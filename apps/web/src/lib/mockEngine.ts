// 2D canvas stand-in for the real three.js engine (web/src/scene/engine.ts). Enabled with `?mock=1`.
// Implements the full Engine contract from ../types with a one-point-perspective sketch of the room.
import type {
	Decal,
	Engine,
	Material,
	Op,
	Scene,
	SceneObject,
	SurfaceId,
} from "../types";

type RGB = [number, number, number];
type Pt = { x: number; y: number; s: number }; // s = pixels per meter at that depth

const SURFACE_IDS: SurfaceId[] = [
	"wall_back",
	"wall_left",
	"wall_right",
	"floor",
	"ceiling",
];
const UNDO_CAP = 50;
const POP_MS = 350;
const FADE_MS = 400;
const FOCUS_MS = 1200;

export const MOCK_DEFAULT_SCENE: Scene = {
	room: { width: 6, depth: 5, height: 3 },
	surfaces: {
		wall_back: {
			id: "wall_back",
			color: "#d8d4cc",
			material: { roughness: 0.9 },
		},
		wall_left: {
			id: "wall_left",
			color: "#d8d4cc",
			material: { roughness: 0.9 },
		},
		wall_right: {
			id: "wall_right",
			color: "#d8d4cc",
			material: { roughness: 0.9 },
		},
		floor: { id: "floor", color: "#8a6a4a", material: { roughness: 0.6 } },
		ceiling: { id: "ceiling", color: "#eeeeea", material: { roughness: 0.95 } },
	},
	objects: [
		{
			id: "rug_1",
			name: "rug",
			shape: "plane",
			size: { x: 2.4, y: 0.01, z: 1.6 },
			position: { x: 0, y: 0, z: -0.7 },
			rotation_y_deg: 0,
			color: "#b8a58a",
			material: { roughness: 1 },
			parent: "",
		},
		{
			id: "sofa_1",
			name: "sofa",
			shape: "box",
			size: { x: 2.0, y: 0.85, z: 0.9 },
			position: { x: 0, y: 0, z: -1.9 },
			rotation_y_deg: 0,
			color: "#4a5a6a",
			material: { roughness: 0.8 },
			parent: "",
		},
		{
			id: "lamp_1",
			name: "lamp",
			shape: "cylinder",
			size: { x: 0.35, y: 1.6, z: 0.35 },
			position: { x: -2.3, y: 0, z: -2.0 },
			rotation_y_deg: 0,
			color: "#c9a24a",
			material: { roughness: 0.2, metalness: 0.7 },
			parent: "",
		},
	],
	decals: [],
};

const clone = <T>(v: T): T => structuredClone(v);

