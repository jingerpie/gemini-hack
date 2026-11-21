// Offline stand-in for the studio server (`?mock=1`). A tiny keyword rule engine fakes /api/patch,
// and asset/decal/verify return plausible results after realistic delays. Every delay honours the AbortSignal.
import type { Api } from "./api";
import type {
  AssetEvent,
  AssetRequest,
  Decal,
  DecalRequest,
  DecalResponse,
  Job,
  Op,
  PatchRequest,
  PatchResponse,
  Scene,
  SceneObject,
  SurfaceId,
  Vec3,
  VerifyRequest,
  VerifyResponse,
} from "../types";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r2 = (v: number) => Math.round(v * 100) / 100;
const abortError = () => new DOMException("Aborted", "AbortError");

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer);
      reject(abortError());
    };
    timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, Math.max(0, ms));
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// ---------- vocabulary ----------
const COLOURS: Record<string, string> = {
  black: "#1c1c1e", white: "#f3f2ee", red: "#b3261e", blue: "#2f5fa8", green: "#3f7a4a", navy: "#1f2a44",
  beige: "#d8c8a8", grey: "#8a8d91", gray: "#8a8d91", pink: "#e3a1b4", yellow: "#e6c34a", orange: "#d9792b",
  purple: "#6b4a8a", teal: "#2a8a8a", gold: "#c9a227", cream: "#f1e8d0",
};
const COLOUR_RE = /\b(black|white|red|blue|green|navy|beige|grey|gray|pink|yellow|orange|purple|teal|gold|cream)\b/g;

type Kind = "seat" | "table" | "lamp" | "plant" | "sofa" | "box" | "tv";
type Furn = { size: [number, number, number]; color: string; accent: string; kind: Kind; back?: boolean; arms?: boolean; fancy?: boolean };
const WOOD = "#3b2a1e";
const FURNITURE: Record<string, Furn> = {
  armchair: { size: [0.9, 1.0, 0.9], color: "#6b4f3a", accent: WOOD, kind: "seat", back: true, arms: true },
  chair: { size: [0.7, 1.1, 0.7], color: "#8b5a2b", accent: WOOD, kind: "seat", back: true },
  throne: { size: [0.9, 1.6, 0.8], color: "#7a1f2b", accent: "#c9a227", kind: "seat", back: true, arms: true, fancy: true },
  stool: { size: [0.4, 0.65, 0.4], color: "#9a6b3f", accent: WOOD, kind: "seat" },
  table: { size: [1.4, 0.75, 0.8], color: "#a0714a", accent: WOOD, kind: "table" },
  desk: { size: [1.4, 0.75, 0.7], color: "#7d5a3c", accent: "#2b2b2b", kind: "table" },
  lamp: { size: [0.4, 1.6, 0.4], color: "#efe3c8", accent: "#2b2b2b", kind: "lamp" },
  sofa: { size: [2.1, 0.85, 0.9], color: "#5d6b7a", accent: "#7b8898", kind: "sofa", arms: true },
  couch: { size: [2.1, 0.85, 0.9], color: "#6e5a4a", accent: "#8a7562", kind: "sofa", arms: true },
  bed: { size: [1.6, 1.0, 2.1], color: "#5a4636", accent: "#eeeae2", kind: "sofa" },
  bookshelf: { size: [1.0, 2.0, 0.35], color: "#6e4b2f", accent: "#a33b2f", kind: "box", back: true },
  shelf: { size: [1.0, 1.8, 0.35], color: "#8a6440", accent: "#3f6e8a", kind: "box", back: true },
  cabinet: { size: [1.0, 0.9, 0.5], color: "#7a5a3e", accent: "#c0c0c0", kind: "box" },
  plant: { size: [0.5, 1.2, 0.5], color: "#3f7a3a", accent: "#b5653a", kind: "plant" },
  tv: { size: [1.3, 1.2, 0.3], color: "#111111", accent: "#222222", kind: "tv" },
};
const NOUNS = Object.keys(FURNITURE);
const NOUN_ALT = NOUNS.join("|");
const DECAL_ALT = "logo|poster|painting|picture|mural|artwork|art";
const FILLER = new Set(
  ("look looks like make bit little lot much more less please the and with its it that this very some " +
    "shiny shinier glossy metallic polished matte bigger larger smaller move left right rotate spin turn change")
    .split(" "),
);

