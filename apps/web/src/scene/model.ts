// Evaluating AI-generated `function build(THREE) {...}` code into a render-ready, draw-call-merged group.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { SceneObject, Vec3 } from "../types";

export type StdMat = THREE.MeshStandardMaterial;

/** One material of a generated model plus its original look, so overrides can always be undone. */
export type MatRecord = {
  mat: StdMat;
  color: THREE.Color; // original (linear)
  roughness: number;
  metalness: number;
  opacity: number;
  transparent: boolean;
  emissive: THREE.Color;
  emissiveIntensity: number;
};

export type PreparedModel = {
  group: THREE.Group; // merged meshes, in the model's own (raw) coordinates
  rawBox: THREE.Box3;
  records: MatRecord[];
  meshCount: number; // meshes in the generated code
  drawCount: number; // meshes after merging
};

export type EvalResult = { ok: true; model: PreparedModel } | { ok: false; error: string };

/** Max non-uniform stretch per axis (after the uniform fit) used to fill the object's size box. */
export const STRETCH_MAX = 1.25;

function cleanSource(code: string): string {
  let src = code.trim();
  // Strip markdown fences if a model wrapped its answer.
  const fence = /```(?:[a-zA-Z]*)\n([\s\S]*?)```/.exec(src);
  if (fence) src = fence[1];
  // `export default function build` / `export function build` -> plain function.
  src = src.replace(/^\s*export\s+(default\s+)?(?=(async\s+)?function|const|let|var)/gm, "");
  return src;
}

/** Runs the generated code and converts the result to a merged, standard-material group. Never throws. */
export function evaluateModelCode(code: string): EvalResult {
  if (typeof code !== "string" || !code.trim()) return { ok: false, error: "empty code" };
  let root: unknown;
  try {
    const src = cleanSource(code);
    // A fresh shallow copy so code that assigns onto THREE cannot break the module namespace or other models.
    const T = Object.assign({}, THREE);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("THREE", src + "\n;return (typeof build === 'function') ? build(THREE) : undefined;");
    root = fn(T);
  } catch (e) {
    return { ok: false, error: "build threw: " + ((e as Error)?.message ?? String(e)) };
  }
  if (!root || !(root as THREE.Object3D).isObject3D) return { ok: false, error: "build(THREE) did not return an Object3D" };
  try {
    const model = prepare(root as THREE.Object3D);
    if (model.rawBox.isEmpty() || !Number.isFinite(model.rawBox.min.x) || !Number.isFinite(model.rawBox.max.y)) {
      disposeObject(model.group);
      return { ok: false, error: "model is empty or has invalid geometry" };
    }
    return { ok: true, model };
  } catch (e) {
    return { ok: false, error: "model preparation failed: " + ((e as Error)?.message ?? String(e)) };
  }
}

const KEEP_ATTRS = new Set(["position", "normal", "uv"]);

function toStandard(m: THREE.Material, cache: Map<THREE.Material, THREE.Material>): THREE.Material {
  const hit = cache.get(m);
  if (hit) return hit;
  let out: THREE.Material;
  const anyM = m as THREE.Material & Record<string, unknown>;
  if ((m as StdMat).isMeshStandardMaterial) {
    out = m.clone(); // MeshPhysicalMaterial is a MeshStandardMaterial too
  } else if ((anyM as { isMeshLambertMaterial?: boolean }).isMeshLambertMaterial || (anyM as { isMeshPhongMaterial?: boolean }).isMeshPhongMaterial || (anyM as { isMeshToonMaterial?: boolean }).isMeshToonMaterial) {
    const src = m as THREE.MeshPhongMaterial;
    const shin = typeof src.shininess === "number" ? src.shininess : 10;
    out = new THREE.MeshStandardMaterial({
      color: src.color?.clone() ?? new THREE.Color(0xcccccc),
      emissive: src.emissive?.clone() ?? new THREE.Color(0),
      emissiveIntensity: src.emissiveIntensity ?? 1,
      map: src.map ?? null,
      opacity: src.opacity,
      transparent: src.transparent,
      side: src.side,
      flatShading: !!src.flatShading,
      roughness: THREE.MathUtils.clamp(1 - Math.sqrt(shin / 120), 0.15, 0.95),
      metalness: 0,
    });
  } else if ((m as THREE.MeshNormalMaterial).isMeshNormalMaterial || (m as THREE.MeshDepthMaterial).isMeshDepthMaterial) {
    out = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.6 });
  } else {
    out = m.clone(); // Basic (unlit) etc. stay as authored
  }
  cache.set(m, out);
  return out;
}

