// Procedural canvas textures: floor planks, "building" labels, decal placeholders.
import * as THREE from "three";

function rng(seed: number) {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Near-white plank pattern; multiplied by the floor color so the surface color still drives the look. Tiles. */
export function makeFloorTexture(): THREE.CanvasTexture {
	const S = 1024;
	const c = document.createElement("canvas");
	c.width = c.height = S;
	const g = c.getContext("2d")!;
	g.fillStyle = "#ffffff";
	g.fillRect(0, 0, S, S);
	const rnd = rng(1337);
	const rows = 8;
	const rh = S / rows;
	for (let r = 0; r < rows; r++) {
		let x = -rnd() * S * 0.6;
		const y0 = r * rh;
		while (x < S) {
			const len = S * (0.45 + rnd() * 0.45);
			const v = 0.84 + rnd() * 0.16;
			const grains: [number, number, number, number, number][] = [];
			for (let k = 0; k < 14; k++)
				grains.push([
					y0 + rnd() * rh,
					(rnd() - 0.5) * 8,
					(rnd() - 0.5) * 8,
					0.02 + rnd() * 0.05,
					0.6 + rnd() * 1.6,
				]);
			const knots =
				rnd() < 0.35
					? [[x + rnd() * len, y0 + rh * (0.25 + rnd() * 0.5), 4 + rnd() * 6]]
					: [];
			for (const off of [-S, 0, S]) {
				const xx = x + off;
				if (xx > S || xx + len < 0) continue;
				const sh = Math.round(255 * v);
				g.fillStyle = `rgb(${sh},${Math.round(sh * 0.985)},${Math.round(sh * 0.97)})`;
				g.fillRect(xx, y0, len, rh);
				for (const [yy, d1, d2, a, w] of grains) {
					g.strokeStyle = `rgba(60,40,20,${a})`;
					g.lineWidth = w;
					g.beginPath();
					g.moveTo(xx, yy);
					g.bezierCurveTo(
						xx + len * 0.33,
						yy + d1,
						xx + len * 0.66,
						yy + d2,
						xx + len,
						yy + (d1 + d2) * 0.3,
					);
					g.stroke();
				}
				for (const [kx, ky, kr] of knots) {
					g.fillStyle = "rgba(70,45,25,0.12)";
					g.beginPath();
					g.ellipse(kx + off, ky, kr * 2.2, kr, 0, 0, Math.PI * 2);
					g.fill();
				}
				g.fillStyle = "rgba(40,25,10,0.35)";
				g.fillRect(xx, y0, 2, rh);
			}
			x += len;
		}
		g.fillStyle = "rgba(40,25,10,0.32)";
		g.fillRect(0, y0, S, 2);
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.anisotropy = 8;
	return t;
}

function roundRect(
	g: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	g.beginPath();
	g.moveTo(x + r, y);
	g.arcTo(x + w, y, x + w, y + h, r);
	g.arcTo(x + w, y + h, x, y + h, r);
	g.arcTo(x, y + h, x, y, r);
	g.arcTo(x, y, x + w, y, r);
	g.closePath();
}

const FONT = `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif`;

/** Floating pill label (e.g. "Building throne chair…"). World height ~= `worldH` meters. */
export function makeLabel(text: string, worldH = 0.15): THREE.Sprite {
	const pad = 22;
	const h = 64;
	const c = document.createElement("canvas");
	const g0 = c.getContext("2d")!;
	g0.font = `600 30px ${FONT}`;
	const tw = Math.min(900, Math.ceil(g0.measureText(text).width));
	c.width = tw + pad * 2 + 34;
	c.height = h;
	const g = c.getContext("2d")!;
	g.fillStyle = "rgba(14,22,34,0.78)";
	roundRect(g, 1, 1, c.width - 2, h - 2, (h - 2) / 2);
	g.fill();
	g.strokeStyle = "rgba(140,210,255,0.85)";
	g.lineWidth = 2;
	g.stroke();
	g.fillStyle = "#8fdcff";
	g.beginPath();
	g.arc(pad + 8, h / 2, 7, 0, Math.PI * 2);
	g.fill();
	g.font = `600 30px ${FONT}`;
	g.fillStyle = "#eaf6ff";
	g.textBaseline = "middle";
	g.fillText(text, pad + 28, h / 2 + 1, tw);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	const mat = new THREE.SpriteMaterial({
		map: tex,
		transparent: true,
		depthTest: false,
		depthWrite: false,
		toneMapped: false,
	});
	const s = new THREE.Sprite(mat);
	s.center.set(0.5, 0);
	s.scale.set((worldH * c.width) / c.height, worldH, 1);
	s.renderOrder = 1000;
	return s;
}

/** Placeholder card for a decal whose image is still being generated (or failed). */
export function makeDecalPlaceholderTexture(
	name: string,
	w: number,
	h: number,
	failed: boolean,
): THREE.CanvasTexture {
	const aspect = THREE.MathUtils.clamp(w / h, 0.2, 5);
	const W = aspect >= 1 ? 512 : Math.round(512 * aspect);
	const H = aspect >= 1 ? Math.round(512 / aspect) : 512;
	const c = document.createElement("canvas");
	c.width = Math.max(64, W);
	c.height = Math.max(64, H);
	const g = c.getContext("2d")!;
	const r = Math.min(c.width, c.height) * 0.06;
	const grad = g.createLinearGradient(0, 0, c.width, c.height);
	if (failed) {
		grad.addColorStop(0, "rgba(120,110,105,0.55)");
		grad.addColorStop(1, "rgba(90,85,80,0.55)");
	} else {
		grad.addColorStop(0, "rgba(160,215,255,0.55)");
		grad.addColorStop(1, "rgba(190,160,255,0.45)");
	}
	g.fillStyle = grad;
	roundRect(g, 4, 4, c.width - 8, c.height - 8, r);
	g.fill();
	g.setLineDash([16, 10]);
	g.lineWidth = 5;
	g.strokeStyle = failed ? "rgba(230,220,210,0.9)" : "rgba(235,248,255,0.95)";
	roundRect(g, 10, 10, c.width - 20, c.height - 20, r * 0.8);
	g.stroke();
	g.setLineDash([]);
	const base = Math.min(c.width, c.height);
	let fs = Math.max(14, Math.round(base * 0.12));
	g.font = `700 ${fs}px ${FONT}`;
	while (g.measureText(name).width > c.width * 0.84 && fs > 12) {
		fs -= 2;
		g.font = `700 ${fs}px ${FONT}`;
	}
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.fillStyle = "#ffffff";
	g.shadowColor = "rgba(0,0,0,0.35)";
	g.shadowBlur = 8;
	g.fillText(name, c.width / 2, c.height / 2 - fs * 0.35, c.width * 0.86);
	g.font = `500 ${Math.round(fs * 0.5)}px ${FONT}`;
	g.fillStyle = "rgba(255,255,255,0.9)";
	g.fillText(
		failed ? "image unavailable" : "generating image…",
		c.width / 2,
		c.height / 2 + fs * 0.6,
		c.width * 0.86,
	);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	return t;
}
