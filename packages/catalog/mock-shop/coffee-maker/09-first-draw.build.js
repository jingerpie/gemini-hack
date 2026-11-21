function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.23;
  const H = 0.295;
  const D = 0.27;
  const FOOT_H = 0.008;
  const TRAY_H = 0.036;
  const HEAD_H = 0.095;
  const TANK_D = 0.055;
  const BODY_D = D - TANK_D;
  const BACK_COL_D = 0.075;

  const Z_FRONT = D / 2;
  const Z_BACK = -D / 2;
  const Z_TANK_FRONT = Z_BACK + TANK_D;

  // Materials
  const matBody = new THREE.MeshStandardMaterial({
    color: 0x383b3f,
    roughness: 0.55,
    metalness: 0.15
  });
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.28,
    metalness: 0.85
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xe2e5e8,
    roughness: 0.12,
    metalness: 0.95
  });
  const matDarkRubber = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.8,
    metalness: 0.05
  });
  const matTank = new THREE.MeshPhysicalMaterial({
    color: 0xdce4ea,
    roughness: 0.1,
    metalness: 0.0,
    transparent: true,
    opacity: 0.35,
    clearcoat: 0.6
  });
  const matGaugeFace = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.4,
    metalness: 0.1
  });
  const matIndicator = new THREE.MeshStandardMaterial({
    color: 0x6c7278,
    roughness: 0.35,
    metalness: 0.4
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

  // 1. Feet
  const footGeo = new THREE.CylinderGeometry(0.012, 0.014, FOOT_H, 16);
  const footX = W / 2 - 0.025;
  const footZf = Z_FRONT - 0.025;
  const footZb = Z_BACK + 0.025;
  addMesh(footGeo, matDarkRubber, 'foot_fl', -footX, FOOT_H / 2, footZf);
  addMesh(footGeo, matDarkRubber, 'foot_fr', footX, FOOT_H / 2, footZf);
  addMesh(footGeo, matDarkRubber, 'foot_bl', -footX, FOOT_H / 2, footZb);
  addMesh(footGeo, matDarkRubber, 'foot_br', footX, FOOT_H / 2, footZb);

  // 2. Drip tray base
  const trayGeo = new THREE.BoxGeometry(W, TRAY_H, BODY_D);
  const trayY = FOOT_H + TRAY_H / 2;
  const bodyZ = Z_TANK_FRONT + BODY_D / 2;
  addMesh(trayGeo, matBody, 'drip_tray_base', 0, trayY, bodyZ);

  // 3. Drip tray stainless steel grate
  const grateH = 0.004;
  const grateGeo = new THREE.BoxGeometry(W - 0.024, grateH, BODY_D - BACK_COL_D - 0.016);
  const grateZ = Z_TANK_FRONT + BACK_COL_D + (BODY_D - BACK_COL_D) / 2;
  addMesh(grateGeo, matSteel, 'drip_tray_grate', 0, FOOT_H + TRAY_H + grateH / 2, grateZ);

  // 4. Lower body rear column
  const colH = H - FOOT_H - TRAY_H - HEAD_H;
  const colY = FOOT_H + TRAY_H + colH / 2;
  const colZ = Z_TANK_FRONT + BACK_COL_D / 2;
  const colGeo = new THREE.BoxGeometry(W, colH, BACK_COL_D);
  addMesh(colGeo, matBody, 'lower_body_back', 0, colY, colZ);

  // 5. Brew area stainless steel backplate
  const backplateGeo = new THREE.BoxGeometry(W - 0.02, colH + 0.004, 0.005);
  addMesh(backplateGeo, matSteel, 'brew_backplate', 0, colY, Z_TANK_FRONT + BACK_COL_D + 0.002);

  // 6. Upper head
  const headY = H - HEAD_H / 2;
  const headGeo = new THREE.BoxGeometry(W, HEAD_H, BODY_D);
  addMesh(headGeo, matBody, 'upper_head', 0, headY, bodyZ);

  // 7. Top cup warmer plate
  const warmerGeo = new THREE.BoxGeometry(W - 0.024, 0.004, BODY_D - 0.024);
  addMesh(warmerGeo, matBody, 'top_cup_warmer', 0, H + 0.001, bodyZ);

  // 8. Rear water tank
  const tankH = H - FOOT_H - 0.016;
  const tankGeo = new THREE.BoxGeometry(W - 0.008, tankH, TANK_D);
  addMesh(tankGeo, matTank, 'water_tank', 0, FOOT_H + tankH / 2, Z_BACK + TANK_D / 2);

  // 9. Water tank lid
  const tankLidH = 0.016;
  const tankLidGeo = new THREE.BoxGeometry(W - 0.004, tankLidH, TANK_D + 0.002);
  addMesh(tankLidGeo, matBody, 'water_tank_lid', 0, H - tankLidH / 2, Z_BACK + TANK_D / 2);

  // 10. Front stainless steel faceplate
  const faceW = W - 0.016;
  const faceH = HEAD_H - 0.014;
  const faceZ = Z_FRONT + 0.002;
  const faceGeo = new THREE.BoxGeometry(faceW, faceH, 0.004);
  addMesh(faceGeo, matSteel, 'front_faceplate', 0, headY, faceZ);

  // 11-13. Pressure gauge
  const gaugeZ = faceZ + 0.003;
  const bezelGeo = new THREE.TorusGeometry(0.021, 0.0035, 12, 28);
  addMesh(bezelGeo, matChrome, 'gauge_bezel', 0, headY, gaugeZ);

  const gaugeFaceGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.003, 24);
  addMesh(gaugeFaceGeo, matGaugeFace, 'gauge_face', 0, headY, gaugeZ - 0.001, Math.PI / 2, 0, 0);

  const needleGeo = new THREE.BoxGeometry(0.002, 0.013, 0.002);
  addMesh(needleGeo, matDarkRubber, 'gauge_needle', 0.002, headY + 0.002, gaugeZ + 0.001, 0, 0, -0.6);

  // 14-15. Toggle switches (left and right)
  const toggleX = 0.076;
  const toggleBaseGeo = new THREE.CylinderGeometry(0.006, 0.007, 0.005, 16);
  const toggleLeverGeo = new THREE.CylinderGeometry(0.002, 0.003, 0.016, 12);

  addMesh(toggleBaseGeo, matChrome, 'toggle_left_base', -toggleX, headY, gaugeZ, Math.PI / 2, 0, 0);
  addMesh(toggleLeverGeo, matChrome, 'toggle_left_lever', -toggleX, headY + 0.003, gaugeZ + 0.007, Math.PI / 3, 0, 0);

  addMesh(toggleBaseGeo, matChrome, 'toggle_right_base', toggleX, headY, gaugeZ, Math.PI / 2, 0, 0);
  addMesh(toggleLeverGeo, matChrome, 'toggle_right_lever', toggleX, headY + 0.003, gaugeZ + 0.007, Math.PI / 3, 0, 0);

  // 16. Indicator lights (4 small circles)
  const indGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 16);
  const indX = 0.042;
  const indY = 0.013;
  addMesh(indGeo, matIndicator, 'indicator_lt', -indX, headY + indY, gaugeZ - 0.001, Math.PI / 2, 0, 0);
  addMesh(indGeo, matIndicator, 'indicator_lb', -indX, headY - indY, gaugeZ - 0.001, Math.PI / 2, 0, 0);
  addMesh(indGeo, matIndicator, 'indicator_rt', indX, headY + indY, gaugeZ - 0.001, Math.PI / 2, 0, 0);
  addMesh(indGeo, matIndicator, 'indicator_rb', indX, headY - indY, gaugeZ - 0.001, Math.PI / 2, 0, 0);

  // 17. Group head
  const headBottomY = H - HEAD_H;
  const groupZ = Z_FRONT - 0.055;
  const groupH = 0.022;
  const groupGeo = new THREE.CylinderGeometry(0.034, 0.034, groupH, 24);
  addMesh(groupGeo, matSteel, 'group_head', 0, headBottomY - groupH / 2 + 0.002, groupZ);

  // 18. Portafilter basket holder
  const pfH = 0.024;
  const pfY = headBottomY - groupH - pfH / 2 + 0.004;
  const pfGeo = new THREE.CylinderGeometry(0.031, 0.026, pfH, 24);
  addMesh(pfGeo, matChrome, 'portafilter_basket', 0, pfY, groupZ);

  // 19. Portafilter double spout
  const spoutGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.018, 12);
  addMesh(spoutGeo, matChrome, 'portafilter_spout', 0, pfY - pfH / 2 - 0.007, groupZ);

  // 20. Portafilter handle (angled toward -X, +Z)
  const handleAngle = -0.35;
  const handleLen = 0.115;
  const handleGeo = new THREE.CylinderGeometry(0.011, 0.015, handleLen, 18);
  const hx = Math.sin(handleAngle) * (0.03 + handleLen / 2);
  const hz = groupZ + Math.cos(handleAngle) * (0.03 + handleLen / 2);
  addMesh(handleGeo, matBody, 'portafilter_handle', hx, pfY - 0.002, hz, Math.PI / 2, 0, -handleAngle);

  // 21-23. Steam wand
  const wandX = 0.068;
  const wandZ = Z_FRONT - 0.048;
  const wandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wandX, headBottomY + 0.004, wandZ),
    new THREE.Vector3(wandX, headBottomY - 0.028, wandZ + 0.005),
    new THREE.Vector3(wandX + 0.022, headBottomY - 0.045, wandZ + 0.015),
    new THREE.Vector3(wandX + 0.036, headBottomY - 0.105, wandZ + 0.025)
  ]);
  const wandGeo = new THREE.TubeGeometry(wandCurve, 20, 0.004, 12, false);
  addMesh(wandGeo, matChrome, 'steam_wand_tube', 0, 0, 0);

  // Steam wand rubber grip
  const gripGeo = new THREE.CylinderGeometry(0.007, 0.006, 0.026, 12);
  addMesh(gripGeo, matDarkRubber, 'steam_wand_grip', wandX + 0.022, headBottomY - 0.046, wandZ + 0.015, 0.25, 0, -0.35);

  // Steam wand tip
  const tipGeo = new THREE.CylinderGeometry(0.005, 0.0035, 0.014, 12);
  addMesh(tipGeo, matChrome, 'steam_wand_tip', wandX + 0.037, headBottomY - 0.11, wandZ + 0.026, 0.15, 0, -0.2);

  return group;
}