function matSignature(m: THREE.Material): string {
  const s = m as StdMat & { clearcoat?: number; transmission?: number; isMeshPhysicalMaterial?: boolean };
  const hasMaps = !!(s.map || s.normalMap || s.roughnessMap || s.metalnessMap || s.emissiveMap || s.alphaMap || s.aoMap || s.bumpMap);
  if (hasMaps || s.isMeshPhysicalMaterial || !s.isMeshStandardMaterial) return "u:" + m.uuid;
  return [
    s.type, s.color.getHexString(), s.roughness.toFixed(3), s.metalness.toFixed(3), s.emissive.getHexString(),
    s.emissiveIntensity.toFixed(2), s.opacity.toFixed(3), s.transparent, s.side, s.flatShading, s.wireframe, s.vertexColors,
  ].join("|");
}

function flipWinding(g: THREE.BufferGeometry) {
  // non-indexed geometry: swap 2nd and 3rd vertex of every triangle in every attribute
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name] as THREE.BufferAttribute;
    const n = a.itemSize;
    const arr = a.array as Float32Array;
    for (let t = 0; t + 2 < a.count; t += 3) {
      for (let k = 0; k < n; k++) {
        const i1 = (t + 1) * n + k, i2 = (t + 2) * n + k;
        const tmp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = tmp;
      }
    }
    a.needsUpdate = true;
  }
}

function prepare(root: THREE.Object3D): PreparedModel {
  const holder = new THREE.Group();
  holder.add(root);
  holder.updateMatrixWorld(true);

  const matCache = new Map<THREE.Material, THREE.Material>();
  const buckets = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[] }>();
  const leftovers: THREE.Object3D[] = [];
  let meshCount = 0;

  root.traverseVisible((obj) => {
    if ((obj as THREE.Light).isLight || (obj as THREE.Camera).isCamera) return; // lights/cameras stripped
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      meshCount++;
      const geo = mesh.geometry as THREE.BufferGeometry | undefined;
      if (!geo || !geo.attributes || !geo.attributes.position) return;
      const isSpecial = (mesh as THREE.InstancedMesh).isInstancedMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh || Object.keys(geo.morphAttributes || {}).length > 0;
      const mats = Array.isArray(mesh.material) ? mesh.material.map((m) => toStandard(m, matCache)) : toStandard(mesh.material, matCache);
      if (isSpecial || Array.isArray(mats)) {
        const c = mesh.clone(false) as THREE.Mesh;
        c.material = mats;
        leftovers.push(c);
        mesh.matrixWorld.decompose(c.position, c.quaternion, c.scale);
        return;
      }
      try {
        let g = geo.clone();
        g.applyMatrix4(mesh.matrixWorld);
        if (g.index) g = g.toNonIndexed();
        for (const name of Object.keys(g.attributes)) if (!KEEP_ATTRS.has(name)) g.deleteAttribute(name);
        g.morphAttributes = {};
        g.clearGroups();
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        if (g.attributes.position.itemSize !== 3 || g.attributes.normal.itemSize !== 3 || g.attributes.uv.itemSize !== 2) throw new Error("odd attrs");
        if (mesh.matrixWorld.determinant() < 0) flipWinding(g);
        const key = matSignature(mats);
        let b = buckets.get(key);
        if (!b) buckets.set(key, (b = { mat: mats, geos: [] }));
        b.geos.push(g);
      } catch {
        const c = mesh.clone(false) as THREE.Mesh;
        c.material = mats;
        mesh.matrixWorld.decompose(c.position, c.quaternion, c.scale);
        leftovers.push(c);
      }
      return;
    }
    if ((obj as THREE.Line).isLine || (obj as THREE.Points).isPoints || (obj as THREE.Sprite).isSprite) {
      const c = obj.clone(false);
      obj.matrixWorld.decompose(c.position, c.quaternion, c.scale);
      leftovers.push(c);
    }
  });

  const group = new THREE.Group();
  group.name = "generated";
  let drawCount = 0;
  for (const b of buckets.values()) {
    let merged: THREE.BufferGeometry | null = null;
    try {
      merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    } catch {
      merged = null;
    }
    if (merged) {
      if (merged !== b.geos[0]) b.geos.forEach((g) => g.dispose());
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const m = new THREE.Mesh(merged, b.mat);
      group.add(m);
      drawCount++;
    } else {
      for (const g of b.geos) {
        group.add(new THREE.Mesh(g, b.mat));
        drawCount++;
      }
    }
  }
  for (const l of leftovers) {
    group.add(l);
    drawCount++;
  }
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  group.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(group);

  // Dispose the original generated geometry (we cloned what we needed; leftovers share theirs, keep those).
  const keep = new Set<THREE.BufferGeometry>();
  group.traverse((o) => {
    const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (g) keep.add(g);
  });
  root.traverse((o) => {
    const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (g && !keep.has(g)) g.dispose();
  });

  const records: MatRecord[] = [];
  const seen = new Set<THREE.Material>();
  group.traverse((o) => {
    const mm = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!mm) return;
    for (const m of Array.isArray(mm) ? mm : [mm]) {
      if (seen.has(m)) continue;
      seen.add(m);
      const s = m as StdMat;
      if (!s.isMeshStandardMaterial) continue;
      records.push({
        mat: s,
        color: s.color.clone(),
        roughness: s.roughness,
        metalness: s.metalness,
        opacity: s.opacity,
        transparent: s.transparent,
        emissive: s.emissive.clone(),
        emissiveIntensity: s.emissiveIntensity,
      });
    }
  });
  return { group, rawBox, records, meshCount, drawCount };
}

