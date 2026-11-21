// Catalog model viewer: every product photo next to its generated build(THREE) model.
// Open at http://localhost:5273/catalog.html (npm run dev). New .build.js files appear via HMR.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { evaluateModelCode } from "../scene/model";
import catalog from "@gemini-hack/catalog/catalog.json";
import "./catalog.css";

type Entry = {
  kind: string; name: string; productType: string; vendor: string;
  price: number; currency: string; imageFile: string; modelFile?: string;
};

// Glob keys are rewritten by Vite; key them by "<kind>/<file>", the form catalog.json uses.
const byFile = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k.split("/").slice(-2).join("/"), v]));
const CODE = byFile(import.meta.glob("@catalog/*/*.build.js", { query: "?raw", import: "default", eager: true }) as Record<string, string>);
const IMAGES = byFile(import.meta.glob("@catalog/*/*.{png,jpg,jpeg,webp}", { query: "?url", import: "default", eager: true }) as Record<string, string>);
const modelRel = (e: Entry) => e.modelFile ?? e.imageFile.replace(/\.(png|jpe?g|webp)$/i, ".build.js");

const entries = (catalog as Entry[]).map(e => ({ ...e, code: CODE[modelRel(e)] as string | undefined, img: IMAGES[e.imageFile] }));
const kinds = [...new Set(entries.map(e => e.kind))];
type Item = (typeof entries)[number];

// ---------- shared rendering ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const envMap = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

function makeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1c21);
  scene.environment = envMap;
  scene.environmentIntensity = 0.45;
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2.5, 5, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.1, far: 20 });
  scene.add(sun, new THREE.HemisphereLight(0xdde4ff, 0x3a3328, 0.6));
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return scene;
}

type Built = { group: THREE.Group; size: THREE.Vector3; center: THREE.Vector3; meshes: number } | { error: string };
const builtCache = new Map<string, Built>();
function build(it: Item): Built {
  if (!it.code) return { error: "not generated yet" };
  const hit = builtCache.get(it.code);
  if (hit) return hit;
  const r = evaluateModelCode(it.code);
  let out: Built;
  if (!r.ok) out = { error: r.error };
  else {
    const group = r.model.group;
    group.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    out = { group, size: r.model.rawBox.getSize(new THREE.Vector3()), center: r.model.rawBox.getCenter(new THREE.Vector3()), meshes: r.model.meshCount };
  }
  builtCache.set(it.code, out);
  return out;
}

function frame(cam: THREE.PerspectiveCamera, b: { size: THREE.Vector3; center: THREE.Vector3 }, dist = 1.15) {
  const r = b.size.length() / 2;
  const d = (r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2))) * dist;
  const dir = new THREE.Vector3(0.75, 0.5, 1).normalize();
  cam.position.copy(b.center).addScaledVector(dir, d);
  cam.near = d / 100; cam.far = d * 10;
  cam.updateProjectionMatrix();
  cam.lookAt(b.center);
}

// Thumbnails: one renderer, rendered once to a data URL (browsers cap live WebGL contexts at ~16).
const THUMB_W = 320, THUMB_H = 320;
function thumbnail(it: Item): string | null {
  const b = build(it);
  if ("error" in b) return null;
  const scene = makeScene();
  scene.add(b.group);
  const cam = new THREE.PerspectiveCamera(32, THUMB_W / THUMB_H);
  frame(cam, b);
  renderer.setSize(THUMB_W, THUMB_H, false);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");
  scene.remove(b.group);
  return url;
}

// ---------- grid ----------
const grid = document.getElementById("grid")!;
const kindsNav = document.getElementById("kinds")!;
const count = document.getElementById("count")!;
let filter = "all";

const fmtSize = (s: THREE.Vector3) => `${s.x.toFixed(2)} × ${s.y.toFixed(2)} × ${s.z.toFixed(2)} m`;
const fmtPrice = (e: Item) => new Intl.NumberFormat("en-US", { style: "currency", currency: e.currency || "USD" }).format(e.price);

function renderKinds() {
  kindsNav.innerHTML = "";
  for (const k of ["all", ...kinds]) {
    const n = k === "all" ? entries.filter(e => e.code).length : entries.filter(e => e.kind === k && e.code).length;
    const total = k === "all" ? entries.length : entries.filter(e => e.kind === k).length;
    const b = document.createElement("button");
    b.className = "chip" + (k === filter ? " on" : "");
    b.innerHTML = `${k} <span>${n}/${total}</span>`;
    b.onclick = () => { filter = k; renderKinds(); renderGrid(); };
    kindsNav.appendChild(b);
  }
}

