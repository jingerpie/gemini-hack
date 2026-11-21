function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.46;
  const BOWL_R = 0.23;
  const BOWL_H = 0.19;
  const BOWL_THICK = 0.008;
  const CANOPY_R = 0.092;
  const CANOPY_H = 0.032;
  const ROD_R = 0.0075;
  const ROD_RING_R = 0.048;
  const COLLAR_R = 0.0125;
  const COLLAR_H = 0.014;
  const HUB_R = 0.062;
  const HUB_H = 0.016;
  const BULB_R = 0.042;

  const CANOPY_BOTTOM_Y = H - CANOPY_H;
  const BOWL_TOP_Y = BOWL_H;
  const HUB_Y = BOWL_H * 0.55;
  const ROD_BOTTOM_Y = HUB_Y;
  const ROD_TOP_Y = CANOPY_BOTTOM_Y;
  const ROD_LEN = ROD_TOP_Y - ROD_BOTTOM_Y;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.45,
    metalness: 0.15,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6f1e7,
    roughness: 0.65,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd89b,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0,
  });

  // Helper to configure shadow properties
  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Canopy plate at the top (y = H)
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  const canopyMesh = new THREE.Mesh(canopyGeo, metalMat);
  canopyMesh.position.set(0, H - CANOPY_H / 2, 0);
  addMesh(canopyMesh, "canopy_plate");

  // Canopy subtle top bevel ring
  const canopyLipGeo = new THREE.TorusGeometry(CANOPY_R - 0.002, 0.003, 12, 32);
  const canopyLipMesh = new THREE.Mesh(canopyLipGeo, metalMat);
  canopyLipMesh.rotation.x = Math.PI / 2;
  canopyLipMesh.position.set(0, CANOPY_BOTTOM_Y + 0.002, 0);
  addMesh(canopyLipMesh, "canopy_lip");

  // 3 vertical suspension rods + top/bottom collars
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_LEN, 16);
  const collarGeo = new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_H, 16);

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3 + Math.PI / 6;
    const rx = Math.cos(angle) * ROD_RING_R;
    const rz = Math.sin(angle) * ROD_RING_R;

    const rod = new THREE.Mesh(rodGeo, metalMat);
    rod.position.set(rx, ROD_BOTTOM_Y + ROD_LEN / 2, rz);
    addMesh(rod, `rod_${i + 1}`);

    const topCollar = new THREE.Mesh(collarGeo, metalMat);
    topCollar.position.set(rx, CANOPY_BOTTOM_Y - COLLAR_H / 2, rz);
    addMesh(topCollar, `rod_top_collar_${i + 1}`);

    const baseCollar = new THREE.Mesh(collarGeo, metalMat);
    baseCollar.position.set(rx, HUB_Y + HUB_H / 2 + COLLAR_H / 2 - 0.002, rz);
    addMesh(baseCollar, `rod_base_collar_${i + 1}`);
  }

  // Internal mounting hub inside the bowl
  const hubGeo = new THREE.CylinderGeometry(HUB_R, HUB_R * 0.9, HUB_H, 24);
  const hubMesh = new THREE.Mesh(hubGeo, metalMat);
  hubMesh.position.set(0, HUB_Y, 0);
  addMesh(hubMesh, "internal_hub");

  // Emissive bulb inside the frosted bowl
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 16);
  const bulbMesh = new THREE.Mesh(bulbGeo, emitMat);
  bulbMesh.position.set(0, HUB_Y - HUB_H / 2 - BULB_R * 0.65, 0);
  addMesh(bulbMesh, "emit_bulb");

  // Frosted glass bowl shade (LatheGeometry with wall thickness, bottom at y = 0)
  const bowlPoints = [];
  const steps = 20;
  // Outer curve from bottom center (0, 0) up to rim (BOWL_R, BOWL_H)
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2);
    const r = Math.sin(t) * BOWL_R;
    const y = (1 - Math.cos(t)) * BOWL_H;
    bowlPoints.push(new THREE.Vector2(r, y));
  }
  // Inner curve from rim back down to inner bottom center
  for (let i = steps; i >= 0; i--) {
    const t = (i / steps) * (Math.PI / 2);
    const r = Math.max(0, Math.sin(t) * (BOWL_R - BOWL_THICK));
    const y = BOWL_THICK + (1 - Math.cos(t)) * (BOWL_H - BOWL_THICK);
    bowlPoints.push(new THREE.Vector2(r, y));
  }

  const bowlGeo = new THREE.LatheGeometry(bowlPoints, 32);
  const bowlMesh = new THREE.Mesh(bowlGeo, glassMat);
  addMesh(bowlMesh, "glass_bowl_shade");

  // Subtle rim torus at top edge of bowl
  const rimGeo = new THREE.TorusGeometry(BOWL_R - BOWL_THICK / 2, BOWL_THICK / 2, 10, 32);
  const rimMesh = new THREE.Mesh(rimGeo, glassMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.set(0, BOWL_TOP_Y, 0);
  addMesh(rimMesh, "bowl_rim");

  return group;
}
