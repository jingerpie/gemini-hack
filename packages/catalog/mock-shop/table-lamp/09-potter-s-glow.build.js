function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.46;
  const BASE_H = 0.22;
  const BASE_MAX_R = 0.11;
  const FOOT_R = 0.068;
  const NECK_R = 0.048;
  const COLLAR_R = 0.058;

  const STEM_R = 0.009;
  const STEM_H = 0.035;

  const SHADE_BOTTOM_R = 0.18;
  const SHADE_TOP_R = 0.10;
  const SHADE_H = 0.22;
  const SHADE_Y_BOTTOM = TOTAL_H - SHADE_H; // 0.24
  const SHADE_Y_CENTER = SHADE_Y_BOTTOM + SHADE_H / 2;

  const CORD_R = 0.004;

  // Materials
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a4621,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  const stonewareFootMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29b,
    roughness: 0.85,
    metalness: 0.0
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8c7344,
    roughness: 0.35,
    metalness: 0.85
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf2eadc,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const pleatMat = new THREE.MeshStandardMaterial({
    color: 0xe6dccb,
    roughness: 0.9,
    metalness: 0.0
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d28,
    roughness: 0.8,
    metalness: 0.0
  });

  const switchMat = new THREE.MeshStandardMaterial({
    color: 0x4a3121,
    roughness: 0.5,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Unglazed stoneware foot ring
  const footGeo = new THREE.CylinderGeometry(FOOT_R * 1.02, FOOT_R, 0.008, 32);
  addMesh(footGeo, stonewareFootMat, "ceramic_foot", 0, 0.004, 0);

  // 2. Glazed ceramic jar body (LatheGeometry)
  const basePoints = [
    new THREE.Vector2(0.0, 0.007),
    new THREE.Vector2(FOOT_R * 1.02, 0.007),
    new THREE.Vector2(FOOT_R * 1.12, 0.02),
    new THREE.Vector2(BASE_MAX_R * 0.85, 0.055),
    new THREE.Vector2(BASE_MAX_R, 0.105),
    new THREE.Vector2(BASE_MAX_R * 0.96, 0.145),
    new THREE.Vector2(BASE_MAX_R * 0.72, 0.178),
    new THREE.Vector2(NECK_R, 0.194),
    new THREE.Vector2(COLLAR_R, 0.205),
    new THREE.Vector2(COLLAR_R * 0.96, 0.214),
    new THREE.Vector2(NECK_R * 0.75, 0.218),
    new THREE.Vector2(0.0, BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(baseGeo, ceramicMat, "ceramic_base_body", 0, 0, 0);

  // 3. Brass neck fitting & stem
  const collarRingGeo = new THREE.CylinderGeometry(0.018, 0.021, 0.01, 24);
  addMesh(collarRingGeo, brassMat, "brass_collar_ring", 0, BASE_H + 0.002, 0);

  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 16);
  addMesh(stemGeo, brassMat, "brass_stem", 0, BASE_H + STEM_H / 2, 0);

  // 4. Bulb socket & glowing bulb inside shade
  const socketGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.038, 20);
  addMesh(socketGeo, brassMat, "bulb_socket", 0, SHADE_Y_BOTTOM + 0.032, 0);

  const bulbGeo = new THREE.SphereGeometry(0.028, 20, 16);
  addMesh(bulbGeo, bulbMat, "emit_bulb", 0, SHADE_Y_BOTTOM + 0.072, 0);

  // 5. Lampshade main cone (open-ended)
  const shadeGeo = new THREE.CylinderGeometry(SHADE_TOP_R, SHADE_BOTTOM_R, SHADE_H, 32, 1, true);
  addMesh(shadeGeo, shadeMat, "lampshade_cone", 0, SHADE_Y_CENTER, 0);

  // 6. Shade top & bottom trim rings
  const bottomTrimGeo = new THREE.TorusGeometry(SHADE_BOTTOM_R, 0.0035, 10, 32);
  addMesh(bottomTrimGeo, shadeMat, "shade_bottom_trim", 0, SHADE_Y_BOTTOM, 0, Math.PI / 2, 0, 0);

  const topTrimGeo = new THREE.TorusGeometry(SHADE_TOP_R, 0.0035, 10, 32);
  addMesh(topTrimGeo, shadeMat, "shade_top_trim", 0, TOTAL_H, 0, Math.PI / 2, 0, 0);

  // 7. Pleats around the shade (24 pleats)
  const PLEAT_COUNT = 24;
  const pleatLen = Math.hypot(SHADE_BOTTOM_R - SHADE_TOP_R, SHADE_H) - 0.004;
  const pleatTilt = Math.atan2(SHADE_BOTTOM_R - SHADE_TOP_R, SHADE_H);
  const pleatMidR = (SHADE_TOP_R + SHADE_BOTTOM_R) / 2 + 0.0015;
  const pleatGeo = new THREE.CylinderGeometry(0.0022, 0.0032, pleatLen, 6);

  for (let i = 0; i < PLEAT_COUNT; i++) {
    const angle = (i / PLEAT_COUNT) * Math.PI * 2;
    const px = Math.sin(angle) * pleatMidR;
    const pz = Math.cos(angle) * pleatMidR;
    const pleatMesh = new THREE.Mesh(pleatGeo, pleatMat);
    pleatMesh.name = `shade_pleat_${i + 1}`;
    pleatMesh.position.set(px, SHADE_Y_CENTER, pz);
    pleatMesh.rotation.order = "YXZ";
    pleatMesh.rotation.y = angle;
    pleatMesh.rotation.x = -pleatTilt;
    pleatMesh.castShadow = true;
    pleatMesh.receiveShadow = true;
    group.add(pleatMesh);
  }

  // 8. Braided power cord & inline switch resting on y = 0
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.015, -0.06),
    new THREE.Vector3(0.10, CORD_R, -0.08),
    new THREE.Vector3(0.18, CORD_R, -0.05),
    new THREE.Vector3(0.26, CORD_R, -0.02),
    new THREE.Vector3(0.32, CORD_R, 0.04)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, CORD_R, 8, false);
  addMesh(cordGeo, cordMat, "power_cord", 0, 0, 0);

  const switchGeo = new THREE.BoxGeometry(0.048, 0.016, 0.022);
  addMesh(switchGeo, switchMat, "inline_switch", 0.22, 0.008, -0.035, 0, -0.35, 0);

  return group;
}
