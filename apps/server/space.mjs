// SPACE block: the scene described in words and ready-made geometry (corners, footprints, neighbours, free space,
// recency, camera/pointer), so the model does not have to derive spatial relations from raw coordinates.
// Conventions (same as types.ts): +x = right, +z = toward the viewer (open front, no wall), floor y = 0.
// Decal "along-wall x": wall_back x = world x; wall_left x = -world z; wall_right x = +world z (as seen facing the wall).

const r1 = (v) => (Math.round(v * 100) / 100).toString();
const num = (v, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const WALLS = ["wall_back", "wall_left", "wall_right"];

export function roomOf(scene) {
	const r = scene?.room || {};
	return {
		width: num(r.width, 6) || 6,
		depth: num(r.depth, 5) || 5,
		height: num(r.height, 2.8) || 2.8,
	};
}
export function footprint(o) {
	const a = (num(o.rotation_y_deg) * Math.PI) / 180;
	const c = Math.abs(Math.cos(a));
	const s = Math.abs(Math.sin(a));
	const sx = num(o.size?.x, 0.5);
	const sz = num(o.size?.z, 0.5);
	const ex = (sx * c + sz * s) / 2;
	const ez = (sx * s + sz * c) / 2;
	const px = num(o.position?.x);
	const pz = num(o.position?.z);
	return {
		x0: px - ex,
		x1: px + ex,
		z0: pz - ez,
		z1: pz + ez,
		y0: num(o.position?.y),
		y1: num(o.position?.y) + num(o.size?.y, 0.5),
	};
}
export const isFlat = (o) => num(o.size?.y, 1) < 0.06; // rugs, mats: may lie under furniture
// 3D overlap of two bounding boxes (rotation-aware footprints + height ranges), with tolerance.
export function boxesOverlap(A, B, tol = 0.02) {
	return (
		Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) > tol &&
		Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0) > tol &&
		Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) > tol
	);
}
const gapBetween = (A, B) =>
	Math.max(A.x0 - B.x1, B.x0 - A.x1, A.z0 - B.z1, B.z0 - A.z1, 0);

function facing(rot) {
	const r = (((num(rot) % 360) + 540) % 360) - 180; // -180..180
	const names = [
		[0, "front (+z, toward the viewer)"],
		[90, "right (+x)"],
		[-90, "left (-x)"],
		[180, "the back wall (-z)"],
		[-180, "the back wall (-z)"],
	];
	for (const [a, n] of names) if (Math.abs(r - a) <= 15) return n;
	return `${Math.round(r)} deg`;
}
// Direction of point b from point a, in the default viewer frame (camera at the open front looking at the back wall).
function dirWord(dx, dz) {
	if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? "right of" : "left of";
	return dz > 0 ? "in front of" : "behind";
}

function whereWords(f, room) {
	const hx = room.width / 2;
	const hz = room.depth / 2;
	const d = {
		left: f.x0 + hx,
		right: hx - f.x1,
		back: f.z0 + hz,
		front: hz - f.z1,
	};
	const cx = (f.x0 + f.x1) / 2;
	const cz = (f.z0 + f.z1) / 2;
	const near = (k) => d[k] <= 0.6;
	if (near("back") && near("left")) return "back-left corner";
	if (near("back") && near("right")) return "back-right corner";
	if (near("front") && near("left")) return "front-left corner";
	if (near("front") && near("right")) return "front-right corner";
	const against = [
		["back", "wall_back"],
		["left", "wall_left"],
		["right", "wall_right"],
	]
		.filter(([k]) => d[k] <= 0.15)
		.map(([, w]) => w);
	if (against.length) return `against ${against[0]}`;
	const wallsNear = ["back", "left", "right"]
		.filter((k) => d[k] <= 0.8)
		.map((k) => `${r1(d[k])} m from wall_${k}`);
	const zone = `${Math.abs(cx) < room.width / 6 ? "centre" : cx < 0 ? "left side" : "right side"}, ${Math.abs(cz) < room.depth / 6 ? "middle" : cz < 0 ? "back half" : "front half"}`;
	return `free-standing (${zone})${wallsNear.length ? ", " + wallsNear.join(", ") : ""}`;
}

// Free intervals of [lo,hi] after removing spans, keeping those >= minLen.
function freeIntervals(lo, hi, spans, minLen) {
	const s = spans
		.map(([a, b]) => [Math.max(lo, a), Math.min(hi, b)])
		.filter(([a, b]) => b > a)
		.sort((p, q) => p[0] - q[0]);
	const out = [];
	let cur = lo;
	for (const [a, b] of s) {
		if (a - cur >= minLen) out.push([cur, a]);
		cur = Math.max(cur, b);
	}
	if (hi - cur >= minLen) out.push([cur, hi]);
	return out;
}
const wallSpanOf = (f, wall) =>
	wall === "wall_back"
		? [f.x0, f.x1]
		: wall === "wall_left"
			? [-f.z1, -f.z0]
			: [f.z0, f.z1];