function findNoun(text: string): string | undefined {
  const like = new RegExp(`\\blike an? (${NOUN_ALT})\\b`).exec(text);
  if (like) return like[1];
  return new RegExp(`\\b(${NOUN_ALT})\\b`).exec(text)?.[1];
}

function uniqueId(prefix: string, taken: Set<string>): string {
  let n = 1;
  while (taken.has(`${prefix}_${n}`)) n++;
  const id = `${prefix}_${n}`;
  taken.add(id);
  return id;
}

function placeOnFloor(scene: Scene, size: Vec3, corner: boolean, extra: SceneObject[]): Vec3 {
  const hw = scene.room.width / 2, hd = scene.room.depth / 2;
  const fit = (x: number, z: number): Vec3 => ({
    x: r2(clamp(x, -hw + size.x / 2 + 0.05, hw - size.x / 2 - 0.05)),
    y: 0,
    z: r2(clamp(z, -hd + size.z / 2 + 0.05, hd - size.z / 2 - 0.05)),
  });
  const others = [...scene.objects, ...extra].filter((o) => o.parent === "");
  const free = (p: Vec3) =>
    others.every(
      (o) => Math.abs(o.position.x - p.x) > (o.size.x + size.x) / 2 + 0.1 || Math.abs(o.position.z - p.z) > (o.size.z + size.z) / 2 + 0.1,
    );
  const cands = corner
    ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => fit(sx * hw, sz * hd))
    : Array.from({ length: 16 }, () => fit(rand(-2, 2), rand(-1.5, 1)));
  return cands.find(free) ?? cands[0];
}

