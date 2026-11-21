function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 1.55;
  const FOOT_H = 0.005;
  const FOOT_R = 0.015;
  const BASE_W = 0.30;
  const BASE_D = 0.30;
  const BASE_H = 0.045;
  const COL_W = 0.16;
  const COL_D = 0.16;
  const STEM_H = 0.05;
  const STEM_R = 0.011;
  const SHADE_H = 0.36;
  const SHADE_R = 0.21;
  const COL_H = TOTAL_H - FOOT_H - BASE_H - STEM_H - SHADE_H;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x7a4b2a,
    roughness: 0.55,
    metalness: 0.05
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a45d,
    roughness: 0.3,
    metalness: 0.85
  });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf4ecdc,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Feet pads
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footOffsetX = BASE_W / 2 - 0.03;
  const footOffsetZ = BASE_D / 2 - 0.03;
  addMesh(footGeo, footMat, 'foot_fl', -footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, footMat, 'foot_fr', footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, footMat, 'foot_bl', -footOffsetX, FOOT_H / 2, -footOffsetZ);
  addMesh(footGeo, footMat, 'foot_br', footOffsetX, FOOT_H / 2, -footOffsetZ);

  // 2. Walnut base plinth
  const baseY = FOOT_H + BASE_H / 2;
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
  addMesh(baseGeo, walnutMat, 'base_plinth', 0, baseY, 0);

  // 3. Walnut vertical column
  const colY = FOOT_H + BASE_H + COL_H / 2;
  const colGeo = new THREE.BoxGeometry(COL_W, COL_H, COL_D);
  addMesh(colGeo, walnutMat, 'walnut_column', 0, colY, 0);

  // 4. Brass mounting plate & stem
  const colTopY = FOOT_H + BASE_H + COL_H;
  const plateH = 0.004;
  const plateGeo = new THREE.CylinderGeometry(0.025, 0.025, plateH, 24);
  addMesh(plateGeo, brassMat, 'brass_mounting_plate', 0, colTopY + plateH / 2, 0);

  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 20);
  addMesh(stemGeo, brassMat, 'brass_stem', 0, colTopY + STEM_H / 2, 0);

  // 5. Socket & Bulb inside shade
  const shadeBottomY = colTopY + STEM_H;
  const socketH = 0.055;
  const socketGeo = new THREE.CylinderGeometry(0.02, 0.02, socketH, 20);
  addMesh(socketGeo, brassMat, 'brass_socket', 0, shadeBottomY + socketH / 2, 0);

  const bulbR = 0.032;
  const bulbGeo = new THREE.SphereGeometry(bulbR, 20, 16);
  addMesh(bulbGeo, bulbMat, 'light_bulb', 0, shadeBottomY + socketH + bulbR * 0.7, 0);

  // 6. Drum shade & trim rings
  const shadeCenterY = shadeBottomY + SHADE_H / 2;
  const shadeGeo = new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true);
  addMesh(shadeGeo, shadeMat, 'shade_outer', 0, shadeCenterY, 0);

  const ringTubeR = 0.003;
  const ringGeo = new THREE.TorusGeometry(SHADE_R, ringTubeR, 12, 32);
  addMesh(ringGeo, shadeMat, 'shade_bottom_ring', 0, shadeBottomY, 0, Math.PI / 2, 0, 0);
  addMesh(ringGeo, shadeMat, 'shade_top_ring', 0, shadeBottomY + SHADE_H, 0, Math.PI / 2, 0, 0);

  // 7. Spider fitter arms connecting socket to bottom shade ring
  const armLen = SHADE_R - 0.015;
  const armGeo = new THREE.CylinderGeometry(0.0025, 0.0025, armLen, 8);
  const armY = shadeBottomY + 0.005;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const armX = Math.cos(angle) * (armLen / 2 + 0.015);
    const armZ = Math.sin(angle) * (armLen / 2 + 0.015);
    addMesh(
      armGeo,
      brassMat,
      `spider_arm_${i + 1}`,
      armX,
      armY,
      armZ,
      0,
      -angle,
      Math.PI / 2
    );
  }

  return group;
}
