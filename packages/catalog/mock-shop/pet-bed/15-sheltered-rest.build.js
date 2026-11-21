function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.65;
  const H = 0.45;
  const D = 0.50;
  const BASE_H = 0.012;
  const WALL_T = 0.045;
  const RIM_R = 0.032;
  const CUSHION_H = 0.085;

  // Materials
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x9b8977,
    roughness: 0.92,
    metalness: 0.0
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xa89786,
    roughness: 0.95,
    metalness: 0.0
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x705e4e,
    roughness: 0.96,
    metalness: 0.0
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x2a2623,
    roughness: 0.85,
    metalness: 0.05
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper: rounded rectangle shape
  function makeRoundedRectShape(w, d, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r);
    s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r);
    s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  }

  // 1. Non-slip dark base pad (y = 0 to BASE_H)
  const baseShape = makeRoundedRectShape(W - 0.03, D - 0.03, 0.14);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: false,
    curveSegments: 24
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, baseMat, 'non_slip_base');

  // 2. Outer shell arch (extruded along Z)
  const outerRx = W / 2 - 0.015;
  const outerTopY = 0.14 + outerRx;
  const innerRx = outerRx - WALL_T;
  const innerTopY = 0.14 + innerRx;
  const floorY = BASE_H + 0.065;

  const archShape = new THREE.Shape();
  archShape.moveTo(-outerRx, BASE_H);
  archShape.lineTo(-outerRx, 0.14);
  archShape.absarc(0, 0.14, outerRx, Math.PI, 0, true);
  archShape.lineTo(outerRx, BASE_H);
  archShape.lineTo(innerRx, BASE_H);
  archShape.lineTo(innerRx, 0.14);
  archShape.absarc(0, 0.14, innerRx, 0, Math.PI, false);
  archShape.lineTo(-innerRx, BASE_H);
  archShape.closePath();

  const shellDepth = 0.34;
  const shellGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: shellDepth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 4,
    curveSegments: 28
  });
  shellGeo.translate(0, 0, -shellDepth / 2 + 0.02);
  addMesh(shellGeo, outerMat, 'outer_shell_arch');

  // 3. Lower front wall under the opening
  const frontWallShape = makeRoundedRectShape(W - 0.03, 0.08, 0.035);
  const frontWallGeo = new THREE.ExtrudeGeometry(frontWallShape, {
    depth: floorY - BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 16
  });
  frontWallGeo.rotateX(-Math.PI / 2);
  frontWallGeo.translate(0, BASE_H, D / 2 - 0.07);
  addMesh(frontWallGeo, outerMat, 'lower_front_wall');

  // 4. Outer back cap (rounded dome closing -Z, reaching exactly z = -D/2)
  const capDepth = 0.10;
  const backCapGeo = new THREE.SphereGeometry(outerRx, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  backCapGeo.rotateX(-Math.PI / 2);
  backCapGeo.scale(1.0, (outerTopY - 0.14) / outerRx, capDepth / outerRx);
  const backCap = addMesh(backCapGeo, outerMat, 'outer_back_cap');
  backCap.position.set(0, 0.14, -shellDepth / 2 + 0.02);

  // 5. Outer seam ribs (distinctive stitched ribs over the hood)
  const ribPositionsZ = [-0.09, 0.03, 0.14];
  ribPositionsZ.forEach((zPos, idx) => {
    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-outerRx - 0.005, BASE_H + 0.01, zPos),
      new THREE.Vector3(-outerRx - 0.005, 0.16, zPos),
      new THREE.Vector3(-outerRx * 0.68, 0.36, zPos),
      new THREE.Vector3(0, H - 0.009, zPos),
      new THREE.Vector3(outerRx * 0.68, 0.36, zPos),
      new THREE.Vector3(outerRx + 0.005, 0.16, zPos),
      new THREE.Vector3(outerRx + 0.005, BASE_H + 0.01, zPos)
    ]);
    const ribGeo = new THREE.TubeGeometry(ribCurve, 28, 0.009, 8, false);
    addMesh(ribGeo, outerMat, `outer_seam_rib_${idx + 1}`);
  });

  // 6. Front opening plush rolled rim (frontmost point at z = +D/2)
  const rimZ = D / 2 - RIM_R;
  const rimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, floorY + 0.01, rimZ),
    new THREE.Vector3(innerRx * 0.72, floorY + 0.04, rimZ),
    new THREE.Vector3(innerRx + 0.005, 0.21, rimZ),
    new THREE.Vector3(innerRx * 0.68, 0.37, rimZ),
    new THREE.Vector3(0, H - 0.025, rimZ),
    new THREE.Vector3(-innerRx * 0.68, 0.37, rimZ),
    new THREE.Vector3(-innerRx - 0.005, 0.21, rimZ),
    new THREE.Vector3(-innerRx * 0.72, floorY + 0.04, rimZ)
  ], true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 32, RIM_R, 14, true);
  addMesh(rimGeo, rimMat, 'front_opening_rim');

  // 7. Inner plush lining arch
  const liningShape = new THREE.Shape();
  const lRx = innerRx - 0.002;
  const lInnerRx = lRx - 0.015;
  liningShape.moveTo(-lRx, BASE_H + 0.01);
  liningShape.lineTo(-lRx, 0.14);
  liningShape.absarc(0, 0.14, lRx, Math.PI, 0, true);
  liningShape.lineTo(lRx, BASE_H + 0.01);
  liningShape.lineTo(lInnerRx, BASE_H + 0.01);
  liningShape.lineTo(lInnerRx, 0.14);
  liningShape.absarc(0, 0.14, lInnerRx, 0, Math.PI, false);
  liningShape.lineTo(-lInnerRx, BASE_H + 0.01);
  liningShape.closePath();

  const liningDepth = shellDepth - 0.02;
  const liningGeo = new THREE.ExtrudeGeometry(liningShape, {
    depth: liningDepth,
    bevelEnabled: false,
    curveSegments: 24
  });
  liningGeo.translate(0, 0, -liningDepth / 2 + 0.02);
  addMesh(liningGeo, innerMat, 'inner_lining_arch');

  // 8. Inner back wall lining
  const innerBackGeo = new THREE.CylinderGeometry(lInnerRx, lInnerRx, 0.02, 24);
  innerBackGeo.rotateX(Math.PI / 2);
  const innerBack = addMesh(innerBackGeo, innerMat, 'inner_lining_back');
  innerBack.position.set(0, 0.14, -liningDepth / 2 + 0.025);

  // 9. Inner padded ribs
  const innerRibZ = [-0.08, 0.02, 0.12];
  innerRibZ.forEach((zPos, idx) => {
    const iRibCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-lInnerRx + 0.005, floorY + 0.01, zPos),
      new THREE.Vector3(-lInnerRx + 0.005, 0.17, zPos),
      new THREE.Vector3(-lInnerRx * 0.65, 0.33, zPos),
      new THREE.Vector3(0, innerTopY - 0.018, zPos),
      new THREE.Vector3(lInnerRx * 0.65, 0.33, zPos),
      new THREE.Vector3(lInnerRx - 0.005, 0.17, zPos),
      new THREE.Vector3(lInnerRx - 0.005, floorY + 0.01, zPos)
    ]);
    const iRibGeo = new THREE.TubeGeometry(iRibCurve, 24, 0.01, 8, false);
    addMesh(iRibGeo, innerMat, `inner_rib_${idx + 1}`);
  });

  // 10. Inner removable puffy cushion
  const cushionW = W - WALL_T * 2 - 0.03;
  const cushionD = D - 0.13;
  const cushionShape = makeRoundedRectShape(cushionW, cushionD, 0.12);
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 5,
    curveSegments: 24
  });
  cushionGeo.rotateX(-Math.PI / 2);
  const cushion = addMesh(cushionGeo, outerMat, 'inner_cushion');
  cushion.position.set(0, BASE_H + 0.02, 0.02);

  return group;
}
