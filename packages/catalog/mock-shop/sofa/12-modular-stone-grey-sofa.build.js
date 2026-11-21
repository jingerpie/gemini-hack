function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.70;
  const H = 0.82;
  const D = 0.98;

  const FOOT_H = 0.02;
  const FOOT_R = 0.025;

  const ARM_W = 0.27;
  const ARM_H = 0.58;
  const ARM_D = D;

  const MOD_W = (W - 2 * ARM_W) / 3; // 0.72m per module
  const SEAT_BASE_H = 0.28;
  const SEAT_CUSH_H = 0.14;
  const SEAT_H = FOOT_H + SEAT_BASE_H + SEAT_CUSH_H; // 0.44m

  const BACK_FRAME_H = 0.68;
  const BACK_FRAME_T = 0.16;

  const BACK_CUSH_W = MOD_W - 0.01;
  const BACK_CUSH_H = H - (FOOT_H + SEAT_BASE_H + SEAT_CUSH_H) + 0.05; // ~0.43m
  const BACK_CUSH_D = 0.22;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8d8982,
    roughness: 0.92,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Helper: create rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const rad = Math.min(r, hw, hh);
    shape.moveTo(-hw + rad, -hh);
    shape.lineTo(hw - rad, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    shape.lineTo(hw, hh - rad);
    shape.quadraticCurveTo(hw, hh, hw - rad, hh);
    shape.lineTo(-hw + rad, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    shape.lineTo(-hw, -hh + rad);
    shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
    return shape;
  }

  // Helper: create extruded rounded box centered at origin
  function createRoundedBox(w, h, d, radius, bevelSize, bevelSegments) {
    const shape = roundedRectShape(w - bevelSize * 2, d - bevelSize * 2, radius);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h - bevelSize * 2,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelSegments: bevelSegments || 4,
      curveSegments: 8,
    });
    geo.rotateX(-Math.PI / 2);
    geo.center();
    return geo;
  }

  // Helper: add mesh with shadows
  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Feet
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.85, FOOT_H, 16);
  const footPositions = [
    // Left arm feet
    [-W / 2 + 0.07, -D / 2 + 0.08],
    [-W / 2 + 0.07, D / 2 - 0.08],
    [-W / 2 + ARM_W - 0.06, D / 2 - 0.08],
    // Right arm feet
    [W / 2 - 0.07, -D / 2 + 0.08],
    [W / 2 - 0.07, D / 2 - 0.08],
    [W / 2 - ARM_W + 0.06, D / 2 - 0.08],
    // Center module front/back feet
    [-MOD_W * 0.8, D / 2 - 0.08],
    [MOD_W * 0.8, D / 2 - 0.08],
    [-MOD_W * 0.8, -D / 2 + 0.08],
    [MOD_W * 0.8, -D / 2 + 0.08],
  ];
  footPositions.forEach((pos, idx) => {
    addMesh(footGeo, footMat, `foot_${idx + 1}`, pos[0], FOOT_H / 2, pos[1]);
  });

  // 2. Armrests (Left and Right)
  const armGeo = createRoundedBox(ARM_W, ARM_H - FOOT_H, ARM_D, 0.05, 0.035, 5);
  const armY = FOOT_H + (ARM_H - FOOT_H) / 2;
  addMesh(armGeo, fabricMat, 'armrest_left', -W / 2 + ARM_W / 2, armY, 0);
  addMesh(armGeo, fabricMat, 'armrest_right', W / 2 - ARM_W / 2, armY, 0);

  // 3. Back Frame (behind cushions)
  const backFrameW = W - 2 * ARM_W + 0.04;
  const backFrameGeo = createRoundedBox(backFrameW, BACK_FRAME_H - FOOT_H, BACK_FRAME_T, 0.03, 0.02, 4);
  addMesh(
    backFrameGeo,
    fabricMat,
    'back_frame',
    0,
    FOOT_H + (BACK_FRAME_H - FOOT_H) / 2,
    -D / 2 + BACK_FRAME_T / 2
  );

  // 4. Three Modular Seat Bases, Seat Cushions, and Back Cushions
  const seatBaseD = D - 0.02;
  const seatBaseGeo = createRoundedBox(MOD_W - 0.008, SEAT_BASE_H, seatBaseD, 0.03, 0.02, 4);

  const seatCushD = D - BACK_FRAME_T + 0.02;
  const seatCushGeo = createRoundedBox(MOD_W - 0.008, SEAT_CUSH_H, seatCushD, 0.04, 0.035, 5);

  // Back cushion: extruded front-facing rounded rectangle
  const backCushShape = roundedRectShape(BACK_CUSH_W - 0.06, BACK_CUSH_H - 0.06, 0.05);
  const backCushGeo = new THREE.ExtrudeGeometry(backCushShape, {
    depth: BACK_CUSH_D - 0.08,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 5,
    curveSegments: 8,
  });
  backCushGeo.center();

  const moduleNames = ['left', 'center', 'right'];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * MOD_W;
    const tag = moduleNames[i];

    // Seat Base
    addMesh(
      seatBaseGeo,
      fabricMat,
      `seat_base_${tag}`,
      x,
      FOOT_H + SEAT_BASE_H / 2,
      0.01
    );

    // Seat Cushion
    addMesh(
      seatCushGeo,
      fabricMat,
      `seat_cushion_${tag}`,
      x,
      FOOT_H + SEAT_BASE_H + SEAT_CUSH_H / 2 - 0.01,
      BACK_FRAME_T / 2
    );

    // Back Cushion (slightly reclined)
    addMesh(
      backCushGeo,
      fabricMat,
      `back_cushion_${tag}`,
      x,
      SEAT_H + BACK_CUSH_H / 2 - 0.05,
      -D / 2 + BACK_FRAME_T + BACK_CUSH_D / 2 - 0.03,
      -0.12,
      0,
      0
    );
  }

  return group;
}
