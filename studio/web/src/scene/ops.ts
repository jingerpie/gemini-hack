// Pure, defensive scene editing: (scene, ops) -> new scene. No three.js view code here.
import * as THREE from "three";
import type { Decal, Material, Op, Scene, SceneObject, Shape, Surface, SurfaceId, Vec3 } from "../types";

export const SHAPES: Shape[] = ["box", "cylinder", "sphere", "cone", "capsule", "torus", "plane", "custom"];
export const SURFACE_IDS: SurfaceId[] = ["wall_back", "wall_left", "wall_right", "floor", "ceiling"];
export const WALL_IDS = ["wall_back", "wall_left", "wall_right"] as const;
export type WallId = (typeof WALL_IDS)[number];
const STATUSES = ["building", "ready", "failed"] as const;
type Status = (typeof STATUSES)[number];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Finite number or undefined (accepts numeric strings; NaN/Infinity/garbage -> undefined). */
export function num(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const _c = new THREE.Color();
/** Normalizes "#abc", "abcdef", "#AABBCCDD", "0xaabbcc", CSS names ("navy", "dark red"), rgb()/hsl() to "#rrggbb". */
export function sanitizeColor(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 0xffffff) return "#" + v.toString(16).padStart(6, "0");
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  let m = /^(?:#|0x)?([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s);
  if (m) return "#" + m[1];
  m = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m) return "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
  const name = s.replace(/[\s_-]/g, "");
  const names = THREE.Color.NAMES as Record<string, number>;
  if (name in names) return "#" + names[name].toString(16).padStart(6, "0");
  if (/^(rgb|hsl)a?\(/.test(s)) {
    try {
      _c.setStyle(s);
      return "#" + _c.getHexString();
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function mergeVec(base: Vec3, ch: unknown, lo: number, hi: number): Vec3 {
  const out = { ...base };
  if (!ch || typeof ch !== "object") return out;
  const c = ch as Record<string, unknown>;
  for (const k of ["x", "y", "z"] as const) {
    const n = num(c[k]);
    if (n !== undefined) out[k] = clamp(n, lo, hi);
  }
  return out;
}

const MAT_KEYS = ["roughness", "metalness", "opacity", "emissive"] as const;

/** Merge a partial material change into an existing material. `null` resets to defaults. */
export function mergeMaterial(base: Material | undefined, ch: unknown): Material | undefined {
  if (ch === null) return undefined;
  if (!ch || typeof ch !== "object") return base;
  const c = ch as Record<string, unknown>;
  const out: Material = { ...(base || {}) };
  for (const k of ["roughness", "metalness"] as const) {
    if (!(k in c)) continue;
    if (c[k] === null) delete out[k];
    else {
      const n = num(c[k]);
      if (n !== undefined) out[k] = clamp(n, 0, 1);
    }
  }
  if ("opacity" in c) {
    if (c.opacity === null) delete out.opacity;
    else {
      const n = num(c.opacity);
      if (n !== undefined) out.opacity = clamp(n, 0.05, 1);
    }
  }
  if ("emissive" in c) {
    const e = c.emissive;
    if (e === null || e === "" || e === "none" || e === false) delete out.emissive;
    else {
      const col = sanitizeColor(e);
      if (col) out.emissive = col;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Models sometimes put roughness etc. at the top level of `changes`; fold them into `material`. */
function liftMaterial(c: Record<string, unknown>): unknown {
  const lifted: Record<string, unknown> = {};
  let any = false;
  for (const k of MAT_KEYS) if (k in c) ((lifted[k] = c[k]), (any = true));
  if (!any) return c.material;
  if (c.material && typeof c.material === "object") return { ...lifted, ...(c.material as object) };
  return lifted;
}

function sanitizeNewObject(id: string, raw: unknown): SceneObject | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const shape: Shape = SHAPES.includes(r.shape as Shape) ? (r.shape as Shape) : "box";
  const o: SceneObject = {
    id,
    name: (str(r.name) || "").trim() || id,
    shape,
    size: mergeVec({ x: 0.5, y: 0.5, z: 0.5 }, r.size, 0.01, 30),
    position: mergeVec({ x: 0, y: 0, z: 0 }, r.position, -60, 60),
    rotation_y_deg: num(r.rotation_y_deg) ?? 0,
    color: sanitizeColor(r.color) ?? "#b9b2a8",
    parent: str(r.parent) ?? "",
  };
  const mat = mergeMaterial(undefined, liftMaterial(r));
  if (mat) o.material = mat;
  if (typeof r.description === "string") o.description = r.description;
  if (shape === "custom") o.status = r.status === "failed" ? "failed" : "building";
  return o;
}

function applyObjectChanges(o: SceneObject, raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const c = raw as Record<string, unknown>;
  const prevDesc = o.description;
  const prevShape = o.shape;
  if (typeof c.name === "string" && c.name.trim()) o.name = c.name.trim();
  if (SHAPES.includes(c.shape as Shape)) o.shape = c.shape as Shape;
  if ("size" in c) o.size = mergeVec(o.size, c.size, 0.01, 30);
  if ("position" in c) o.position = mergeVec(o.position, c.position, -60, 60);
  const rot = num(c.rotation_y_deg);
  if (rot !== undefined) o.rotation_y_deg = rot;
  const col = sanitizeColor(c.color);
  if (col) o.color = col;
  if (typeof c.parent === "string") o.parent = c.parent;
  const matCh = liftMaterial(c);
  if (matCh !== undefined) {
    const m = mergeMaterial(o.material, matCh);
    if (m) o.material = m;
    else delete o.material;
  }
  if (typeof c.description === "string") o.description = c.description;
  if (STATUSES.includes(c.status as Status)) o.status = c.status as Status;
  if (o.shape === "custom") {
    // A new description (or turning a primitive into a custom object) means a new model is on its way.
    if (o.description !== prevDesc || prevShape !== "custom") {
      if (!STATUSES.includes(c.status as Status) || c.status === "ready") o.status = "building";
    }
    if (!o.status) o.status = "building";
  }
}

function sanitizeNewDecal(id: string, raw: unknown, scene: Scene): Decal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const surface: WallId = WALL_IDS.includes(r.surface as WallId) ? (r.surface as WallId) : "wall_back";
  const H = scene.room.height;
  const d: Decal = {
    id,
    name: (str(r.name) || "").trim() || id,
    surface,
    x: num(r.x) ?? 0,
    y: num(r.y) ?? H * 0.55,
    width: clamp(num(r.width) ?? 1, 0.05, 30),
    height: clamp(num(r.height) ?? 1, 0.05, 30),
    prompt: str(r.prompt) ?? str(r.name) ?? "",
    status: r.status === "failed" ? "failed" : "building",
  };
  return d;
}

function applyDecalChanges(d: Decal, raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const c = raw as Record<string, unknown>;
  const prevPrompt = d.prompt;
  if (typeof c.name === "string" && c.name.trim()) d.name = c.name.trim();
  if (WALL_IDS.includes(c.surface as WallId)) d.surface = c.surface as WallId;
  for (const k of ["x", "y"] as const) {
    const n = num(c[k]);
    if (n !== undefined) d[k] = n;
  }
  for (const k of ["width", "height"] as const) {
    const n = num(c[k]);
    if (n !== undefined) d[k] = clamp(n, 0.05, 30);
  }
  if (typeof c.prompt === "string") d.prompt = c.prompt;
  if (STATUSES.includes(c.status as Status)) d.status = c.status as Status;
  if (d.prompt !== prevPrompt && (!STATUSES.includes(c.status as Status) || c.status === "ready")) d.status = "building";
}

function applySurfaceChanges(s: Surface, raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const c = raw as Record<string, unknown>;
  const col = sanitizeColor(c.color);
  if (col) s.color = col;
  const matCh = liftMaterial(c);
  if (matCh !== undefined) {
    const m = mergeMaterial(s.material, matCh);
    if (m) s.material = m;
    else delete s.material;
  }
}

/** Accepts "back wall", "walls"-style ids defensively; returns the list of surfaces an op targets. */
function resolveSurfaceIds(id: unknown): SurfaceId[] {
  if (typeof id !== "string") return [];
  const s = id.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (SURFACE_IDS.includes(s as SurfaceId)) return [s as SurfaceId];
  if (s === "walls" || s === "all_walls" || s === "wall") return ["wall_back", "wall_left", "wall_right"];
  const alias: Record<string, SurfaceId> = {
    back_wall: "wall_back", left_wall: "wall_left", right_wall: "wall_right", back: "wall_back",
    left: "wall_left", right: "wall_right", ground: "floor", roof: "ceiling",
  };
  return alias[s] ? [alias[s]] : [];
}

function applyOne(scene: Scene, op: Op | Record<string, unknown>): void {
  const o = op as Record<string, unknown>;
  const kind = o.op;
  const id = typeof o.id === "string" ? o.id : typeof o.id === "number" ? String(o.id) : "";
  switch (kind) {
    case "add": {
      const raw = o.object as Record<string, unknown> | undefined;
      const oid = id || (raw && typeof raw.id === "string" ? raw.id : "");
      if (!oid) return;
      const obj = sanitizeNewObject(oid, raw);
      if (!obj) return;
      const i = scene.objects.findIndex((x) => x.id === oid);
      if (i >= 0) scene.objects[i] = obj;
      else scene.objects.push(obj);
      return;
    }
    case "update": {
      const obj = scene.objects.find((x) => x.id === id);
      if (obj) return applyObjectChanges(obj, o.changes);
      const d = scene.decals.find((x) => x.id === id);
      if (d) applyDecalChanges(d, o.changes);
      return;
    }
    case "remove": {
      scene.objects = scene.objects.filter((x) => x.id !== id);
      scene.decals = scene.decals.filter((x) => x.id !== id);
      return;
    }
    case "surface": {
      for (const sid of resolveSurfaceIds(o.id)) {
        const s = scene.surfaces[sid] || (scene.surfaces[sid] = { id: sid, color: "#dddddd" });
        applySurfaceChanges(s, o.changes);
      }
      return;
    }
    case "add_decal": {
      const raw = o.decal as Record<string, unknown> | undefined;
      const did = id || (raw && typeof raw.id === "string" ? raw.id : "");
      if (!did) return;
      const d = sanitizeNewDecal(did, raw, scene);
      if (!d) return;
      const i = scene.decals.findIndex((x) => x.id === did);
      if (i >= 0) scene.decals[i] = d;
      else scene.decals.push(d);
      return;
    }
    case "update_decal": {
      const d = scene.decals.find((x) => x.id === id);
      if (d) applyDecalChanges(d, o.changes);
      return;
    }
    case "remove_decal": {
      scene.decals = scene.decals.filter((x) => x.id !== id);
      return;
    }
    default:
      return;
  }
}

/** Returns a NEW scene with ops applied. Malformed ops are skipped, never thrown. */
export function applyOpsToScene(scene: Scene, ops: unknown): Scene {
  const next = cloneScene(scene);
  if (!Array.isArray(ops)) return next;
  for (const op of ops) {
    if (!op || typeof op !== "object") continue;
    try {
      applyOne(next, op as Op);
    } catch (e) {
      console.warn("[engine] skipped op", op, e);
    }
  }
  return next;
}

export function cloneScene(s: Scene): Scene {
  return JSON.parse(JSON.stringify(s)) as Scene;
}

/** Make an arbitrary (possibly partial) scene safe to render: every surface present, arrays present. */
export function normalizeScene(raw: Scene): Scene {
  const s = cloneScene(raw);
  const r = s.room || ({} as Scene["room"]);
  s.room = {
    width: clamp(num(r.width) ?? 6, 1, 40),
    depth: clamp(num(r.depth) ?? 5, 1, 40),
    height: clamp(num(r.height) ?? 2.8, 1.5, 12),
  };
  const surfaces = (s.surfaces || {}) as Scene["surfaces"];
  const defaults: Record<SurfaceId, string> = {
    wall_back: "#e8e2d8", wall_left: "#e4ddd2", wall_right: "#e4ddd2", floor: "#b07f52", ceiling: "#f3f1ec",
  };
  for (const id of SURFACE_IDS) {
    const cur = surfaces[id];
    surfaces[id] = {
      id,
      color: sanitizeColor(cur?.color) ?? defaults[id],
      ...(cur?.material ? { material: mergeMaterial(undefined, cur.material) } : {}),
    };
    if (!surfaces[id].material) delete surfaces[id].material;
  }
  s.surfaces = surfaces;
  s.objects = (Array.isArray(s.objects) ? s.objects : [])
    .map((o) => {
      const n = sanitizeNewObject(String(o?.id ?? ""), o);
      if (n && o.shape === "custom" && (o.status === "ready" || o.status === "failed")) n.status = o.status;
      return n;
    })
    .filter((o): o is SceneObject => !!o && !!o.id);
  s.decals = (Array.isArray(s.decals) ? s.decals : [])
    .map((d) => {
      const n = sanitizeNewDecal(String(d?.id ?? ""), d, s);
      if (n && (d.status === "ready" || d.status === "failed")) n.status = d.status;
      return n;
    })
    .filter((d): d is Decal => !!d && !!d.id);
  return s;
}