// ---------- patch rule engine ----------
function interpret(scene: Scene, utterance: string): { ops: Op[]; jobs: Job[]; say: string } {
  const text = utterance.toLowerCase();
  const ops: Op[] = [];
  const jobs: Job[] = [];
  let say = "";
  const taken = new Set(scene.objects.map((o) => o.id));
  const latest = (pred: (o: SceneObject) => boolean = () => true) => [...scene.objects].reverse().find(pred);
  const matchesNoun = (o: SceneObject, n: string) =>
    o.id.startsWith(n + "_") || o.name.toLowerCase().includes(n) || (o.description ?? "").toLowerCase().includes(n);
  const removing = /\b(remove|delete|get rid of|take away|take out)\b/.test(text);
  const modifying = /\b(bigger|larger|smaller|move|rotate|spin)\b/.test(text);
  const nouns = [...text.matchAll(new RegExp(`\\b(${NOUN_ALT})\\b`, "g"))].map((m) => ({ noun: m[1], index: m.index ?? 0 }));
  const excluded: [number, number][] = []; // colour words that belong to an object/decal, not to a surface
  let added: SceneObject | undefined;

  // 1. furniture: rebuild an existing object, or add a new one
  const first = nouns[0];
  if (first && !removing) {
    const existing = latest((o) => matchesNoun(o, first.noun));
    const editVerb = /\b(make|change|turn|redo|rebuild) the\b|\bmore\b|\bless\b/.test(text);
    const leftover = text.slice(first.index + first.noun.length).split(/[^a-z]+/).filter((w) => w.length > 2 && !FILLER.has(w));
    const addMatch = new RegExp(`\\b(?:a|an|another|one|some|new|add|want|need)\\s+(?:[a-z-]+\\s+){0,3}?(${NOUN_ALT})\\b`).exec(text);
    if (existing && editVerb && leftover.length) {
      const description = `${existing.description ?? existing.name}. Change: ${utterance.trim()}`;
      ops.push({ op: "update", id: existing.id, changes: { description, status: "building" } });
      jobs.push({ kind: "asset", objectId: existing.id, name: existing.name, description, size: existing.size });
      if (Math.random() < 0.6) say = `Reworking the ${existing.name.toLowerCase()}.`;
    } else if (addMatch) {
      const noun = addMatch[1];
      const start = addMatch.index;
      const phrase = utterance.slice(start).split(/[.;!?]|,\s*(?:and\s+)?(?:make|paint|put|move|rotate|then)\b|\s+and\s+(?:make|paint|put|then)\b/i)[0];
      const description = phrase.replace(/^(add|want|need)\s+/i, "").trim();
      excluded.push([start, start + phrase.length]);
      const furn = FURNITURE[findNoun(text.slice(start, start + phrase.length)) ?? noun] ?? FURNITURE[noun];
      const size: Vec3 = { x: furn.size[0], y: furn.size[1], z: furn.size[2] };
      const colourWord = text.slice(start, start + phrase.length).match(COLOUR_RE)?.[0];
      const id = uniqueId(noun, taken);
      const name = noun === "tv" ? "TV" : noun[0].toUpperCase() + noun.slice(1);
      added = {
        id, name, shape: "custom", size,
        position: placeOnFloor(scene, size, /\b(corner|there)\b/.test(text), []),
        rotation_y_deg: 0,
        color: colourWord ? COLOURS[colourWord] : furn.color,
        parent: "", description, status: "building",
      };
      ops.push({ op: "add", id, object: added });
      jobs.push({ kind: "asset", objectId: id, name, description, size });
      if (Math.random() < 0.6) say = `Building the ${noun === "tv" ? "TV" : noun} in the background.`;
    }
  }

  // 2. decals (logo / poster / painting / mural ...)
  const decalMatch = new RegExp(`(?:[a-z0-9-]+\\s+){0,2}\\b(${DECAL_ALT})\\b`).exec(text);
  const wallSpecs = [...text.matchAll(/\b(back|left|right)(?:\s+(?:and|&)\s+(back|left|right))?\s+walls?\b/g)];
  if (decalMatch) excluded.push([decalMatch.index, decalMatch.index + decalMatch[0].length]);
  const decalRef = new RegExp(`\\b(the|that|this)\\s+(?:[a-z]+\\s+)?(${DECAL_ALT})\\b`).test(text);
  const lastDecal = scene.decals[scene.decals.length - 1];
  if (decalMatch && lastDecal && decalRef && (removing || modifying) && !first) {
    if (removing) ops.push({ op: "remove_decal", id: lastDecal.id });
    else {
      const k = /\bsmaller\b/.test(text) ? 0.75 : /\b(bigger|larger)\b/.test(text) ? 1.3 : 1;
      const dx = /\bleft\b/.test(text) ? -1 : /\bright\b/.test(text) ? 1 : 0;
      ops.push({ op: "update_decal", id: lastDecal.id, changes: { width: r2(lastDecal.width * k), height: r2(lastDecal.height * k), x: lastDecal.x + dx } });
    }
  } else if (decalMatch && !removing) {
    const kind = decalMatch[1] === "art" ? "artwork" : decalMatch[1];
    const surface = (wallSpecs[0] ? `wall_${wallSpecs[0][1]}` : "wall_back") as Decal["surface"];
    const decalIds = new Set(scene.decals.map((d) => d.id));
    const id = uniqueId("decal", decalIds);
    const mural = kind === "mural";
    const width = mural ? 3 : 1.2, height = mural ? 1.8 : 1.2;
    const before = new RegExp(`\\b([A-Za-z0-9-]+)\\s+(?:${DECAL_ALT})\\b`, "i").exec(utterance)?.[1];
    const skip = /^(a|an|the|that|this|some|big|small|nice|cool|new|huge|large|of|my)$/i;
    const name = /bmw/.test(text)
      ? `BMW ${kind}`
      : before && !skip.test(before) ? `${before[0].toUpperCase()}${before.slice(1)} ${kind}` : kind[0].toUpperCase() + kind.slice(1);
    const wallLen = surface === "wall_back" ? scene.room.width : scene.room.depth;
    const onWall = scene.decals.filter((d) => d.surface === surface);
    const x = [0, 1.6, -1.6, 3, -3].find(
      (cx) => Math.abs(cx) + width / 2 < wallLen / 2 && onWall.every((d) => Math.abs(d.x - cx) > (d.width + width) / 2),
    ) ?? 0;
    const decal: Decal = { id, name, surface, x, y: 1.6, width, height, prompt: utterance.trim(), status: "building" };
    ops.push({ op: "add_decal", id, decal });
    jobs.push({ kind: "decal", decalId: id, prompt: decal.prompt, width, height });
    if (!say && Math.random() < 0.3) say = `Generating the ${name}.`;
  }

  // 3. surfaces: colour + walls / floor / ceiling
  const colours = [...text.matchAll(COLOUR_RE)]
    .map((m) => ({ word: m[1], index: m.index ?? 0 }))
    .filter((c) => !excluded.some(([a, b]) => c.index >= a && c.index < b));
  const hits: { id: SurfaceId; index: number }[] = [];
  if (wallSpecs.length) {
    for (const m of wallSpecs) for (const side of [m[1], m[2]]) if (side) hits.push({ id: `wall_${side}` as SurfaceId, index: m.index ?? 0 });
  } else {
    const w = /\bwalls?\b/.exec(text);
    if (w) for (const id of ["wall_back", "wall_left", "wall_right"] as const) hits.push({ id, index: w.index });
  }
  for (const id of ["floor", "ceiling"] as const) {
    const m = new RegExp(`\\b${id}\\b`).exec(text);
    if (m) hits.push({ id, index: m.index });
  }
  const shiny = /\b(shiny|shinier|glossy|metallic|polished)\b/.test(text);
  const matte = /\bmatte\b/.test(text);
  const done = new Set<SurfaceId>();
  for (const h of hits) {
    if (done.has(h.id)) continue;
    const c = colours.slice().sort((a, b) => Math.abs(a.index - h.index) - Math.abs(b.index - h.index))[0];
    const surfaceOnly = !first && !/\b(it|that|this)\b/.test(text) && !decalMatch;
    const material = surfaceOnly && (shiny || matte) ? (matte ? { roughness: 0.95, metalness: 0 } : { roughness: 0.1, metalness: 0.3 }) : undefined;
    if (!c && !material) continue;
    done.add(h.id);
    ops.push({ op: "surface", id: h.id, changes: { ...(c ? { color: COLOURS[c.word] } : {}), ...(material ? { material } : {}) } });
  }
  const surfaceMaterialUsed = [...done].length > 0 && (shiny || matte) && !first;

  // 4. modifiers on the object just added, the object named, or the most recent one ("it"/"that")
  const named = nouns.map((n) => latest((o) => matchesNoun(o, n.noun))).find(Boolean) ?? latest((o) => text.includes(o.name.toLowerCase()));
  const target = added ?? named ?? latest();
  const decalOnly = decalMatch && !first;
  if (target && !decalOnly) {
    if (removing && !added && (named || /\b(it|that|this)\b/.test(text))) ops.push({ op: "remove", id: target.id });
    if (!removing) {
      const changes: Partial<SceneObject> = {};
      if ((shiny || matte) && !surfaceMaterialUsed)
        changes.material = { ...target.material, ...(matte ? { roughness: 0.95, metalness: 0 } : { roughness: 0.1, metalness: 0.6 }) };
      const k = /\bsmaller\b/.test(text) ? 0.75 : /\b(bigger|larger)\b/.test(text) ? 1.3 : 1;
      if (k !== 1) changes.size = { x: r2(target.size.x * k), y: r2(target.size.y * k), z: r2(target.size.z * k) };
      const mv = /\bmove\b[^.]*?\b(left|right)\b/.exec(text);
      const lim = Math.max(0, scene.room.width / 2 - target.size.x / 2 - 0.05);
      if (mv) changes.position = { ...target.position, x: r2(clamp(target.position.x + (mv[1] === "left" ? -1 : 1), -lim, lim)) };
      if (/\b(rotate|spin|turn it|turn that)\b/.test(text)) changes.rotation_y_deg = (target.rotation_y_deg + 45) % 360;
      if (Object.keys(changes).length) ops.push({ op: "update", id: target.id, changes });
    }
  } else if (removing && decalMatch && lastDecal && !ops.length) {
    ops.push({ op: "remove_decal", id: lastDecal.id });
  }

  if (!ops.length && !jobs.length) say = "Not sure what to change there.";
  return { ops, jobs, say };
}

