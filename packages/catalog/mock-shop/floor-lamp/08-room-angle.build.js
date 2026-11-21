function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.20;
  const FOOT_H = 0.004;
  const FOOT_R = 0.012;
  const BASE_THICK = 0.008;
  const BASE_W = 0.26;
  const BASE_D = 0.24;
  const BASE_R = 0.022;

  const COLLAR_H = 0.006;
  const CAP_H = 0.008;
  const COL_W = 0.044;
  const COL_D = 0.036;
  const COL_Z = -0.02;
  const COL_BOTTOM_Y = FOOT_H + BASE_THICK + COLLAR_H;
  const COL_H = H - COL_BOTTOM_Y - CAP_H;

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xb8bdc2,
    roughness: 0.35,
    metalness: 0.85,
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.85,
    metalness: 0.05,
  });

  const diffuserMat = new THREE.MeshPhysicalMaterial({
    color: 0x5234e8,
    emissive: 0x3b1ed4,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
  });

  // 1. Rounded triangular base plate
  const halfW = BASE_W / 2 - BASE_R;
  const frontZ = BASE_D / 2 - BASE_R;
  const backZ = -BASE_D / 2 + BASE_R;

  const baseShape = new THREE.Shape();
  baseShape.moveTo(-halfW, frontZ);
  baseShape.lineTo(halfW, frontZ);
  baseShape.quadraticCurveTo(halfW + BASE_R, frontZ, halfW + BASE_R * 0.5, frontZ - BASE_R);
  baseShape.lineTo(BASE_R * 0.7, backZ + BASE_R * 0.5);
  baseShape.quadraticCurveTo(0, backZ - BASE_R * 0.5, -BASE_R * 0.7, backZ + BASE_R * 0.5);
  baseShape.lineTo(-halfW - BASE_R * 0.5, frontZ - BASE_R);
  baseShape.quadraticCurveTo(-halfW - BASE_R, frontZ, -halfW, frontZ);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 12,
  });
  baseGeo.rotateX(Math.PI / 2);

  const basePlate = new THREE.Mesh(baseGeo, aluminumMat);
  basePlate.name = 'base_plate';
  basePlate.position.y = FOOT_H + BASE_THICK;
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  group.add(basePlate);

  // 2. Three rubber feet under the base
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 1.05, FOOT_H, 16);
  const footPositions = [
    [-halfW * 0.75, frontZ * 0.75, 'foot_front_left'],
    [halfW * 0.75, frontZ * 0.75, 'foot_front_right'],
    [0, backZ * 0.72, 'foot_back'],
  ];

  for (const [fx, fz, fname] of footPositions) {
    const foot = new THREE.Mesh(footGeo, darkRubberMat);
    foot.name = fname;
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  // 3. Base collar where column meets base
  const collarGeo = new THREE.CylinderGeometry(COL_W * 0.54, COL_W * 0.58, COLLAR_H, 24);
  const baseCollar = new THREE.Mesh(collarGeo, aluminumMat);
  baseCollar.name = 'base_collar';
  baseCollar.position.set(0, FOOT_H + BASE_THICK + COLLAR_H / 2, COL_Z);
  baseCollar.castShadow = true;
  baseCollar.receiveShadow = true;
  group.add(baseCollar);

  // 4. Vertical aluminum back spine
  const spineGeo = new THREE.BoxGeometry(COL_W * 0.85, COL_H, COL_D * 0.45);
  const columnSpine = new THREE.Mesh(spineGeo, aluminumMat);
  columnSpine.name = 'column_back_channel';
  columnSpine.position.set(0, COL_BOTTOM_Y + COL_H / 2, COL_Z - COL_D * 0.25);
  columnSpine.castShadow = true;
  columnSpine.receiveShadow = true;
  group.add(columnSpine);

  // 5. Left and right aluminum side flanges
  const flangeGeo = new THREE.BoxGeometry(0.005, COL_H, COL_D * 0.55);
  const leftFlange = new THREE.Mesh(flangeGeo, aluminumMat);
  leftFlange.name = 'column_side_left';
  leftFlange.position.set(-COL_W * 0.42, COL_BOTTOM_Y + COL_H / 2, COL_Z - COL_D * 0.05);
  leftFlange.castShadow = true;
  leftFlange.receiveShadow = true;
  group.add(leftFlange);

  const rightFlange = new THREE.Mesh(flangeGeo, aluminumMat);
  rightFlange.name = 'column_side_right';
  rightFlange.position.set(COL_W * 0.42, COL_BOTTOM_Y + COL_H / 2, COL_Z - COL_D * 0.05);
  rightFlange.castShadow = true;
  rightFlange.receiveShadow = true;
  group.add(rightFlange);

  // 6. Front glowing LED diffuser (semi-cylindrical)
  const diffuserGeo = new THREE.CylinderGeometry(
    COL_W * 0.44,
    COL_W * 0.44,
    COL_H,
    24,
    1,
    false,
    -Math.PI / 2,
    Math.PI
  );
  const ledDiffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
  ledDiffuser.name = 'led_diffuser';
  ledDiffuser.position.set(0, COL_BOTTOM_Y + COL_H / 2, COL_Z + COL_D * 0.05);
  ledDiffuser.castShadow = true;
  ledDiffuser.receiveShadow = true;
  group.add(ledDiffuser);

  // 7. Top cap bevel ring
  const topBevelGeo = new THREE.CylinderGeometry(COL_W * 0.52, COL_W * 0.52, CAP_H * 0.35, 24);
  const topBevel = new THREE.Mesh(topBevelGeo, aluminumMat);
  topBevel.name = 'top_cap_bevel';
  topBevel.position.set(0, H - CAP_H + (CAP_H * 0.35) / 2, COL_Z);
  topBevel.castShadow = true;
  topBevel.receiveShadow = true;
  group.add(topBevel);

  // 8. Top cap
  const topCapGeo = new THREE.CylinderGeometry(COL_W * 0.54, COL_W * 0.54, CAP_H * 0.65, 24);
  const topCap = new THREE.Mesh(topCapGeo, aluminumMat);
  topCap.name = 'top_cap';
  topCap.position.set(0, H - (CAP_H * 0.65) / 2, COL_Z);
  topCap.castShadow = true;
  topCap.receiveShadow = true;
  group.add(topCap);

  // 9. Cord strain relief at the back of the base
  const grommetGeo = new THREE.CylinderGeometry(0.005, 0.006, 0.014, 12);
  grommetGeo.rotateX(Math.PI / 2);
  const cordStrainRelief = new THREE.Mesh(grommetGeo, darkRubberMat);
  cordStrainRelief.name = 'cord_strain_relief';
  cordStrainRelief.position.set(0, FOOT_H + BASE_THICK + 0.008, COL_Z - COL_D * 0.5);
  cordStrainRelief.castShadow = true;
  cordStrainRelief.receiveShadow = true;
  group.add(cordStrainRelief);

  // 10. Power cord resting on the floor
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, FOOT_H + BASE_THICK + 0.008, COL_Z - COL_D * 0.5 - 0.005),
    new THREE.Vector3(-0.02, 0.006, COL_Z - 0.07),
    new THREE.Vector3(-0.08, 0.003, COL_Z - 0.09),
    new THREE.Vector3(-0.11, 0.003, COL_Z - 0.04),
    new THREE.Vector3(-0.07, 0.003, COL_Z + 0.01),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, 0.0028, 8, false);
  const powerCord = new THREE.Mesh(cordGeo, darkRubberMat);
  powerCord.name = 'power_cord';
  powerCord.castShadow = true;
  powerCord.receiveShadow = true;
  group.add(powerCord);

  // 11. Inline switch on the power cord
  const switchGeo = new THREE.BoxGeometry(0.016, 0.008, 0.032);
  const inlineSwitch = new THREE.Mesh(switchGeo, darkRubberMat);
  inlineSwitch.name = 'inline_switch';
  inlineSwitch.position.set(-0.08, 0.004, COL_Z - 0.09);
  inlineSwitch.rotation.y = 0.5;
  inlineSwitch.castShadow = true;
  inlineSwitch.receiveShadow = true;
  group.add(inlineSwitch);

  // 12. Switch button
  const buttonGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12);
  const switchButton = new THREE.Mesh(buttonGeo, aluminumMat);
  switchButton.name = 'switch_button';
  switchButton.position.set(-0.08, 0.009, COL_Z - 0.09);
  switchButton.castShadow = true;
  switchButton.receiveShadow = true;
  group.add(switchButton);

  return group;
}
