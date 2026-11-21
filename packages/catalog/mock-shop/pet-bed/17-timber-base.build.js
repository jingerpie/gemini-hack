function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.95; // overall width along X
  const D = 0.70; // overall depth along Z
  const H = 0.24; // overall height of top rail
  const LEG_R = 0.016; // radius of legs and top rail
  const BASE_Y = 0.065; // center height of lower frame rails
  const RAIL_H = 0.032; // height of lower frame rails
  const RAIL_T = 0.024; // thickness of lower frame rails
  const SLAT_W = 0.036;
  const SLAT_H = 0.014;
  const SLAT_COUNT = 11;
  const CUSHION_W = W - LEG_R * 4 - 0.025;
  const CUSHION_D = D - LEG_R * 4 - 0.025;
  const CUSHION_H = 0.125;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a47c,
    roughness: 0.65,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9c8972,
    roughness: 0.92,
    metalness: 0.0,
  });

  const tuftMat = new THREE.MeshStandardMaterial({
    color: 0x877560,
    roughness: 0.95,
    metalness: 0.0,
  });

  const halfX = W / 2 - LEG_R;
  const halfZ = D / 2 - LEG_R;
  const topY = H - LEG_R;
  const bend = 0.045;

  // 1. Continuous U-shaped top rail + front legs
  const railPoints = [
    new THREE.Vector3(-halfX, LEG_R * 0.5, halfZ),
    new THREE.Vector3(-halfX, topY - bend, halfZ),
    new THREE.Vector3(-halfX, topY, halfZ - bend),
    new THREE.Vector3(-halfX, topY, -halfZ + bend),
    new THREE.Vector3(-halfX + bend, topY, -halfZ),
    new THREE.Vector3(halfX - bend, topY, -halfZ),
    new THREE.Vector3(halfX, topY, -halfZ + bend),
    new THREE.Vector3(halfX, topY, halfZ - bend),
    new THREE.Vector3(halfX, topY - bend, halfZ),
    new THREE.Vector3(halfX, LEG_R * 0.5, halfZ),
  ];
  const railCurve = new THREE.CatmullRomCurve3(railPoints, false, 'catmullrom', 0.25);
  const railGeo = new THREE.TubeGeometry(railCurve, 64, LEG_R, 16, false);
  const railMesh = new THREE.Mesh(railGeo, woodMat);
  railMesh.name = 'top_rail_and_front_legs';
  railMesh.castShadow = true;
  railMesh.receiveShadow = true;
  group.add(railMesh);

  // Rounded caps at bottom of front legs
  const capGeo = new THREE.SphereGeometry(LEG_R, 16, 12);
  const flCap = new THREE.Mesh(capGeo, woodMat);
  flCap.name = 'front_left_leg_foot';
  flCap.position.set(-halfX, LEG_R, halfZ);
  flCap.castShadow = true;
  flCap.receiveShadow = true;
  group.add(flCap);

  const frCap = new THREE.Mesh(capGeo, woodMat);
  frCap.name = 'front_right_leg_foot';
  frCap.position.set(halfX, LEG_R, halfZ);
  frCap.castShadow = true;
  frCap.receiveShadow = true;
  group.add(frCap);

  // 2. Back legs
  const backLegH = topY;
  const backLegGeo = new THREE.CylinderGeometry(LEG_R, LEG_R, backLegH, 16);
  const backLeftLeg = new THREE.Mesh(backLegGeo, woodMat);
  backLeftLeg.name = 'back_left_leg';
  backLeftLeg.position.set(-halfX, backLegH / 2, -halfZ);
  backLeftLeg.castShadow = true;
  backLeftLeg.receiveShadow = true;
  group.add(backLeftLeg);

  const backRightLeg = new THREE.Mesh(backLegGeo, woodMat);
  backRightLeg.name = 'back_right_leg';
  backRightLeg.position.set(halfX, backLegH / 2, -halfZ);
  backRightLeg.castShadow = true;
  backRightLeg.receiveShadow = true;
  group.add(backRightLeg);

  // 3. Lower frame rails
  const fbRailGeo = new THREE.BoxGeometry(W - LEG_R * 2, RAIL_H, RAIL_T);
  const frontRail = new THREE.Mesh(fbRailGeo, woodMat);
  frontRail.name = 'lower_front_rail';
  frontRail.position.set(0, BASE_Y, halfZ);
  frontRail.castShadow = true;
  frontRail.receiveShadow = true;
  group.add(frontRail);

  const backRail = new THREE.Mesh(fbRailGeo, woodMat);
  backRail.name = 'lower_back_rail';
  backRail.position.set(0, BASE_Y, -halfZ);
  backRail.castShadow = true;
  backRail.receiveShadow = true;
  group.add(backRail);

  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, D - LEG_R * 2);
  const leftRail = new THREE.Mesh(sideRailGeo, woodMat);
  leftRail.name = 'lower_left_rail';
  leftRail.position.set(-halfX, BASE_Y, 0);
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;
  group.add(leftRail);

  const rightRail = new THREE.Mesh(sideRailGeo, woodMat);
  rightRail.name = 'lower_right_rail';
  rightRail.position.set(halfX, BASE_Y, 0);
  rightRail.castShadow = true;
  rightRail.receiveShadow = true;
  group.add(rightRail);

  // 4. Slats running front-to-back
  const slatLen = D - LEG_R * 2 - RAIL_T;
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, slatLen);
  const slatY = BASE_Y + RAIL_H / 2 - SLAT_H / 2 + 0.002;
  const slatSpan = W - LEG_R * 2 - RAIL_T * 2 - SLAT_W;
  for (let i = 0; i < SLAT_COUNT; i++) {
    const t = i / (SLAT_COUNT - 1) - 0.5;
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.name = `platform_slat_${i + 1}`;
    slat.position.set(t * slatSpan, slatY, 0);
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }

  // 5. Cushion (rounded extruded box with bevels)
  const cw = CUSHION_W - 0.04;
  const cd = CUSHION_D - 0.04;
  const cr = 0.045;
  const cushionShape = new THREE.Shape();
  cushionShape.moveTo(-cw / 2 + cr, -cd / 2);
  cushionShape.lineTo(cw / 2 - cr, -cd / 2);
  cushionShape.quadraticCurveTo(cw / 2, -cd / 2, cw / 2, -cd / 2 + cr);
  cushionShape.lineTo(cw / 2, cd / 2 - cr);
  cushionShape.quadraticCurveTo(cw / 2, cd / 2, cw / 2 - cr, cd / 2);
  cushionShape.lineTo(-cw / 2 + cr, cd / 2);
  cushionShape.quadraticCurveTo(-cw / 2, cd / 2, -cw / 2, cd / 2 - cr);
  cushionShape.lineTo(-cw / 2, -cd / 2 + cr);
  cushionShape.quadraticCurveTo(-cw / 2, -cd / 2, -cw / 2 + cr, -cd / 2);

  const bevelSize = 0.022;
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - bevelSize * 2,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  });
  cushionGeo.rotateX(-Math.PI / 2);

  const cushionBaseY = slatY + SLAT_H / 2 + bevelSize;
  const cushionMesh = new THREE.Mesh(cushionGeo, fabricMat);
  cushionMesh.name = 'dog_bed_cushion';
  cushionMesh.position.set(0, cushionBaseY, 0);
  cushionMesh.castShadow = true;
  cushionMesh.receiveShadow = true;
  group.add(cushionMesh);

  // 6. Cushion tufts (3x2 grid)
  const tuftGeo = new THREE.SphereGeometry(0.016, 12, 8);
  tuftGeo.scale(1, 0.4, 1);
  const tuftY = slatY + SLAT_H / 2 + CUSHION_H - 0.004;
  const tuftXPositions = [-CUSHION_W * 0.26, 0, CUSHION_W * 0.26];
  const tuftZPositions = [-CUSHION_D * 0.2, CUSHION_D * 0.2];

  let tuftIdx = 1;
  for (let ix = 0; ix < tuftXPositions.length; ix++) {
    for (let iz = 0; iz < tuftZPositions.length; iz++) {
      const tuft = new THREE.Mesh(tuftGeo, tuftMat);
      tuft.name = `cushion_tuft_${tuftIdx++}`;
      tuft.position.set(tuftXPositions[ix], tuftY, tuftZPositions[iz]);
      tuft.castShadow = true;
      tuft.receiveShadow = true;
      group.add(tuft);
    }
  }

  return group;
}
