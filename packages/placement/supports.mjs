// Support surfaces of a model, computed from its triangles (no metadata needed): places where something can rest.
// Node-side (apps/server/catalog.mjs caches the result per model). Coordinates are the model's raw build() coordinates.
//   findSupports(THREE, root) -> [{ y, x0, x1, z0, z1, area, fill, clear }] sorted by height
//     y         height of the surface; x0..x1, z0..z1 its conservative rectangle; area its real area (m2)
//     fill      area / rectangle area (1 = full rectangle, < 0.6 = ring, L-shape or slats)
//     clear     free height above it (median over samples), null = open to the sky
// A surface counts only if it faces up (within ~10 degrees), is flat (<= 1 cm), connected, at least ~11x11 cm, and has
// at least 18 cm of free space above it (hidden plywood bases under seat cushions do not).

const G = 0.02; // grid cell (m)
const UP = 0.985; // min normal.y of an upward face (about 10 degrees)
const MIN_AREA = 0.012;
const MIN_SIDE = 0.08;
const MIN_CLEAR = 0.18;
const MIN_FILL = 0.2;

export function findSupports(THREE, root) {
	root.updateMatrixWorld(true);
	const all = []; // [ax,ay,az,bx,by,bz,cx,cy,cz]
	const a = new THREE.Vector3();
	const b = new THREE.Vector3();
	const c = new THREE.Vector3();
	root.traverse((o) => {
		if (!o.isMesh || !o.geometry?.attributes?.position) return;
		const pos = o.geometry.attributes.position;
		const idx = o.geometry.index;
		const m = o.matrixWorld;
		const flip = m.determinant() < 0;
		const n = idx ? idx.count : pos.count;
		for (let i = 0; i + 2 < n; i += 3) {
			const i0 = idx ? idx.getX(i) : i;
			const i1 = idx ? idx.getX(i + 1) : i + 1;
			const i2 = idx ? idx.getX(i + 2) : i + 2;
			a.fromBufferAttribute(pos, i0).applyMatrix4(m);
			b.fromBufferAttribute(pos, i1).applyMatrix4(m);
			c.fromBufferAttribute(pos, i2).applyMatrix4(m);
			const t = flip
				? [a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z]
				: [a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z];
			if (t.every(Number.isFinite)) all.push(t);
		}
	});
	// upward, flat faces -> occupancy grid per 1 cm height bin
	const bins = new Map(); // yKey -> { y, cells:Set }
	for (const t of all) {
		const ux = t[3] - t[0];
		const uy = t[4] - t[1];
		const uz = t[5] - t[2];
		const vx = t[6] - t[0];
		const vy = t[7] - t[1];
		const vz = t[8] - t[2];
		const nx = uy * vz - uz * vy;
		const ny = uz * vx - ux * vz;
		const nz = ux * vy - uy * vx;
		const len = Math.hypot(nx, ny, nz);
		if (len < 1e-10 || ny / len < UP) continue;
		const ymax = Math.max(t[1], t[4], t[7]);
		if (ymax - Math.min(t[1], t[4], t[7]) > 0.01) continue;
		const k = Math.round(ymax / 0.01);
		let bin = bins.get(k);
		if (!bin) bins.set(k, (bin = { y: ymax, cells: new Set() }));
		bin.y = Math.max(bin.y, ymax);
		rasterize(t, bin.cells);
	}
	// merge neighbouring bins (a surface split by float noise), then connected components
	const keys = [...bins.keys()].sort((p, q) => p - q);
	const planes = [];
	for (const k of keys) {
		const bin = bins.get(k);
		const last = planes[planes.length - 1];
		if (last && k - last.k <= 1) {
			for (const cl of bin.cells) last.cells.add(cl);
			last.y = Math.max(last.y, bin.y);
			last.k = k;
		} else planes.push({ k, y: bin.y, cells: new Set(bin.cells) });
	}
	const out = [];
	for (const p of planes)
		for (const comp of components(p.cells)) {
			let i0 = Number.POSITIVE_INFINITY;
			let i1 = Number.NEGATIVE_INFINITY;
			let j0 = Number.POSITIVE_INFINITY;
			let j1 = Number.NEGATIVE_INFINITY;
			for (const cl of comp) {
				const [i, j] = cl.split(",").map(Number);
				i0 = Math.min(i0, i);
				i1 = Math.max(i1, i);
				j0 = Math.min(j0, j);
				j1 = Math.max(j1, j);
			}
			const x0 = i0 * G;
			const x1 = (i1 + 1) * G;
			const z0 = j0 * G;
			const z1 = (j1 + 1) * G;
			const area = comp.length * G * G;
			if (area < MIN_AREA || Math.min(x1 - x0, z1 - z0) < MIN_SIDE) continue;
			const clear = clearance(all, p.y, comp);
			if (clear !== null && clear < MIN_CLEAR) continue;
			if (area / ((x1 - x0) * (z1 - z0)) < MIN_FILL) continue;
			const fill = area / ((x1 - x0) * (z1 - z0));
			const sup = {
				y: r3(p.y),
				x0: r3(x0),
				x1: r3(x1),
				z0: r3(z0),
				z1: r3(z1),
				area: r3(area),
				fill: +fill.toFixed(2),
				clear: clear === null ? null : r3(clear),
			};
			if (fill < 0.95) sup.mask = maskOf(comp, i0, j0, i1, j1); // rings, slats, round tops: where it is really solid
			out.push(sup);
		}
	out.sort((p, q) => p.y - q.y || q.area - p.area);
	return out.length > 10
		? out
				.sort((p, q) => q.area - p.area)
				.slice(0, 10)
				.sort((p, q) => p.y - q.y)
		: out;
}

