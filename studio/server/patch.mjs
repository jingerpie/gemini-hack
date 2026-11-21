// POST /api/patch: utterance -> gemini-4-hydrogen function calls -> sanitized ops + background jobs.
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_DIR, generateContent } from './lib.mjs';

export const PATCH_MODEL = process.env.PATCH_MODEL || 'gemini-4-hydrogen';
const SYSTEM = fs.readFileSync(path.join(SERVER_DIR, 'prompts', 'orchestrator.txt'), 'utf8');

// ---------- tool declarations ----------
const num = { type: 'number' };
const vec3 = desc => ({ type: 'object', properties: { x: num, y: num, z: num }, required: ['x', 'y', 'z'], description: desc });
const SHAPES = ['box', 'cylinder', 'sphere', 'cone', 'capsule', 'torus', 'plane', 'custom'];
const SURFACES = ['wall_back', 'wall_left', 'wall_right', 'floor', 'ceiling'];
const WALLS = ['wall_back', 'wall_left', 'wall_right'];
const material = {
  type: 'object', description: 'PBR material. roughness 0 = mirror-glossy, 1 = matte. opacity < 1 = transparent.',
  properties: { roughness: num, metalness: num, opacity: num, emissive: { type: 'string', description: 'hex color of emitted light' } },
};
const objectProps = {
  name: { type: 'string', description: "short human-readable name, e.g. 'gothic throne'" },
  shape: { type: 'string', enum: SHAPES, description: 'custom for any real furniture/decor; primitives only for abstract shapes the user literally asks for' },
  size: vec3('bounding-box size in meters in the object frame: x=width, y=height, z=depth (front-to-back)'),
  position: vec3('absolute world position of the BOTTOM-CENTER of the bounding box'),
  rotation_y_deg: { type: 'number', description: 'yaw in degrees; front faces local +Z. back wall 0, left wall 90, right wall -90' },
  color: { type: 'string', description: 'dominant color, hex like #3366ff' },
  material,
  parent: { type: 'string', description: 'id of the object this rests on, or "" for the floor' },
  description: { type: 'string', description: 'custom shape only: rich 40-90 word description for the 3D modeler (style, parts, materials, colors, finish), at rest' },
};
const decalProps = {
  name: { type: 'string', description: "short name, e.g. 'BMW logo'" },
  surface: { type: 'string', enum: WALLS },
  x: { type: 'number', description: 'horizontal offset of the center from the wall center, + = right when facing the wall' },
  y: { type: 'number', description: 'height of the center above the floor' },
  width: num, height: num,
  prompt: { type: 'string', description: 'complete self-contained image-generation prompt for a flat front-on image filling the frame' },
};
const TOOLS = [
  { name: 'add_object', description: 'Add a new object (furniture/decor = shape custom with description).',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'new unique id, e.g. throne1' }, ...objectProps },
      required: ['id', 'name', 'shape', 'size', 'position', 'rotation_y_deg', 'color', 'parent'] } },
  { name: 'update_object', description: 'Change fields of an existing object. Pass only changed fields as absolute values. A new description on a custom object rebuilds its model.',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'id of an existing object' },
      changes: { type: 'object', properties: objectProps, description: 'only the fields that change' } }, required: ['id', 'changes'] } },
  { name: 'remove_object', description: 'Delete an object.', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'set_surface', description: 'Change the color and/or finish of a wall, the floor or the ceiling. "The walls" = three calls.',
    parameters: { type: 'object', properties: { id: { type: 'string', enum: SURFACES }, color: { type: 'string', description: 'hex like #1a1a1a' }, material }, required: ['id'] } },
  { name: 'add_decal', description: 'Mount a generated flat image (logo, painting, poster, mural, sign) on a wall.',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'new unique id, e.g. bmw_logo1' }, ...decalProps },
      required: ['id', 'name', 'surface', 'x', 'y', 'width', 'height', 'prompt'] } },
  { name: 'update_decal', description: 'Change an existing decal. A new prompt regenerates the image; x/y/width/height/surface just move it.',
    parameters: { type: 'object', properties: { id: { type: 'string' }, changes: { type: 'object', properties: decalProps } }, required: ['id', 'changes'] } },
  { name: 'remove_decal', description: 'Delete a decal.', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'say', description: 'Short spoken confirmation or reply (max 10 words).', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
];

