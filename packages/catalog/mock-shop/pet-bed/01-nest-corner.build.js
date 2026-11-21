function build(THREE) {
  const group = new THREE.Group();

  // Overall dimensions (meters)
  const W = 0.65;
  const D = 0.50;
  const H = 0.19;
  const WALL_T = 0.085;
  const FRONT_LOW_H = 0.095;
  const CUSHION_H = 0.075;
  const BASE_H = 0.014;
  const PIPE_R = 0.006;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece0,
    roughness: 0.92,
    metalness: 0.0
  });

  const beigeGinghamMat = new THREE.MeshStandardMaterial({
    color: 0xcabfa9,
    roughness: 0.9,
    metalness: 0.0
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x9c907e,
    roughness: 0.95,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xf6f1e6,
    roughness: 0.85,
    metalness: 0.0
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

  // Helper for rounded rectangle shape
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Bottom base pad (touches y = 0)
  const baseShape = createRoundedRectShape(W - 0.008, D - 0.008, 0.035);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, baseMat, 'base_pad', 0, BASE_H, 0);

  // 2. Back bolster (outer beige + inner cream)
  const backOuterGeo = new THREE.BoxGeometry(W - 0.02, H - BASE_H, WALL_T * 0.52);
  addMesh(
    backOuterGeo,
    beigeGinghamMat,
    'back_bolster_outer',
    0,
    BASE_H + (H - BASE_H) / 2,
    -D / 2 + (WALL_T * 0.52) / 2
  );

  const backInnerGeo = new THREE.BoxGeometry(W - WALL_T * 1.1, H - BASE_H - 0.008, WALL_T * 0.55);
  addMesh(
    backInnerGeo,
    creamMat,
    'back_bolster_inner',
    0,
    BASE_H + (H - BASE_H - 0.008) / 2,
    -D / 2 + WALL_T * 0.52 + (WALL_T * 0.55) / 2 - 0.005
  );

  // 3. Left bolster (outer beige + inner cream)
  const sideLen = D - WALL_T * 0.6;
  const leftOuterGeo = new THREE.BoxGeometry(WALL_T * 0.52, H - BASE_H, sideLen);
  addMesh(
    leftOuterGeo,
    beigeGinghamMat,
    'left_bolster_outer',
    -W / 2 + (WALL_T * 0.52) / 2,
    BASE_H + (H - BASE_H) / 2,
    -0.01
  );

  const leftInnerGeo = new THREE.BoxGeometry(WALL_T * 0.55, H - BASE_H - 0.008, sideLen - 0.02);
  addMesh(
    leftInnerGeo,
    creamMat,
    'left_bolster_inner',
    -W / 2 + WALL_T * 0.52 + (WALL_T * 0.55) / 2 - 0.005,
    BASE_H + (H - BASE_H - 0.008) / 2,
    -0.01
  );

  // 4. Right bolster (outer beige + inner cream)
  const rightOuterGeo = new THREE.BoxGeometry(WALL_T * 0.52, H - BASE_H, sideLen);
  addMesh(
    rightOuterGeo,
    beigeGinghamMat,
    'right_bolster_outer',
    W / 2 - (WALL_T * 0.52) / 2,
    BASE_H + (H - BASE_H) / 2,
    -0.01
  );

  const rightInnerGeo = new THREE.BoxGeometry(WALL_T * 0.55, H - BASE_H - 0.008, sideLen - 0.02);
  addMesh(
    rightInnerGeo,
    creamMat,
    'right_bolster_inner',
    W / 2 - WALL_T * 0.52 - (WALL_T * 0.55) / 2 + 0.005,
    BASE_H + (H - BASE_H - 0.008) / 2,
    -0.01
  );

  // 5. Rounded corner pillars (outer beige)
  const cornerGeo = new THREE.CylinderGeometry(WALL_T * 0.35, WALL_T * 0.35, H - BASE_H, 16);
  const cornerX = W / 2 - WALL_T * 0.35;
  const cornerZBack = -D / 2 + WALL_T * 0.35;
  addMesh(cornerGeo, beigeGinghamMat, 'corner_back_left', -cornerX, BASE_H + (H - BASE_H) / 2, cornerZBack);
  addMesh(cornerGeo, beigeGinghamMat, 'corner_back_right', cornerX, BASE_H + (H - BASE_H) / 2, cornerZBack);

  // 6. Front center low panel (cream)
  const frontCenterW = W * 0.48;
  const frontCenterGeo = new THREE.BoxGeometry(frontCenterW, FRONT_LOW_H - BASE_H, WALL_T * 0.85);
  addMesh(
    frontCenterGeo,
    creamMat,
    'front_center_panel',
    0,
    BASE_H + (FRONT_LOW_H - BASE_H) / 2,
    D / 2 - (WALL_T * 0.85) / 2
  );

  // 7. Front left and right wings (beige, sloping down toward center)
  const wingW = (W - frontCenterW) / 2 + 0.01;
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(wingW, 0);
  wingShape.lineTo(wingW, FRONT_LOW_H - BASE_H);
  wingShape.quadraticCurveTo(wingW * 0.55, FRONT_LOW_H - BASE_H, wingW * 0.35, H - BASE_H - 0.02);
  wingShape.quadraticCurveTo(wingW * 0.15, H - BASE_H, 0, H - BASE_H);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: WALL_T * 0.88,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 12
  });

  addMesh(
    wingGeo,
    beigeGinghamMat,
    'front_left_wing',
    -W / 2,
    BASE_H,
    D / 2 - WALL_T * 0.88
  );

  const rightWingGeo = wingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  addMesh(
    rightWingGeo,
    beigeGinghamMat,
    'front_right_wing',
    W / 2,
    BASE_H,
    D / 2 - WALL_T * 0.88
  );

  // 8. Inner plush cushion
  const innerW = W - WALL_T * 1.75;
  const innerD = D - WALL_T * 1.75;
  const cushionShape = createRoundedRectShape(innerW, innerD, 0.025);
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 4,
    curveSegments: 12
  });
  cushionGeo.rotateX(Math.PI / 2);
  addMesh(cushionGeo, creamMat, 'inner_cushion_base', 0, CUSHION_H, 0.005);

  // Subtle quilted pillow top segments on the inner cushion
  const puffW = innerW * 0.44;
  const puffD = innerD * 0.44;
  const puffGeo = new THREE.SphereGeometry(0.5, 16, 12);
  puffGeo.scale(puffW, 0.028, puffD);
  const puffY = CUSHION_H + 0.004;
  const puffOffsetX = innerW * 0.23;
  const puffOffsetZ = innerD * 0.23;

  addMesh(puffGeo, creamMat, 'cushion_puff_back_left', -puffOffsetX, puffY, -puffOffsetZ + 0.005);
  addMesh(puffGeo, creamMat, 'cushion_puff_back_right', puffOffsetX, puffY, -puffOffsetZ + 0.005);
  addMesh(puffGeo, creamMat, 'cushion_puff_front_left', -puffOffsetX, puffY, puffOffsetZ + 0.005);
  addMesh(puffGeo, creamMat, 'cushion_puff_front_right', puffOffsetX, puffY, puffOffsetZ + 0.005);

  // 9. Piping along top edges of bolsters
  const backPipeGeo = new THREE.CylinderGeometry(PIPE_R, PIPE_R, W - 0.03, 10);
  backPipeGeo.rotateZ(Math.PI / 2);
  addMesh(backPipeGeo, pipingMat, 'piping_back_top', 0, H, -D / 2 + 0.012);

  const sidePipeGeo = new THREE.CylinderGeometry(PIPE_R, PIPE_R, D - 0.05, 10);
  sidePipeGeo.rotateX(Math.PI / 2);
  addMesh(sidePipeGeo, pipingMat, 'piping_left_top', -W / 2 + 0.012, H, -0.01);
  addMesh(sidePipeGeo, pipingMat, 'piping_right_top', W / 2 - 0.012, H, -0.01);

  // 10. Front cutout piping (smooth curve following the front dip)
  const frontCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + 0.012, H, D / 2 - 0.04),
    new THREE.Vector3(-W * 0.34, H - 0.015, D / 2 - 0.015),
    new THREE.Vector3(-frontCenterW / 2 - 0.02, FRONT_LOW_H, D / 2 - 0.012),
    new THREE.Vector3(0, FRONT_LOW_H, D / 2 - 0.012),
    new THREE.Vector3(frontCenterW / 2 + 0.02, FRONT_LOW_H, D / 2 - 0.012),
    new THREE.Vector3(W * 0.34, H - 0.015, D / 2 - 0.015),
    new THREE.Vector3(W / 2 - 0.012, H, D / 2 - 0.04)
  ]);
  const frontPipeGeo = new THREE.TubeGeometry(frontCurve, 32, PIPE_R, 8, false);
  addMesh(frontPipeGeo, pipingMat, 'piping_front_cutout');

  return group;
}