const r3 = (v) => Math.round(v * 1000) / 1000;

/** Occupancy of a surface on a (2G) grid over its rectangle: { w, h, bits } with bits as hex, row-major, z rows. */
function maskOf(comp, i0, j0, i1, j1) {
	const set = new Set(comp);
	const w = Math.ceil((i1 - i0 + 1) / 2);
	const h = Math.ceil((j1 - j0 + 1) / 2);
	const bits = [];
	for (let J = 0; J < h; J++)
		for (let I = 0; I < w; I++) {
			let n = 0;
			for (const [a, b] of [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
			])
				if (set.has(i0 + 2 * I + a + "," + (j0 + 2 * J + b))) n++;
			bits.push(n >= 2 ? 1 : 0);
		}
	let hex = "";
	for (let k = 0; k < bits.length; k += 4)
		hex += (
			(bits[k] << 3) |
			((bits[k + 1] || 0) << 2) |
			((bits[k + 2] || 0) << 1) |
			(bits[k + 3] || 0)
		).toString(16);
	return { w, h, bits: hex };
}

/**
 * Fraction of a footprint (center cx,cz, half extents hx,hz, in the surface's frame) that lies on solid surface.
 * Surfaces without a mask are solid across their rectangle.
 */
export function coverage(surf, cx, cz, hx, hz) {
	const N = 6;
	let inside = 0;
	for (let a = 0; a < N; a++)
		for (let b = 0; b < N; b++) {
			const x = cx - hx + (2 * hx * (a + 0.5)) / N;
			const z = cz - hz + (2 * hz * (b + 0.5)) / N;
			if (x < surf.x0 || x > surf.x1 || z < surf.z0 || z > surf.z1) continue;
			if (!surf.mask) {
				inside++;
				continue;
			}
			const { w, h, bits } = surf.mask;
			const I = Math.min(
				w - 1,
				Math.floor(((x - surf.x0) / (surf.x1 - surf.x0)) * w),
			);
			const J = Math.min(
				h - 1,
				Math.floor(((z - surf.z0) / (surf.z1 - surf.z0)) * h),
			);
			const k = J * w + I;
			const nib = Number.parseInt(bits[k >> 2], 16);
			if ((nib >> (3 - (k & 3))) & 1) inside++;
		}
	return inside / (N * N);
}

