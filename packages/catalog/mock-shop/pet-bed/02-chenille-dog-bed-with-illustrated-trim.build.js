function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.86;
  const D = 0.68;
  const H = 0.23;
  const BASE_H = 0.018;
  const BOLSTER_R = 0.074;
  const BOLSTER_Y_SCALE = 1.32;
  const BOLSTER_TOP_Y = BASE_H + BOLSTER_R * BOLSTER_Y_SCALE * 2 - 0.012;
  const CUSHION_H = 0.11;
  const FRONT_DIP_TOP_Y = 0.118;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x241e1a,
    roughness: 0.92,
    metalness: 0.0
  });

  const chenilleMainMat = new THREE.MeshStandardMaterial({
    color: 0xd9c7b2,
    roughness: 0.95,
    metalness: 0.0
  });

  const chenilleCushionMat = new THREE.MeshStandardMaterial({
    color: 0xdfd0be,
    roughness: 0.95,
    metalness: 0.0
  });

  const chenilleOuterMat = new THREE.MeshStandardMaterial({
    color: 0xcfbba4,
    roughness: 0.95,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xefe6d8,
    roughness: 0.88,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Non-slip dark bottom base (tucked neatly underneath)
  const baseGeo = new THREE.BoxGeometry(W - 0.16, BASE_H, D - 0.14);
  addMesh(baseGeo, baseMat, "base_pad", [0, BASE_H / 2, 0]);

  // 2. Center plush cushion (domed)
  const innerW = W - BOLSTER_R * 3.4;
  const innerD = D - BOLSTER_R * 3.2;
  const cushionGeo = new THREE.SphereGeometry(0.5, 28, 18);
  addMesh(
    cushionGeo,
    chenilleCushionMat,
    "center_cushion",
    [0, BASE_H + CUSHION_H * 0.45, 0.01],
    [0, 0, 0],
    [innerW, CUSHION_H, innerD]
  );

  // 3. Back bolster (puffy rounded wall)
  const bolsterCenterY = BASE_H + BOLSTER_R * BOLSTER_Y_SCALE - 0.012;
  const backZ = -D / 2 + BOLSTER_R * 1.05;
  const backBolsterGeo = new THREE.CapsuleGeometry(BOLSTER_R, W - BOLSTER_R * 2.5, 12, 24);
  addMesh(
    backBolsterGeo,
    chenilleMainMat,
    "back_bolster",
    [0, bolsterCenterY, backZ],
    [0, 0, Math.PI / 2],
    [BOLSTER_Y_SCALE, 1, 1.0]
  );

  // 4. Left & Right bolsters
  const sideLen = D - BOLSTER_R * 2.3;
  const sideX = W / 2 - BOLSTER_R * 1.05;
  const sideBolsterGeo = new THREE.CapsuleGeometry(BOLSTER_R, sideLen, 12, 24);
  addMesh(
    sideBolsterGeo,
    chenilleMainMat,
    "left_bolster",
    [-sideX, bolsterCenterY, 0],
    [Math.PI / 2, 0, 0],
    [1.0, 1, BOLSTER_Y_SCALE]
  );
  addMesh(
    sideBolsterGeo,
    chenilleMainMat,
    "right_bolster",
    [sideX, bolsterCenterY, 0],
    [Math.PI / 2, 0, 0],
    [1.0, 1, BOLSTER_Y_SCALE]
  );

  // 5. Outer side puffs (outward-bulging pillowy sides)
  const outerPuffGeo = new THREE.SphereGeometry(0.5, 20, 14);
  addMesh(
    outerPuffGeo,
    chenilleOuterMat,
    "left_outer_puff",
    [-W / 2 + 0.065, bolsterCenterY - 0.01, 0],
    [0, 0, 0],
    [0.14, BOLSTER_R * BOLSTER_Y_SCALE * 1.75, D * 0.72]
  );
  addMesh(
    outerPuffGeo,
    chenilleOuterMat,
    "right_outer_puff",
    [W / 2 - 0.065, bolsterCenterY - 0.01, 0],
    [0, 0, 0],
    [0.14, BOLSTER_R * BOLSTER_Y_SCALE * 1.75, D * 0.72]
  );

  // 6. Front bolster with U-shaped entry cutout
  const frontZ = D / 2 - BOLSTER_R * 1.05;
  const frontSideW = (W - BOLSTER_R * 2.2) * 0.22;
  const frontSideGeo = new THREE.CapsuleGeometry(BOLSTER_R * 0.92, frontSideW, 10, 18);
  const frontSideY = BASE_H + BOLSTER_R * 0.92 * 1.22 - 0.012;

  addMesh(
    frontSideGeo,
    chenilleMainMat,
    "front_left_bolster",
    [-W / 2 + BOLSTER_R * 1.25 + frontSideW * 0.35, frontSideY, frontZ],
    [0, 0, Math.PI / 2],
    [1.22, 1, 0.95]
  );
  addMesh(
    frontSideGeo,
    chenilleMainMat,
    "front_right_bolster",
    [W / 2 - BOLSTER_R * 1.25 - frontSideW * 0.35, frontSideY, frontZ],
    [0, 0, Math.PI / 2],
    [1.22, 1, 0.95]
  );

  const frontDipLen = W * 0.46;
  const frontDipR = 0.062;
  const frontDipYScale = 0.85;
  const frontDipCenterY = FRONT_DIP_TOP_Y - frontDipR * frontDipYScale;
  const frontDipGeo = new THREE.CapsuleGeometry(frontDipR, frontDipLen, 10, 20);
  addMesh(
    frontDipGeo,
    chenilleMainMat,
    "front_center_dip",
    [0, frontDipCenterY, frontZ],
    [0, 0, Math.PI / 2],
    [frontDipYScale, 1, 0.95]
  );

  // 7. Cream piping trim resting directly on the top edges and front cutout
  const pipeRadius = 0.01;
  const pipeYTop = BOLSTER_TOP_Y - 0.004;
  const pipeYFrontSide = frontSideY + BOLSTER_R * 0.92 * 1.22 - 0.006;
  const pipeYDip = FRONT_DIP_TOP_Y - 0.004;
  const pipeXOuter = sideX;
  const pipeZBack = backZ;
  const pipeZFront = frontZ;

  const pipingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-pipeXOuter, pipeYTop, pipeZBack),
    new THREE.Vector3(0, pipeYTop, pipeZBack),
    new THREE.Vector3(pipeXOuter, pipeYTop, pipeZBack),
    new THREE.Vector3(pipeXOuter, pipeYTop, 0),
    new THREE.Vector3(pipeXOuter - 0.02, pipeYFrontSide, pipeZFront),
    new THREE.Vector3(W * 0.24, pipeYFrontSide - 0.008, pipeZFront),
    new THREE.Vector3(W * 0.16, pipeYDip + 0.006, pipeZFront),
    new THREE.Vector3(0, pipeYDip, pipeZFront),
    new THREE.Vector3(-W * 0.16, pipeYDip + 0.006, pipeZFront),
    new THREE.Vector3(-W * 0.24, pipeYFrontSide - 0.008, pipeZFront),
    new THREE.Vector3(-pipeXOuter + 0.02, pipeYFrontSide, pipeZFront),
    new THREE.Vector3(-pipeXOuter, pipeYTop, 0)
  ], true);

  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, pipeRadius, 10, true);
  addMesh(pipingGeo, pipingMat, "trim_piping");

  // 8. Subtle inner cushion welt/seam
  const cushionWeltGeo = new THREE.TorusGeometry(0.5, 0.008, 8, 32);
  addMesh(
    cushionWeltGeo,
    pipingMat,
    "cushion_welt",
    [0, BASE_H + CUSHION_H * 0.42, 0.01],
    [Math.PI / 2, 0, 0],
    [innerW * 0.96, innerD * 0.96, 1]
  );

  return group;
}