const wallLen = (wall, room) =>
	wall === "wall_back" ? room.width : room.depth;
function againstWall(f, wall, room, tol = 0.6) {
	const hx = room.width / 2;
	const hz = room.depth / 2;
	return wall === "wall_back"
		? f.z0 + hz <= tol
		: wall === "wall_left"
			? f.x0 + hx <= tol
			: hx - f.x1 <= tol;
}

// Ids touched by recent history, newest first. Parses the client's `applied` summaries ("add lamp1 ...; update sofa1 ...").
export function recentIds(history) {
	const out = [];
	const seen = new Set();
	for (const h of (Array.isArray(history) ? history : []).slice().reverse()) {
		const re =
			/(?:^|;\s*)(add|update|remove|surface|add_decal|update_decal|remove_decal)\s+([\w-]+)/g;
		let m;
		const found = [];
		while ((m = re.exec(String(h?.applied || "")))) found.push([m[2], m[1]]);
		for (const [id, op] of found)
			if (!seen.has(id)) {
				seen.add(id);
				out.push({ id, op, u: String(h?.u || "").slice(0, 50) });
			}
		if (out.length >= 6) break;
	}
	return out;
}

function viewLines(view, scene, room, objs) {
	const P = view?.position;
	const T = view?.target;
	if (!P || !T) return [];
	const dx = num(T.x) - num(P.x);
	const dz = num(T.z) - num(P.z);
	const n = Math.hypot(dx, dz) || 1;
	const fx = dx / n;
	const fz = dz / n;
	const toWall = (vx, vz) =>
		Math.abs(vx) >= Math.abs(vz)
			? vx < 0
				? "wall_left"
				: "wall_right"
			: vz < 0
				? "wall_back"
				: "the open front (no wall)";
	const rx = -fz;
	const rz = fx; // viewer's right
	const L = [];
	L.push(
		`VIEW: camera at (${r1(num(P.x))},${r1(num(P.y))},${r1(num(P.z))}) looking toward (${r1(num(T.x))},${r1(num(T.y))},${r1(num(T.z))}). The user FACES ${toWall(fx, fz)}.`,
	);
	L.push(
		`- Viewer's LEFT is ${toWall(-rx, -rz)} (world direction x ${r1(-rx)}, z ${r1(-rz)}); viewer's RIGHT is ${toWall(rx, rz)} (x ${r1(rx)}, z ${r1(rz)}); "closer to me" = toward the camera (x ${r1(-fx)}, z ${r1(-fz)}).`,
	);
	L.push(
		`- "left/right/closer/further" in the utterance use THIS frame, not world x.`,
	);
	const near = objs
		.map((o) => ({
			o,
			d: Math.hypot(
				num(o.position?.x) - num(P.x),
				num(o.position?.z) - num(P.z),
			),
		}))
		.sort((a, b) => a.d - b.d)
		.slice(0, 3);
	if (near.length)
		L.push(
			`- Nearest the camera: ${near.map(({ o, d }) => `${o.id} (${r1(d)} m)`).join(", ")}`,
		);
	if (view.pointed || view.pointedAt) {
		const id = String(view.pointed || "");
		const thing =
			objs.find((o) => o.id === id) ||
			(scene?.decals || []).find((d) => d.id === id);
		const what = thing
			? `${id} (${thing.name})`
			: id
				? `${id}${WALLS.includes(id) || id === "floor" || id === "ceiling" ? " (surface)" : " (unknown id)"}`
				: "nothing";
		const pa = view.pointedAt
			? ` at world point (${r1(num(view.pointedAt.x))},${r1(num(view.pointedAt.y))},${r1(num(view.pointedAt.z))})`
			: "";
		L.push(
			`POINTING AT: ${what}${pa}. "this/that/here/there" = this target or point.`,
		);
	}
	return L;
}

// Surfaces of catalog products (seat, shelves, top), injected by patch.mjs so this module stays free of catalog imports.
let supportsOf = () => [];
export function setSupportLookup(fn) {
	if (typeof fn === "function") supportsOf = fn;
}
function surfacesText(o) {
	const list = o.product?.catalogId
		? supportsOf(o.product.catalogId, o.size)
		: [];
	if (!list.length) return "";
	const seen = new Set();
	const parts = [];
	for (const p of list) {
		const k = p.name + "@" + p.y.toFixed(2);
		if (seen.has(k)) continue;
		seen.add(k);
		parts.push(
			`${p.name} y ${r1(num(o.position?.y) + p.y)} (${r1(p.x1 - p.x0)} x ${r1(p.z1 - p.z0)} m${p.clear != null ? `, ${r1(p.clear)} m clear above` : ""})`,
		);
	}
	return `; surfaces: ${parts.slice(0, 8).join(", ")}`;
}

