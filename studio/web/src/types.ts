// Shared contract for the whole app. Owned by the orchestrator: do not edit, report needed changes instead.
// Units: meters. +Y up. +X = viewer's right. +Z = toward the viewer. Room centered at origin, floor at y=0.
// Back wall plane z = -depth/2, left wall x = -width/2, right wall x = +width/2. There is no front wall (camera side).

export type Vec3 = { x: number; y: number; z: number };

export type Material = {
  roughness?: number; // 0 = mirror-glossy, 1 = matte
  metalness?: number; // 0..1
  opacity?: number; // < 1 = transparent
  emissive?: string; // "#rrggbb"
};

export type Shape = "box" | "cylinder" | "sphere" | "cone" | "capsule" | "torus" | "plane" | "custom";

export type SceneObject = {
  id: string;
  name: string;
  shape: Shape;
  size: Vec3; // bounding box: x width, y height, z depth
  position: Vec3; // BOTTOM-CENTER of the bounding box
  rotation_y_deg: number;
  color: string; // "#rrggbb"
  material?: Material;
  parent: string; // id of the support it rests on, or ""
  // shape === "custom" only: a detailed model is generated in the background from this text.
  description?: string;
  // shape === "custom" only: "building" shows the placeholder, "ready" shows generated geometry, "failed" keeps placeholder.
  status?: "building" | "ready" | "failed";
};

export type SurfaceId = "wall_back" | "wall_left" | "wall_right" | "floor" | "ceiling";

export type Surface = {
  id: SurfaceId;
  color: string; // "#rrggbb"
  material?: Material;
};

// A flat image mounted on a wall (logo, painting, poster, wallpaper patch). Image is generated in the background.
export type Decal = {
  id: string;
  name: string;
  surface: "wall_back" | "wall_left" | "wall_right";
  x: number; // horizontal offset of the decal center along the wall, meters from the wall's center (as seen facing the wall, + = right)
  y: number; // height of the decal center above the floor
  width: number;
  height: number;
  prompt: string; // image generation prompt
  status?: "building" | "ready" | "failed";
};

export type Scene = {
  room: { width: number; depth: number; height: number };
  surfaces: Record<SurfaceId, Surface>;
  objects: SceneObject[];
  decals: Decal[];
};

export type Op =
  | { op: "add"; id: string; object: SceneObject }
  | { op: "update"; id: string; changes: Partial<SceneObject> }
  | { op: "remove"; id: string }
  | { op: "surface"; id: SurfaceId; changes: Partial<Omit<Surface, "id">> }
  | { op: "add_decal"; id: string; decal: Decal }
  | { op: "update_decal"; id: string; changes: Partial<Decal> }
  | { op: "remove_decal"; id: string };

// Slow background work the server asks the client to start after applying ops.
export type Job =
  | { kind: "asset"; objectId: string; name: string; description: string; size: Vec3 }
  | { kind: "decal"; decalId: string; prompt: string; width: number; height: number };

export type HistoryItem = { u: string; applied: string };

// ---------- HTTP API (server on :8787, proxied by Vite at /api) ----------

// POST /api/patch
export type PatchRequest = { scene: Scene; history: HistoryItem[]; utterance: string };
export type PatchResponse = { ops: Op[]; jobs: Job[]; say: string; ms: number; model: string; dropped?: string[] /* ops the server discarded */ };

// POST /api/asset  (body: AssetRequest) -> text/event-stream, each line `data: <AssetEvent json>\n\n`
export type AssetRequest = { objectId: string; name: string; description: string; size: Vec3; currentCode?: string };
export type AssetEvent =
  | { type: "status"; text: string } // short human-readable progress line (agent thought heading, tool call, etc.)
  | { type: "done"; code: string; ms: number; via: "managed-agent" | "direct"; model: string }
  | { type: "error"; message: string };
// `code` is JavaScript source that defines `function build(THREE) { ... return group; }` returning a THREE.Group
// built only from THREE primitives/materials (no imports, no loaders, no DOM, no network).
// Model faces +Z, default pose closed/at rest. The client rescales and re-centers it to fit the object's size box.

// POST /api/decal
export type DecalRequest = { decalId: string; prompt: string; width: number; height: number };
export type DecalResponse = { dataUrl: string; ms: number; model: string; aspectRatio?: string /* nearest supported ratio, not exactly width/height */ };

// POST /api/source (body: SourceRequest) -> text/event-stream, each line `data: <SourceEvent json>\n\n`
// A Managed Agent searches the web for real products matching a custom object. Slow (45-125 s); started by the
// client alongside the asset job for a newly added custom object (not for rebuilds).
export type SourceRequest = { objectId: string; name: string; description: string };
export type Product = { title: string; price: string; store: string; url: string; image_url: string };
export type SourceEvent =
  | { type: "status"; text: string }
  | { type: "done"; products: Product[]; ms: number; model: string }
  | { type: "error"; message: string };

// GET /api/token -> ephemeral token for the browser to open a gemini-3.5-transcribe-live session
export type TokenResponse = { token: string; model: string; apiVersion: string };

// POST /api/verify -> Decisions API check of a canvas screenshot against what the user asked for
export type VerifyRequest = { image: string /* jpeg/png data URL */; claims: { key: string; text: string }[] };
export type VerifyResponse = { results: Record<string, { yes: number; confidence: number }>; ms: number; model: string };

// ---------- Front-end module interfaces ----------

export interface Engine {
  getScene(): Scene;
  applyOps(ops: Op[]): void; // pushes an undo snapshot, updates the 3D view with a short pop-in/ghost animation
  setAssetCode(objectId: string, code: string): { ok: boolean; error?: string }; // swap placeholder for generated model
  setAssetFailed(objectId: string): void;
  setDecalImage(decalId: string, dataUrl: string): void;
  setDecalFailed(decalId: string): void;
  undo(): boolean;
  subscribe(fn: (scene: Scene) => void): () => void;
  screenshot(): string; // JPEG data URL of the current view
  focus(id: string): void; // glide camera toward an object / decal / surface
  dispose(): void;
}
// web/src/scene/engine.ts must export:  export function createEngine(container: HTMLElement): Engine

export type VoiceState = "idle" | "connecting" | "listening" | "error";
export interface Voice {
  start(): Promise<void>;
  stop(): void;
}
export type VoiceHandlers = {
  onInterim(text: string): void; // live partial text of the utterance in progress (replace previous interim)
  onUtterance(text: string): void; // a finished utterance (sentence/clause after a short pause); clears interim
  onState(state: VoiceState, detail?: string): void;
  onLevel?(rms: number): void; // 0..1 mic level for a meter
};
// web/src/voice/voice.ts must export:  export function createVoice(handlers: VoiceHandlers): Voice
