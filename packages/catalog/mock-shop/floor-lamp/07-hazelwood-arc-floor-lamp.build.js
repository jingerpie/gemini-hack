function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 1.65;
  const BASE_R = 0.17;
  const BASE_H = 0.032;
  const COLLAR_H = 0.025;
  const STEM_R = 0.014;
  const SHADE_TOP_R = 0.22;
  const SHADE_BOT_R = 0.27;
  const SHADE_H = 0.28;
  const SHADE_CENTER_Y = 1.36;
  const SHADE_TOP_Y = SHADE_CENTER_Y + SHADE_H * 0.5;
  const SHADE_BOT_Y = SHADE_CENTER_Y - SHADE_H * 0.5;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89456,
    metalness: 0.85,
    roughness: 0.32
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6234,
    roughness: 0.55,
    metalness: 0.05
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf2e6d5,
    roughness: 0.85,
    metalness: 0.0,
    emissive: 0xffe4b5,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.0
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    metalness: 0.6,
    roughness: 0.45
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base
  const baseGeo = new THREE.CylinderGeometry(BASE_R * 0.97, BASE_R, BASE_H, 32);
  addMesh(baseGeo, brassMat, 'base_disc', [0, BASE_H * 0.5, 0]);

  const basePadGeo = new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.96, 0.004, 32);
  addMesh(basePadGeo, darkMetalMat, 'base_pad', [0, 0.002, 0]);

  const collarGeo = new THREE.CylinderGeometry(STEM_R * 1.45, STEM_R * 1.7, COLLAR_H, 24);
  addMesh(collarGeo, brassMat, 'stem_base_collar', [0, BASE_H + COLLAR_H * 0.5 - 0.002, 0]);

  // 2. Wooden Arc Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BASE_H * 0.5, 0),
    new THREE.Vector3(0, SHADE_BOT_Y, 0),
    new THREE.Vector3(0, SHADE_TOP_Y + 0.02, -0.015),
    new THREE.Vector3(0, TOTAL_H - 0.01, -0.01),
    new THREE.Vector3(0, TOTAL_H, 0.015),
    new THREE.Vector3(0, SHADE_TOP_Y + 0.01, 0.025),
    new THREE.Vector3(0, SHADE_TOP_Y - 0.04, 0)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 32, STEM_R, 16, false);
  addMesh(stemGeo, woodMat, 'wooden_arc_stem');

  // 3. Socket & Bulb inside shade
  const socketCapGeo = new THREE.CylinderGeometry(STEM_R * 1.3, STEM_R * 1.3, 0.02, 20);
  addMesh(socketCapGeo, brassMat, 'socket_cap', [0, SHADE_TOP_Y - 0.045, 0]);

  const socketBodyGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.055, 20);
  addMesh(socketBodyGeo, brassMat, 'lamp_socket', [0, SHADE_TOP_Y - 0.08, 0]);

  const bulbBaseGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.022, 16);
  addMesh(bulbBaseGeo, brassMat, 'bulb_screw_base', [0, SHADE_TOP_Y - 0.115, 0]);

  const bulbGeo = new THREE.SphereGeometry(0.034, 20, 16);
  addMesh(bulbGeo, bulbMat, 'light_bulb', [0, SHADE_TOP_Y - 0.15, 0]);

  // 4. Lampshade
  const shadeGeo = new THREE.CylinderGeometry(SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 32, 1, true);
  addMesh(shadeGeo, shadeMat, 'linen_lampshade', [0, SHADE_CENTER_Y, 0]);

  const topRimGeo = new THREE.TorusGeometry(SHADE_TOP_R, 0.003, 12, 32);
  addMesh(topRimGeo, shadeMat, 'shade_top_rim', [0, SHADE_TOP_Y, 0], [Math.PI * 0.5, 0, 0]);

  const botRimGeo = new THREE.TorusGeometry(SHADE_BOT_R, 0.003, 12, 32);
  addMesh(botRimGeo, shadeMat, 'shade_bottom_rim', [0, SHADE_BOT_Y, 0], [Math.PI * 0.5, 0, 0]);

  // 5. Spider Fitter (connects socket to shade top rim)
  const spiderRingGeo = new THREE.TorusGeometry(0.026, 0.003, 10, 24);
  addMesh(spiderRingGeo, brassMat, 'spider_center_ring', [0, SHADE_TOP_Y - 0.05, 0], [Math.PI * 0.5, 0, 0]);

  const armLen = SHADE_TOP_R - 0.024;
  const armGeo = new THREE.CylinderGeometry(0.0025, 0.0025, armLen, 8);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const arm = new THREE.Mesh(armGeo, brassMat);
    arm.name = `spider_arm_${i + 1}`;
    const midR = 0.024 + armLen * 0.5;
    arm.position.set(
      Math.cos(angle) * midR,
      SHADE_TOP_Y - 0.025,
      Math.sin(angle) * midR
    );
    arm.rotation.z = Math.PI * 0.5 - 0.22;
    arm.rotation.y = -angle;
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);
  }

  return group;
}
