// Background keying for decal images. Image models return JPEGs (no alpha), so a logo arrives sitting on a white,
// grey or black square. When the image border is a near-uniform colour, that background is made transparent by a
// flood fill inward from the edges, with a soft (feathered) edge and edge colours pulled toward the foreground so
// there is no halo. When the border is not uniform (painting, photo, full-frame poster) the image is left alone.
//
// Returns RGBA pixels with row 0 = BOTTOM (ready for a THREE.DataTexture with flipY = false), or null = leave the
// image untouched. Pixels are returned raw (not via a canvas) on purpose: a 2D canvas stores premultiplied colour,
// which would turn the colour of fully transparent texels black and give a dark fringe under texture filtering.

export type KeyedPixels = {
	data: Uint8Array<ArrayBuffer>;
	width: number;
	height: number;
};

const MAX_SIDE = 1024;

const smooth = (lo: number, hi: number, x: number) => {
	if (x <= lo) return 0;
	if (x >= hi) return 1;
	const t = (x - lo) / (hi - lo);
	return t * t * (3 - 2 * t);
};

export function keyOutBackground(
	src: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): KeyedPixels | null {
	const sw = (src as HTMLImageElement).naturalWidth || src.width;
	const sh = (src as HTMLImageElement).naturalHeight || src.height;
	if (!sw || !sh) return null;
	const s = Math.min(1, MAX_SIDE / Math.max(sw, sh));
	const w = Math.max(2, Math.round(sw * s));
	const h = Math.max(2, Math.round(sh * s));
	const cv = document.createElement("canvas");
	cv.width = w;
	cv.height = h;
	const g = cv.getContext("2d", { willReadFrequently: true });
	if (!g) return null;
	g.drawImage(src, 0, 0, w, h);
	const px = g.getImageData(0, 0, w, h).data;
	const N = w * h;

	// ---- border pixels (each perimeter pixel once)
	const edge: number[] = [];
	for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
	for (let y = 1; y < h - 1; y++) edge.push(y * w, y * w + w - 1);

	// ---- background colour: per-channel median of the border
	const hist = [
		new Uint32Array(256),
		new Uint32Array(256),
		new Uint32Array(256),
	];
	for (const i of edge) {
		hist[0][px[i * 4]]++;
		hist[1][px[i * 4 + 1]]++;
		hist[2][px[i * 4 + 2]]++;
	}
	const med = (hh: Uint32Array) => {
		let acc = 0;
		for (let v = 0; v < 256; v++)
			if ((acc += hh[v]) * 2 >= edge.length) return v;
		return 255;
	};
	const br = med(hist[0]);
	const bgc = med(hist[1]);
	const bb = med(hist[2]);

	// ---- distance of every pixel to the background colour
	const dist = new Float32Array(N);
	for (let i = 0, j = 0; i < N; i++, j += 4) {
		const dr = px[j] - br;
		const dg = px[j + 1] - bgc;
		const db = px[j + 2] - bb;
		dist[i] = Math.sqrt(dr * dr + dg * dg + db * db);
	}

	// ---- is the border uniform? (most border pixels and all four corners close to the median)
	const UNIFORM = 42;
	let inl = 0;
	let ss = 0;
	for (const i of edge) {
		const d = dist[i];
		if (d < UNIFORM) {
			inl++;
			ss += d * d;
		}
	}
	if (inl < edge.length * 0.88) return null;
	const cornerOk = (cx: number, cy: number) => {
		const k = Math.max(2, Math.round(Math.min(w, h) * 0.01));
		let sum = 0;
		let n = 0;
		for (let y = 0; y < k; y++)
			for (let x = 0; x < k; x++) {
				const xx = cx ? w - 1 - x : x;
				const yy = cy ? h - 1 - y : y;
				sum += dist[yy * w + xx];
				n++;
			}
		return sum / n < UNIFORM * 0.8;
	};
	if (!cornerOk(0, 0) || !cornerOk(1, 0) || !cornerOk(0, 1) || !cornerOk(1, 1))
		return null;

	// thresholds follow the border noise (JPEG blocks, grain): below lo = background, above hi = foreground
	const rms = Math.sqrt(ss / Math.max(1, inl));
	const lo = Math.min(70, Math.max(14, rms * 2.5 + 10));
	const hi = lo + 36;
	const mid = (lo + hi) / 2;

	// ---- flood fill inward from the border (single BFS queue on typed arrays)
	const seen = new Uint8Array(N);
	const queue = new Int32Array(N);
	let qh = 0;
	let qt = 0;
	for (const i of edge) {
		if (dist[i] < hi && !seen[i]) {
			seen[i] = 1;
			queue[qt++] = i;
		}
	}
	const alpha0 = new Float32Array(N).fill(1);
	while (qh < qt) {
		const i = queue[qh++];
		const d = dist[i];
		alpha0[i] = smooth(lo, hi, d);
		if (d >= mid) continue; // anti-aliased rim pixels are labelled but not expanded through (no leaking into the logo)
		const x = i % w;
		if (x > 0 && !seen[i - 1] && dist[i - 1] < hi) {
			seen[i - 1] = 1;
			queue[qt++] = i - 1;
		}
		if (x < w - 1 && !seen[i + 1] && dist[i + 1] < hi) {
			seen[i + 1] = 1;
			queue[qt++] = i + 1;
		}
		if (i >= w && !seen[i - w] && dist[i - w] < hi) {
			seen[i - w] = 1;
			queue[qt++] = i - w;
		}
		if (i < N - w && !seen[i + w] && dist[i + w] < hi) {
			seen[i + w] = 1;
			queue[qt++] = i + w;
		}
	}
	if (qt === 0) return null;

	// ---- colours: unmix the background out of rim pixels; transparent pixels take the nearest solid colour
	const rgb = new Uint8Array(N * 3);
	let solid = 0;
	for (let i = 0; i < N; i++) {
		const a = alpha0[i];
		const j = i * 4;
		if (a >= 0.999) {
			rgb[i * 3] = px[j];
			rgb[i * 3 + 1] = px[j + 1];
			rgb[i * 3 + 2] = px[j + 2];
			solid++;
		} else if (a >= 0.5) {
			const inv = 1 / a;
			rgb[i * 3] = Math.max(0, Math.min(255, br + (px[j] - br) * inv));
			rgb[i * 3 + 1] = Math.max(
				0,
				Math.min(255, bgc + (px[j + 1] - bgc) * inv),
			);
			rgb[i * 3 + 2] = Math.max(0, Math.min(255, bb + (px[j + 2] - bb) * inv));
			solid++;
		}
	}
	if (solid < N * 0.004) return null; // nothing but background: show as is
	// multi-source BFS from solid pixels into the transparent region (reuse queue / seen)
	seen.fill(0);
	qh = qt = 0;
	for (let i = 0; i < N; i++)
		if (alpha0[i] >= 0.5) {
			seen[i] = 1;
			queue[qt++] = i;
		}
	while (qh < qt) {
		const i = queue[qh++];
		const x = i % w;
		const r = rgb[i * 3];
		const gg = rgb[i * 3 + 1];
		const b = rgb[i * 3 + 2];
		const visit = (n: number) => {
			if (seen[n]) return;
			seen[n] = 1;
			rgb[n * 3] = r;
			rgb[n * 3 + 1] = gg;
			rgb[n * 3 + 2] = b;
			queue[qt++] = n;
		};
		if (x > 0) visit(i - 1);
		if (x < w - 1) visit(i + 1);
		if (i >= w) visit(i - w);
		if (i < N - w) visit(i + w);
	}

	// ---- feather: 3x3 tent blur of the mask ([1 2 1] separable)
	const tmp = new Float32Array(N);
	for (let y = 0; y < h; y++) {
		const row = y * w;
		for (let x = 0; x < w; x++) {
			const l = alpha0[row + (x > 0 ? x - 1 : x)];
			const c = alpha0[row + x];
			const r = alpha0[row + (x < w - 1 ? x + 1 : x)];
			tmp[row + x] = (l + 2 * c + r) * 0.25;
		}
	}
	const out = new Uint8Array(N * 4);
	for (let y = 0; y < h; y++) {
		const up = (y > 0 ? y - 1 : y) * w;
		const row = y * w;
		const dn = (y < h - 1 ? y + 1 : y) * w;
		const orow = (h - 1 - y) * w; // flip: row 0 of the output is the bottom of the image
		for (let x = 0; x < w; x++) {
			const a = (tmp[up + x] + 2 * tmp[row + x] + tmp[dn + x]) * 0.25;
			const i = row + x;
			const o = (orow + x) * 4;
			out[o] = rgb[i * 3];
			out[o + 1] = rgb[i * 3 + 1];
			out[o + 2] = rgb[i * 3 + 2];
			out[o + 3] = Math.round(a * 255);
		}
	}
	return { data: out, width: w, height: h };
}
