// Merchant GLB models: download (with progress + timeouts), parse (Draco / Meshopt / KTX2 decoders served locally
// from web/public), cap textures, and hand out per-object instances that share geometry and textures with a cached
// template (materials are cloned per instance, because the engine re-tints / overrides them per object).
import * as THREE from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import type { MatRecord, PreparedModel, StdMat } from "./model";

export type GlbTemplate = {
	url: string;
	scene: THREE.Group; // never added to the scene; instances are clones
	rawBox: THREE.Box3; // in the file's own units (meters per glTF spec)
	size: THREE.Vector3;
	bytes: number;
	meshCount: number;
	ms: number;
};

const IDLE_MS = 15000; // no bytes for this long -> fail
const TOTAL_MS = 90000; // whole download
const PARSE_MS = 15000; // decoding (a missing decoder must not hang)
const MAX_TEX = 1024;

export type GlbLoaders = { gltf: GLTFLoader; dispose(): void };

export function createGlbLoaders(renderer: THREE.WebGLRenderer): GlbLoaders {
	const base = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
	const draco = new DRACOLoader().setDecoderPath(base + "draco/");
	const ktx2 = new KTX2Loader().setTranscoderPath(base + "basis/");
	try {
		ktx2.detectSupport(renderer);
	} catch (e) {
		console.warn("[glb] KTX2 support detection failed", e);
	}
	const gltf = new GLTFLoader()
		.setDRACOLoader(draco)
		.setKTX2Loader(ktx2)
		.setMeshoptDecoder(MeshoptDecoder);
	return {
		gltf,
		dispose() {
			draco.dispose();
			ktx2.dispose();
		},
	};
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const t = setTimeout(
			() =>
				reject(new Error(`${what} timed out after ${Math.round(ms / 1000)} s`)),
			ms,
		);
		p.then(
			(v) => (clearTimeout(t), resolve(v)),
			(e) => (clearTimeout(t), reject(e)),
		);
	});
}

async function download(
	url: string,
	onProgress: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
	const ac = new AbortController();
	let why = "";
	let idle = setTimeout(
		() => ((why = "download stalled (15 s without data)"), ac.abort()),
		IDLE_MS,
	);
	const all = setTimeout(
		() => ((why = "download took too long"), ac.abort()),
		TOTAL_MS,
	);
	try {
		const res = await fetch(url, {
			signal: ac.signal,
			mode: "cors",
			credentials: "omit",
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		let total = Number(res.headers.get("content-length")) || 0;
		const reader = res.body?.getReader();
		if (!reader) {
			const b = await res.arrayBuffer();
			onProgress(b.byteLength, b.byteLength);
			return b;
		}
		const chunks: Uint8Array[] = [];
		let loaded = 0;
		onProgress(0, total);
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			clearTimeout(idle);
			idle = setTimeout(
				() => ((why = "download stalled (15 s without data)"), ac.abort()),
				IDLE_MS,
			);
			chunks.push(value);
			loaded += value.byteLength;
			if (loaded > total) total = 0; // compressed transfer: length unknown
			onProgress(loaded, total);
		}
		const out = new Uint8Array(loaded);
		let o = 0;
		for (const c of chunks) {
			out.set(c, o);
			o += c.byteLength;
		}
		onProgress(loaded, loaded);
		return out.buffer;
	} catch (e) {
		if (why) throw new Error(why);
		throw e;
	} finally {
		clearTimeout(idle);
		clearTimeout(all);
	}
}

function capTexture(t: THREE.Texture) {
	if ((t as THREE.CompressedTexture).isCompressedTexture) return;
	const img = t.image as
		| { width?: number; height?: number; close?: () => void }
		| undefined;
	if (!img || !img.width || !img.height) return;
	const m = Math.max(img.width, img.height);
	if (m <= MAX_TEX) return;
	const k = MAX_TEX / m;
	const cv = document.createElement("canvas");
	cv.width = Math.max(1, Math.round(img.width * k));
	cv.height = Math.max(1, Math.round(img.height * k));
	const g = cv.getContext("2d");
	if (!g) return;
	g.imageSmoothingQuality = "high";
	g.drawImage(img as CanvasImageSource, 0, 0, cv.width, cv.height);
	img.close?.(); // ImageBitmap
	t.image = cv;
	t.needsUpdate = true;
}

const TEX_KEYS = [
	"map",
	"normalMap",
	"roughnessMap",
	"metalnessMap",
	"aoMap",
	"emissiveMap",
	"alphaMap",
	"bumpMap",
	"clearcoatMap",
	"clearcoatNormalMap",
	"clearcoatRoughnessMap",
	"sheenColorMap",
	"sheenRoughnessMap",
	"specularColorMap",
	"specularIntensityMap",
	"transmissionMap",
	"thicknessMap",
	"iridescenceMap",
	"iridescenceThicknessMap",
	"anisotropyMap",
] as const;

export async function loadGlbTemplate(
	loaders: GlbLoaders,
	url: string,
	onProgress: (loaded: number, total: number) => void,
): Promise<GlbTemplate> {
	const t0 = performance.now();
	const buf = await download(url, onProgress);
	const dir = url.slice(0, url.split("?")[0].lastIndexOf("/") + 1);
	const gltf = await withTimeout(
		loaders.gltf.parseAsync(buf, dir),
		PARSE_MS,
		"model decoding",
	);
	const root = (gltf.scene || gltf.scenes?.[0]) as THREE.Group | undefined;
	if (!root) throw new Error("file has no scene");
	const drop: THREE.Object3D[] = [];
	const seenTex = new Set<THREE.Texture>();
	let meshCount = 0;
	root.traverse((o) => {
		if ((o as THREE.Light).isLight || (o as THREE.Camera).isCamera)
			return void drop.push(o);
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		meshCount++;
		m.castShadow = true;
		m.receiveShadow = true;
		for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
			const rec = mat as unknown as Record<
				string,
				THREE.Texture | null | undefined
			>;
			for (const k of TEX_KEYS) {
				const tex = rec[k];
				if (tex && !seenTex.has(tex)) {
					seenTex.add(tex);
					try {
						capTexture(tex);
					} catch {
						/* keep the full-size texture */
					}
				}
			}
		}
	});
	for (const o of drop) o.removeFromParent();
	if (!meshCount) throw new Error("file has no meshes");
	root.updateMatrixWorld(true);
	const rawBox = new THREE.Box3().setFromObject(root);
	if (
		rawBox.isEmpty() ||
		!Number.isFinite(rawBox.min.x) ||
		!Number.isFinite(rawBox.max.y)
	)
		throw new Error("model has no valid geometry");
	const size = rawBox.getSize(new THREE.Vector3());
	return {
		url,
		scene: root,
		rawBox,
		size,
		bytes: buf.byteLength,
		meshCount,
		ms: Math.round(performance.now() - t0),
	};
}

