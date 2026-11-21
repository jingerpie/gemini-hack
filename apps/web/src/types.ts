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

export type Shape =
	| "box"
	| "cylinder"
	| "sphere"
	| "cone"
	| "capsule"
	| "torus"
	| "plane"
	| "custom";

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
	// Set when the object IS a real product: found live through Shop MCP (buyable; `product.similar` unset) or taken
	// from the pre-built catalog (packages/catalog: demo listings, not buyable; `product.similar` set).
	product?: Product;
	// shape === "custom" only: URL of the merchant's own 3D model (GLB on the merchant CDN, loaded straight from there,
	// never copied). When set, the client loads this instead of asking for generated geometry, and keeps the model's
	// real-world size (it replaces `size` with the measured one). On load failure it falls back to generation.
	glb?: string;
};

export type SurfaceId =
	| "wall_back"
	| "wall_left"
	| "wall_right"
	| "floor"
	| "ceiling";

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
	| {
			kind: "asset";
			objectId: string;
			name: string;
			description: string;
			size: Vec3;
			catalogId?: string /* pre-built catalog model: returns in well under a second */;
			glb?: string /* load this GLB with Engine.setAssetGlb; no /api/asset call unless it fails */;
			image_url?: string /* product photo: generate the model from it */;
	  }
	| {
			kind: "decal";
			decalId: string;
			prompt: string;
			width: number;
			height: number;
	  };

// `ids` (optional): every object/decal/surface id that utterance touched, newest last, so "it" / "that one" resolves
// even when `applied` was cut short.
export type HistoryItem = { u: string; applied: string; ids?: string[] };

// ---------- HTTP API (server on :8787, proxied by Vite at /api) ----------

// POST /api/patch
// Every request carries the whole space: the scene, what the user is looking at (`view`) and a picture of it (`image`).
// `image` (optional): JPEG data URL of the canvas as the user sees it.
// `view` (optional): where the camera is, and what the cursor is on, so "this", "that wall", "over there" can be resolved.
export type View = {
	position: Vec3; // camera position, world meters
	target: Vec3; // point the camera looks at
	pointed?: string; // id of the object, decal or surface under the cursor right now, if any
	pointedAt?: Vec3; // world point under the cursor (e.g. the spot on the floor or wall), if any
};
// `options` (optional): the option cards on screen now, so "the leather one" / "the cheaper one" can be resolved.
export type PatchRequest = {
	scene: Scene;
	history: HistoryItem[];
	utterance: string;
	image?: string;
	view?: View;
	options?: Options;
};
export type PatchResponse = {
	ops: Op[];
	jobs: Job[];
	say: string;
	ms: number;
	model: string;
	dropped?: string[] /* ops the server discarded */;
	brief?: string /* set when the designer model did the work: the brief the orchestrator handed it */;
	options?: Options /* show these cards */;
};

// POST /api/asset  (body: AssetRequest) -> text/event-stream, each line `data: <AssetEvent json>\n\n`
// With `catalogId` the server skips generation and returns the catalog's pre-built model at once (via: "catalog").
// With `image_url` the model is generated from that product photo (the photo is sent to the model, not stored).
export type AssetRequest = {
	objectId: string;
	name: string;
	description: string;
	size: Vec3;
	currentCode?: string;
	catalogId?: string;
	image_url?: string;
};
export type AssetEvent =
	| { type: "status"; text: string } // short human-readable progress line (agent thought heading, tool call, etc.)
	| {
			type: "done";
			code: string;
			ms: number;
			via: "managed-agent" | "direct" | "catalog";
			model: string;
	  }
	| { type: "error"; message: string };
// `code` is JavaScript source that defines `function build(THREE) { ... return group; }` returning a THREE.Group
// built only from THREE primitives/materials (no imports, no loaders, no DOM, no network).
// Model faces +Z, default pose closed/at rest. The client rescales and re-centers it to fit the object's size box.

// POST /api/decal
export type DecalRequest = {
	decalId: string;
	prompt: string;
	width: number;
	height: number;
};
export type DecalResponse = {
	dataUrl: string;
	ms: number;
	model: string;
	aspectRatio?: string /* nearest supported ratio, not exactly width/height */;
};