export type Fit = { scale: THREE.Vector3; offset: THREE.Vector3 };

/**
 * Fit rule: uniform scale so the model fits entirely inside the size box (smallest ratio wins), then each axis may
 * be stretched by at most STRETCH_MAX to fill the box further. Small aspect mismatches (the common case) end up
 * filling the box exactly, so things placed "on top" of it line up; wildly different aspects are not distorted.
 * Then the model is translated so its bottom-center sits at the object's origin.
 */
export function computeFit(raw: THREE.Box3, size: Vec3): Fit {
  const s = raw.getSize(new THREE.Vector3());
  const target = new THREE.Vector3(size.x, size.y, size.z);
  const EPS = 1e-4;
  let k = Infinity;
  for (const a of ["x", "y", "z"] as const) if (s[a] > EPS) k = Math.min(k, target[a] / s[a]);
  if (!Number.isFinite(k) || k <= 0) k = 1;
  const scale = new THREE.Vector3();
  for (const a of ["x", "y", "z"] as const) {
    const extra = s[a] > EPS ? THREE.MathUtils.clamp(target[a] / (s[a] * k), 1, STRETCH_MAX) : 1;
    scale[a] = k * extra;
  }
  const c = raw.getCenter(new THREE.Vector3());
  const offset = new THREE.Vector3(-c.x * scale.x, -raw.min.y * scale.y, -c.z * scale.z);
  return { scale, offset };
}

export type MatState = { color: THREE.Color; roughness: number; metalness: number; opacity: number; emissive: THREE.Color; emissiveIntensity: number };

const _hslA = { h: 0, s: 0, l: 0 };
const _hslB = { h: 0, s: 0, l: 0 };

/**
 * Material rule for a custom object that has a generated model:
 *  - roughness / metalness in obj.material override EVERY part (so "make it shiny" affects the whole model);
 *    when unset, each part keeps the roughness/metalness the generator authored.
 *  - opacity multiplies each part's own opacity; emissive (if set) is applied to every part.
 *  - color: the model keeps its authored multi-color look as long as obj.color equals the color the object had when
 *    the model arrived (`baseColor`). If the user later changes the color, every part is re-tinted: it takes the new
 *    hue, mostly the new saturation, and 70% of the way to the new lightness, so the parts stay distinguishable.
 */
export function modelTargets(records: MatRecord[], obj: SceneObject, baseColor: string | null): MatState[] {
  const m = obj.material || {};
  const tint = baseColor !== null && obj.color.toLowerCase() !== baseColor.toLowerCase() ? new THREE.Color(obj.color) : null;
  if (tint) tint.getHSL(_hslB);
  const emissive = m.emissive ? new THREE.Color(m.emissive) : null;
  return records.map((r) => {
    const color = r.color.clone();
    if (tint) {
      r.color.getHSL(_hslA);
      color.setHSL(_hslB.h, THREE.MathUtils.lerp(_hslA.s, _hslB.s, 0.85), THREE.MathUtils.lerp(_hslA.l, _hslB.l, 0.7));
    }
    return {
      color,
      roughness: m.roughness ?? r.roughness,
      metalness: m.metalness ?? r.metalness,
      opacity: r.opacity * (m.opacity ?? 1),
      emissive: emissive ? emissive.clone() : r.emissive.clone(),
      emissiveIntensity: emissive ? 0.8 : r.emissiveIntensity,
    };
  });
}

export function disposeObject(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = m.material as THREE.Material | THREE.Material[] | undefined;
    if (mats) for (const mm of Array.isArray(mats) ? mats : [mats]) {
      const anyM = mm as THREE.Material & { map?: THREE.Texture | null };
      if (anyM.map && (anyM.map as THREE.CanvasTexture).isCanvasTexture) anyM.map.dispose();
      mm.dispose();
    }
  });
}