// ---------- asset (fake managed-agent stream) ----------
const BODIES: Record<Kind, string> = {
  seat: `const t = Math.max(0.035, Math.min(W, D) * 0.07);
  const seatY = BACK ? Math.min(0.47, H * 0.42) : H - t;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(t * 0.5, t * 0.4, seatY, 10), FANCY ? acc : mat, sx * (W / 2 - t), seatY / 2, sz * (D / 2 - t));
  add(new THREE.BoxGeometry(W, t * 1.5, D), mat, 0, seatY, 0);
  if (BACK) add(new THREE.BoxGeometry(W, H - seatY, t * 1.2), mat, 0, seatY + (H - seatY) / 2, -D / 2 + t * 0.6);
  if (ARMS) for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(t * 1.2, t * 1.2, D * 0.9), FANCY ? acc : mat, sx * (W / 2 - t * 0.6), seatY + 0.22, 0.02);
    add(new THREE.BoxGeometry(t, 0.22, t), FANCY ? acc : mat, sx * (W / 2 - t * 0.6), seatY + 0.11, D / 2 - t);
  }
  if (FANCY) for (const sx of [-1, 1]) add(new THREE.SphereGeometry(t * 1.3, 14, 10), acc, sx * (W / 2 - t), H - t, -D / 2 + t * 0.6);`,
  table: `const t = Math.max(0.03, Math.min(W, D) * 0.05);
  add(new THREE.BoxGeometry(W, t, D), mat, 0, H - t / 2, 0);
  add(new THREE.BoxGeometry(W - t * 4, t * 2, D - t * 4), acc, 0, H - t * 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(t * 1.4, H - t, t * 1.4), acc, sx * (W / 2 - t * 1.5), (H - t) / 2, sz * (D / 2 - t * 1.5));`,
  lamp: `const r = Math.min(W, D) / 2;
  add(new THREE.CylinderGeometry(r * 0.55, r * 0.65, 0.04, 24), acc, 0, 0.02, 0);
  add(new THREE.CylinderGeometry(0.015, 0.015, H * 0.78, 8), acc, 0, H * 0.39, 0);
  const shade = new THREE.MeshStandardMaterial({ color: COL, emissive: COL, emissiveIntensity: 0.35, roughness: 0.85, side: THREE.DoubleSide });
  add(new THREE.CylinderGeometry(r * 0.6, r, H * 0.24, 24, 1, true), shade, 0, H * 0.86, 0);`,
  plant: `add(new THREE.CylinderGeometry(W * 0.3, W * 0.22, H * 0.3, 18), acc, 0, H * 0.15, 0);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, k = i / 6;
    add(new THREE.SphereGeometry(W * (0.24 - k * 0.08), 12, 10), mat, Math.cos(a) * W * 0.18, H * (0.45 + k * 0.42), Math.sin(a) * D * 0.18);
  }`,
  sofa: `const baseH = H * 0.45, armW = ARMS ? W * 0.08 : 0;
  add(new THREE.BoxGeometry(W, baseH, D), mat, 0, baseH / 2, 0);
  add(new THREE.BoxGeometry(W, H - baseH, D * 0.2), mat, 0, baseH + (H - baseH) / 2, -D / 2 + D * 0.1);
  if (ARMS) for (const sx of [-1, 1]) add(new THREE.BoxGeometry(armW, H * 0.68, D), mat, sx * (W / 2 - armW / 2), H * 0.34, 0);
  const n = Math.max(1, Math.round((W - armW * 2) / 0.7)), cw = (W - armW * 2) / n;
  for (let i = 0; i < n; i++) add(new THREE.BoxGeometry(cw * 0.94, H * 0.12, D * 0.75), acc, -W / 2 + armW + cw * (i + 0.5), baseH + H * 0.06, D * 0.08);`,
  box: `const t = 0.03, n = Math.max(2, Math.round(H / 0.38));
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(t, H, D), mat, sx * (W / 2 - t / 2), H / 2, 0);
  add(new THREE.BoxGeometry(W, H, t), mat, 0, H / 2, -D / 2 + t / 2);
  for (let i = 0; i <= n; i++) add(new THREE.BoxGeometry(W - t * 2, t, D), mat, 0, t / 2 + (H - t) * i / n, 0);
  if (BACK) for (let i = 0; i < n; i++) add(new THREE.BoxGeometry(W * 0.12, (H / n) * 0.6, D * 0.7), acc, -W / 2 + W * (0.2 + 0.15 * (i % 4)), (H - t) * i / n + t + (H / n) * 0.3, 0);
  else { add(new THREE.BoxGeometry(W - t * 2, H - t * 2, t), mat, 0, H / 2, D / 2 - t / 2); add(new THREE.BoxGeometry(0.02, 0.12, 0.03), acc, W * 0.3, H * 0.6, D / 2 + 0.01); }`,
  tv: `const standH = Math.max(0, H - W * 0.5625), panelH = H - standH;
  add(new THREE.BoxGeometry(W, panelH, Math.max(0.03, D * 0.3)), acc, 0, standH + panelH / 2, 0);
  const screen = new THREE.MeshStandardMaterial({ color: "#05070a", roughness: 0.15, metalness: 0.3, emissive: "#0b1a2e" });
  add(new THREE.BoxGeometry(W * 0.96, panelH * 0.93, 0.005), screen, 0, standH + panelH / 2, Math.max(0.03, D * 0.3) / 2 + 0.003);
  if (standH > 0) { add(new THREE.CylinderGeometry(0.03, 0.03, standH, 8), acc, 0, standH / 2, 0); add(new THREE.BoxGeometry(W * 0.35, 0.02, D), acc, 0, 0.01, 0); }`,
};