export function spaceBlock(scene, history = [], view) {
	const room = roomOf(scene);
	const hx = room.width / 2;
	const hz = room.depth / 2;
	const objs = (scene?.objects || []).filter((o) => o && o.id);
	const decals = (scene?.decals || []).filter((d) => d && d.id);
	const F = new Map(objs.map((o) => [o.id, footprint(o)]));
	const floorObjs = objs.filter((o) => !o.parent && !o.mount); // wall/ceiling-mounted things are not floor obstacles
	const L = [];
	L.push(
		"SPACE (computed by the server from the scene; use these numbers instead of re-deriving them)",
	);
	L.push(
		`ROOM ${r1(room.width)} x ${r1(room.depth)} m, height ${r1(room.height)}. x -${r1(hx)} (left wall) .. ${r1(hx)} (right wall); z -${r1(hz)} (back wall) .. ${r1(hz)} (open front, camera side).`,
	);
	// corners
	const corners = [
		["back-left", -hx, -hz],
		["back-right", hx, -hz],
		["front-left", -hx, hz],
		["front-right", hx, hz],
	].map(([n, x, z]) => {
		const occ = floorObjs
			.filter((o) => !isFlat(o))
			.filter((o) => {
				const f = F.get(o.id);
				return (
					Math.max(
						Math.abs(x) -
							Math.max(Math.abs(f.x0), Math.abs(f.x1)) *
								Math.sign(x) *
								Math.sign(x),
						0,
					) >= 0 &&
					Math.min(Math.abs(x - f.x0), Math.abs(x - f.x1)) <= 0.9 &&
					Math.min(Math.abs(z - f.z0), Math.abs(z - f.z1)) <= 0.9
				);
			});
		return { n, x, z, occ: occ.map((o) => o.id) };
	});
	L.push(
		`CORNERS: ${corners.map((c) => `${c.n} (${r1(c.x)},${r1(c.z)}) ${c.occ.length ? "[" + c.occ.join(",") + "]" : "EMPTY"}`).join("; ")}`,
	);
	L.push(
		`WALL CENTRES (floor): wall_back (0,-${r1(hz)}), wall_left (-${r1(hx)},0), wall_right (${r1(hx)},0). Decal along-wall x: wall_back = world x, wall_left = -world z, wall_right = +world z.`,
	);
	// objects
	if (objs.length)
		L.push(
			"OBJECTS (footprint = world x-range / z-range after rotation; top = height of its top surface):",
		);
	for (const o of objs) {
		const f = F.get(o.id);
		const holds = objs.filter((c) => c.parent === o.id).map((c) => c.id);
		const sameSupport = o.mount
			? []
			: objs.filter(
					(b) =>
						b.id !== o.id &&
						!b.mount &&
						(b.parent || "") === (o.parent || "") &&
						!isFlat(b),
				);
		const nb = sameSupport
			.map((b) => {
				const g = F.get(b.id);
				return {
					b,
					gap: gapBetween(f, g),
					dx: (g.x0 + g.x1 - f.x0 - f.x1) / 2,
					dz: (g.z0 + g.z1 - f.z0 - f.z1) / 2,
				};
			})
			.sort((a, b) => a.gap - b.gap)
			.slice(0, 2)
			.filter((n) => n.gap < 2);
		const under =
			!o.parent && !isFlat(o)
				? objs
						.filter(
							(b) =>
								isFlat(b) &&
								!b.parent &&
								boxesOverlap(
									{ ...f, y0: 0, y1: 1 },
									{ ...F.get(b.id), y0: 0, y1: 1 },
								),
						)
						.map((b) => b.id)
				: [];
		L.push(
			`- ${o.id} "${String(o.name || "").slice(0, 30)}": ${o.mount ? (o.mount === "ceiling" ? "hangs from the ceiling" : `hangs on ${o.mount}, y ${r1(num(o.position?.y))}..${r1(num(o.position?.y) + num(o.size?.y))}`) + (o.parent ? "" : "") + " " + whereWords(f, room) : o.parent ? `on top of ${o.parent}` : whereWords(f, room)}. x ${r1(f.x0)}..${r1(f.x1)}, z ${r1(f.z0)}..${r1(f.z1)}, top ${r1(f.y1)}${o.parent ? "" : ""}; faces ${facing(o.rotation_y_deg)}` +
				`${surfacesText(o)}${holds.length ? `; holds ${holds.join(",")}` : ""}${under.length ? `; stands on rug ${under.join(",")}` : ""}${nb.length ? `; ${nb.map((n) => `${n.b.id} is ${r1(n.gap)} m ${dirWord(n.dx, n.dz).replace(" of", "")}`).join(", ")}` : ""}`,
		);
	}
	// decals
	if (decals.length) L.push("DECALS (span along the wall, height range):");
	for (const d of decals) {
		const x0 = num(d.x) - num(d.width, 1) / 2;
		const x1 = num(d.x) + num(d.width, 1) / 2;
		const y0 = num(d.y, 1.6) - num(d.height, 1) / 2;
		const y1 = num(d.y, 1.6) + num(d.height, 1) / 2;
		const below = floorObjs
			.filter(
				(o) => !isFlat(o) && againstWall(F.get(o.id), d.surface, room, 1.0),
			)
			.filter((o) => {
				const [a, b] = wallSpanOf(F.get(o.id), d.surface);
				return Math.min(b, x1) - Math.max(a, x0) > 0;
			});
		L.push(
			`- ${d.id} "${String(d.name || "").slice(0, 30)}" on ${d.surface}: x ${r1(x0)}..${r1(x1)}, y ${r1(y0)}..${r1(y1)}${below.length ? `; below it: ${below.map((o) => `${o.id} (top ${r1(F.get(o.id).y1)})`).join(", ")}` : ""}`,
		);
	}
	// free space
	L.push("FREE SPACE:");
	L.push(
		`- empty corners: ${
			corners
				.filter((c) => !c.occ.length)
				.map((c) => c.n)
				.join(", ") || "none"
		}`,
	);
	for (const w of WALLS) {
		const len = wallLen(w, room) / 2;
		const spans = floorObjs
			.filter((o) => !isFlat(o) && againstWall(F.get(o.id), w, room))
			.map((o) => wallSpanOf(F.get(o.id), w));
		const free = freeIntervals(
			-len + 0.05,
			len - 0.05,
			spans.map(([a, b]) => [a - 0.1, b + 0.1]),
			0.4,
		);
		const axis = w === "wall_back" ? "x" : "along-wall x";
		const decalSpans = decals
			.filter((d) => d.surface === w)
			.map((d) => [
				num(d.x) - num(d.width, 1) / 2 - 0.1,
				num(d.x) + num(d.width, 1) / 2 + 0.1,
			]);
		const freeArt = freeIntervals(-len + 0.1, len - 0.1, decalSpans, 0.5);
		const tops = floorObjs
			.filter((o) => !isFlat(o) && againstWall(F.get(o.id), w, room, 1.0))
			.map((o) => {
				const [a, b] = wallSpanOf(F.get(o.id), w);
				return `${o.id} ${r1(a)}..${r1(b)} top ${r1(F.get(o.id).y1)}`;
			});
		L.push(
			`- ${w}: free floor ${axis} ${free.map(([a, b]) => `${r1(a)}..${r1(b)}`).join(", ") || "none"}; wall free of decals ${axis} ${freeArt.map(([a, b]) => `${r1(a)}..${r1(b)}`).join(", ") || "none"}${tops.length ? `; furniture below (${axis}): ${tops.join(", ")}` : ""}`,
		);
	}
	// clear floor spots: 0.7 m squares free of all non-flat floor objects, spread out
	const blocks = floorObjs.filter((o) => !isFlat(o)).map((o) => F.get(o.id));
	const cand = [];
	for (let x = -hx + 0.45; x <= hx - 0.45 + 1e-9; x += 0.25)
		for (let z = -hz + 0.45; z <= hz - 0.45 + 1e-9; z += 0.25) {
			const sq = {
				x0: x - 0.35,
				x1: x + 0.35,
				z0: z - 0.35,
				z1: z + 0.35,
				y0: 0,
				y1: 1,
			};
			if (!blocks.some((b) => boxesOverlap(sq, { ...b, y0: 0, y1: 1 }, 0)))
				cand.push({
					x,
					z,
					d: Math.min(...blocks.map((b) => gapBetween(sq, b)), 9),
				});
		}
	const spots = [];
	for (const c of cand.sort((a, b) => b.d - a.d)) {
		if (spots.every((s) => Math.hypot(s.x - c.x, s.z - c.z) > 1.2))
			spots.push(c);
		if (spots.length >= 5) break;
	}
	L.push(
		`- clear floor spots (0.7 m square free): ${spots.map((s) => `(${r1(s.x)},${r1(s.z)})`).join(" ") || "none"}`,
	);
	// recency
	const rec = recentIds(history);
	if (rec.length)
		L.push(
			`RECENT (newest first; "it/that/the other one" = the first that fits): ${rec.map((r) => `${r.id} (${r.op}, "${r.u}")`).join("; ")}`,
		);
	L.push(...viewLines(view, scene, room, objs));
	return L.join("\n");
}