/** A per-object copy: shared geometry + textures, cloned materials (tracked in `records`). */
export function instantiateGlb(t: GlbTemplate): PreparedModel {
	const group = new THREE.Group();
	group.name = "glb";
	const copy = cloneSkinned(t.scene);
	group.add(copy);
	const matMap = new Map<THREE.Material, THREE.Material>();
	const cl = (m: THREE.Material) => {
		let c = matMap.get(m);
		if (!c) {
			c = m.clone();
			c.userData.glb = true;
			matMap.set(m, c);
		}
		return c;
	};
	copy.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.material = Array.isArray(m.material)
			? m.material.map(cl)
			: cl(m.material);
	});
	const records: MatRecord[] = [];
	for (const c of matMap.values()) {
		const s = c as StdMat;
		if (!s.isMeshStandardMaterial) continue;
		records.push({
			mat: s,
			color: s.color.clone(),
			roughness: s.roughness,
			metalness: s.metalness,
			opacity: s.opacity,
			transparent: s.transparent,
			emissive: s.emissive.clone(),
			emissiveIntensity: s.emissiveIntensity,
		});
	}
	group.updateMatrixWorld(true);
	// Merchant GLBs carry no emit_* convention; lamps from GLBs get no practical light (emitters empty).
	return {
		group,
		rawBox: t.rawBox.clone(),
		records,
		meshCount: t.meshCount,
		drawCount: t.meshCount,
		emitters: [],
	};
}

/** Dispose what an instance owns (its cloned materials), never the shared geometry / textures. */
export function disposeGlbInstance(o: THREE.Object3D) {
	o.traverse((c) => {
		const mm = (c as THREE.Mesh).material as
			| THREE.Material
			| THREE.Material[]
			| undefined;
		if (mm) for (const m of Array.isArray(mm) ? mm : [mm]) m.dispose();
	});
}

export function disposeGlbTemplate(t: GlbTemplate) {
	const texs = new Set<THREE.Texture>();
	t.scene.traverse((c) => {
		const m = c as THREE.Mesh;
		m.geometry?.dispose();
		const mm = m.material as THREE.Material | THREE.Material[] | undefined;
		if (mm)
			for (const mat of Array.isArray(mm) ? mm : [mm]) {
				const rec = mat as unknown as Record<
					string,
					THREE.Texture | null | undefined
				>;
				for (const k of TEX_KEYS) if (rec[k]) texs.add(rec[k]!);
				mat.dispose();
			}
	});
	for (const x of texs) x.dispose();
}