function assetCode(req: AssetRequest): string {
  const text = `${req.name} ${req.description}`.toLowerCase();
  const furn = FURNITURE[findNoun(text) ?? "cabinet"] ?? FURNITURE.cabinet;
  const fancy = !!furn.fancy || /\b(throne|royal|regal|ornate|gold|golden)\b/.test(text);
  const colourWord = text.match(COLOUR_RE)?.find((c) => c !== "gold");
  const col = colourWord ? COLOURS[colourWord] : furn.color;
  const acc = fancy ? "#c9a227" : furn.accent;
  const [rough, metal] = /\bmatte\b/.test(text) ? [0.95, 0] : /\b(shiny|glossy|polished)\b/.test(text) ? [0.15, 0.5] : /\b(metal|metallic|chrome|steel)\b/.test(text) ? [0.3, 0.9] : [0.6, 0.05];
  const f = (v: number) => Math.max(0.05, v).toFixed(3);
  return `function build(THREE) {
  const W = ${f(req.size.x)}, H = ${f(req.size.y)}, D = ${f(req.size.z)};
  const COL = "${col}", ACC = "${acc}", FANCY = ${fancy}, BACK = ${!!furn.back || fancy}, ARMS = ${!!furn.arms || fancy};
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: COL, roughness: ${rough}, metalness: ${metal} });
  const acc = new THREE.MeshStandardMaterial({ color: ACC, roughness: ${fancy ? 0.3 : 0.55}, metalness: ${fancy ? 0.8 : 0.2} });
  function add(geo, m, x, y, z) { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh; }
  ${BODIES[furn.kind]}
  return g;
}`;
}

