function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.62;
  const BASE_R = 0.10;
  const BASE_H = 0.016;
  const FRAME_H = 0.32;
  const FRAME_R = 0.072;
  const BAR_T = 0.010;
  const CENTER_ROD_R = 0.0045;
  const ACCENT_R = 0.022;
  const ACCENT_H = 0.092;
  const NECK_R = 0.012;
  const NECK_H = 0.042;
  const SHADE_R = 0.17;
  const SHADE_H = 0.245;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.28,
    metalness: 0.85,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x8e7c9e,
    roughness: 0.45,
    metalness: 0.25,
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xebe3d3,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffdca8,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
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

  // 1. Base disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R * 1.02, BASE_H, 32),
    brassMat,
    'base_disc',
    0,
    BASE_H / 2,
    0
  );

  // 2. Central vertical rod
  const frameBottomY = BASE_H;
  const frameTopY = frameBottomY + FRAME_H;
  addMesh(
    new THREE.CylinderGeometry(CENTER_ROD_R, CENTER_ROD_R, FRAME_H, 16),
    brassMat,
    'center_rod',
    0,
    frameBottomY + FRAME_H / 2,
    0
  );

  // 3. Three-arm open geometric frame (120 degrees apart)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Bottom radial bar
    addMesh(
      new THREE.BoxGeometry(FRAME_R, BAR_T, BAR_T),
      brassMat,
      `frame_arm_bottom_${i}`,
      (FRAME_R / 2) * cos,
      frameBottomY + BAR_T / 2,
      (FRAME_R / 2) * sin,
      0,
      -angle,
      0
    );

    // Vertical outer bar
    addMesh(
      new THREE.BoxGeometry(BAR_T, FRAME_H, BAR_T),
      brassMat,
      `frame_arm_vertical_${i}`,
      (FRAME_R - BAR_T / 2) * cos,
      frameBottomY + FRAME_H / 2,
      (FRAME_R - BAR_T / 2) * sin,
      0,
      -angle,
      0
    );

    // Top radial bar
    addMesh(
      new THREE.BoxGeometry(FRAME_R, BAR_T, BAR_T),
      brassMat,
      `frame_arm_top_${i}`,
      (FRAME_R / 2) * cos,
      frameTopY - BAR_T / 2,
      (FRAME_R / 2) * sin,
      0,
      -angle,
      0
    );
  }

  // 4. Suspended lavender accent cylinder near top of frame
  const accentCenterY = frameTopY - BAR_T - 0.008 - ACCENT_H / 2;
  addMesh(
    new THREE.CylinderGeometry(ACCENT_R, ACCENT_R, ACCENT_H, 24),
    accentMat,
    'accent_cylinder',
    0,
    accentCenterY,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(ACCENT_R * 1.04, ACCENT_R * 1.04, 0.005, 24),
    brassMat,
    'accent_cap_top',
    0,
    accentCenterY + ACCENT_H / 2 + 0.0025,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(ACCENT_R * 0.65, ACCENT_R * 0.65, 0.004, 24),
    brassMat,
    'accent_cap_bottom',
    0,
    accentCenterY - ACCENT_H / 2 - 0.002,
    0
  );

  // 5. Neck stem & socket inside shade
  const neckBottomY = frameTopY;
  addMesh(
    new THREE.CylinderGeometry(NECK_R, NECK_R, NECK_H, 20),
    brassMat,
    'neck_stem',
    0,
    neckBottomY + NECK_H / 2,
    0
  );

  const socketY = neckBottomY + NECK_H + 0.015;
  addMesh(
    new THREE.CylinderGeometry(0.018, 0.015, 0.032, 20),
    brassMat,
    'socket_cup',
    0,
    socketY,
    0
  );

  // 6. Emissive bulb inside shade
  addMesh(
    new THREE.SphereGeometry(0.032, 20, 16),
    bulbMat,
    'emit_bulb',
    0,
    socketY + 0.038,
    0
  );

  // 7. Shade spider arms connecting socket to drum shade
  const shadeBottomY = TOTAL_H - SHADE_H;
  const spiderY = shadeBottomY + 0.02;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    addMesh(
      new THREE.BoxGeometry(SHADE_R, 0.003, 0.003),
      brassMat,
      `shade_spider_arm_${i}`,
      (SHADE_R / 2) * Math.cos(angle),
      spiderY,
      (SHADE_R / 2) * Math.sin(angle),
      0,
      -angle,
      0
    );
  }

  // 8. Drum lampshade
  addMesh(
    new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true),
    shadeMat,
    'shade_drum',
    0,
    shadeBottomY + SHADE_H / 2,
    0
  );

  addMesh(
    new THREE.TorusGeometry(SHADE_R, 0.0025, 8, 32),
    shadeMat,
    'shade_trim_top',
    0,
    TOTAL_H,
    0,
    Math.PI / 2,
    0,
    0
  );

  addMesh(
    new THREE.TorusGeometry(SHADE_R, 0.0025, 8, 32),
    shadeMat,
    'shade_trim_bottom',
    0,
    shadeBottomY,
    0,
    Math.PI / 2,
    0,
    0
  );

  return group;
}
