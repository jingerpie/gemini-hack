function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.78;
  const BASE_R = 0.14;
  const BASE_H = 0.026;
  const PAD_H = 0.004;
  const POLE_R = 0.014;
  const SHADE_TOP_R = 0.165;
  const SHADE_BOT_R = 0.028;
  const SHADE_H = 0.105;
  const SHADE_Y = H - SHADE_H;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.55,
    metalness: 0.08
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c3,
    roughness: 0.45,
    metalness: 0.12
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x262422,
    roughness: 0.9,
    metalness: 0.0
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xc8bba6,
    roughness: 0.7,
    metalness: 0.02
  });

  const switchMat = new THREE.MeshStandardMaterial({
    color: 0xded7cb,
    roughness: 0.5,
    metalness: 0.05
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.6,
    roughness: 0.3,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base pad
  const padGeo = new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32);
  addMesh(padGeo, padMat, 'base_pad', 0, PAD_H / 2, 0);

  // 2. Base disc (LatheGeometry with slightly rounded top edge)
  const basePts = [
    new THREE.Vector2(0, PAD_H),
    new THREE.Vector2(BASE_R, PAD_H),
    new THREE.Vector2(BASE_R, PAD_H + BASE_H * 0.65),
    new THREE.Vector2(BASE_R - 0.008, PAD_H + BASE_H),
    new THREE.Vector2(POLE_R + 0.006, PAD_H + BASE_H),
    new THREE.Vector2(0, PAD_H + BASE_H)
  ];
  const baseGeo = new THREE.LatheGeometry(basePts, 32);
  addMesh(baseGeo, creamMat, 'base_disc');

  // 3. Base-to-pole collar
  const baseCollarH = 0.012;
  const baseCollarGeo = new THREE.CylinderGeometry(POLE_R + 0.004, POLE_R + 0.007, baseCollarH, 24);
  addMesh(baseCollarGeo, collarMat, 'base_collar', 0, PAD_H + BASE_H + baseCollarH / 2, 0);

  // 4-8. Pole segments and joint collars
  const poleStartY = PAD_H + BASE_H + baseCollarH;
  const poleEndY = SHADE_Y;
  const totalPoleH = poleEndY - poleStartY;
  const segH = totalPoleH / 3;
  const jointH = 0.007;

  const seg1Geo = new THREE.CylinderGeometry(POLE_R, POLE_R, segH, 24);
  addMesh(seg1Geo, creamMat, 'pole_lower', 0, poleStartY + segH / 2, 0);

  const joint1Geo = new THREE.CylinderGeometry(POLE_R + 0.0025, POLE_R + 0.0025, jointH, 24);
  addMesh(joint1Geo, collarMat, 'joint_collar_1', 0, poleStartY + segH, 0);

  const seg2Geo = new THREE.CylinderGeometry(POLE_R, POLE_R, segH, 24);
  addMesh(seg2Geo, creamMat, 'pole_middle', 0, poleStartY + segH * 1.5, 0);

  const joint2Geo = new THREE.CylinderGeometry(POLE_R + 0.0025, POLE_R + 0.0025, jointH, 24);
  addMesh(joint2Geo, collarMat, 'joint_collar_2', 0, poleStartY + segH * 2, 0);

  const seg3Geo = new THREE.CylinderGeometry(POLE_R, POLE_R, segH, 24);
  addMesh(seg3Geo, creamMat, 'pole_upper', 0, poleStartY + segH * 2.5, 0);

  // 9. Under-shade glowing diffuser ring
  const underGlowH = 0.01;
  const underGlowGeo = new THREE.CylinderGeometry(SHADE_BOT_R - 0.002, POLE_R + 0.005, underGlowH, 24);
  addMesh(underGlowGeo, glowMat, 'under_shade_diffuser', 0, SHADE_Y - underGlowH / 2 + 0.004, 0);

  // 10. Shade bowl (LatheGeometry with outer & inner wall)
  const wallT = 0.005;
  const shadePts = [
    new THREE.Vector2(POLE_R, SHADE_Y),
    new THREE.Vector2(SHADE_BOT_R, SHADE_Y),
    new THREE.Vector2(SHADE_BOT_R + 0.045, SHADE_Y + SHADE_H * 0.22),
    new THREE.Vector2(SHADE_BOT_R + 0.105, SHADE_Y + SHADE_H * 0.58),
    new THREE.Vector2(SHADE_TOP_R, SHADE_Y + SHADE_H),
    new THREE.Vector2(SHADE_TOP_R - wallT, SHADE_Y + SHADE_H),
    new THREE.Vector2(SHADE_BOT_R + 0.105 - wallT, SHADE_Y + SHADE_H * 0.58),
    new THREE.Vector2(SHADE_BOT_R + 0.045 - wallT, SHADE_Y + SHADE_H * 0.22 + wallT),
    new THREE.Vector2(SHADE_BOT_R - wallT, SHADE_Y + wallT + 0.004),
    new THREE.Vector2(0, SHADE_Y + wallT + 0.004)
  ];
  const shadeGeo = new THREE.LatheGeometry(shadePts, 32);
  addMesh(shadeGeo, creamMat, 'shade_bowl');

  // 11. Inner bulb / diffuser dome
  const bulbGeo = new THREE.SphereGeometry(0.036, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  addMesh(bulbGeo, glowMat, 'inner_bulb_diffuser', 0, SHADE_Y + 0.012, 0);

  // 12. Cord grommet at bottom of pole
  const grommetY = PAD_H + BASE_H + 0.022;
  const grommetGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.016, 12);
  grommetGeo.rotateZ(Math.PI / 2);
  addMesh(grommetGeo, collarMat, 'cord_grommet', POLE_R + 0.005, grommetY, 0);

  // 13. Power cord from grommet to foot switch
  const switchX = 0.24;
  const switchZ = 0.14;
  const cordR = 0.0035;
  const cordCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(POLE_R + 0.01, grommetY, 0),
    new THREE.Vector3(0.11, PAD_H + 0.018, -0.02),
    new THREE.Vector3(0.26, cordR, 0.02),
    new THREE.Vector3(0.32, cordR, 0.09),
    new THREE.Vector3(switchX, cordR + 0.006, switchZ)
  ]);
  const cordGeo1 = new THREE.TubeGeometry(cordCurve1, 24, cordR, 8, false);
  addMesh(cordGeo1, cordMat, 'power_cord_1');

  // 14. Foot switch body
  const switchW = 0.072;
  const switchH = 0.022;
  const switchD = 0.038;
  const switchGeo = new THREE.BoxGeometry(switchW, switchH, switchD);
  const switchMesh = addMesh(switchGeo, switchMat, 'foot_switch_body', switchX, switchH / 2, switchZ);
  switchMesh.rotation.y = -0.35;

  // 15. Foot switch button
  const btnGeo = new THREE.CylinderGeometry(0.009, 0.011, 0.008, 16);
  addMesh(btnGeo, creamMat, 'foot_switch_button', switchX, switchH + 0.003, switchZ);

  // 16. Power cord trailing from foot switch
  const cordCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(switchX + 0.03, cordR + 0.006, switchZ + 0.01),
    new THREE.Vector3(0.38, cordR, 0.20),
    new THREE.Vector3(0.55, cordR, 0.16),
    new THREE.Vector3(0.75, cordR, 0.12)
  ]);
  const cordGeo2 = new THREE.TubeGeometry(cordCurve2, 20, cordR, 8, false);
  addMesh(cordGeo2, cordMat, 'power_cord_2');

  return group;
}
