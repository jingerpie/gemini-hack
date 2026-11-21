function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.36;
  const H = 0.17;
  const D = 0.09;
  const FRAME_T = 0.022;
  const WALL_T = 0.012;
  const RECESS_D = 0.014;
  const RECESS_PLATE_T = 0.008;

  const WIN_W = 0.116;
  const WIN_H = 0.088;
  const WIN_OFFSET_X = 0.068;

  const DIG_W = 0.048;
  const DIG_H = 0.080;
  const DIG_D = 0.012;
  const FLAP_GAP = 0.002;
  const FLAP_H = (DIG_H - FLAP_GAP) / 2;
  const DIG_PAIR_GAP = 0.006;

  // Materials
  const casingMat = new THREE.MeshStandardMaterial({
    color: 0xc2c3c0,
    roughness: 0.65,
    metalness: 0.05
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0xb6b7b4,
    roughness: 0.7,
    metalness: 0.05
  });

  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x222325,
    roughness: 0.85,
    metalness: 0.1
  });

  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f2,
    roughness: 0.45,
    metalness: 0.02
  });

  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x2b2c2e,
    roughness: 0.5,
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

  // Outer casing (5 parts: back, top, bottom, left, right)
  addMesh(
    new THREE.BoxGeometry(W, H, WALL_T),
    casingMat,
    "casing_back",
    0,
    H / 2,
    -D / 2 + WALL_T / 2
  );

  addMesh(
    new THREE.BoxGeometry(W, FRAME_T, D),
    casingMat,
    "casing_top",
    0,
    H - FRAME_T / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(W, FRAME_T, D),
    casingMat,
    "casing_bottom",
    0,
    FRAME_T / 2,
    0
  );

  const sideH = H - 2 * FRAME_T;
  addMesh(
    new THREE.BoxGeometry(FRAME_T, sideH, D),
    casingMat,
    "casing_left",
    -W / 2 + FRAME_T / 2,
    H / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(FRAME_T, sideH, D),
    casingMat,
    "casing_right",
    W / 2 - FRAME_T / 2,
    H / 2,
    0
  );

  // Recessed front face with 2 rectangular windows
  const innerW = W - 2 * FRAME_T;
  const innerH = H - 2 * FRAME_T;
  const faceShape = new THREE.Shape();
  faceShape.moveTo(-innerW / 2, -innerH / 2);
  faceShape.lineTo(innerW / 2, -innerH / 2);
  faceShape.lineTo(innerW / 2, innerH / 2);
  faceShape.lineTo(-innerW / 2, innerH / 2);
  faceShape.closePath();

  const makeWindowHole = (cx) => {
    const hole = new THREE.Path();
    hole.moveTo(cx - WIN_W / 2, -WIN_H / 2);
    hole.lineTo(cx - WIN_W / 2, WIN_H / 2);
    hole.lineTo(cx + WIN_W / 2, WIN_H / 2);
    hole.lineTo(cx + WIN_W / 2, -WIN_H / 2);
    hole.closePath();
    return hole;
  };

  faceShape.holes.push(makeWindowHole(-WIN_OFFSET_X));
  faceShape.holes.push(makeWindowHole(WIN_OFFSET_X));

  const faceGeo = new THREE.ExtrudeGeometry(faceShape, {
    depth: RECESS_PLATE_T,
    bevelEnabled: false
  });
  addMesh(
    faceGeo,
    recessMat,
    "recessed_face",
    0,
    H / 2,
    D / 2 - RECESS_D - RECESS_PLATE_T
  );

  // Dark interior cavity behind windows
  const cavityZ = D / 2 - RECESS_D - RECESS_PLATE_T - 0.015;
  addMesh(
    new THREE.BoxGeometry(innerW - 0.004, innerH - 0.004, 0.01),
    cavityMat,
    "interior_cavity",
    0,
    H / 2,
    cavityZ
  );

  // 4 Flip-digit stacks (2 in left window, 2 in right window)
  const digitXPositions = [
    -WIN_OFFSET_X - (DIG_W + DIG_PAIR_GAP) / 2,
    -WIN_OFFSET_X + (DIG_W + DIG_PAIR_GAP) / 2,
    WIN_OFFSET_X - (DIG_W + DIG_PAIR_GAP) / 2,
    WIN_OFFSET_X + (DIG_W + DIG_PAIR_GAP) / 2
  ];

  const digitZ = D / 2 - RECESS_D - RECESS_PLATE_T - DIG_D / 2 - 0.002;
  const upperFlapGeo = new THREE.BoxGeometry(DIG_W, FLAP_H, DIG_D);
  const lowerFlapGeo = new THREE.BoxGeometry(DIG_W, FLAP_H, DIG_D);
  const hingeGeo = new THREE.CylinderGeometry(0.0028, 0.0028, DIG_W + 0.005, 12);

  digitXPositions.forEach((dx, idx) => {
    const n = idx + 1;
    addMesh(
      upperFlapGeo,
      flapMat,
      `digit_upper_${n}`,
      dx,
      H / 2 + FLAP_GAP / 2 + FLAP_H / 2,
      digitZ
    );
    addMesh(
      lowerFlapGeo,
      flapMat,
      `digit_lower_${n}`,
      dx,
      H / 2 - FLAP_GAP / 2 - FLAP_H / 2,
      digitZ
    );
    addMesh(
      hingeGeo,
      hingeMat,
      `digit_hinge_${n}`,
      dx,
      H / 2,
      digitZ + DIG_D / 2 - 0.001,
      0,
      0,
      Math.PI / 2
    );
  });

  return group;
}