function assetLines(req: AssetRequest): string[] {
  const text = `${req.name} ${req.description}`.toLowerCase();
  const n = req.name.toLowerCase();
  const furn = FURNITURE[findNoun(text) ?? "cabinet"] ?? FURNITURE.cabinet;
  const fancy = !!furn.fancy || /\b(throne|royal|regal|ornate|gold)\b/.test(text);
  const detail: Record<Kind, [string, string]> = {
    seat: [`Blocking out seat and backrest of the ${n}`, fancy ? "Adding carved armrests and finials" : "Adding legs and stretchers"],
    table: [`Blocking out the ${n} top`, "Adding legs and apron"],
    lamp: [`Blocking out base and stem of the ${n}`, "Adding fabric shade"],
    plant: ["Shaping the pot", "Scattering foliage clusters"],
    sofa: [`Blocking out base and back of the ${n}`, "Adding arms and seat cushions"],
    box: [`Blocking out carcass of the ${n}`, "Adding shelves and panels"],
    tv: ["Blocking out screen panel", "Adding bezel and stand"],
  };
  const mats = ["gold leaf", "velvet", "oak", "walnut", "leather", "marble", "chrome", "glass", "linen", "brass"].filter((m) => text.includes(m.split(" ")[0]));
  const s = req.size;
  const first = req.currentCode ? `Editing previous model (${req.currentCode.split("\n").length} lines)` : `Planning silhouette of the ${n}`;
  const lines = [
    first,
    "Calling tool: write_file build.js",
    ...detail[furn.kind],
    `Tuning materials (${mats.length ? mats.slice(0, 2).join(", ") : fancy ? "gold leaf, velvet" : "wood, fabric"})`,
    "Calling tool: run_sandbox build.js",
    `Self-check: proportions vs ${s.x}×${s.y}×${s.z} m box`,
  ];
  const drop = 7 - Math.floor(rand(5, 8)); // keep 5..7 lines; optional ones are the two tool calls
  const optional = [5, 1].sort(() => Math.random() - 0.5).slice(0, drop);
  return lines.filter((_, i) => !optional.includes(i));
}

// ---------- decal (canvas placeholder image) ----------
const STOP = new Set(
  ("put a an the on that this wall walls back left right logo poster painting picture mural art artwork i want need add please of " +
    "with and to in big some there can you me my we lets let's like would place hang get make giant huge large small nice")
    .split(" "),
);

