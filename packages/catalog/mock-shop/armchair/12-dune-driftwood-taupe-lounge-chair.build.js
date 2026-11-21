function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.68;
  const H = 0.78;
  const D = 0.76;
  const SEAT_H_FRONT = 0.36;
  const SEAT_H_BACK = 0.29;
  const TOP_W = 0.54; // Backrest tapers narrower at top

  const HALF_W = W / 2;
  const HALF_D = D / 2;
  const FRONT_Z = HALF_D - 0.06;
  const BACK_Z = -HALF_D + 0.14;
  const BACK_TOP_Z = -HALF_D + 0.02;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8a389,
    roughness: 0.72,
    metalness: 0.02,
  });

  const weaveMat = new THREE.MeshStandardMaterial({
    color: 0x948c80,
    roughness: 0.88,
    metalness: 0.0,
  });

  const weaveDarkMat = new THREE.MeshStandardMaterial({
    color: 0x766e63,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create a tapered leg/post between two 3D points
  function createStrut(p1, p2, rBottom, rTop, mat, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(rTop, rBottom, len, 10);
    const mesh = addMesh(geo, mat, name);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.scale.set(1, 1, 0.85);
    return mesh;
  }

  // 1. Front Legs
  const flBottom = new THREE.Vector3(-HALF_W + 0.03, 0, FRONT_Z);
  const flTop = new THREE.Vector3(-HALF_W + 0.025, SEAT_H_FRONT - 0.02, FRONT_Z - 0.01);
  createStrut(flBottom, flTop, 0.021, 0.024, woodMat, 'front_left_leg');

  const frBottom = new THREE.Vector3(HALF_W - 0.03, 0, FRONT_Z);
  const frTop = new THREE.Vector3(HALF_W - 0.025, SEAT_H_FRONT - 0.02, FRONT_Z - 0.01);
  createStrut(frBottom, frTop, 0.021, 0.024, woodMat, 'front_right_leg');

  // 2. Back Legs
  const blBottom = new THREE.Vector3(-HALF_W + 0.06, 0, BACK_Z - 0.04);
  const blTop = new THREE.Vector3(-HALF_W + 0.045, SEAT_H_BACK + 0.01, BACK_Z + 0.04);
  createStrut(blBottom, blTop, 0.02, 0.023, woodMat, 'back_left_leg');

  const brBottom = new THREE.Vector3(HALF_W - 0.06, 0, BACK_Z - 0.04);
  const brTop = new THREE.Vector3(HALF_W - 0.045, SEAT_H_BACK + 0.01, BACK_Z + 0.04);
  createStrut(brBottom, brTop, 0.02, 0.023, woodMat, 'back_right_leg');

  // 3. Front Arched Rail (clearly below the seat cushion)
  const frontRailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-HALF_W + 0.03, SEAT_H_FRONT - 0.075, FRONT_Z - 0.01),
    new THREE.Vector3(0, SEAT_H_FRONT - 0.055, FRONT_Z - 0.01),
    new THREE.Vector3(HALF_W - 0.03, SEAT_H_FRONT - 0.075, FRONT_Z - 0.01),
  ]);
  const frontRailGeo = new THREE.TubeGeometry(frontRailCurve, 16, 0.02, 8, false);
  const frontRail = addMesh(frontRailGeo, woodMat, 'front_rail');
  frontRail.scale.set(1, 1.2, 0.85);

  // 4. Side Rails
  createStrut(
    new THREE.Vector3(-HALF_W + 0.028, SEAT_H_FRONT - 0.045, FRONT_Z - 0.01),
    new THREE.Vector3(-HALF_W + 0.045, SEAT_H_BACK - 0.01, BACK_Z + 0.04),
    0.02,
    0.02,
    woodMat,
    'left_side_rail'
  );
  createStrut(
    new THREE.Vector3(HALF_W - 0.028, SEAT_H_FRONT - 0.045, FRONT_Z - 0.01),
    new THREE.Vector3(HALF_W - 0.045, SEAT_H_BACK - 0.01, BACK_Z + 0.04),
    0.02,
    0.02,
    woodMat,
    'right_side_rail'
  );

  // 5. Backrest Stiles (tapering inward toward the top)
  const leftStileBottom = new THREE.Vector3(-HALF_W + 0.05, SEAT_H_BACK, BACK_Z + 0.03);
  const leftStileTop = new THREE.Vector3(-TOP_W / 2, H, BACK_TOP_Z);
  createStrut(leftStileBottom, leftStileTop, 0.022, 0.018, woodMat, 'left_back_stile');

  const rightStileBottom = new THREE.Vector3(HALF_W - 0.05, SEAT_H_BACK, BACK_Z + 0.03);
  const rightStileTop = new THREE.Vector3(TOP_W / 2, H, BACK_TOP_Z);
  createStrut(rightStileBottom, rightStileTop, 0.022, 0.018, woodMat, 'right_back_stile');

  // 6. Backrest Top & Bottom Rails (framing the woven panel)
  createStrut(
    new THREE.Vector3(-TOP_W / 2 + 0.01, H - 0.015, BACK_TOP_Z),
    new THREE.Vector3(TOP_W / 2 - 0.01, H - 0.015, BACK_TOP_Z),
    0.016,
    0.016,
    woodMat,
    'backrest_top_rail'
  );

  createStrut(
    new THREE.Vector3(-HALF_W + 0.05, SEAT_H_BACK + 0.025, BACK_Z + 0.03),
    new THREE.Vector3(HALF_W - 0.05, SEAT_H_BACK + 0.025, BACK_Z + 0.03),
    0.016,
    0.016,
    woodMat,
    'backrest_bottom_rail'
  );

  // 7. Deep Seat Cushion (plump, slightly contoured profile resting on the rails)
  const seatShape = new THREE.Shape();
  const seatLen = FRONT_Z - BACK_Z;
  seatShape.moveTo(0, 0.01);
  seatShape.quadraticCurveTo(seatLen * 0.5, -0.015, seatLen, 0.045);
  seatShape.lineTo(seatLen, 0.105);
  seatShape.quadraticCurveTo(seatLen * 0.5, 0.045, 0, 0.075);
  seatShape.closePath();

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: W - 0.07,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 12,
  });
  seatGeo.rotateY(-Math.PI / 2);
  const seatMesh = addMesh(seatGeo, weaveMat, 'seat_cushion');
  seatMesh.position.set((W - 0.07) / 2, SEAT_H_BACK - 0.015, BACK_Z + 0.015);

  // 8. Woven Backrest Panel (framed between stiles)
  const backMidBottom = new THREE.Vector3()
    .addVectors(leftStileBottom, rightStileBottom)
    .multiplyScalar(0.5);
  const backMidTop = new THREE.Vector3()
    .addVectors(leftStileTop, rightStileTop)
    .multiplyScalar(0.5);
  const backDir = new THREE.Vector3().subVectors(backMidTop, backMidBottom).normalize();
  const backHeight = new THREE.Vector3().subVectors(backMidTop, backMidBottom).length() - 0.055;
  const backWBottom = W - 0.115;
  const backWTop = TOP_W - 0.04;

  const backShape = new THREE.Shape();
  backShape.moveTo(-backWBottom / 2, 0);
  backShape.lineTo(backWBottom / 2, 0);
  backShape.lineTo(backWTop / 2, backHeight);
  backShape.lineTo(-backWTop / 2, backHeight);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });

  const backMesh = addMesh(backGeo, weaveDarkMat, 'woven_backrest_base');
  backMesh.position.copy(backMidBottom).addScaledVector(backDir, 0.032);
  backMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), backDir);
  backMesh.translateZ(-0.009);

  // 9. Backrest Basket-Weave Horizontal Strips (8 bands)
  const numH = 8;
  for (let i = 0; i < numH; i++) {
    const t = (i + 0.5) / numH;
    const stripW = THREE.MathUtils.lerp(backWBottom, backWTop, t) - 0.008;
    const stripGeo = new THREE.BoxGeometry(stripW, 0.024, 0.008);
    const mat = i % 2 === 0 ? weaveMat : weaveDarkMat;
    const strip = addMesh(stripGeo, mat, `backrest_weave_h_${i + 1}`);
    strip.position.copy(backMidBottom).addScaledVector(backDir, 0.032 + t * backHeight);
    strip.quaternion.copy(backMesh.quaternion);
    strip.translateZ(0.011);
  }

  // 10. Backrest Basket-Weave Vertical Strips (6 bands)
  const numV = 6;
  for (let i = 0; i < numV; i++) {
    const u = (i + 0.5) / numV - 0.5;
    const xBottom = u * (backWBottom - 0.02);
    const xTop = u * (backWTop - 0.02);
    const pBot = backMidBottom
      .clone()
      .addScaledVector(backDir, 0.036)
      .add(new THREE.Vector3(xBottom, 0, 0));
    const pTop = backMidBottom
      .clone()
      .addScaledVector(backDir, 0.036 + backHeight - 0.008)
      .add(new THREE.Vector3(xTop, 0, 0));
    const vDir = new THREE.Vector3().subVectors(pTop, pBot);
    const vLen = vDir.length();
    const stripGeo = new THREE.BoxGeometry(0.024, vLen, 0.008);
    const mat = i % 2 === 0 ? weaveDarkMat : weaveMat;
    const strip = addMesh(stripGeo, mat, `backrest_weave_v_${i + 1}`);
    strip.position.copy(pBot).add(pTop).multiplyScalar(0.5);
    strip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vDir.normalize());
    strip.translateZ(0.013);
  }

  return group;
}
