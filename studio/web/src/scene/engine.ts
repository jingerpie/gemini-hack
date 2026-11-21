// Scene JSON -> three.js view. The Scene object is the single source of truth; every mesh is derived from it.
//
// Public surface: createEngine(container, initialScene?) -> StudioEngine (implements Engine from ../types).
//  - getScene() returns a fresh DEEP COPY each call (safe to mutate / send to the server). subscribe() listeners
//    also receive a deep copy (one copy shared by all listeners of the same change). Listeners are NOT called on
//    subscribe; call getScene() for the initial value.
//  - The container must have a non-zero size (the canvas fills it 100% x 100% and follows it via ResizeObserver).
//
// Decal x convention: x is measured along the wall from its center, + = to the RIGHT of a viewer standing in the room
// facing that wall. Back wall: +x = world +X. Left wall (x = -W/2): +x = world -Z (toward the back wall).
// Right wall (x = +W/2): +x = world +Z (toward the open front).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { Decal, Engine, Scene, SceneObject, Shape, SurfaceId, Vec3 } from "../types";
import { DEFAULT_SCENE } from "./defaultScene";
import { applyOpsToScene, clamp, cloneScene, normalizeScene, SURFACE_IDS, WALL_IDS, type WallId } from "./ops";
import { computeFit, disposeObject, evaluateModelCode, modelTargets, type MatState, type PreparedModel, type StdMat } from "./model";
import { makeDecalPlaceholderTexture, makeFloorTexture, makeLabel } from "./textures";

export { DEFAULT_SCENE };

/** Engine plus a few extras the UI may use. Everything in `Engine` behaves exactly per ../types. */
export type StudioEngine = Engine & {
  /** setAssetCode with an optional description the code was generated for (stale results are cached, not shown). */
  setAssetCode(objectId: string, code: string, description?: string): { ok: boolean; error?: string };
  /** Latest generated code for an object (for AssetRequest.currentCode when asking for an edit). */
  getAssetCode(objectId: string): string | undefined;
  /** Glide the camera back to the default framing of the whole room. */
  resetView(): void;
  /** Replace the whole scene (e.g. load). Pushes an undo snapshot. */
  setScene(scene: Scene): void;
};

// ---------------------------------------------------------------------------------------------------------------
// small helpers

const DEG = Math.PI / 180;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const vecEq = (a: Vec3, b: Vec3) => a.x === b.x && a.y === b.y && a.z === b.z;
const cacheKey = (id: string, text: string | undefined) => id + "\u0000" + (text ?? "");