function decalText(prompt: string): string {
  if (/bmw/i.test(prompt)) return "BMW";
  const caps = prompt.match(/\b[A-Z][A-Z0-9&]+\b/g);
  if (caps) return caps.slice(0, 2).join(" ");
  const words = prompt.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const key = words.filter((w) => !STOP.has(w)).slice(0, 3);
  return (key.length ? key : words.slice(0, 3)).join(" ").toUpperCase() || "ART";
}

function renderDecal(prompt: string, width: number, height: number): string {
  const aspect = width > 0 && height > 0 ? width / height : 1;
  const cw = aspect >= 1 ? 512 : Math.max(16, Math.round(512 * aspect));
  const ch = aspect >= 1 ? Math.max(16, Math.round(512 / aspect)) : 512;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  let hue = 0;
  for (const c of prompt) hue = (hue * 31 + c.charCodeAt(0)) % 360;
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, `hsl(${hue}, 45%, 16%)`);
  grad.addColorStop(1, `hsl(${(hue + 50) % 360}, 55%, 42%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);
  const glow = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.6);
  glow.addColorStop(0, "rgba(255,255,255,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, cw - 24, ch - 24);
  const label = decalText(prompt);
  let size = Math.min(ch * 0.42, cw * 0.5);
  const setFont = () => (ctx.font = `700 ${Math.round(size)}px system-ui, -apple-system, "Segoe UI", sans-serif`);
  setFont();
  while (ctx.measureText(label).width > cw * 0.8 && size > 10) {
    size *= 0.9;
    setFont();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, cw / 2, ch / 2);
  return canvas.toDataURL("image/png");
}

// ---------- the Api ----------
export function createMockApi(): Api {
  return {
    async patch(req: PatchRequest, signal: AbortSignal): Promise<PatchResponse> {
      const queue = typeof window !== "undefined" ? (window as unknown as { __mockPatchDelays?: unknown }).__mockPatchDelays : undefined;
      const latency = Array.isArray(queue) && queue.length ? Number(queue.shift()) || 0 : 700 + Math.random() * 900;
      await sleep(latency, signal);
      if (req.utterance.toLowerCase().includes("fail")) throw new Error("mock patch failure (500)");
      const { ops, jobs, say } = interpret(req.scene, req.utterance);
      return { ops, jobs, say, ms: Math.round(latency), model: "mock-hydrogen" };
    },

    async asset(req: AssetRequest, signal: AbortSignal, onEvent: (e: AssetEvent) => void): Promise<void> {
      const start = Date.now();
      const total = rand(9000, 16000);
      const text = `${req.name} ${req.description}`.toLowerCase();
      const lines = assetLines(req);
      await sleep(rand(300, 700), signal);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) await sleep(rand(1200, 2600), signal);
        onEvent({ type: "status", text: lines[i] });
        if (text.includes("error") && i === Math.floor(lines.length / 2)) {
          await sleep(rand(800, 1500), signal);
          onEvent({ type: "error", message: "mock agent crashed" });
          return;
        }
      }
      await sleep(Math.max(600, total - (Date.now() - start)), signal);
      const code = text.includes("broken") ? "function build(THREE) { return (; }" : assetCode(req);
      onEvent({ type: "done", code, ms: Date.now() - start, via: "managed-agent", model: "mock-antigravity" });
    },

    async decal(req: DecalRequest, signal: AbortSignal): Promise<DecalResponse> {
      const start = Date.now();
      await sleep(rand(5000, 8000), signal);
      if (req.prompt.toLowerCase().includes("fail")) throw new Error("mock image failure");
      const dataUrl = renderDecal(req.prompt, req.width, req.height);
      return { dataUrl, ms: Date.now() - start, model: "mock-nano-banana" };
    },

    async verify(req: VerifyRequest, signal?: AbortSignal): Promise<VerifyResponse> {
      const start = Date.now();
      await sleep(rand(600, 1200), signal);
      const results: VerifyResponse["results"] = {};
      for (const c of req.claims) {
        results[c.key] = { yes: r2(Math.max(0.35, 1 - Math.random() ** 2 * 0.65)), confidence: r2(rand(0.6, 0.95)) };
      }
      return { results, ms: Date.now() - start, model: "mock-decisions" };
    },
  };
}