// POST /api/source (body: SourceRequest) -> text/event-stream, each line `data: <SourceEvent json>\n\n`
// A Managed Agent searches the web for real products matching a custom object. Slow (45-125 s); started by the
// client alongside the asset job for a newly added custom object (not for rebuilds).
export type SourceRequest = {
	objectId: string;
	name: string;
	description: string;
};
// `catalogId` = the catalog entry's modelFile without ".build.js" (e.g. "sofa/03-junction"); set for catalog products.
// Shop MCP products: `url`, `image_url`, `model_glb` are used exactly as returned (every query parameter kept, no proxy).
export type Product = {
	title: string;
	price: string;
	store: string;
	url: string;
	image_url: string;
	catalogId?: string;
	variant_id?: string; // Shop MCP variant id: what checkout buys
	shop?: string; // merchant domain for checkout
	model_glb?: string;
	model_usdz?: string; // merchant's 3D model, if the listing has one
	similar?: boolean; // true = closest real product to what is shown in the room, not the exact item
	// How this product gets its 3D model: "glb" = the merchant's own model (seconds), "catalog" = pre-built (instant),
	// "photo" = generated from the product photo by Gemini (about 20 s).
	model?: "glb" | "catalog" | "photo";
};

// OPTIONS: products that fit what the user asked for, shown as numbered cards in a panel on the right (1, 2, 3 ...).
// The first is placed in the room at once; saying "two" / "number two" / clicking a card swaps to it; "more" /
// "scroll more" shows the next page. Numbers run on across pages (page 1 = cards 4..6 with pageSize 3).
export type Options = {
	objectId: string;
	query: string;
	products: Product[];
	page: number;
	pageSize: number;
	more: boolean;
	chosen?: number /* 1-based card number now in the room */;
};
// GET /api/options?q=<query>&page=<n>&objectId=<id> -> next page of options (live search, no model call)
export type OptionsResponse = Options & { ms: number };
// POST /api/choose -> ops + jobs that put the chosen product on the object (no model call, a few ms)
export type ChooseRequest = {
	scene: Scene;
	objectId: string;
	product: Product;
};
export type ChooseResponse = {
	ops: Op[];
	jobs: Job[];
	say: string;
	ms: number;
};

// GET /api/catalog -> the shop catalog (100 real listings, each with a pre-built 3D model)
export type CatalogItem = Product & {
	catalogId: string;
	kind: string;
	productType: string;
	size: Vec3 /* meters */;
};
export type CatalogResponse = { items: CatalogItem[] };

// POST /api/checkout -> real checkout links from Shop MCP, one per merchant. Paying happens on the merchant's page.
export type CheckoutRequest = {
	items: {
		variantId?: string;
		shop?: string;
		url?: string;
		catalogId?: string;
		title?: string;
		quantity?: number;
	}[];
};
export type CheckoutResponse = {
	checkouts: {
		store: string;
		url: string /* continue_url, opened unchanged */;
		titles: string[];
		total?: string;
		similar?: boolean;
		status?: string;
		warnings?: string[];
	}[];
	failed?: { title: string; reason: string }[];
	ms: number;
};

// GET /api/shop/search?q=...&limit=3&model=1 -> live Shop MCP search (model=1: only listings that have a 3D model)
export type ShopSearchResponse = { products: Product[]; ms: number };
export type SourceEvent =
	| { type: "status"; text: string }
	| { type: "done"; products: Product[]; ms: number; model: string }
	| { type: "error"; message: string };

// POST /api/render -> photorealistic picture of the current room, made by the image model from a canvas screenshot.
// The 3D scene stays the source of truth; the render is a picture of it, not a replacement.
export type RenderRequest = {
	image: string /* jpeg/png data URL of the canvas */;
	scene?: Scene;
	style?: string;
};
export type RenderResponse = { dataUrl: string; ms: number; model: string };

// GET /api/token -> ephemeral token for the browser to open a gemini-3.5-transcribe-live session
export type TokenResponse = {
	token: string;
	model: string;
	apiVersion: string;
};

// POST /api/verify -> Decisions API check of a canvas screenshot against what the user asked for
export type VerifyRequest = {
	image: string /* jpeg/png data URL */;
	claims: { key: string; text: string }[];
};
export type VerifyResponse = {
	results: Record<string, { yes: number; confidence: number }>;
	ms: number;
	model: string;
};

// ---------- Front-end module interfaces ----------

export interface Engine {
	getScene(): Scene;
	applyOps(ops: Op[]): void; // pushes an undo snapshot, updates the 3D view with a short pop-in/ghost animation
	setAssetCode(objectId: string, code: string): { ok: boolean; error?: string }; // swap placeholder for generated model
	// Load a merchant GLB for a custom object. Resolves with the model's measured real size once shown.
	setAssetGlb?(
		objectId: string,
		url: string,
	): Promise<{ ok: boolean; error?: string; size?: Vec3 }>;
	setAssetFailed(objectId: string): void;
	setDecalImage(decalId: string, dataUrl: string): void;
	setDecalFailed(decalId: string): void;
	undo(): boolean;
	subscribe(fn: (scene: Scene) => void): () => void;
	screenshot(): string; // JPEG data URL of the current view
	focus(id: string): void; // glide camera toward an object / decal / surface
	getView?(): View; // camera pose and what the cursor is on, sent with every patch request
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
