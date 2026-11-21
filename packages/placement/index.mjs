// Shared placement rules for the server (apps/server/patch.mjs) and the browser (apps/web/src/scene/ops.ts). Plain JS so Node can import it.
// Coordinates follow web/src/types.ts: meters, +Y up, position = bottom-center, front faces local +Z, absolute world values.
//   resolveMount(o, room)                  -> pins a wall/ceiling-mounted object to its wall or the ceiling (mutates o)
//   inferMount(kind, o, room)              -> the mount a catalog kind implies, or undefined
//   followParents(prev, next, explicitIds) -> objects resting on a moved/turned/resized support follow it; children of a
//                                             removed support are removed too (mutates next.objects)

export const WALLS = ["wall_back", "wall_left", "wall_right"];
export const MOUNTS = [...WALLS, "ceiling"];
const WALL_GAP = 0.005; // keeps the back just off the wall plane (no z-fighting)
const WALL_YAW = { wall_back: 0, wall_left: 90, wall_right: -90 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Pins `o` to its mount. Wall: faces into the room, back on the wall plane, kept inside the wall. Ceiling: top touches it. */
export function resolveMount(o, room) {
	const m = o.mount;
	if (!m || !MOUNTS.includes(m)) return o;
	const s = o.size;
	const p = { ...o.position };
	const W = room.width / 2;
	const D = room.depth / 2;
	if (m === "ceiling") {
		p.y = r3(Math.max(0, room.height - s.y));
	} else {
		o.rotation_y_deg = WALL_YAW[m];
		const half = s.z / 2 + WALL_GAP;
		if (m === "wall_back") {
			p.z = r3(-D + half);
			p.x = r3(clamp(p.x, -W + s.x / 2, W - s.x / 2));
		}
		if (m === "wall_left") {
			p.x = r3(-W + half);
			p.z = r3(clamp(p.z, -D + s.x / 2, D - s.x / 2));
		}
		if (m === "wall_right") {
			p.x = r3(W - half);
			p.z = r3(clamp(p.z, -D + s.x / 2, D - s.x / 2));
		}
		p.y = r3(clamp(p.y, 0, Math.max(0, room.height - s.y)));
	}
	o.position = p;
	o.parent = "";
	return o;
}

const WALL_KINDS = new Set([
	"wall-art",
	"wall-clock",
	"curtain",
	"wreath",
	"string-lights",
]);
/** Mount implied by a catalog kind: wall things go on the nearest wall, pendant lights on the ceiling. */
export function inferMount(kind, o, room) {
	if (kind === "pendant-light") return "ceiling";
	const thinMirror = kind === "mirror" && o.size.z < 0.12 && o.size.y < 1.4; // floor/tabletop mirrors stand on things
	if (!WALL_KINDS.has(kind) && !thinMirror) return undefined;
	const p = o.position;
	const W = room.width / 2;
	const D = room.depth / 2;
	const d = { wall_back: p.z + D, wall_left: p.x + W, wall_right: W - p.x };
	return Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
}

const DEG = Math.PI / 180;
/**
 * After an edit (prev -> next): every object resting on a support that moved, turned or was resized keeps its relative
 * place on that support (offsets in the support's frame scale with its size); children of removed supports are removed. Objects in `explicitIds` were placed by this same edit and
 * are left alone (their numbers are already absolute). Supports are processed parents-first; cycles are cut.
 */
export function followParents(prev, next, explicitIds = new Set()) {
	// explicitIds: a Set (position and rotation both explicit) or { pos: Set, rot: Set } (each component on its own)
	const exPos =
		explicitIds instanceof Set ? explicitIds : explicitIds.pos || new Set();
	const exRot =
		explicitIds instanceof Set ? explicitIds : explicitIds.rot || new Set();
	const before = new Map((prev.objects || []).map((o) => [o.id, o]));
	const now = new Map((next.objects || []).map((o) => [o.id, o]));
	// cascade removal
	let removed = [...before.keys()].filter((id) => !now.has(id));
	while (removed.length) {
		const gone = new Set(removed);
		removed = [];
		for (const o of now.values())
			if (o.parent && gone.has(o.parent)) {
				now.delete(o.id);
				removed.push(o.id);
			}
	}
	// break cycles / dangling parents
	for (const o of now.values()) {
		if (!o.parent) continue;
		if (o.parent === o.id || !now.has(o.parent)) {
			o.parent = "";
			continue;
		}
		for (let p = now.get(o.parent), n = 0; p && p.parent; p = now.get(p.parent))
			if (p.parent === o.id || ++n > 64) {
				o.parent = "";
				break;
			}
	}
	const moved = new Map(); // id -> { a: old support, b: new support } for supports whose frame or size changed
	const changed = (a, b) =>
		["x", "y", "z"].some(
			(k) => a.position[k] !== b.position[k] || a.size[k] !== b.size[k],
		) || (a.rotation_y_deg || 0) !== (b.rotation_y_deg || 0);
	const order = [];
	const seen = new Set();
	const visit = (o) => {
		if (seen.has(o.id)) return;
		seen.add(o.id);
		if (o.parent && now.has(o.parent)) visit(now.get(o.parent));
		order.push(o);
	};
	for (const o of now.values()) visit(o);
	for (const o of order) {
		const old = before.get(o.id);
		if (
			o.parent &&
			moved.has(o.parent) &&
			!(exPos.has(o.id) && exRot.has(o.id)) &&
			old &&
			old.parent === o.parent
		) {
			const { a, b } = moved.get(o.parent);
			// world offset -> old support frame (three.js yaw: local (x,z) -> world (x cos + z sin, -x sin + z cos))
			const ya = (a.rotation_y_deg || 0) * DEG;
			const yb = (b.rotation_y_deg || 0) * DEG;
			const dx = old.position.x - a.position.x;
			const dz = old.position.z - a.position.z;
			let lx = dx * Math.cos(ya) - dz * Math.sin(ya);
			let lz = dx * Math.sin(ya) + dz * Math.cos(ya);
			// A resized support keeps the child at the same relative spot (seat, shelf, top all scale with it). Catalog sizes
			// are kept equal to what the renderer draws (server drawnSize), so the plain size ratio is the visible ratio.
			const k = {
				x: a.size.x > 1e-6 ? b.size.x / a.size.x : 1,
				y: a.size.y > 1e-6 ? b.size.y / a.size.y : 1,
				z: a.size.z > 1e-6 ? b.size.z / a.size.z : 1,
			};
			lx *= k.x;
			lz *= k.z;
			const ly = (old.position.y - a.position.y) * k.y;
			if (!exPos.has(o.id))
				o.position = {
					x: r3(b.position.x + lx * Math.cos(yb) + lz * Math.sin(yb)),
					y: r3(b.position.y + ly),
					z: r3(b.position.z - lx * Math.sin(yb) + lz * Math.cos(yb)),
				};
			if (!exRot.has(o.id))
				o.rotation_y_deg =
					Math.round(
						((old.rotation_y_deg || 0) +
							(b.rotation_y_deg || 0) -
							(a.rotation_y_deg || 0)) *
							100,
					) / 100;
		}
		if (old && changed(old, o)) moved.set(o.id, { a: old, b: o });
	}
	next.objects = (next.objects || []).filter((o) => now.has(o.id));
	return next;
}

export const STRETCH_MAX = 1.25;
/** Per-axis scale the renderer applies to a model of raw size `raw` shown in a size box `size` (model.ts computeFit). */
export function fitScale(raw, size) {
	let k = Number.POSITIVE_INFINITY;
	for (const a of ["x", "y", "z"])
		if (raw[a] > 1e-4) k = Math.min(k, size[a] / raw[a]);
	if (!Number.isFinite(k) || k <= 0) k = 1;
	const out = {};
	for (const a of ["x", "y", "z"])
		out[a] =
			raw[a] > 1e-4 ? k * clamp(size[a] / (raw[a] * k), 1, STRETCH_MAX) : 1;
	return out;
}