const visible = () => entries.filter(e => filter === "all" || e.kind === filter);

function renderGrid() {
  grid.innerHTML = "";
  const list = visible();
  count.textContent = `${entries.filter(e => e.code).length} of ${entries.length} products have models`;
  list.forEach(it => {
    const card = document.createElement("article");
    card.className = "card" + (it.code ? "" : " pending");
    const b = it.code ? build(it) : null;
    const meta = b && !("error" in b) ? `${fmtSize(b.size)} · ${b.meshes} meshes` : b && "error" in b ? `error: ${b.error}` : "not generated yet";
    card.innerHTML = `
      <div class="pair">
        <img class="ph" src="${it.img}" alt="" loading="lazy" />
        <div class="th"></div>
      </div>
      <div class="cap">
        <div class="row"><b>${it.name}</b><span class="kind">${it.kind}</span></div>
        <div class="sub">${meta}</div>
      </div>`;
    grid.appendChild(card);
    if (it.code) card.onclick = () => openViewer(entries.indexOf(it));
  });
  // Render thumbnails progressively so the page stays responsive.
  const cards = [...grid.children] as HTMLElement[];
  let i = 0;
  const step = () => {
    const end = Math.min(i + 3, list.length);
    for (; i < end; i++) {
      const url = list[i].code ? thumbnail(list[i]) : null;
      const slot = cards[i].querySelector(".th")!;
      slot.innerHTML = url ? `<img src="${url}" alt="" />` : `<span>${list[i].code ? "failed" : "pending"}</span>`;
    }
    if (i < list.length) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- viewer ----------
const dialog = document.getElementById("viewer") as HTMLDialogElement;
const stage = document.getElementById("stage")!;
const vRenderer = new THREE.WebGLRenderer({ antialias: true });
vRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
vRenderer.toneMapping = THREE.NeutralToneMapping;
vRenderer.shadowMap.enabled = true;
vRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(vRenderer.domElement);
const vScene = makeScene();
vScene.environment = new THREE.PMREMGenerator(vRenderer).fromScene(new RoomEnvironment(), 0.04).texture;
const vCam = new THREE.PerspectiveCamera(35, 1);
const controls = new OrbitControls(vCam, vRenderer.domElement);
controls.enableDamping = true;
let current: THREE.Object3D | null = null;
let currentIdx = -1;

function openViewer(idx: number) {
  const it = entries[idx];
  const b = build(it);
  if ("error" in b) return;
  currentIdx = idx;
  if (current) vScene.remove(current);
  // Clone: thumbnails and viewer use different renderers; geometry/material are shared, which is fine.
  current = b.group.clone();
  vScene.add(current);
  (document.getElementById("photo") as HTMLImageElement).src = it.img;
  document.getElementById("v-name")!.textContent = it.name;
  document.getElementById("v-meta")!.innerHTML = [
    ["Kind", it.kind], ["Type", it.productType], ["Vendor", it.vendor], ["Price", fmtPrice(it)],
    ["Size", fmtSize(b.size)], ["Meshes", String(b.meshes)], ["File", modelRel(it)],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  document.getElementById("v-code")!.textContent = it.code!;
  if (!dialog.open) dialog.showModal();
  resize();
  frame(vCam, b, 1.3);
  controls.target.copy(b.center);
  controls.update();
}

function step(dir: number) {
  const withModels = visible().filter(e => e.code).map(e => entries.indexOf(e));
  if (!withModels.length) return;
  const pos = withModels.indexOf(currentIdx);
  openViewer(withModels[(pos + dir + withModels.length) % withModels.length]);
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  vRenderer.setSize(w, h, false);
  vCam.aspect = w / h;
  vCam.updateProjectionMatrix();
}

document.getElementById("close")!.onclick = () => dialog.close();
document.getElementById("prev")!.onclick = () => step(-1);
document.getElementById("next")!.onclick = () => step(1);
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
addEventListener("keydown", e => {
  if (!dialog.open) return;
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
addEventListener("resize", resize);
vRenderer.setAnimationLoop(() => {
  if (!dialog.open) return;
  controls.update();
  vRenderer.render(vScene, vCam);
});

renderKinds();
renderGrid();
