function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.16;
  const D = 0.82;
  const H = 0.78;
  const MOD_W = W / 3;
  const TUBE = 0.036;
  const FRAME_SEAT_H = 0.28;
  const ARM_H = 0.58;
  const SEAT_CUSHION_H = 0.13;
  const BACK_CUSHION_H = 0.44;
  const BACK_CUSHION_T = 0.16;
  const BACK_TILT = 0.16; // radians (~9 deg)
  const GAP = 0.004;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3b3f3d,
    roughness: 0.48,
    metalness: 0.38,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8d9e87,
    roughness: 0.88,
    metalness: 0.0,
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

  // Helper for rounded cushion geometry
  function createCushionGeo(w, h, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2 - r;
    const hh = d / 2 - r;
    shape.moveTo(-hw, -hh - r);
    shape.lineTo(hw, -hh - r);
    shape.quadraticCurveTo(hw + r, -hh - r, hw + r, -hh);
    shape.lineTo(hw + r, hh);
    shape.quadraticCurveTo(hw + r, hh + r, hw, hh + r);
    shape.lineTo(-hw, hh + r);
    shape.quadraticCurveTo(-hw - r, hh + r, -hw - r, hh);
    shape.lineTo(-hw - r, -hh);
    shape.quadraticCurveTo(-hw - r, -hh - r, -hw, -hh - r);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h - r * 2,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 4,
      curveSegments: 6,
    });
    geo.rotateX(Math.PI / 2);
    geo.center();
    return geo;
  }

  const frontZ = D / 2 - TUBE / 2;
  const backZ = -D / 2 + TUBE / 2;
  const railY = FRAME_SEAT_H - TUBE / 2;

  // Build 3 modular sections
  for (let i = 0; i < 3; i++) {
    const modCenterX = -W / 2 + MOD_W * (i + 0.5);
    const leftX = modCenterX - MOD_W / 2 + TUBE / 2 + (i > 0 ? GAP / 2 : 0);
    const rightX = modCenterX + MOD_W / 2 - TUBE / 2 - (i < 2 ? GAP / 2 : 0);
    const innerW = rightX - leftX - TUBE;

    // Front legs (outermost front legs extend up to ARM_H)
    const flH = i === 0 ? ARM_H : FRAME_SEAT_H;
    addMesh(
      new THREE.BoxGeometry(TUBE, flH, TUBE),
      frameMat,
      `leg_front_left_${i}`,
      leftX,
      flH / 2,
      frontZ
    );

    const frH = i === 2 ? ARM_H : FRAME_SEAT_H;
    addMesh(
      new THREE.BoxGeometry(TUBE, frH, TUBE),
      frameMat,
      `leg_front_right_${i}`,
      rightX,
      frH / 2,
      frontZ
    );

    // Back legs
    addMesh(
      new THREE.BoxGeometry(TUBE, FRAME_SEAT_H, TUBE),
      frameMat,
      `leg_back_left_${i}`,
      leftX,
      FRAME_SEAT_H / 2,
      backZ
    );
    addMesh(
      new THREE.BoxGeometry(TUBE, FRAME_SEAT_H, TUBE),
      frameMat,
      `leg_back_right_${i}`,
      rightX,
      FRAME_SEAT_H / 2,
      backZ
    );

    // Front & back seat rails
    addMesh(
      new THREE.BoxGeometry(innerW, TUBE, TUBE),
      frameMat,
      `rail_front_${i}`,
      (leftX + rightX) / 2,
      railY,
      frontZ
    );
    addMesh(
      new THREE.BoxGeometry(innerW, TUBE, TUBE),
      frameMat,
      `rail_back_${i}`,
      (leftX + rightX) / 2,
      railY,
      backZ
    );

    // Side seat rails
    const sideLen = D - TUBE * 2;
    addMesh(
      new THREE.BoxGeometry(TUBE, TUBE, sideLen),
      frameMat,
      `rail_side_left_${i}`,
      leftX,
      railY,
      0
    );
    addMesh(
      new THREE.BoxGeometry(TUBE, TUBE, sideLen),
      frameMat,
      `rail_side_right_${i}`,
      rightX,
      railY,
      0
    );

    // Seat cushion
    const seatW = MOD_W - (i === 0 || i === 2 ? TUBE : 0) - 0.012;
    const seatD = D - TUBE * 1.5;
    const seatGeo = createCushionGeo(seatW, SEAT_CUSHION_H, seatD, 0.028);
    const seatX =
      modCenterX + (i === 0 ? TUBE / 2 : i === 2 ? -TUBE / 2 : 0);
    addMesh(
      seatGeo,
      fabricMat,
      `seat_cushion_${i}`,
      seatX,
      FRAME_SEAT_H + SEAT_CUSHION_H / 2 - 0.005,
      TUBE * 0.4
    );

    // Back cushion
    const backGeo = createCushionGeo(
      seatW,
      BACK_CUSHION_H,
      BACK_CUSHION_T,
      0.035
    );
    addMesh(
      backGeo,
      fabricMat,
      `back_cushion_${i}`,
      seatX,
      FRAME_SEAT_H + SEAT_CUSHION_H + BACK_CUSHION_H / 2 - 0.04,
      backZ + BACK_CUSHION_T / 2 + 0.05,
      -BACK_TILT,
      0,
      0
    );
  }

  // Armrests (left and right outer sides)
  const armLen = D - TUBE;
  const armY = ARM_H - TUBE / 2;
  addMesh(
    new THREE.BoxGeometry(TUBE, TUBE, armLen),
    frameMat,
    "armrest_left",
    -W / 2 + TUBE / 2,
    armY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(TUBE, TUBE, armLen),
    frameMat,
    "armrest_right",
    W / 2 - TUBE / 2,
    armY,
    0
  );

  // Backrest frame (angled posts + top horizontal bar)
  const backFrameH = H - FRAME_SEAT_H - 0.06;
  const backPostY = FRAME_SEAT_H + backFrameH / 2 - 0.02;
  const backPostZ = backZ - Math.sin(BACK_TILT) * (backFrameH / 2);

  addMesh(
    new THREE.BoxGeometry(TUBE, backFrameH, TUBE),
    frameMat,
    "backrest_post_left",
    -W / 2 + TUBE / 2,
    backPostY,
    backPostZ,
    -BACK_TILT,
    0,
    0
  );
  addMesh(
    new THREE.BoxGeometry(TUBE, backFrameH, TUBE),
    frameMat,
    "backrest_post_right",
    W / 2 - TUBE / 2,
    backPostY,
    backPostZ,
    -BACK_TILT,
    0,
    0
  );

  const topBarY = FRAME_SEAT_H + backFrameH - 0.03;
  const topBarZ = backZ - Math.sin(BACK_TILT) * backFrameH;
  addMesh(
    new THREE.BoxGeometry(W - TUBE * 2, TUBE, TUBE),
    frameMat,
    "backrest_top_bar",
    0,
    topBarY,
    topBarZ,
    -BACK_TILT,
    0,
    0
  );

  return group;
}
