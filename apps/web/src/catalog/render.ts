// three.js side of the catalog page: build models from their code, render thumbnails, drive the 3D viewer.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { evaluateModelCode } from "../scene/model";
import type { Item } from "./data";

export type Built =
	| {
			group: THREE.Group;
			size: THREE.Vector3;
			center: THREE.Vector3;
			meshes: number;
	  }
	| { error: string };

const builtCache = new Map<string, Built>();
/** Evaluate an item's model code once; later calls return the cached group. */
export function build(it: Item): Built {
	if (!it.code) return { error: "not generated yet" };
	const hit = builtCache.get(it.code);
	if (hit) return hit;
	const r = evaluateModelCode(it.code);
	let out: Built;
	if (!r.ok) out = { error: r.error };
	else {
		const group = r.model.group;
		group.traverse((o) => {
			if ((o as THREE.Mesh).isMesh) {
				o.castShadow = true;
				o.receiveShadow = true;
			}
		});
		out = {
			group,
			size: r.model.rawBox.getSize(new THREE.Vector3()),
			center: r.model.rawBox.getCenter(new THREE.Vector3()),
			meshes: r.model.meshCount,
		};
	}
	builtCache.set(it.code, out);
	return out;
}

function makeRenderer(preserveDrawingBuffer: boolean) {
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		preserveDrawingBuffer,
	});
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const env = new THREE.PMREMGenerator(renderer).fromScene(
		new RoomEnvironment(),
		0.04,
	).texture;
	return { renderer, env };
}

function makeScene(env: THREE.Texture) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1a1c21);
	scene.environment = env;
	scene.environmentIntensity = 0.45;
	const sun = new THREE.DirectionalLight(0xffffff, 1.6);
	sun.position.set(2.5, 5, 3.5);
	sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024);
	Object.assign(sun.shadow.camera, {
		left: -3,
		right: 3,
		top: 3,
		bottom: -3,
		near: 0.1,
		far: 20,
	});
	scene.add(sun, new THREE.HemisphereLight(0xdde4ff, 0x3a3328, 0.6));
	const floor = new THREE.Mesh(
		new THREE.CircleGeometry(4, 48),
		new THREE.ShadowMaterial({ opacity: 0.35 }),
	);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);
	return scene;
}

function frame(
	cam: THREE.PerspectiveCamera,
	b: { size: THREE.Vector3; center: THREE.Vector3 },
	dist = 1.15,
) {
	const r = b.size.length() / 2;
	const d = (r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2))) * dist;
	const dir = new THREE.Vector3(0.75, 0.5, 1).normalize();
	cam.position.copy(b.center).addScaledVector(dir, d);
	cam.near = d / 100;
	cam.far = d * 10;
	cam.updateProjectionMatrix();
	cam.lookAt(b.center);
}

const THUMB = 320;
/** One offscreen renderer that turns models into PNG data URLs (browsers cap live WebGL contexts at ~16). */
export function createThumbnailer() {
	const { renderer, env } = makeRenderer(true);
	return {
		thumbnail(it: Item): string | null {
			const b = build(it);
			if ("error" in b) return null;
			const scene = makeScene(env);
			scene.add(b.group);
			const cam = new THREE.PerspectiveCamera(32, 1);
			frame(cam, b);
			renderer.setSize(THUMB, THUMB, false);
			renderer.render(scene, cam);
			const url = renderer.domElement.toDataURL("image/png");
			scene.remove(b.group);
			return url;
		},
		dispose() {
			env.dispose();
			renderer.dispose();
		},
	};
}

/** Live orbit viewer rendered into `stage`; show() swaps the model. */
export function createViewer(stage: HTMLElement) {
	const { renderer, env } = makeRenderer(false);
	stage.appendChild(renderer.domElement);
	renderer.domElement.className = "block size-full";
	const scene = makeScene(env);
	const cam = new THREE.PerspectiveCamera(35, 1);
	const controls = new OrbitControls(cam, renderer.domElement);
	controls.enableDamping = true;
	let current: THREE.Object3D | null = null;

	const resize = () => {
		const w = stage.clientWidth;
		const h = stage.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		cam.aspect = w / h;
		cam.updateProjectionMatrix();
	};
	const ro = new ResizeObserver(resize);
	ro.observe(stage);
	renderer.setAnimationLoop(() => {
		controls.update();
		renderer.render(scene, cam);
	});

	return {
		show(it: Item) {
			const b = build(it);
			if ("error" in b) return;
			if (current) scene.remove(current);
			// Clone: thumbnails and viewer use different renderers; geometry/material are shared, which is fine.
			current = b.group.clone();
			scene.add(current);
			resize();
			frame(cam, b, 1.3);
			controls.target.copy(b.center);
			controls.update();
		},
		dispose() {
			ro.disconnect();
			renderer.setAnimationLoop(null);
			controls.dispose();
			env.dispose();
			renderer.domElement.remove();
			renderer.dispose();
		},
	};
}