function inTri(px, pz, t) {
	const x1 = t[0];
	const z1 = t[2];
	const x2 = t[3];
	const z2 = t[5];
	const x3 = t[6];
	const z3 = t[8];
	const d = (z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3);
	if (Math.abs(d) < 1e-14) return null;
	const l1 = ((z2 - z3) * (px - x3) + (x3 - x2) * (pz - z3)) / d;
	const l2 = ((z3 - z1) * (px - x3) + (x1 - x3) * (pz - z3)) / d;
	const l3 = 1 - l1 - l2;
	if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return null;
	return l1 * t[1] + l2 * t[4] + l3 * t[7]; // y at (px, pz)
}

function rasterize(t, cells) {
	const xs = [t[0], t[3], t[6]];
	const zs = [t[2], t[5], t[8]];
	const i0 = Math.floor(Math.min(...xs) / G);
	const i1 = Math.floor(Math.max(...xs) / G);
	const j0 = Math.floor(Math.min(...zs) / G);
	const j1 = Math.floor(Math.max(...zs) / G);
	let hit = false;
	if ((i1 - i0 + 1) * (j1 - j0 + 1) <= 40000)
		for (let i = i0; i <= i1; i++)
			for (let j = j0; j <= j1; j++) {
				if (inTri((i + 0.5) * G, (j + 0.5) * G, t) !== null) {
					cells.add(i + "," + j);
					hit = true;
				}
			}
	if (!hit)
		cells.add(
			Math.floor((xs[0] + xs[1] + xs[2]) / 3 / G) +
				"," +
				Math.floor((zs[0] + zs[1] + zs[2]) / 3 / G),
		);
}

/** Connected components; cells up to 2 apart join (bridges slat gaps and seams of a few cm). */
function components(cells) {
	const left = new Set(cells);
	const out = [];
	for (const start of cells) {
		if (!left.has(start)) continue;
		left.delete(start);
		const comp = [start];
		const q = [start];
		while (q.length) {
			const [i, j] = q.pop().split(",").map(Number);
			for (let di = -2; di <= 2; di++)
				for (let dj = -2; dj <= 2; dj++) {
					const k = i + di + "," + (j + dj);
					if (left.has(k)) {
						left.delete(k);
						comp.push(k);
						q.push(k);
					}
				}
		}
		out.push(comp);
	}
	return out;
}

/** Median free height above a surface, sampling up to 48 of its cells; null when most samples see nothing above. */
function clearance(all, y, comp) {
	const step = Math.max(1, Math.floor(comp.length / 48));
	const pts = [];
	for (let n = 0; n < comp.length; n += step) {
		const [i, j] = comp[n].split(",").map(Number);
		pts.push([(i + 0.5) * G, (j + 0.5) * G]);
	}
	let x0 = Number.POSITIVE_INFINITY;
	let x1 = Number.NEGATIVE_INFINITY;
	let z0 = Number.POSITIVE_INFINITY;
	let z1 = Number.NEGATIVE_INFINITY;
	for (const [x, z] of pts) {
		x0 = Math.min(x0, x);
		x1 = Math.max(x1, x);
		z0 = Math.min(z0, z);
		z1 = Math.max(z1, z);
	}
	const above = all.filter(
		(t) =>
			Math.max(t[1], t[4], t[7]) > y + 0.004 &&
			Math.max(t[0], t[3], t[6]) >= x0 &&
			Math.min(t[0], t[3], t[6]) <= x1 &&
			Math.max(t[2], t[5], t[8]) >= z0 &&
			Math.min(t[2], t[5], t[8]) <= z1,
	);
	const gaps = pts
		.map(([x, z]) => {
			let best = Number.POSITIVE_INFINITY;
			for (const t of above) {
				const ty = inTri(x, z, t);
				if (ty !== null && ty > y + 0.004 && ty < best) best = ty;
			}
			return best - y;
		})
		.sort((p, q) => p - q);
	const med = gaps[Math.floor(gaps.length / 2)];
	return Number.isFinite(med) ? med : null;
}
