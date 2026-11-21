// /api/render: photorealistic picture of the current room, made by the image model from a canvas screenshot.
// The 3D scene stays the source of truth; the render is only a picture of it.
import { generateContent } from "./lib.mjs";
import { closestRatio, IMAGE_MODEL } from "./media.mjs";

const TIMEOUT_MS = 45000;

// Width/height from a PNG or JPEG header (so the output keeps the screenshot's aspect ratio).
function imageDims(buf) {
	if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50)
		return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
	if (buf[0] === 0xff && buf[1] === 0xd8) {
		let i = 2;
		while (i + 9 < buf.length) {
			if (buf[i] !== 0xff) return null;
			const m = buf[i + 1];
			const len = buf.readUInt16BE(i + 2);
			if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
				return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
			i += 2 + len;
		}
	}
	return null;
}

const finish = (m) =>
	(m?.roughness ?? 1) < 0.25
		? "glossy"
		: (m?.metalness ?? 0) > 0.5
			? "metallic"
			: "matte";
function where(o, room) {
	const fx = o.position.x / (room.width || 6);
	const fz = o.position.z / (room.depth || 5);
	const h = fx < -0.17 ? "left" : fx > 0.17 ? "right" : "center";
	const d =
		fz < -0.25
			? "against/near the back wall"
			: fz > 0.15
				? "toward the front"
				: "middle of the room";
	return `${h}, ${d}`;
}
export function objectList(scene) {
	const L = [];
	const s = scene.surfaces || {};
	if (s.wall_back && s.wall_left && s.floor) {
		L.push(
			`- back wall: ${s.wall_back.color} ${finish(s.wall_back.material)}; side walls: ${s.wall_left.color} ${finish(s.wall_left.material)}; floor: ${s.floor.color}`,
		);
	}
	const objs = Array.isArray(scene.objects) ? scene.objects : [];
	for (const o of objs.slice(0, 40)) {
		if (!o?.position || !o?.size) continue;
		const parent = o.parent ? objs.find((p) => p.id === o.parent) : null;
		L.push(
			`- ${o.name || o.id} (${o.shape === "custom" ? "detailed model" : o.shape}), color ${o.color}, about ${+o.size.x.toFixed(2)}x${+o.size.y.toFixed(2)}x${+o.size.z.toFixed(2)} m (w x h x d), ${where(o, scene.room || {})}${parent ? `, resting on the ${parent.name || parent.id}` : ""}`,
		);
	}
	for (const d of (Array.isArray(scene.decals) ? scene.decals : []).slice(
		0,
		20,
	)) {
		L.push(
			`- wall art "${d.name}" on the ${String(d.surface).replace("wall_", "")} wall, ${d.width}x${d.height} m, center ${d.y} m above floor`,
		);
	}
	return L.join("\n");
}

export function renderPrompt(scene, style) {
	let p =
		"Turn this 3D-modelling screenshot of an interior into a photorealistic interior photograph of the SAME room. Keep EXACTLY: the camera position, angle and framing; the room's shape; every object, in the same place, with the same size, shape and colour; the wall colours and floor colour; any picture on the walls, unchanged. Only replace the flat computer-graphics look with real materials (fabric, wood, metal, plaster), realistic lighting, soft shadows and reflections. Do NOT add, remove or move anything: no new furniture, windows, doors, lamps, plants, curtains or decorations. Simple blocky shapes stand for real furniture of that kind and colour (a box named sofa is a sofa) — make them the real item at the same size and position. The room is shown as an open cut-away (the front wall is removed); keep that same view and keep the dark area outside the room.";
	const list = scene && typeof scene === "object" ? objectList(scene) : "";
	if (list)
		p += `\n\nThe room contains exactly these things and nothing else:\n${list}`;
	if (typeof style === "string" && style.trim())
		p += `\n\nLighting/style: ${style.trim().slice(0, 200)}.`;
	return p;
}

export async function render({ image, scene, style } = {}) {
	const m =
		typeof image === "string" &&
		image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/s);
	if (!m) {
		const e = new Error("image (jpeg/png/webp base64 data URL) required");
		e.status = 400;
		throw e;
	}
	const t0 = Date.now();
	const dims = imageDims(Buffer.from(m[2].slice(0, 200000), "base64"));
	const aspectRatio = dims ? closestRatio(dims[0], dims[1]) : "16:9";
	let js;
	try {
		js = await generateContent(
			IMAGE_MODEL,
			{
				contents: [
					{
						role: "user",
						parts: [
							{
								inlineData: {
									mimeType: m[1].replace("jpg", "jpeg"),
									data: m[2],
								},
							},
							{ text: renderPrompt(scene, style) },
						],
					},
				],
				generationConfig: {
					responseModalities: ["IMAGE"],
					imageConfig: { aspectRatio, imageSize: "1K" },
					thinkingConfig: { thinkingLevel: "minimal" },
				},
			},
			{ timeoutMs: TIMEOUT_MS },
		);
	} catch (e) {
		if (/timeout|abort/i.test(String(e.message)) && !e.status) {
			const t = new Error(`render timed out after ${TIMEOUT_MS / 1000} s`);
			t.status = 504;
			throw t;
		}
		throw e;
	}
	const cand = js.candidates?.[0];
	const img = (cand?.content?.parts || []).find(
		(p) => p.inlineData?.data || p.inline_data?.data,
	);
	if (!img) {
		const why =
			cand?.finishReason ||
			js.promptFeedback?.blockReason ||
			"no image returned";
		const txt = (cand?.content?.parts || [])
			.map((p) => p.text)
			.filter(Boolean)
			.join(" ")
			.slice(0, 200);
		const e = new Error(
			`image model returned no render: ${why}${txt ? ": " + txt : ""}`,
		);
		e.status = 422;
		throw e;
	}
	const d = img.inlineData || img.inline_data;
	return {
		dataUrl: `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`,
		ms: Date.now() - t0,
		model: IMAGE_MODEL,
	};
}