function hexToRgb(hex: string | undefined): RGB {
	let h = (hex ?? "").trim().replace(/^#/, "");
	if (h.length === 3)
		h = h
			.split("")
			.map((c) => c + c)
			.join("");
	const n = Number.parseInt(h, 16);
	if (h.length !== 6 || Number.isNaN(n)) return [128, 128, 128];
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (c: RGB, k = 1, a = 1): string =>
	`rgba(${c.map((v) => Math.round(Math.min(255, Math.max(0, v * k)))).join(",")},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];
const easeOut = (t: number): number =>
	1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
const isShiny = (m?: Material): boolean =>
	!!m && ((m.roughness ?? 1) < 0.3 || (m.metalness ?? 0) > 0.5);

function applyOp(s: Scene, op: Op): void {
	switch (op.op) {
		case "add": {
			const o: SceneObject = { ...clone(op.object), id: op.id };
			if (o.shape === "custom" && !o.status) o.status = "building";
			const i = s.objects.findIndex((x) => x.id === op.id);
			if (i >= 0) s.objects[i] = o;
			else s.objects.push(o);
			break;
		}
		case "update": {
			const o = s.objects.find((x) => x.id === op.id);
			if (!o) break;
			const { material, ...rest } = clone(op.changes);
			Object.assign(o, rest, { id: op.id });
			if (material) o.material = { ...o.material, ...material };
			if (o.shape === "custom" && !o.status) o.status = "building";
			break;
		}
		case "remove": {
			if (!s.objects.some((x) => x.id === op.id)) break;
			const dead = new Set([op.id]);
			for (let grew = true; grew; ) {
				grew = false;
				for (const o of s.objects)
					if (!dead.has(o.id) && dead.has(o.parent)) {
						dead.add(o.id);
						grew = true;
					}
			}
			s.objects = s.objects.filter((o) => !dead.has(o.id));
			break;
		}
		case "surface": {
			const sf = s.surfaces[op.id];
			if (!sf) break;
			const { material, ...rest } = clone(op.changes);
			Object.assign(sf, rest, { id: op.id });
			if (material) sf.material = { ...sf.material, ...material };
			break;
		}
		case "add_decal": {
			const d: Decal = { ...clone(op.decal), id: op.id };
			if (!d.status) d.status = "building";
			const i = s.decals.findIndex((x) => x.id === op.id);
			if (i >= 0) s.decals[i] = d;
			else s.decals.push(d);
			break;
		}
		case "update_decal": {
			const d = s.decals.find((x) => x.id === op.id);
			if (d) Object.assign(d, clone(op.changes), { id: op.id });
			break;
		}
		case "remove_decal":
			s.decals = s.decals.filter((x) => x.id !== op.id);
			break;
	}
}

export function createMockEngine(container: HTMLElement): Engine {
	const canvas = document.createElement("canvas");
	canvas.style.cssText =
		"position:absolute;inset:0;width:100%;height:100%;display:block";
	if (getComputedStyle(container).position === "static")
		container.style.position = "relative";
	container.appendChild(canvas);
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	let scene: Scene = clone(MOCK_DEFAULT_SCENE);
	const undoStack: Scene[] = [];
	const subs = new Set<(s: Scene) => void>();
	const pops = new Map<string, number>();
	const fades = new Map<SurfaceId, { from: RGB; start: number }>();
	const shown = new Map<SurfaceId, RGB>();
	const images = new Map<string, HTMLImageElement>();
	const codeLen = new Map<string, number>();
	const outlines = new Map<string, Pt[]>(); // last drawn outline per id, for focus glow
	let focusInfo: { id: string; start: number } | null = null;
	let cssW = 0;
	let cssH = 0;
	let dpr = 1;
	let raf = 0;
	let disposed = false;

	const notify = (): void => {
		for (const fn of subs) {
			try {
				fn(clone(scene));
			} catch (e) {
				console.error("[mockEngine] subscriber failed", e);
			}
		}
	};

	// Start pop-in for new/changed objects and color crossfades for changed surfaces.
	const diffAnimate = (prev: Scene, next: Scene): void => {
		const now = performance.now();
		const before = new Map(prev.objects.map((o) => [o.id, JSON.stringify(o)]));
		for (const o of next.objects)
			if (before.get(o.id) !== JSON.stringify(o)) pops.set(o.id, now);
		for (const id of SURFACE_IDS) {
			if (prev.surfaces[id]?.color !== next.surfaces[id]?.color) {
				fades.set(id, {
					from: shown.get(id) ?? hexToRgb(prev.surfaces[id]?.color),
					start: now,
				});
			}
		}
	};

	const resize = (): void => {
		cssW = Math.max(1, container.clientWidth);
		cssH = Math.max(1, container.clientHeight);
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(cssW * dpr);
		canvas.height = Math.round(cssH * dpr);
	};
	const ro = new ResizeObserver(resize);
	ro.observe(container);
	resize();

	// ---------- drawing helpers ----------
	const path = (pts: Pt[]): void => {
		ctx.beginPath();
		pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
		ctx.closePath();
	};
	const rr = (x: number, y: number, w: number, h: number, r: number): void => {
		const q = Math.max(0, Math.min(r, w / 2, h / 2));
		ctx.beginPath();
		ctx.moveTo(x + q, y);
		ctx.arcTo(x + w, y, x + w, y + h, q);
		ctx.arcTo(x + w, y + h, x, y + h, q);
		ctx.arcTo(x, y + h, x, y, q);
		ctx.arcTo(x, y, x + w, y, q);
		ctx.closePath();
	};
	const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [
		{ x, y, s: 1 },
		{ x: x + w, y, s: 1 },
		{ x: x + w, y: y + h, s: 1 },
		{ x, y: y + h, s: 1 },
	];
	const label = (text: string, cx: number, top: number, alpha = 1): void => {
		ctx.save();
		ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const w = ctx.measureText(text).width + 10;
		ctx.globalAlpha = alpha;
		ctx.fillStyle = "rgba(12,14,18,0.72)";
		rr(cx - w / 2, top, w, 16, 8);
		ctx.fill();
		ctx.fillStyle = "#ebe8e2";
		ctx.fillText(text, cx, top + 8.5);
		ctx.restore();
	};
	const popScale = (id: string, now: number): number => {
		const start = pops.get(id);
		if (start === undefined) return 1;
		const t = (now - start) / POP_MS;
		if (t >= 1) {
			pops.delete(id);
			return 1;
		}
		return 0.6 + 0.4 * easeOut(t);
	};
	const surfaceColor = (id: SurfaceId, now: number): RGB => {
		const target = hexToRgb(scene.surfaces[id]?.color);
		const f = fades.get(id);
		let c = target;
		if (f) {
			const t = (now - f.start) / FADE_MS;
			if (t >= 1) fades.delete(id);
			else c = mix(f.from, target, easeOut(t));
		}
		shown.set(id, c);
		return c;
	};

	// ---------- frame ----------
	function draw(now: number): void {
		const W = cssW;
		const H = cssH;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = "#0d0f12";
		ctx.fillRect(0, 0, W, H);
		outlines.clear();

		const { width: RW, depth: RD, height: RH } = scene.room;
		const hw = RW / 2;
		const hd = RD / 2;
		const dCam = RD * 0.9;
		const camZ = hd + dCam;
		const eyeY = RH * 0.5;
		const fit = Math.min(W / RW, H / RH);
		const fill = Math.max(W / RW, H / RH);
		const f = Math.min(fill, fit * 1.15) * dCam;
		const P = (x: number, y: number, z: number): Pt => {
			const s = f / Math.max(0.05, camZ - z);
			return { x: W / 2 + x * s, y: H / 2 - (y - eyeY) * s, s };
		};
		const wallPt = (w: Decal["surface"], a: number, y: number): Pt =>
			w === "wall_back"
				? P(a, y, -hd + 0.01)
				: w === "wall_left"
					? P(-hw + 0.01, y, -a)
					: P(hw - 0.01, y, a);

		// Surfaces. Index 0,1 = back edge, 2,3 = front edge (except the back wall).
		const polys: Record<SurfaceId, Pt[]> = {
			wall_back: [
				P(-hw, 0, -hd),
				P(hw, 0, -hd),
				P(hw, RH, -hd),
				P(-hw, RH, -hd),
			],
			floor: [P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)],
			ceiling: [P(-hw, RH, -hd), P(hw, RH, -hd), P(hw, RH, hd), P(-hw, RH, hd)],
			wall_left: [
				P(-hw, 0, -hd),
				P(-hw, RH, -hd),
				P(-hw, RH, hd),
				P(-hw, 0, hd),
			],
			wall_right: [P(hw, 0, -hd), P(hw, RH, -hd), P(hw, RH, hd), P(hw, 0, hd)],
		};
		const shade: Record<SurfaceId, number> = {
			wall_back: 1,
			wall_left: 0.82,
			wall_right: 0.9,
			floor: 0.95,
			ceiling: 1.03,
		};
		for (const id of SURFACE_IDS) {
			const pts = polys[id];
			const c = surfaceColor(id, now);
			outlines.set(id, pts);
			ctx.save();
			path(pts);
			ctx.fillStyle = rgba(c, shade[id]);
			ctx.fill();
			ctx.clip();
			if (id === "wall_back") {
				const g = ctx.createRadialGradient(
					W / 2,
					H / 2,
					0,
					W / 2,
					H / 2,
					(pts[1].x - pts[0].x) * 0.7,
				);
				g.addColorStop(0, "rgba(255,255,255,0.07)");
				g.addColorStop(1, "rgba(0,0,0,0.10)");
				ctx.fillStyle = g;
			} else {
				const b = {
					x: (pts[0].x + pts[1].x) / 2,
					y: (pts[0].y + pts[1].y) / 2,
				};
				const fr = {
					x: (pts[2].x + pts[3].x) / 2,
					y: (pts[2].y + pts[3].y) / 2,
				};
				const g = ctx.createLinearGradient(b.x, b.y, fr.x, fr.y);
				g.addColorStop(0, "rgba(0,0,0,0.26)");
				g.addColorStop(1, "rgba(0,0,0,0)");
				ctx.fillStyle = g;
			}
			ctx.fillRect(0, 0, W, H);
			if (id === "floor") {
				// faint plank lines converging to the vanishing point
				ctx.strokeStyle = "rgba(0,0,0,0.07)";
				ctx.lineWidth = 1;
				for (let x = -hw + 0.4; x < hw; x += 0.4) {
					const a = P(x, 0, -hd);
					const z = P(x, 0, hd);
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(z.x, z.y);
					ctx.stroke();
				}
			}
			if (isShiny(scene.surfaces[id]?.material)) {
				const cx = pts.reduce((t, p) => t + p.x, 0) / 4;
				const cy = pts.reduce((t, p) => t + p.y, 0) / 4;
				const r =
					Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
				const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.45);
				g.addColorStop(0, "rgba(255,255,255,0.26)");
				g.addColorStop(1, "rgba(255,255,255,0)");
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, W, H);
			}
			ctx.restore();
			path(pts);
			ctx.strokeStyle = "rgba(0,0,0,0.16)";
			ctx.lineWidth = 1;
			ctx.stroke();
		}

		const objs = [...scene.objects].sort((a, b) => a.position.z - b.position.z);
		const flat = (o: SceneObject): boolean =>
			o.shape === "plane" && o.size.y < 0.05;

		// Flat floor objects (rugs) first.
		for (const o of objs.filter(flat)) {
			const k = popScale(o.id, now);
			const sx = (o.size.x * k) / 2;
			const sz = (o.size.z * k) / 2;
			const { x, y, z } = o.position;
			const pts = [
				P(x - sx, y, z - sz),
				P(x + sx, y, z - sz),
				P(x + sx, y, z + sz),
				P(x - sx, y, z + sz),
			];
			outlines.set(o.id, pts);
			const c = hexToRgb(o.color);
			ctx.save();
			ctx.globalAlpha = o.material?.opacity ?? 1;
			path(pts);
			const g = ctx.createLinearGradient(0, pts[0].y, 0, pts[2].y);
			g.addColorStop(0, rgba(c, 0.85));
			g.addColorStop(1, rgba(c, 1.02));
			ctx.fillStyle = g;
			ctx.fill();
			ctx.strokeStyle = rgba(c, 0.7);
			ctx.stroke();
			ctx.restore();
			label(o.name, (pts[2].x + pts[3].x) / 2, pts[2].y + 4, 0.85);
		}

		// Decals on the walls.
		for (const d of scene.decals) {
			const top = d.y + d.height / 2;
			const bot = d.y - d.height / 2;
			const l = d.x - d.width / 2;
			const r = d.x + d.width / 2;
			const pts = [
				wallPt(d.surface, l, top),
				wallPt(d.surface, r, top),
				wallPt(d.surface, r, bot),
				wallPt(d.surface, l, bot),
			];
			outlines.set(d.id, pts);
			const img = images.get(d.id);
			const cx = pts.reduce((t, p) => t + p.x, 0) / 4;
			const cy = pts.reduce((t, p) => t + p.y, 0) / 4;
			if (d.status === "ready" && img && img.complete && img.naturalWidth > 0) {
				const N = d.surface === "wall_back" ? 1 : 24; // side walls: vertical strips approximate the perspective
				for (let i = 0; i < N; i++) {
					const a0 = l + (d.width * i) / N;
					const a1 = l + (d.width * (i + 1)) / N;
					const t0 = wallPt(d.surface, a0, top);
					const b0 = wallPt(d.surface, a0, bot);
					const t1 = wallPt(d.surface, a1, top);
					const b1 = wallPt(d.surface, a1, bot);
					const yt = (t0.y + t1.y) / 2;
					const yb = (b0.y + b1.y) / 2;
					ctx.drawImage(
						img,
						(img.naturalWidth * i) / N,
						0,
						img.naturalWidth / N,
						img.naturalHeight,
						t0.x,
						yt,
						t1.x - t0.x + (N > 1 ? 0.6 : 0),
						yb - yt,
					);
				}
			} else {
				const failed = d.status === "failed";
				const pulse = 0.5 + 0.5 * Math.sin(now / 280);
				ctx.save();
				path(pts);
				ctx.fillStyle = failed
					? "rgba(220,70,60,0.08)"
					: `rgba(40,44,56,${0.06 + 0.06 * pulse})`;
				ctx.fill();
				ctx.setLineDash([6, 4]);
				ctx.lineDashOffset = -now / 40;
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = failed
					? "rgba(220,80,70,0.9)"
					: `rgba(40,44,56,${0.45 + 0.35 * pulse})`;
				ctx.stroke();
				ctx.restore();
				label(failed ? "image failed" : "generating image…", cx, cy - 8);
			}
		}

		// Standing objects, far to near.
		for (const o of objs) {
			if (flat(o)) continue;
			const k = popScale(o.id, now);
			const p = P(o.position.x, o.position.y, o.position.z);
			const w = o.size.x * p.s * k;
			const h = o.size.y * p.s * k;
			const x = p.x - w / 2;
			const y = p.y - h;
			const c = hexToRgb(o.color);
			const custom = o.shape === "custom";
			const round = {
				sphere: 0.5,
				capsule: 0.5,
				cylinder: 0.22,
				cone: 0.3,
				torus: 0.5,
			} as Partial<Record<string, number>>;
			const rad = Math.min(w, h) * (round[o.shape] ?? 0.08);
			outlines.set(o.id, rectPts(x, y, w, h));

			if (o.position.y < 0.05) {
				// contact shadow
				ctx.fillStyle = "rgba(0,0,0,0.22)";
				ctx.beginPath();
				ctx.ellipse(
					p.x,
					p.y,
					w * 0.56,
					Math.max(2, o.size.z * p.s * k * 0.14),
					0,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			}
			ctx.save();
			ctx.globalAlpha = o.material?.opacity ?? 1;
			if (o.material?.emissive) {
				ctx.shadowColor = o.material.emissive;
				ctx.shadowBlur = 22;
			}
			let text = o.name;
			if (custom && o.status !== "ready") {
				const failed = o.status === "failed";
				const pulse = 0.5 + 0.5 * Math.sin(now / 260);
				rr(x, y, w, h, rad);
				ctx.fillStyle = failed
					? "rgba(220,70,60,0.10)"
					: `rgba(255,255,255,${0.06 + 0.08 * pulse})`;
				ctx.fill();
				ctx.setLineDash([6, 4]);
				ctx.lineDashOffset = -now / 40;
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = failed
					? "rgba(235,95,85,0.9)"
					: `rgba(250,250,255,${0.45 + 0.45 * pulse})`;
				ctx.stroke();
				text = `${o.name} · ${failed ? "failed" : "building…"}`;
			} else {
				const topBelowEye = o.position.y + o.size.y * k < eyeY;
				if ((o.shape === "box" || custom) && topBelowEye) {
					// visible top face
					const b = P(
						o.position.x,
						o.position.y + o.size.y * k,
						o.position.z - (o.size.z * k) / 2,
					);
					const bw = (o.size.x * k * b.s) / 2;
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x + w, y);
					ctx.lineTo(b.x + bw, b.y);
					ctx.lineTo(b.x - bw, b.y);
					ctx.closePath();
					ctx.fillStyle = rgba(c, 1.18);
					ctx.fill();
				}
				rr(x, y, w, h, rad);
				const g = ctx.createLinearGradient(x, y, x + (custom ? w : 0), y + h);
				if (custom) {
					g.addColorStop(0, rgba(c, 1.35));
					g.addColorStop(0.5, rgba(c, 1));
					g.addColorStop(1, rgba(c, 0.55));
				} else {
					g.addColorStop(0, rgba(c, 1.1));
					g.addColorStop(1, rgba(c, 0.8));
				}
				ctx.fillStyle = g;
				ctx.fill();
				ctx.shadowBlur = 0;
				ctx.lineWidth = 1;
				ctx.strokeStyle = rgba(c, 0.6);
				ctx.stroke();
				if (isShiny(o.material)) {
					ctx.save();
					rr(x, y, w, h, rad);
					ctx.clip();
					const s = ctx.createLinearGradient(x, y, x + w, y + h);
					s.addColorStop(0.2, "rgba(255,255,255,0)");
					s.addColorStop(0.32, "rgba(255,255,255,0.55)");
					s.addColorStop(0.42, "rgba(255,255,255,0)");
					ctx.fillStyle = s;
					ctx.fillRect(x, y, w, h);
					ctx.restore();
				}
				if (custom) {
					// "generated model" badge
					const bx = x + w - 2;
					const by = y + 2;
					ctx.fillStyle = "rgba(12,14,18,0.8)";
					ctx.beginPath();
					ctx.arc(bx, by, 8, 0, Math.PI * 2);
					ctx.fill();
					ctx.fillStyle = "#ffd98a";
					ctx.font = "10px system-ui, sans-serif";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText("✦", bx, by + 0.5);
					const len = codeLen.get(o.id);
					if (len) text = `${o.name} · ${(len / 1000).toFixed(1)}k`;
				}
			}
			ctx.restore();
			label(text, p.x, p.y + 4);
		}

		// Focus glow.
		if (focusInfo) {
			const t = (now - focusInfo.start) / FOCUS_MS;
			const pts = outlines.get(focusInfo.id);
			if (t >= 1 || !pts) focusInfo = null;
			else {
				const a = (1 - t) * (0.7 + 0.3 * Math.sin(now / 90));
				ctx.save();
				path(pts);
				ctx.shadowColor = `rgba(110,190,255,${a})`;
				ctx.shadowBlur = 18;
				ctx.lineWidth = 3;
				ctx.strokeStyle = `rgba(140,205,255,${a})`;
				ctx.stroke();
				ctx.restore();
			}
		}

		ctx.save();
		ctx.font = "10px ui-monospace, Menlo, Consolas, monospace";
		ctx.textBaseline = "top";
		ctx.fillStyle = "rgba(12,14,18,0.55)";
		rr(8, cssH - 24, ctx.measureText("mock engine (2D)").width + 10, 16, 4);
		ctx.fill();
		ctx.fillStyle = "rgba(255,255,255,0.45)";
		ctx.fillText("mock engine (2D)", 13, cssH - 21);
		ctx.restore();
	}

	const loop = (t: number): void => {
		if (disposed) return;
		try {
			draw(t);
		} catch (e) {
			console.error("[mockEngine] draw failed", e);
		}
		raf = requestAnimationFrame(loop);
	};
	raf = requestAnimationFrame(loop);

	const setObjStatus = (
		id: string,
		status: SceneObject["status"],
	): SceneObject | undefined => {
		const o = scene.objects.find((x) => x.id === id);
		if (!o) return undefined;
		const prev = clone(scene);
		o.status = status;
		diffAnimate(prev, scene);
		return o;
	};

	return {
		getScene: () => clone(scene),
		applyOps(ops: Op[]): void {
			const prev = clone(scene);
			undoStack.push(prev);
			if (undoStack.length > UNDO_CAP) undoStack.shift();
			const g = window as any;
			g.__appliedOps ??= [];
			for (const op of ops) {
				try {
					applyOp(scene, op);
				} catch (e) {
					console.warn("[mockEngine] op failed", op, e);
				}
				g.__appliedOps.push(op);
			}
			diffAnimate(prev, scene);
			notify();
		},
		setAssetCode(objectId: string, code: string) {
			if (!scene.objects.some((x) => x.id === objectId))
				return { ok: false, error: "unknown object" };
			try {
				const build: unknown = new Function(
					code + "\n;return typeof build === 'function' ? build : null;",
				)();
				if (!build)
					return {
						ok: false,
						error: "code does not define function build(THREE)",
					};
			} catch (e) {
				return { ok: false, error: e instanceof Error ? e.message : String(e) };
			}
			codeLen.set(objectId, code.length);
			setObjStatus(objectId, "ready");
			notify();
			return { ok: true };
		},
		setAssetFailed(objectId: string): void {
			if (setObjStatus(objectId, "failed")) notify();
		},
		setDecalImage(decalId: string, dataUrl: string): void {
			const d = scene.decals.find((x) => x.id === decalId);
			if (!d) return;
			const img = new Image();
			img.src = dataUrl;
			images.set(decalId, img);
			d.status = "ready";
			notify();
		},
		setDecalFailed(decalId: string): void {
			const d = scene.decals.find((x) => x.id === decalId);
			if (!d) return;
			d.status = "failed";
			notify();
		},
		undo(): boolean {
			const snap = undoStack.pop();
			if (!snap) return false;
			const prev = scene;
			scene = snap;
			diffAnimate(prev, scene);
			notify();
			return true;
		},
		subscribe(fn: (s: Scene) => void): () => void {
			subs.add(fn);
			return () => {
				subs.delete(fn);
			};
		},
		screenshot(): string {
			try {
				draw(performance.now());
			} catch {
				/* keep last frame */
			}
			return canvas.toDataURL("image/jpeg", 0.8);
		},
		focus(id: string): void {
			const known =
				scene.objects.some((o) => o.id === id) ||
				scene.decals.some((d) => d.id === id) ||
				(SURFACE_IDS as string[]).includes(id);
			if (known) focusInfo = { id, start: performance.now() };
		},
		dispose(): void {
			disposed = true;
			cancelAnimationFrame(raf);
			ro.disconnect();
			canvas.remove();
			subs.clear();
			images.clear();
		},
	};
}