// ---------- sanitizing ----------
const r2 = v => Math.round(v * 100) / 100;
const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v)) ? v : (typeof v === 'string' && Number.isFinite(+v) && v.trim() !== '' ? +v : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const NAMED = { black: '#111111', white: '#f5f5f5', red: '#cc2222', green: '#2e8b3e', blue: '#2255cc', yellow: '#e8c422', orange: '#e07a1f',
  purple: '#6a3d9a', pink: '#e88aa8', brown: '#7a4a2a', gray: '#808080', grey: '#808080', gold: '#d4af37', silver: '#c0c0c0', beige: '#d8c8a8', navy: '#1f2a52', teal: '#1f8a8a' };
export function hex(c, d = '#808080') {
  if (typeof c !== 'string') return d;
  let s = c.trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  s = s.replace(/^#+/, '').replace(/^0x/, '');
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map(ch => ch + ch).join('');
  if (/^[0-9a-f]{8}$/.test(s)) s = s.slice(0, 6);
  return /^[0-9a-f]{6}$/.test(s) ? '#' + s : d;
}
function cleanMaterial(m) {
  if (!m || typeof m !== 'object') return undefined;
  const o = {};
  for (const k of ['roughness', 'metalness', 'opacity']) { const v = fin(m[k], undefined); if (v !== undefined) o[k] = r2(clamp(v, k === 'opacity' ? 0.05 : 0, 1)); }
  if (m.emissive !== undefined && m.emissive !== null && m.emissive !== '') o.emissive = hex(m.emissive, '#000000');
  return Object.keys(o).length ? o : undefined;
}
function cleanVec(v, d) {
  if (!v || typeof v !== 'object') return d && { ...d };
  return { x: r2(fin(v.x, d?.x ?? 0)), y: r2(fin(v.y, d?.y ?? 0)), z: r2(fin(v.z, d?.z ?? 0)) };
}
// Keep an object inside the room (rotation-aware footprint).
function fitObject(o, room) {
  const s = o.size;
  s.x = r2(clamp(s.x, 0.02, room.width)); s.y = r2(clamp(s.y, 0.01, room.height)); s.z = r2(clamp(s.z, 0.01, room.depth));
  const a = (o.rotation_y_deg || 0) * Math.PI / 180, c = Math.abs(Math.cos(a)), si = Math.abs(Math.sin(a));
  const ex = (s.x * c + s.z * si) / 2, ez = (s.x * si + s.z * c) / 2;
  const hx = Math.max(0, room.width / 2 - ex), hz = Math.max(0, room.depth / 2 - ez);
  o.position = { x: r2(clamp(o.position.x, -hx, hx)), y: r2(clamp(o.position.y, 0, Math.max(0, room.height - s.y))), z: r2(clamp(o.position.z, -hz, hz)) };
}
function fitDecal(d, room) {
  const wallW = d.surface === 'wall_back' ? room.width : room.depth;
  d.width = r2(clamp(d.width, 0.05, wallW)); d.height = r2(clamp(d.height, 0.05, room.height));
  const hx = Math.max(0, wallW / 2 - d.width / 2);
  d.x = r2(clamp(d.x, -hx, hx)); d.y = r2(clamp(d.y, d.height / 2, Math.max(d.height / 2, room.height - d.height / 2)));
}
const isSurf = s => SURFACES.includes(s);
const slug = s => String(s || 'item').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'item';

function normRoom(scene) {
  const r = scene?.room || {};
  return { width: fin(r.width, 6) || 6, depth: fin(r.depth, 5) || 5, height: fin(r.height, 2.8) || 2.8 };
}

// Turn raw function calls into sanitized ops and derived jobs, simulating them on a copy of the scene.
export function buildOps(calls, scene) {
  const room = normRoom(scene);
  const objs = new Map((scene?.objects || []).map(o => [o.id, structuredClone(o)]));
  const decals = new Map((scene?.decals || []).map(d => [d.id, structuredClone(d)]));
  const ops = [], say = [], dropped = [];
  const uniq = (base, map) => { let id = slug(base), i = 2; const b = id; while (objs.has(id) || decals.has(id)) id = `${b}_${i++}`; return id; };

  for (const { name, args: a = {} } of calls) {
    if (name === 'say') { if (a.text) say.push(String(a.text)); continue; }
    if (name === 'add_object') {
      const id = uniq(a.id || a.name);
      const shape = SHAPES.includes(a.shape) ? a.shape : 'custom';
      const o = {
        id, name: String(a.name || id), shape,
        size: cleanVec(a.size, { x: 0.5, y: 0.5, z: 0.5 }), position: cleanVec(a.position, { x: 0, y: 0, z: 0 }),
        rotation_y_deg: r2(fin(a.rotation_y_deg, 0)), color: hex(a.color), parent: objs.has(a.parent) ? a.parent : '',
      };
      const m = cleanMaterial(a.material); if (m) o.material = m;
      if (shape === 'custom') { o.description = String(a.description || a.name || id); o.status = 'building'; }
      fitObject(o, room);
      objs.set(id, o); ops.push({ op: 'add', id, object: o });
      continue;
    }
    if (name === 'update_object') {
      const cur = objs.get(a.id); if (!cur) { dropped.push(`update_object ${a.id}`); continue; }
      const ch = a.changes && typeof a.changes === 'object' ? a.changes : {};
      const c = {};
      if (typeof ch.name === 'string') c.name = ch.name;
      if (SHAPES.includes(ch.shape) && ch.shape !== cur.shape) c.shape = ch.shape;
      if (ch.size) c.size = cleanVec(ch.size, cur.size);
      if (ch.position) c.position = cleanVec(ch.position, cur.position);
      if (ch.rotation_y_deg !== undefined) c.rotation_y_deg = r2(fin(ch.rotation_y_deg, cur.rotation_y_deg || 0));
      if (ch.color !== undefined) c.color = hex(ch.color, cur.color);
      if (ch.material) { const m = cleanMaterial(ch.material); if (m) c.material = { ...(cur.material || {}), ...m }; }
      if (typeof ch.parent === 'string') c.parent = (ch.parent === '' || objs.has(ch.parent)) && ch.parent !== cur.id ? ch.parent : cur.parent;
      const finalShape = c.shape || cur.shape;
      if (finalShape === 'custom') {
        const newDesc = typeof ch.description === 'string' && ch.description.trim() ? ch.description.trim() : null;
        if ((newDesc && newDesc !== cur.description) || (c.shape === 'custom')) {
          c.description = newDesc || cur.description || c.name || cur.name;
          c.status = 'building';
        }
      }
      const merged = { ...cur, ...c };
      if (c.size || c.position || c.rotation_y_deg !== undefined) {
        const before = JSON.stringify(merged.position); fitObject(merged, room);
        if (c.size) c.size = merged.size;
        if (c.position || JSON.stringify(merged.position) !== before) c.position = merged.position;
      }
      if (!Object.keys(c).length) { dropped.push(`update_object ${a.id} (no changes)`); continue; }
      objs.set(cur.id, merged); ops.push({ op: 'update', id: cur.id, changes: c });
      continue;
    }
    if (name === 'remove_object') {
      if (!objs.has(a.id)) { dropped.push(`remove_object ${a.id}`); continue; }
      objs.delete(a.id); ops.push({ op: 'remove', id: a.id });
      continue;
    }
    if (name === 'set_surface') {
      if (!isSurf(a.id)) { dropped.push(`set_surface ${a.id}`); continue; }
      const c = {};
      if (a.color !== undefined && a.color !== null && a.color !== '') c.color = hex(a.color);
      const m = cleanMaterial(a.material);
      if (m) c.material = { ...(scene?.surfaces?.[a.id]?.material || {}), ...m };
      if (!Object.keys(c).length) { dropped.push(`set_surface ${a.id} (no changes)`); continue; }
      ops.push({ op: 'surface', id: a.id, changes: c });
      continue;
    }
    if (name === 'add_decal') {
      const id = uniq(a.id || a.name);
      const d = { id, name: String(a.name || id), surface: WALLS.includes(a.surface) ? a.surface : 'wall_back',
        x: r2(fin(a.x, 0)), y: r2(fin(a.y, 1.6)), width: r2(fin(a.width, 1)), height: r2(fin(a.height, 1)),
        prompt: String(a.prompt || a.name || 'abstract wall art'), status: 'building' };
      fitDecal(d, room);
      decals.set(id, d); ops.push({ op: 'add_decal', id, decal: d });
      continue;
    }
    if (name === 'update_decal') {
      const cur = decals.get(a.id); if (!cur) { dropped.push(`update_decal ${a.id}`); continue; }
      const ch = a.changes && typeof a.changes === 'object' ? a.changes : {};
      const c = {};
      if (typeof ch.name === 'string') c.name = ch.name;
      if (WALLS.includes(ch.surface) && ch.surface !== cur.surface) c.surface = ch.surface;
      for (const k of ['x', 'y', 'width', 'height']) if (ch[k] !== undefined) c[k] = r2(fin(ch[k], cur[k]));
      if (typeof ch.prompt === 'string' && ch.prompt.trim() && ch.prompt.trim() !== cur.prompt) { c.prompt = ch.prompt.trim(); c.status = 'building'; }
      const merged = { ...cur, ...c };
      if (['surface', 'x', 'y', 'width', 'height'].some(k => k in c)) { fitDecal(merged, room); for (const k of ['x', 'y', 'width', 'height']) if (k in c || merged[k] !== cur[k]) c[k] = merged[k]; }
      if (!Object.keys(c).length) { dropped.push(`update_decal ${a.id} (no changes)`); continue; }
      decals.set(cur.id, merged); ops.push({ op: 'update_decal', id: cur.id, changes: c });
      continue;
    }
    if (name === 'remove_decal') {
      if (!decals.has(a.id)) { dropped.push(`remove_decal ${a.id}`); continue; }
      decals.delete(a.id); ops.push({ op: 'remove_decal', id: a.id });
      continue;
    }
    dropped.push(`unknown ${name}`);
  }

  // Jobs: one per object/decal that ends this patch in "building" state and still exists (last write wins).
  const jobs = [], seen = new Set();
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    if ((op.op === 'add' || op.op === 'update') && !seen.has('o' + op.id)) {
      const building = op.op === 'add' ? op.object.status === 'building' : op.changes.status === 'building';
      const o = objs.get(op.id);
      if (building && o) { seen.add('o' + op.id); jobs.unshift({ kind: 'asset', objectId: o.id, name: o.name, description: o.description, size: o.size }); }
    }
    if ((op.op === 'add_decal' || op.op === 'update_decal') && !seen.has('d' + op.id)) {
      const building = op.op === 'add_decal' || op.changes.status === 'building';
      const d = decals.get(op.id);
      if (building && d) { seen.add('d' + op.id); jobs.unshift({ kind: 'decal', decalId: d.id, prompt: d.prompt, width: d.width, height: d.height }); }
    }
  }
  return { ops, jobs, say: say.join(' ').trim(), dropped };
}

// Compact scene for the prompt: only what the model needs, no code / image data.
function compactScene(scene) {
  const room = normRoom(scene);
  const v = p => p && { x: r2(fin(p.x, 0)), y: r2(fin(p.y, 0)), z: r2(fin(p.z, 0)) };
  const surfaces = {};
  for (const id of SURFACES) { const s = scene?.surfaces?.[id]; if (s) surfaces[id] = { color: s.color, ...(s.material && { material: s.material }) }; }
  return {
    room, surfaces,
    objects: (scene?.objects || []).map(o => ({ id: o.id, name: o.name, shape: o.shape, size: v(o.size), position: v(o.position),
      rotation_y_deg: o.rotation_y_deg || 0, color: o.color, ...(o.material && { material: o.material }), parent: o.parent || '',
      ...(o.shape === 'custom' && o.description && { description: o.description }) })),
    decals: (scene?.decals || []).map(d => ({ id: d.id, name: d.name, surface: d.surface, x: d.x, y: d.y, width: d.width, height: d.height, prompt: d.prompt })),
  };
}

export async function patch({ scene, history = [], utterance }) {
  if (typeof utterance !== 'string' || !utterance.trim()) { const e = new Error('utterance required'); e.status = 400; throw e; }
  const input = `CURRENT SCENE:\n${JSON.stringify(compactScene(scene))}\n\nRECENT HISTORY (oldest first):\n` +
    ((Array.isArray(history) ? history : []).slice(-6).map((h, i) => `${i + 1}. User: "${h.u}" -> Applied: ${h.applied}`).join('\n') || '(none)') +
    `\n\nUSER SAID: "${utterance.trim()}"`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: input }] }],
    tools: [{ functionDeclarations: TOOLS.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })) }],
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    generationConfig: { thinkingConfig: { thinkingLevel: 'low' } },
  };
  const t0 = Date.now();
  const js = await generateContent(PATCH_MODEL, body, { timeoutMs: 30000 });
  const calls = (js.candidates?.[0]?.content?.parts || []).filter(p => p.functionCall).map(p => ({ name: p.functionCall.name, args: p.functionCall.args || {} }));
  const out = buildOps(calls, scene);
  return { ops: out.ops, jobs: out.jobs, say: out.say, ms: Date.now() - t0, model: PATCH_MODEL, _dropped: out.dropped };
}
