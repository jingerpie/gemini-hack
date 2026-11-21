function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 2.20;
  const D = 0.96;
  const LEG_H = 0.045;
  const LEG_W = 0.045;
  const LEG_D = 0.045;
  const LEG_INSET_X = 0.14;
  const LEG_INSET_Z = 0.10;

  const BASE_H = 0.185;
  const ARM_W = 0.12;
  const ARM_H = 0.56;
  const BACK_FRAME_H = 0.66;
  const BACK_FRAME_D = 0.14;

  const SEAT_W = W - 2 * ARM_W;
  const SEAT_D = D - BACK_FRAME_D;
  const SEAT_CUSHION_H = 0.19;
  const SEAT_TOP_Y = LEG_H + BASE_H + SEAT_CUSHION_H;

  const BACK_CUSHION_GAP = 0.015;
  const BACK_CUSHION_W = (SEAT_W - BACK_CUSHION_GAP) / 2;
  const BACK_CUSHION_H = 0.39;
  const BACK_CUSHION_D = 0.19;

  // Shared materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc2bcb2,
    roughness: 0.9,
    metalness: 0.0
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x4a4845,
    roughness: 0.4,
    metalness: 0.7
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createBeveledBox(w, h, d, r, bevel) {
    const bw = w - 2 * bevel;
    const bh = h - 2 * bevel;
    const hw = bw / 2;
    const hh = bh / 2;
    const cr = Math.min(r, hw * 0.45, hh * 0.45);

    const shape = new THREE.Shape();
    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    shape.lineTo(hw, hh - cr);
    shape.quadraticCurveTo(hw, hh, hw - cr, hh);
    shape.lineTo(-hw + cr, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    shape.lineTo(-hw, -hh + cr);
    shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8
    });
    geo.center();
    return geo;
  }

  // 1-4. Legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const legX = W / 2 - LEG_INSET_X;
  const legZ = D / 2 - LEG_INSET_Z;
  addMesh(legGeo, legMat, "leg_front_left", -legX, LEG_H / 2, legZ);
  addMesh(legGeo, legMat, "leg_front_right", legX, LEG_H / 2, legZ);
  addMesh(legGeo, legMat, "leg_back_left", -legX, LEG_H / 2, -legZ);
  addMesh(legGeo, legMat, "leg_back_right", legX, LEG_H / 2, -legZ);

  // 5. Base deck
  const baseGeo = createBeveledBox(SEAT_W + 0.02, BASE_H, D, 0.015, 0.01);
  addMesh(baseGeo, fabricMat, "base_deck", 0, LEG_H + BASE_H / 2, 0);

  // 6-7. Left and Right Track Arms
  const armGeo = createBeveledBox(ARM_W, ARM_H, D, 0.02, 0.015);
  addMesh(armGeo, fabricMat, "arm_left", -W / 2 + ARM_W / 2, LEG_H + ARM_H / 2, 0);
  addMesh(armGeo, fabricMat, "arm_right", W / 2 - ARM_W / 2, LEG_H + ARM_H / 2, 0);

  // 8. Back Frame
  const backFrameGeo = createBeveledBox(SEAT_W + 0.02, BACK_FRAME_H, BACK_FRAME_D, 0.02, 0.012);
  addMesh(
    backFrameGeo,
    fabricMat,
    "back_frame",
    0,
    LEG_H + BACK_FRAME_H / 2,
    -D / 2 + BACK_FRAME_D / 2
  );

  // 9. Single Bench Seat Cushion
  const seatGeo = createBeveledBox(SEAT_W - 0.006, SEAT_CUSHION_H, SEAT_D, 0.035, 0.025);
  addMesh(
    seatGeo,
    fabricMat,
    "seat_cushion",
    0,
    LEG_H + BASE_H + SEAT_CUSHION_H / 2 - 0.005,
    D / 2 - SEAT_D / 2
  );

  // 10-11. Two Back Cushions
  const backCushionGeo = createBeveledBox(
    BACK_CUSHION_W,
    BACK_CUSHION_H,
    BACK_CUSHION_D,
    0.04,
    0.03
  );
  const backCushionX = BACK_CUSHION_W / 2 + BACK_CUSHION_GAP / 2;
  const backCushionY = SEAT_TOP_Y + BACK_CUSHION_H / 2 - 0.02;
  const backCushionZ = -D / 2 + BACK_FRAME_D + BACK_CUSHION_D / 2 - 0.02;

  const leftBackCushion = addMesh(
    backCushionGeo,
    fabricMat,
    "back_cushion_left",
    -backCushionX,
    backCushionY,
    backCushionZ
  );
  leftBackCushion.rotation.x = -0.06;

  const rightBackCushion = addMesh(
    backCushionGeo,
    fabricMat,
    "back_cushion_right",
    backCushionX,
    backCushionY,
    backCushionZ
  );
  rightBackCushion.rotation.x = -0.06;

  // 12. Subtle under-frame support rail
  const railGeo = new THREE.BoxGeometry(W - 2 * LEG_INSET_X, 0.02, D - 2 * LEG_INSET_Z);
  addMesh(railGeo, legMat, "underframe_rail", 0, LEG_H - 0.005, 0);

  return group;
}
