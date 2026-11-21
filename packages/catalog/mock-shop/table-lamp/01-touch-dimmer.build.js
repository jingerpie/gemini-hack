function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.34;
  const BASE_R = 0.085;
  const BASE_H = 0.026;
  const PAD_H = 0.002;
  const STEM_R = 0.0085;
  const SHADE_R = 0.115;
  const SHADE_H = 0.085;
  const SHADE_Y = H - SHADE_H;

  // Materials
  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x6f7b82,
    roughness: 0.45,
    metalness: 0.25
  });

  const darkPadMat = new THREE.MeshStandardMaterial({
    color: 0x222528,
    roughness: 0.85,
    metalness: 0.05
  });

  const touchRingMat = new THREE.MeshStandardMaterial({
    color: 0xd8dfe3,
    roughness: 0.35,
    metalness: 0.1
  });

  const innerShadeMat = new THREE.MeshStandardMaterial({
    color: 0x555e63,
    roughness: 0.55,
    metalness: 0.2,
    side: THREE.BackSide
  });

  const emitDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xf4f6f8,
    emissive: 0xfff3e0,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d20,
    roughness: 0.6,
    metalness: 0.5
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

  // 1. Non-slip base pad (touches y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.002, BASE_R - 0.002, PAD_H, 32),
    darkPadMat,
    'base_pad',
    0,
    PAD_H / 2,
    0
  );

  // 2. Main cylindrical base
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H - PAD_H, 32),
    slateMat,
    'base_body',
    0,
    PAD_H + (BASE_H - PAD_H) / 2,
    0
  );

  // 3. Subtle top bevel on base
  addMesh(
    new THREE.TorusGeometry(BASE_R - 0.002, 0.002, 12, 32),
    slateMat,
    'base_top_bevel',
    0,
    BASE_H - 0.001,
    0,
    Math.PI / 2,
    0,
    0
  );

  // 4. Touch dimmer ring on front (+Z) of base
  const touchZ = BASE_R * 0.56;
  addMesh(
    new THREE.TorusGeometry(0.011, 0.0012, 10, 28),
    touchRingMat,
    'touch_dimmer_ring',
    0,
    BASE_H + 0.0005,
    touchZ,
    Math.PI / 2,
    0,
    0
  );

  // 5. Touch dimmer center pad
  addMesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.0006, 24),
    slateMat,
    'touch_dimmer_center',
    0,
    BASE_H + 0.0003,
    touchZ
  );

  // 6. USB-C port housing on back (-Z) of base
  addMesh(
    new THREE.BoxGeometry(0.014, 0.006, 0.004),
    portMat,
    'usb_port_housing',
    0,
    PAD_H + (BASE_H - PAD_H) * 0.45,
    -BASE_R + 0.001
  );

  // 7. Bottom stem collar
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.25, STEM_R * 1.4, 0.004, 24),
    slateMat,
    'stem_collar_bottom',
    0,
    BASE_H + 0.002,
    0
  );

  // 8. Vertical stem
  const stemTopY = SHADE_Y + 0.015;
  const stemH = stemTopY - BASE_H;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, stemH, 24),
    slateMat,
    'stem_pole',
    0,
    BASE_H + stemH / 2,
    0
  );

  // 9. Top stem collar under diffuser
  addMesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.005, 24),
    slateMat,
    'stem_collar_top',
    0,
    SHADE_Y + 0.003,
    0
  );

  // 10. Glowing diffuser plate
  addMesh(
    new THREE.CylinderGeometry(SHADE_R - 0.006, SHADE_R - 0.006, 0.004, 32),
    emitDiffuserMat,
    'emit_diffuser',
    0,
    SHADE_Y + 0.007,
    0
  );

  // 11. Inner glowing bulb core above diffuser
  addMesh(
    new THREE.SphereGeometry(0.025, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    emitDiffuserMat,
    'emit_bulb_core',
    0,
    SHADE_Y + 0.009,
    0
  );

  // 12. Dome shade outer shell
  const domeGeo = new THREE.SphereGeometry(SHADE_R, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.scale(1, SHADE_H / SHADE_R, 1);
  addMesh(
    domeGeo,
    slateMat,
    'shade_dome',
    0,
    SHADE_Y,
    0
  );

  // 13. Dome shade inner shell
  const innerDomeGeo = new THREE.SphereGeometry(SHADE_R - 0.003, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  innerDomeGeo.scale(1, (SHADE_H - 0.003) / (SHADE_R - 0.003), 1);
  addMesh(
    innerDomeGeo,
    innerShadeMat,
    'shade_inner',
    0,
    SHADE_Y,
    0
  );

  // 14. Shade bottom rim
  addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.0015, 0.0025, 12, 32),
    slateMat,
    'shade_rim',
    0,
    SHADE_Y,
    0,
    Math.PI / 2,
    0,
    0
  );

  return group;
}