type Tween = { start: number; dur: number; ease: (t: number) => number; step: (k: number) => void; done?: () => void };
class Tweens {
  private m = new Map<string, Tween>();
  add(key: string, dur: number, step: (k: number) => void, ease: (t: number) => number = easeInOut, done?: () => void) {
    this.m.set(key, { start: performance.now(), dur: Math.max(1, dur), ease, step, done });
  }
  cancel(key: string) {
    this.m.delete(key);
  }
  cancelSuffix(suffix: string) {
    for (const k of [...this.m.keys()]) if (k.endsWith(suffix)) this.m.delete(k);
  }
  tick(now: number) {
    for (const [k, t] of this.m) {
      const p = clamp((now - t.start) / t.dur, 0, 1);
      try {
        t.step(t.ease(p));
      } catch (e) {
        console.warn("[engine] tween error", e);
      }
      if (p >= 1) {
        if (this.m.get(k) === t) this.m.delete(k);
        try {
          t.done?.();
        } catch (e) {
          console.warn("[engine] tween done error", e);
        }
      }
    }
  }
  clear() {
    this.m.clear();
  }
  /** true while any animation other than the camera glide is running */
  busy() {
    for (const k of this.m.keys()) if (k !== "camera") return true;
    return false;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// materials

function matTarget(color: string, m: SceneObject["material"], defRough = 0.6): MatState {
  return {
    color: new THREE.Color(color),
    roughness: m?.roughness ?? defRough,
    metalness: m?.metalness ?? 0,
    opacity: m?.opacity ?? 1,
    emissive: new THREE.Color(m?.emissive ?? "#000000"),
    emissiveIntensity: m?.emissive ? 1 : 1,
  };
}

function readMat(m: StdMat): MatState {
  return {
    color: m.color.clone(),
    roughness: m.roughness,
    metalness: m.metalness,
    opacity: m.opacity,
    emissive: m.emissive.clone(),
    emissiveIntensity: m.emissiveIntensity,
  };
}

function writeMat(m: StdMat, s: MatState, baseTransparent = false) {
  m.color.copy(s.color);
  m.roughness = s.roughness;
  m.metalness = s.metalness;
  m.emissive.copy(s.emissive);
  m.emissiveIntensity = s.emissiveIntensity;
  m.opacity = s.opacity;
  const tr = baseTransparent || s.opacity < 0.999;
  if (m.transparent !== tr) {
    m.transparent = tr;
    m.needsUpdate = true;
  }
  m.depthWrite = baseTransparent ? m.depthWrite : !tr;
  const phys = m as THREE.MeshPhysicalMaterial;
  if (phys.isMeshPhysicalMaterial) {
    // Surfaces: glossy finishes get a lacquer clearcoat so "shiny" reads strongly.
    const gloss = THREE.MathUtils.smoothstep(0.5 - s.roughness, 0, 0.4);
    phys.clearcoat = gloss;
    phys.clearcoatRoughness = Math.max(0.02, s.roughness * 0.4);
  }
}

function lerpState(a: MatState, b: MatState, k: number, out: MatState): MatState {
  out.color.copy(a.color).lerp(b.color, k);
  out.emissive.copy(a.emissive).lerp(b.emissive, k);
  out.roughness = a.roughness + (b.roughness - a.roughness) * k;
  out.metalness = a.metalness + (b.metalness - a.metalness) * k;
  out.opacity = a.opacity + (b.opacity - a.opacity) * k;
  out.emissiveIntensity = a.emissiveIntensity + (b.emissiveIntensity - a.emissiveIntensity) * k;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// geometry: every primitive has a bottom-center origin and exactly fills its size box

function primGeometry(shape: Shape, size: Vec3): THREE.BufferGeometry {
  let g: THREE.BufferGeometry;
  switch (shape) {
    case "cylinder":
      g = new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1);
      break;
    case "sphere":
      g = new THREE.SphereGeometry(0.5, 48, 24);
      break;
    case "cone":
      g = new THREE.ConeGeometry(0.5, 1, 48, 1);
      break;
    case "capsule": {
      const r = Math.min(size.x, size.z) / 2;
      g = new THREE.CapsuleGeometry(r, Math.max(0.001, size.y - 2 * r), 10, 32);
      break;
    }
    case "torus": {
      const flat = size.y <= Math.min(size.x, size.z);
      const major = flat ? Math.max(size.x, size.z) : Math.max(size.x, size.y);
      const minor = flat ? size.y : size.z;
      const tube = clamp(minor / (2 * major), 0.03, 0.25);
      g = new THREE.TorusGeometry(0.5 - tube, tube, 24, 72);
      if (flat) g.rotateX(Math.PI / 2);
      break;
    }
    default: // box, plane, custom placeholder
      g = new THREE.BoxGeometry(1, 1, 1);
  }
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const s = b.getSize(new THREE.Vector3());
  const c = b.getCenter(new THREE.Vector3());
  g.translate(-c.x, -b.min.y, -c.z);
  g.scale(size.x / Math.max(s.x, 1e-6), size.y / Math.max(s.y, 1e-6), size.z / Math.max(s.z, 1e-6));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// view records

type CodeEntry = { code: string; baseColor: string | null };
type Fx = {
  group: THREE.Group;
  fill?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  edges: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  scan: THREE.Group;
  scanFill: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  scanLine: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  label: THREE.Sprite;
  size: Vec3;
  key: string;
  t0: number;
};
type ModelView = { prepared: PreparedModel; wrap: THREE.Group; code: string; baseColor: string | null };
type Mode = "prim" | "solid" | "ghost" | "model";
type ObjView = {
  id: string;
  key: string; // unique per view instance (tween keys)
  obj: SceneObject;
  root: THREE.Group; // position + rotation
  body: THREE.Group; // pop / shrink scale
  mode: Mode;
  prim?: { mesh: THREE.Mesh<THREE.BufferGeometry, StdMat>; shape: Shape };
  model?: ModelView;
  fx?: Fx;
};
type Want = { mode: "prim" | "solid" | "ghost" } | { mode: "model"; entry: CodeEntry; rebuilding: boolean };

type DecalView = {
  id: string;
  key: string;
  d: Decal;
  root: THREE.Group; // child of a wall frame; local +Z = into the room
  size: { w: number; h: number };
  ph: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  phKey: string;
  img?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  imgUrl?: string;
  wantUrl?: string;
  failed: boolean;
  t0: number;
};

let serial = 0;
const BASE_ENV_INTENSITY = 0.5; // generic studio env (before the first room capture)
const ROOM_ENV_INTENSITY = 1.0; // captured room env
const FX_LAYER = 1; // placeholders / labels: visible to the main camera, invisible to the reflection capture

function setLayer(o: THREE.Object3D, layer: number) {
  o.traverse((c) => c.layers.set(layer));
}

// ---------------------------------------------------------------------------------------------------------------

export function createEngine(container: HTMLElement, initialScene: Scene = DEFAULT_SCENE): StudioEngine {
  let scene: Scene = normalizeScene(initialScene);
  const undoStack: Scene[] = [];
  const listeners = new Set<(s: Scene) => void>();
  const tweens = new Tweens();
  let disposed = false;

  // caches that survive undo/redo: generated code by (objectId, description), images by (decalId, prompt)
  const codeByKey = new Map<string, CodeEntry>();
  const latestCode = new Map<string, CodeEntry>();
  const imageByKey = new Map<string, string>();
  const latestImage = new Map<string, string>();
  const textureCache = new Map<string, Promise<THREE.Texture>>();
  let pendingPrepared: { code: string; model: PreparedModel } | null = null;

  // ---------------- renderer / scene / camera
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.outline = "none";
  container.appendChild(canvas);

  const s3 = new THREE.Scene();
  const BG = new THREE.Color(0x15171c);
  s3.background = BG;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmrem.fromScene(roomEnv, 0.04);
  s3.environment = envRT.texture;
  s3.environmentIntensity = BASE_ENV_INTENSITY;
  roomEnv.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
  // Reflections of the ACTUAL room: a cube capture from inside the room, prefiltered with PMREM, refreshed only
  // when the scene changed and animations have settled. Glossy walls/floors/objects then visibly mirror the room.
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.05, 80, cubeRT);
  let capturedRT: THREE.WebGLRenderTarget | null = null;
  let envDirty = true;
  let envDirtySince = 0;
  const CAPTURE_BG = new THREE.Color(0x5a524b); // the open front reads as a dim warm wall in reflections
  const markEnvDirty = () => {
    if (!envDirty) envDirtySince = performance.now();
    envDirty = true;
  };

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.minDistance = 0.8;
  controls.maxDistance = 22;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = 1.5;
  controls.minAzimuthAngle = -1.3;
  controls.maxAzimuthAngle = 1.3;
  let autoFrame = true; // keep re-framing the whole room on resize until the user takes the camera
  controls.addEventListener("start", () => {
    tweens.cancel("camera");
    autoFrame = false;
  });
  camera.layers.enable(FX_LAYER);

  // ---------------- lights
  const hemi = new THREE.HemisphereLight(0xfff2e2, 0x5e5044, 0.35);
  s3.add(hemi);
  const key = new THREE.DirectionalLight(0xffe0bd, 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.025;
  s3.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdbe6ff, 0.45);
  s3.add(fill, fill.target);
  const practical = new THREE.PointLight(0xffd29a, 2.2, 0, 2);
  s3.add(practical);

  // ---------------- room
  const floorTex = makeFloorTexture();
  const surfMats = {} as Record<SurfaceId, THREE.MeshPhysicalMaterial>;
  for (const id of SURFACE_IDS) {
    surfMats[id] = new THREE.MeshPhysicalMaterial({ side: THREE.FrontSide, map: id === "floor" ? floorTex : null });
  }
  const roomGroup = new THREE.Group();
  roomGroup.name = "room";
  s3.add(roomGroup);
  const surfMeshes = {} as Record<SurfaceId, THREE.Mesh>;
  const wallExtras: Record<WallId, THREE.Object3D[]> = { wall_back: [], wall_left: [], wall_right: [] };
  const wallFrames = {} as Record<WallId, THREE.Group>;
  for (const w of WALL_IDS) {
    wallFrames[w] = new THREE.Group();
    wallFrames[w].name = "decals:" + w;
    s3.add(wallFrames[w]);
  }
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x34312e, roughness: 0.92 });
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.5 });
  let builtRoomKey = "";
  const surfApplied = new Map<SurfaceId, string>();

  function buildRoom() {
    const { width: W, depth: D, height: H } = scene.room;
    builtRoomKey = JSON.stringify(scene.room);
    for (const c of [...roomGroup.children]) {
      roomGroup.remove(c);
      (c as THREE.Mesh).geometry?.dispose();
    }
    const T = 0.12;
    const plane = (id: SurfaceId, w: number, h: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), surfMats[id]);
      m.name = id;
      m.receiveShadow = true;
      m.castShadow = false;
      surfMeshes[id] = m;
      roomGroup.add(m);
      return m;
    };
    const floor = plane("floor", W, D);
    floor.rotation.x = -Math.PI / 2;
    floorTex.repeat.set(W / 2.6, D / 2.6);
    const ceil = plane("ceiling", W, D);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    ceil.receiveShadow = false;
    const back = plane("wall_back", W, H);
    back.position.set(0, H / 2, -D / 2);
    const left = plane("wall_left", D, H);
    left.rotation.y = Math.PI / 2;
    left.position.set(-W / 2, H / 2, 0);
    const right = plane("wall_right", D, H);
    right.rotation.y = -Math.PI / 2;
    right.position.set(W / 2, H / 2, 0);

    const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, receive = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.receiveShadow = receive;
      m.castShadow = false;
      roomGroup.add(m);
      return m;
    };
    // architectural-model shell: slab under the floor and thick walls outside the wall planes (dark "section cut")
    box(W + 2 * T, 0.16, D + T, 0, -0.08 - 0.001, -T / 2, shellMat, false);
    wallExtras.wall_back = [box(W + 2 * T, H, T, 0, H / 2, -D / 2 - T / 2 - 0.001, shellMat, false)];
    wallExtras.wall_left = [box(T, H, D + T, -W / 2 - T / 2 - 0.001, H / 2, -T / 2, shellMat, false)];
    wallExtras.wall_right = [box(T, H, D + T, W / 2 + T / 2 + 0.001, H / 2, -T / 2, shellMat, false)];
    const bh = 0.09, bd = 0.016;
    wallExtras.wall_back.push(box(W, bh, bd, 0, bh / 2, -D / 2 + bd / 2, baseboardMat));
    wallExtras.wall_left.push(box(bd, bh, D - 2 * bd, -W / 2 + bd / 2, bh / 2, 0, baseboardMat));
    wallExtras.wall_right.push(box(bd, bh, D - 2 * bd, W / 2 - bd / 2, bh / 2, 0, baseboardMat));

    wallFrames.wall_back.position.set(0, 0, -D / 2);
    wallFrames.wall_back.rotation.set(0, 0, 0);
    wallFrames.wall_left.position.set(-W / 2, 0, 0);
    wallFrames.wall_left.rotation.set(0, Math.PI / 2, 0);
    wallFrames.wall_right.position.set(W / 2, 0, 0);
    wallFrames.wall_right.rotation.set(0, -Math.PI / 2, 0);

    // lights scaled to the room
    const R = Math.max(W, D);
    key.position.set(W * 0.42, H + 4.2, D / 2 + 3.6);
    key.target.position.set(0, 0, -D * 0.1);
    const sc = key.shadow.camera;
    sc.left = -R * 0.85;
    sc.right = R * 0.85;
    sc.top = R * 0.85;
    sc.bottom = -R * 0.85;
    sc.near = 0.5;
    sc.far = 30;
    sc.updateProjectionMatrix();
    fill.position.set(-W * 0.8, H * 1.1, D / 2 + 3);
    fill.target.position.set(0, H * 0.3, 0);
    practical.position.set(0, H - 0.35, 0);
    surfApplied.clear();
  }

  function syncSurfaces(animate: boolean) {
    for (const id of SURFACE_IDS) {
      const s = scene.surfaces[id];
      const sig = JSON.stringify(s);
      if (surfApplied.get(id) === sig) continue;
      const first = !surfApplied.has(id);
      surfApplied.set(id, sig);
      const mat = surfMats[id];
      const to = matTarget(s.color, s.material, id === "floor" ? 0.55 : 0.9);
      if (!animate || first) {
        writeMat(mat, to);
        continue;
      }
      const from = readMat(mat);
      const tmp = readMat(mat);
      tweens.add("surf:" + id, 450, (k) => writeMat(mat, lerpState(from, to, k, tmp)));
    }
  }

  // ---------------- objects
  const objectsGroup = new THREE.Group();
  objectsGroup.name = "objects";
  s3.add(objectsGroup);
  const views = new Map<string, ObjView>();

  function codeFor(o: SceneObject): CodeEntry | undefined {
    return codeByKey.get(cacheKey(o.id, o.description)) ?? (o.status === "ready" ? latestCode.get(o.id) : undefined);
  }

  function want(o: SceneObject, v?: ObjView): Want {
    if (o.shape !== "custom") return { mode: "prim" };
    const entry = codeFor(o);
    if (entry) return { mode: "model", entry, rebuilding: false };
    if (v?.model) return { mode: "model", entry: { code: v.model.code, baseColor: v.model.baseColor }, rebuilding: o.status === "building" };
    return { mode: o.status === "building" ? "ghost" : "solid" };
  }

  function applyTransform(root: THREE.Object3D, o: SceneObject) {
    root.position.set(o.position.x, o.position.y, o.position.z);
    root.rotation.set(0, o.rotation_y_deg * DEG, 0);
  }

  function clearContent(v: ObjView) {
    if (v.prim) {
      v.body.remove(v.prim.mesh);
      disposeObject(v.prim.mesh);
      v.prim = undefined;
    }
    if (v.model) {
      v.body.remove(v.model.wrap);
      disposeObject(v.model.wrap);
      v.model = undefined;
    }
  }

  function setContent(v: ObjView, o: SceneObject, w: Want) {
    clearContent(v);
    let mode: Mode = w.mode;
    if (w.mode === "model") {
      let prepared: PreparedModel | null = null;
      if (pendingPrepared && pendingPrepared.code === w.entry.code) {
        prepared = pendingPrepared.model;
        pendingPrepared = null;
      } else {
        const r = evaluateModelCode(w.entry.code);
        if (r.ok) prepared = r.model;
        else console.warn("[engine] cached model failed to evaluate", r.error);
      }
      if (prepared) {
        const wrap = new THREE.Group();
        wrap.name = "fit";
        wrap.add(prepared.group);
        const fit = computeFit(prepared.rawBox, o.size);
        wrap.scale.copy(fit.scale);
        wrap.position.copy(fit.offset);
        v.body.add(wrap);
        v.model = { prepared, wrap, code: w.entry.code, baseColor: w.entry.baseColor };
        const targets = modelTargets(prepared.records, o, w.entry.baseColor);
        prepared.records.forEach((r, i) => writeMat(r.mat, targets[i], r.transparent));
      } else mode = "solid";
    }
    if (mode === "prim" || mode === "solid") {
      const shape: Shape = mode === "solid" ? "box" : o.shape;
      const mat = new THREE.MeshStandardMaterial();
      writeMat(mat, matTarget(o.color, o.material, mode === "solid" ? 0.85 : 0.6));
      const mesh = new THREE.Mesh(primGeometry(shape, o.size), mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      v.body.add(mesh);
      v.prim = { mesh, shape };
    }
    v.mode = mode;
  }

  function fxKind(v: ObjView, w: Want): "fill" | "outline" | null {
    if (v.mode === "ghost") return "fill";
    if (v.mode === "model" && w.mode === "model" && w.rebuilding) return "outline";
    return null;
  }

  function removeFx(v: ObjView) {
    if (!v.fx) return;
    v.body.remove(v.fx.group);
    disposeObject(v.fx.group);
    v.fx = undefined;
  }

  function syncFx(v: ObjView, o: SceneObject, w: Want) {
    const kind = fxKind(v, w);
    const k = kind ? `${kind}|${o.size.x}|${o.size.y}|${o.size.z}|${o.name}` : "";
    if (v.fx && v.fx.key === k) return;
    const t0 = v.fx?.t0 ?? performance.now();
    removeFx(v);
    if (!kind) return;
    const s = o.size;
    const group = new THREE.Group();
    group.name = "fx";
    const boxGeo = new THREE.BoxGeometry(s.x, s.y, s.z).translate(0, s.y / 2, 0);
    let fillMesh: Fx["fill"];
    if (kind === "fill") {
      fillMesh = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x9ad6ff, transparent: true, opacity: 0.15, depthWrite: false }));
      fillMesh.renderOrder = 2;
      group.add(fillMesh);
    }
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0xb4e6ff, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
    );
    if (kind !== "fill") boxGeo.dispose();
    // scanner: a faint slice + bright outline sweeping bottom -> top
    const sx = s.x * 1.02 / 2, sz = s.z * 1.02 / 2;
    const scanFill = new THREE.Mesh(
      new THREE.PlaneGeometry(sx * 2, sz * 2).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    );
    const scanLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-sx, 0, -sz), new THREE.Vector3(sx, 0, -sz), new THREE.Vector3(sx, 0, sz), new THREE.Vector3(-sx, 0, sz)]),
      new THREE.LineBasicMaterial({ color: 0xd8f3ff, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }),
    );
    const scan = new THREE.Group();
    scan.add(scanFill, scanLine);
    scan.renderOrder = 3;
    const label = makeLabel((kind === "fill" ? "Building " : "Rebuilding ") + o.name + "…");
    label.position.y = s.y + 0.1;
    group.add(edges, scan, label);
    setLayer(group, FX_LAYER);
    v.body.add(group);
    v.fx = { group, fill: fillMesh, edges, scan, scanFill, scanLine, label, size: { ...s }, key: k, t0 };
  }

  function animateFx(fx: Fx, now: number) {
    const p = (now - fx.t0) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(p * 3.4);
    if (fx.fill) fx.fill.material.opacity = 0.07 + 0.13 * pulse;
    fx.edges.material.opacity = fx.fill ? 0.45 + 0.5 * pulse : 0.25 + 0.45 * pulse;
    const sp = (p * 0.55) % 1;
    fx.scan.position.y = Math.max(0.005, sp * fx.size.y);
    const env = Math.sin(sp * Math.PI);
    fx.scanFill.material.opacity = (fx.fill ? 0.16 : 0.1) * env;
    fx.scanLine.material.opacity = 0.95 * env;
    (fx.label.material as THREE.SpriteMaterial).opacity = 0.7 + 0.3 * pulse;
  }

  function createObjView(o: SceneObject, animate: boolean) {
    const root = new THREE.Group();
    root.name = "obj:" + o.id;
    const body = new THREE.Group();
    root.add(body);
    objectsGroup.add(root);
    applyTransform(root, o);
    const v: ObjView = { id: o.id, key: o.id + "#" + ++serial, obj: structuredClone(o), root, body, mode: "prim" };
    const w = want(o, v);
    setContent(v, o, w);
    syncFx(v, o, w);
    views.set(o.id, v);
    if (animate) {
      body.scale.setScalar(0.001);
      tweens.add("pop:" + v.key, 380, (k) => body.scale.setScalar(Math.max(0.001, k)), easeOutBack);
    }
  }

  function updateObjView(v: ObjView, o: SceneObject, animate: boolean) {
    const prev = v.obj;
    v.obj = structuredClone(o);
    const w = want(o, v);
    const swap =
      w.mode !== v.mode ||
      (w.mode === "model" && w.entry.code !== v.model?.code) ||
      (w.mode === "prim" && v.prim?.shape !== o.shape);
    if (swap) {
      const wasModel = v.mode === "model";
      setContent(v, o, w);
      if (animate) {
        const from = v.mode === "model" && !wasModel ? 0.82 : 0.9;
        v.body.scale.setScalar(from);
        tweens.add("pop:" + v.key, 450, (k) => v.body.scale.setScalar(from + (1 - from) * k), easeOutBack);
      }
    } else {
      if (!vecEq(prev.size, o.size)) {
        if (v.prim) {
          const mesh = v.prim.mesh;
          const ratio = new THREE.Vector3(prev.size.x / o.size.x, prev.size.y / o.size.y, prev.size.z / o.size.z);
          mesh.geometry.dispose();
          mesh.geometry = primGeometry(v.prim.shape, o.size);
          if (animate) {
            mesh.scale.copy(ratio);
            const one = new THREE.Vector3(1, 1, 1);
            tweens.add("size:" + v.key, 380, (k) => mesh.scale.copy(ratio).lerp(one, k));
          }
        }
        if (v.model) {
          const wrap = v.model.wrap;
          const fit = computeFit(v.model.prepared.rawBox, o.size);
          if (animate) {
            const s0 = wrap.scale.clone(), p0 = wrap.position.clone();
            tweens.add("size:" + v.key, 380, (k) => {
              wrap.scale.copy(s0).lerp(fit.scale, k);
              wrap.position.copy(p0).lerp(fit.offset, k);
            });
          } else {
            wrap.scale.copy(fit.scale);
            wrap.position.copy(fit.offset);
          }
        }
      }
      const matChanged = prev.color !== o.color || JSON.stringify(prev.material ?? {}) !== JSON.stringify(o.material ?? {});
      if (matChanged) {
        const pairs: { mat: StdMat; from: MatState; to: MatState; tmp: MatState; bt: boolean }[] = [];
        if (v.prim) {
          const to = matTarget(o.color, o.material, v.mode === "solid" ? 0.85 : 0.6);
          pairs.push({ mat: v.prim.mesh.material, from: readMat(v.prim.mesh.material), to, tmp: readMat(v.prim.mesh.material), bt: false });
        }
        if (v.model) {
          const targets = modelTargets(v.model.prepared.records, o, v.model.baseColor);
          v.model.prepared.records.forEach((r, i) => pairs.push({ mat: r.mat, from: readMat(r.mat), to: targets[i], tmp: readMat(r.mat), bt: r.transparent }));
        }
        const step = (k: number) => {
          for (const p of pairs) writeMat(p.mat, lerpState(p.from, p.to, k, p.tmp), p.bt);
        };
        if (animate) tweens.add("mat:" + v.key, 380, step);
        else step(1);
      }
    }
    if (!vecEq(prev.position, o.position) || prev.rotation_y_deg !== o.rotation_y_deg) {
      const root = v.root;
      if (animate) {
        const p0 = root.position.clone();
        const p1 = new THREE.Vector3(o.position.x, o.position.y, o.position.z);
        const r0 = root.rotation.y;
        let d = (o.rotation_y_deg * DEG - r0) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        tweens.add("xf:" + v.key, 420, (k) => {
          root.position.copy(p0).lerp(p1, k);
          root.rotation.y = r0 + d * k;
        });
      } else applyTransform(root, o);
    }
    syncFx(v, o, w);
  }

  function removeObjView(v: ObjView, animate: boolean) {
    views.delete(v.id);
    tweens.cancelSuffix(":" + v.key);
    const finish = () => {
      objectsGroup.remove(v.root);
      removeFx(v);
      clearContent(v);
    };
    if (!animate) return finish();
    const s0 = v.body.scale.x;
    tweens.add("rm:" + v.key, 260, (k) => v.body.scale.setScalar(Math.max(0.001, s0 * (1 - k))), easeInCubic, finish);
  }

  function syncObjects(animate: boolean) {
    const seen = new Set<string>();
    for (const o of scene.objects) {
      seen.add(o.id);
      const v = views.get(o.id);
      if (!v) createObjView(o, animate);
      else updateObjView(v, o, animate);
    }
    for (const v of [...views.values()]) if (!seen.has(v.id)) removeObjView(v, animate);
  }

  // ---------------- decals
  const decalViews = new Map<string, DecalView>();

  function imageFor(d: Decal): string | undefined {
    return imageByKey.get(cacheKey(d.id, d.prompt)) ?? (d.status === "ready" ? latestImage.get(d.id) : undefined);
  }

  function loadTexture(url: string): Promise<THREE.Texture> {
    let p = textureCache.get(url);
    if (!p) {
      p = new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            resolve(t);
          },
          undefined,
          (e) => reject(e),
        );
      });
      p.catch(() => textureCache.delete(url));
      textureCache.set(url, p);
    }
    return p;
  }

  function decalLayout(v: DecalView) {
    const d = v.d;
    const { width: W, depth: D, height: H } = scene.room;
    const wallLen = d.surface === "wall_back" ? W : D;
    const idx = Math.max(0, scene.decals.findIndex((x) => x.id === d.id));
    const w = Math.min(d.width, wallLen), h = Math.min(d.height, H);
    const x = clamp(d.x, -wallLen / 2 + w / 2, wallLen / 2 - w / 2);
    const y = clamp(d.y, h / 2, H - h / 2);
    return { pos: new THREE.Vector3(x, y, 0.004 + idx * 0.0012), w, h };
  }

  function applyDecalSize(v: DecalView) {
    v.ph.scale.set(v.size.w, v.size.h, 1);
    if (v.img) {
      const img = v.img.material.map?.image as { width?: number; height?: number } | undefined;
      const ia = img && img.width && img.height ? img.width / img.height : v.size.w / v.size.h;
      const da = v.size.w / v.size.h;
      // "contain": keep the image's aspect inside the decal box (logos are never stretched)
      if (ia > da) v.img.scale.set(v.size.w, v.size.w / ia, 1);
      else v.img.scale.set(v.size.h * ia, v.size.h, 1);
    }
  }

  function refreshPlaceholder(v: DecalView) {
    const k = `${v.d.name}|${v.d.width.toFixed(2)}|${v.d.height.toFixed(2)}|${v.failed}`;
    if (k === v.phKey) return;
    v.phKey = k;
    v.ph.material.map?.dispose();
    v.ph.material.map = makeDecalPlaceholderTexture(v.d.name, v.d.width, v.d.height, v.failed);
    v.ph.material.needsUpdate = true;
  }

  function showDecalImage(v: DecalView, url: string, animate: boolean) {
    v.wantUrl = url;
    if (v.imgUrl === url && v.img) return;
    loadTexture(url)
      .then((tex) => {
        if (disposed || decalViews.get(v.id) !== v || v.wantUrl !== url) return;
        const old = v.img;
        const mat = new THREE.MeshStandardMaterial({
          map: tex, transparent: true, opacity: animate ? 0 : 1, roughness: 0.55, metalness: 0,
          emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12,
          polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false,
        });
        const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        img.position.z = 0.0005;
        img.receiveShadow = true;
        img.renderOrder = 1;
        v.root.add(img);
        v.img = img;
        v.imgUrl = url;
        applyDecalSize(v);
        const done = () => {
          markEnvDirty();
          v.ph.visible = false;
          if (old) {
            v.root.remove(old);
            old.geometry.dispose();
            old.material.dispose(); // texture stays cached
          }
        };
        if (!animate) return done();
        const ph0 = v.ph.material.opacity;
        tweens.add("img:" + v.key, 700, (k) => {
          mat.opacity = k;
          v.ph.material.opacity = ph0 * (1 - k);
          if (old) old.material.opacity = 1 - k;
        }, easeOutCubic, done);
      })
      .catch((e) => {
        console.warn("[engine] decal image failed to load", e);
        if (decalViews.get(v.id) === v && v.wantUrl === url) {
          v.failed = true;
          refreshPlaceholder(v);
        }
      });
  }

  function hideDecalImage(v: DecalView, animate: boolean) {
    v.wantUrl = undefined;
    const img = v.img;
    if (!img) return;
    v.img = undefined;
    v.imgUrl = undefined;
    v.ph.visible = true;
    const done = () => {
      v.root.remove(img);
      img.geometry.dispose();
      img.material.dispose();
    };
    if (!animate) return done();
    tweens.add("img:" + v.key, 400, (k) => (img.material.opacity = 1 - k), easeInOut, done);
  }

  function syncDecal(v: DecalView, d: Decal, animate: boolean, isNew: boolean) {
    const prev = v.d;
    v.d = structuredClone(d);
    const lay = decalLayout(v);
    if (isNew || prev.surface !== d.surface) {
      wallFrames[d.surface].add(v.root);
      v.root.position.copy(lay.pos);
      v.size = { w: lay.w, h: lay.h };
      applyDecalSize(v);
      if (animate) {
        v.root.scale.setScalar(0.001);
        tweens.add("pop:" + v.key, 420, (k) => v.root.scale.setScalar(Math.max(0.001, k)), easeOutBack);
      }
    } else if (!v.root.position.equals(lay.pos) || v.size.w !== lay.w || v.size.h !== lay.h) {
      if (animate) {
        const p0 = v.root.position.clone(), w0 = v.size.w, h0 = v.size.h;
        tweens.add("xf:" + v.key, 400, (k) => {
          v.root.position.copy(p0).lerp(lay.pos, k);
          v.size = { w: w0 + (lay.w - w0) * k, h: h0 + (lay.h - h0) * k };
          applyDecalSize(v);
        });
      } else {
        v.root.position.copy(lay.pos);
        v.size = { w: lay.w, h: lay.h };
        applyDecalSize(v);
      }
    }
    const url = imageFor(d);
    v.failed = !url && d.status === "failed";
    refreshPlaceholder(v);
    if (url) showDecalImage(v, url, animate);
    else {
      if (!v.ph.visible) {
        v.ph.visible = true;
        v.ph.material.opacity = 0.8;
      }
      hideDecalImage(v, animate);
    }
  }

  function createDecalView(d: Decal, animate: boolean) {
    const ph = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    );
    const root = new THREE.Group();
    root.name = "decal:" + d.id;
    ph.layers.set(FX_LAYER);
    root.add(ph);
    const v: DecalView = { id: d.id, key: d.id + "#" + ++serial, d: structuredClone(d), root, size: { w: d.width, h: d.height }, ph, phKey: "", failed: false, t0: performance.now() };
    decalViews.set(d.id, v);
    syncDecal(v, d, animate, true);
  }

  function removeDecalView(v: DecalView, animate: boolean) {
    decalViews.delete(v.id);
    tweens.cancelSuffix(":" + v.key);
    const finish = () => {
      v.root.parent?.remove(v.root);
      v.ph.geometry.dispose();
      v.ph.material.map?.dispose();
      v.ph.material.dispose();
      if (v.img) {
        v.img.geometry.dispose();
        v.img.material.dispose();
      }
    };
    if (!animate) return finish();
    const s0 = v.root.scale.x;
    tweens.add("rm:" + v.key, 260, (k) => v.root.scale.setScalar(Math.max(0.001, s0 * (1 - k))), easeInCubic, finish);
  }

  function syncDecals(animate: boolean) {
    const seen = new Set<string>();
    for (const d of scene.decals) {
      seen.add(d.id);
      const v = decalViews.get(d.id);
      if (!v) createDecalView(d, animate);
      else syncDecal(v, d, animate, false);
    }
    for (const v of [...decalViews.values()]) if (!seen.has(v.id)) removeDecalView(v, animate);
  }

  // ---------------- reconcile / notify
  function normalizeStatuses(s: Scene) {
    for (const o of s.objects) {
      if (o.shape === "custom" && codeByKey.has(cacheKey(o.id, o.description))) o.status = "ready";
    }
    for (const d of s.decals) {
      if (imageByKey.has(cacheKey(d.id, d.prompt))) d.status = "ready";
    }
  }

  function reconcile(animate: boolean) {
    markEnvDirty();
    if (JSON.stringify(scene.room) !== builtRoomKey) {
      buildRoom();
      for (const v of decalViews.values()) syncDecal(v, v.d, false, false);
    }
    syncSurfaces(animate);
    syncObjects(animate);
    syncDecals(animate);
  }

  function notify() {
    if (!listeners.size) return;
    const copy = cloneScene(scene);
    for (const fn of [...listeners]) {
      try {
        fn(copy);
      } catch (e) {
        console.warn("[engine] subscriber threw", e);
      }
    }
  }

  // ---------------- camera
  const defaultPose = () => {
    const { width: W, depth: D, height: H } = scene.room;
    const target = new THREE.Vector3(0, H * 0.32, -D * 0.06);
    const dir = new THREE.Vector3(0, 0.44, 1).normalize();
    const cam = camera.clone();
    cam.updateProjectionMatrix();
    const T = 0.12;
    const corners: THREE.Vector3[] = [];
    for (const x of [-W / 2 - T, W / 2 + T]) for (const y of [-0.16, H]) for (const z of [-D / 2 - T, D / 2]) corners.push(new THREE.Vector3(x, y, z));
    const v = new THREE.Vector3();
    let pos = target.clone().addScaledVector(dir, 12);
    for (let dist = 2; dist < 60; dist += 0.1) {
      cam.position.copy(target).addScaledVector(dir, dist);
      cam.lookAt(target);
      cam.updateMatrixWorld(true);
      if (corners.every((c) => {
        v.copy(c).project(cam);
        return Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.86 && v.z < 1;
      })) {
        pos = cam.position.clone();
        break;
      }
    }
    return { pos, target };
  };

  function clampCamera(p: THREE.Vector3): THREE.Vector3 {
    // Stay either in front of the open side of the room, or inside its volume — never behind a wall or under the floor.
    const { width: W, depth: D, height: H } = scene.room;
    if (p.z >= D / 2 + 0.05) {
      p.y = clamp(p.y, 0.35, H + 8);
      return p;
    }
    p.x = clamp(p.x, -W / 2 + 0.25, W / 2 - 0.25);
    p.y = clamp(p.y, 0.35, H - 0.12);
    p.z = Math.max(p.z, -D / 2 + 0.6);
    return p;
  }

  function glide(pos: THREE.Vector3, target: THREE.Vector3, dur = 950) {
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    tweens.add("camera", dur, (k) => {
      camera.position.copy(p0).lerp(pos, k);
      controls.target.copy(t0).lerp(target, k);
    });
  }

  function focusTarget(id: string): { pos: THREE.Vector3; target: THREE.Vector3 } | null {
    const { width: W, depth: D, height: H } = scene.room;
    const vfov = camera.fov * DEG;
    const aspect = Math.max(0.4, camera.aspect);
    const fitDist = (w: number, h: number) => Math.max(h / (2 * Math.tan(vfov / 2)), w / (2 * Math.tan(vfov / 2) * aspect)) * 1.35;
    const norm = id.trim().toLowerCase();
    const obj = scene.objects.find((o) => o.id === id) ?? scene.objects.find((o) => o.name.toLowerCase() === norm);
    if (obj) {
      const s = obj.size;
      const target = new THREE.Vector3(obj.position.x, obj.position.y + s.y / 2, obj.position.z);
      const r = Math.max(s.x, s.y, s.z);
      const dist = Math.max(1.3, fitDist(r * 1.2, r * 1.1));
      const cur = camera.position.clone().sub(controls.target).normalize();
      const dir = cur.lerp(new THREE.Vector3(0, 0.45, 1).normalize(), 0.55).normalize();
      if (dir.z < 0.25) dir.z = 0.25;
      dir.normalize();
      return { pos: clampCamera(target.clone().addScaledVector(dir, dist)), target };
    }
    const dec = scene.decals.find((d) => d.id === id) ?? scene.decals.find((d) => d.name.toLowerCase() === norm);
    if (dec) {
      const v = decalViews.get(dec.id);
      const target = new THREE.Vector3();
      if (v) v.root.getWorldPosition(target);
      else target.set(0, dec.y, -D / 2);
      const n = dec.surface === "wall_back" ? new THREE.Vector3(0, 0, 1) : dec.surface === "wall_left" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
      const dist = Math.max(1.4, fitDist(dec.width * 1.6, dec.height * 1.6));
      const dir = n.clone().add(new THREE.Vector3(0, 0.12, dec.surface === "wall_back" ? 0 : 0.35)).normalize();
      return { pos: clampCamera(target.clone().addScaledVector(dir, dist)), target };
    }
    const sid = norm.replace(/\s+/g, "_");
    const surf = (SURFACE_IDS as string[]).includes(sid) ? (sid as SurfaceId) : ({ back_wall: "wall_back", left_wall: "wall_left", right_wall: "wall_right" } as Record<string, SurfaceId>)[sid];
    if (surf) {
      switch (surf) {
        case "wall_back":
          return { target: new THREE.Vector3(0, H / 2, -D / 2), pos: clampCamera(new THREE.Vector3(0, H * 0.55, -D / 2 + Math.max(D + 1.2, fitDist(W, H)))) };
        case "wall_left":
          return { target: new THREE.Vector3(-W / 2, H * 0.45, -D * 0.05), pos: clampCamera(new THREE.Vector3(W * 0.3, H * 0.7, D / 2 + 2.6)) };
        case "wall_right":
          return { target: new THREE.Vector3(W / 2, H * 0.45, -D * 0.05), pos: clampCamera(new THREE.Vector3(-W * 0.3, H * 0.7, D / 2 + 2.6)) };
        case "floor":
          return { target: new THREE.Vector3(0, 0, -D * 0.05), pos: clampCamera(new THREE.Vector3(0, H + 3.2, D / 2 + 2.8)) };
        case "ceiling":
          return { target: new THREE.Vector3(0, H, -D * 0.15), pos: clampCamera(new THREE.Vector3(0, 0.8, D / 2 + 2.4)) };
      }
    }
    if (norm === "room" || norm === "all" || norm === "") return defaultPose();
    return null;
  }

  // ---------------- per-frame
  function updateVisibility() {
    const { width: W, depth: D, height: H } = scene.room;
    const c = camera.position;
    const vis: Record<WallId, boolean> = { wall_back: c.z > -D / 2, wall_left: c.x > -W / 2, wall_right: c.x < W / 2 };
    for (const w of WALL_IDS) {
      for (const o of wallExtras[w]) o.visible = vis[w];
      wallFrames[w].visible = vis[w];
    }
    if (surfMeshes.ceiling) surfMeshes.ceiling.visible = c.y < H - 0.02;
  }

  function clampControls() {
    const { width: W, depth: D, height: H } = scene.room;
    const t = controls.target;
    t.x = clamp(t.x, -W / 2, W / 2);
    t.y = clamp(t.y, 0, H);
    t.z = clamp(t.z, -D / 2, D / 2 + 2);
    if (camera.position.y < 0.15) camera.position.y = 0.15;
  }

  function captureEnv() {
    const { depth: D, height: H } = scene.room;
    const ceilVis = surfMeshes.ceiling?.visible ?? true;
    if (surfMeshes.ceiling) surfMeshes.ceiling.visible = true;
    const frameVis = WALL_IDS.map((w) => wallFrames[w].visible);
    for (const w of WALL_IDS) wallFrames[w].visible = true;
    s3.background = CAPTURE_BG;
    s3.environment = envRT.texture;
    s3.environmentIntensity = BASE_ENV_INTENSITY;
    cubeCam.position.set(0, H * 0.45, D * 0.1);
    cubeCam.update(renderer, s3);
    s3.background = BG;
    if (surfMeshes.ceiling) surfMeshes.ceiling.visible = ceilVis;
    WALL_IDS.forEach((w, i) => (wallFrames[w].visible = frameVis[i]));
    capturedRT = pmrem.fromCubemap(cubeRT.texture, capturedRT ?? undefined);
    s3.environment = capturedRT.texture;
    s3.environmentIntensity = ROOM_ENV_INTENSITY;
  }

  function frame() {
    if (disposed) return;
    const now = performance.now();
    tweens.tick(now);
    if (envDirty && (!tweens.busy() || now - envDirtySince > 1500)) {
      envDirty = false;
      try {
        captureEnv();
      } catch (e) {
        console.warn("[engine] env capture failed", e);
        s3.environment = envRT.texture;
        s3.environmentIntensity = BASE_ENV_INTENSITY;
      }
    }
    for (const v of views.values()) if (v.fx) animateFx(v.fx, now);
    for (const v of decalViews.values()) {
      if (v.ph.visible && !v.img && !v.failed) {
        const p = (now - v.t0) / 1000;
        v.ph.material.opacity = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(p * 3));
      } else if (v.failed && !v.img) v.ph.material.opacity = 0.75;
    }
    controls.update();
    clampControls();
    updateVisibility();
    renderer.render(s3, camera);
  }

  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (autoFrame && !disposed && scene) {
      const p = defaultPose();
      tweens.cancel("camera");
      camera.position.copy(p.pos);
      controls.target.copy(p.target);
    }
  }
  const ro = new ResizeObserver(() => {
    if (!disposed) resize();
  });
  ro.observe(container);

  // ---------------- init
  normalizeStatuses(scene);
  resize();
  reconcile(false);
  {
    const p = defaultPose();
    camera.position.copy(p.pos);
    controls.target.copy(p.target);
    controls.update();
  }
  renderer.setAnimationLoop(frame);

  // ---------------- public API
  function commit(next: Scene) {
    normalizeStatuses(next);
    if (JSON.stringify(next) === JSON.stringify(scene)) return;
    undoStack.push(scene);
    if (undoStack.length > 80) undoStack.shift();
    scene = next;
    reconcile(true);
    notify();
  }

  const api: StudioEngine = {
    getScene() {
      return cloneScene(scene);
    },

    applyOps(ops) {
      if (disposed) return;
      try {
        commit(applyOpsToScene(scene, ops));
      } catch (e) {
        console.error("[engine] applyOps failed", e);
      }
    },

    setScene(next) {
      if (disposed) return;
      commit(normalizeScene(next));
    },

    setAssetCode(objectId: string, code: string, description?: string) {
      if (disposed) return { ok: false, error: "engine disposed" };
      const res = evaluateModelCode(code);
      if (!res.ok) {
        console.warn("[engine] generated model rejected:", objectId, res.error);
        return { ok: false, error: res.error };
      }
      const o = scene.objects.find((x) => x.id === objectId);
      const desc = description ?? o?.description ?? "";
      const current = !!o && (o.description ?? "") === desc;
      const entry: CodeEntry = { code, baseColor: current ? o!.color : null };
      codeByKey.set(cacheKey(objectId, desc), entry);
      latestCode.set(objectId, entry);
      if (o && current && o.shape === "custom") {
        o.status = "ready";
        const v = views.get(objectId);
        if (v) {
          pendingPrepared = { code, model: res.model };
          updateObjView(v, o, true);
        }
        if (pendingPrepared) {
          disposeObject(pendingPrepared.model.group);
          pendingPrepared = null;
        }
        markEnvDirty();
        console.info(`[engine] model for ${objectId}: ${res.model.meshCount} meshes -> ${res.model.drawCount} draw calls`);
        notify();
      } else disposeObject(res.model.group);
      return { ok: true };
    },

    getAssetCode(objectId) {
      return latestCode.get(objectId)?.code;
    },

    setAssetFailed(objectId) {
      if (disposed) return;
      const o = scene.objects.find((x) => x.id === objectId);
      if (!o || o.shape !== "custom" || o.status === "ready") return;
      o.status = "failed";
      const v = views.get(objectId);
      if (v) updateObjView(v, o, true);
      notify();
    },

    setDecalImage(decalId, dataUrl) {
      if (disposed || typeof dataUrl !== "string" || !dataUrl) return;
      const d = scene.decals.find((x) => x.id === decalId);
      imageByKey.set(cacheKey(decalId, d?.prompt ?? ""), dataUrl);
      latestImage.set(decalId, dataUrl);
      if (!d) return;
      d.status = "ready";
      const v = decalViews.get(decalId);
      if (v) syncDecal(v, d, true, false);
      notify();
    },

    setDecalFailed(decalId) {
      if (disposed) return;
      const d = scene.decals.find((x) => x.id === decalId);
      if (!d || d.status === "ready") return;
      d.status = "failed";
      const v = decalViews.get(decalId);
      if (v) syncDecal(v, d, true, false);
      notify();
    },

    undo() {
      if (disposed) return false;
      const prev = undoStack.pop();
      if (!prev) return false;
      scene = prev;
      normalizeStatuses(scene);
      reconcile(true);
      notify();
      return true;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },

    screenshot() {
      if (disposed) return "";
      renderer.render(s3, camera); // render + read in the same task: no preserveDrawingBuffer needed
      return canvas.toDataURL("image/jpeg", 0.88);
    },

    focus(id) {
      if (disposed || typeof id !== "string") return;
      const f = focusTarget(id);
      if (f) {
        autoFrame = false;
        glide(f.pos, f.target);
      }
    },

    resetView() {
      if (disposed) return;
      autoFrame = true;
      const p = defaultPose();
      glide(p.pos, p.target);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controls.dispose();
      tweens.clear();
      listeners.clear();
      for (const v of [...views.values()]) removeObjView(v, false);
      for (const v of [...decalViews.values()]) removeDecalView(v, false);
      disposeObject(roomGroup);
      for (const id of SURFACE_IDS) surfMats[id].dispose();
      floorTex.dispose();
      shellMat.dispose();
      baseboardMat.dispose();
      for (const p of textureCache.values()) p.then((t) => t.dispose()).catch(() => {});
      textureCache.clear();
      envRT.dispose();
      cubeRT.dispose();
      capturedRT?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
  return api;
}
