function build(THREE) {
  const group = new THREE.Group();

  const W = 1.50;
  const D = 0.62;
  const H = 0.82;
  const SEAT_H = 0.43;
  const ARM_H = 0.61;
  const FRAME_T = 0.036;
  const SLAT_T = 0.022;
  const SLAT_W = W - FRAME_T * 2;
  const BACK_ANGLE = -0.16; // radians, tilting back toward -Z

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a8378,
    roughness: 0.45,
    metalness: 0.35
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc28e58,
    roughness: 0.65,
    metalness: 0.05
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

  // Z coordinates for front and rear of the frame
  const zFront = D / 2 - FRAME_T / 2;
  const zRearBottom = -D / 2 + FRAME_T / 2 + 0.05;
  const zRearSeat = -D / 2 + FRAME_T / 2 + 0.08;

  // Build Left (-1) and Right (+1) side frames
  [-1, 1].forEach((side) => {
    const sideName = side === -1 ? "left" : "right";
    const x = side * (W / 2 - FRAME_T / 2);

    // Bottom horizontal rail
    const bottomLen = zFront - zRearBottom + FRAME_T;
    addMesh(
      new THREE.BoxGeometry(FRAME_T, FRAME_T, bottomLen),
      metalMat,
      `${sideName}_bottom_rail`,
      x,
      FRAME_T / 2,
      (zFront + zRearBottom) / 2
    );

    // Front vertical leg (from y=0 up to ARM_H - SLAT_T)
    const frontLegH = ARM_H - SLAT_T;
    addMesh(
      new THREE.BoxGeometry(FRAME_T, frontLegH, FRAME_T),
      metalMat,
      `${sideName}_front_leg`,
      x,
      frontLegH / 2,
      zFront
    );

    // Rear leg (from bottom rail up to seat height, slightly angled)
    const rearLegH = SEAT_H;
    const rearLegDz = zRearSeat - zRearBottom;
    const rearLegAngle = Math.atan2(rearLegDz, rearLegH);
    const rearLegLen = Math.hypot(rearLegH, rearLegDz);
    addMesh(
      new THREE.BoxGeometry(FRAME_T, rearLegLen, FRAME_T),
      metalMat,
      `${sideName}_rear_leg`,
      x,
      rearLegH / 2,
      (zRearBottom + zRearSeat) / 2,
      rearLegAngle,
      0,
      0
    );

    // Seat support rail (connecting front leg and rear leg)
    const seatRailLen = zFront - zRearSeat;
    addMesh(
      new THREE.BoxGeometry(FRAME_T, FRAME_T, seatRailLen),
      metalMat,
      `${sideName}_seat_rail`,
      x,
      SEAT_H - FRAME_T / 2,
      (zFront + zRearSeat) / 2
    );

    // Backrest upright (from seat height up to H, tilted back)
    const backH = H - SEAT_H;
    const backLen = backH / Math.cos(BACK_ANGLE);
    const backDz = Math.sin(BACK_ANGLE) * (backLen / 2);
    addMesh(
      new THREE.BoxGeometry(FRAME_T, backLen + FRAME_T * 0.5, FRAME_T),
      metalMat,
      `${sideName}_back_upright`,
      x,
      SEAT_H + backH / 2 - 0.01,
      zRearSeat + backDz,
      BACK_ANGLE,
      0,
      0
    );

    // Armrest metal support bar
    const zBackAtArm = zRearSeat + Math.sin(BACK_ANGLE) * (ARM_H - SEAT_H);
    const armLen = zFront - zBackAtArm;
    addMesh(
      new THREE.BoxGeometry(FRAME_T, FRAME_T * 0.85, armLen),
      metalMat,
      `${sideName}_arm_rail`,
      x,
      ARM_H - SLAT_T - (FRAME_T * 0.85) / 2,
      (zFront + zBackAtArm) / 2
    );

    // Armrest wooden cap
    const armCapLen = armLen + FRAME_T * 0.8;
    addMesh(
      new THREE.BoxGeometry(FRAME_T + 0.012, SLAT_T, armCapLen),
      woodMat,
      `${sideName}_arm_cap`,
      x,
      ARM_H - SLAT_T / 2,
      (zFront + zBackAtArm) / 2
    );
  });

  // Crossbars under the seat
  addMesh(
    new THREE.BoxGeometry(SLAT_W, FRAME_T, FRAME_T),
    metalMat,
    "front_seat_crossbar",
    0,
    SEAT_H - FRAME_T / 2,
    zFront - FRAME_T * 0.6
  );
  addMesh(
    new THREE.BoxGeometry(SLAT_W, FRAME_T, FRAME_T),
    metalMat,
    "rear_seat_crossbar",
    0,
    SEAT_H - FRAME_T / 2,
    zRearSeat + FRAME_T * 0.6
  );

  // 5 Seat slats
  const seatDepth = zFront - zRearSeat - 0.02;
  const seatSlatCount = 5;
  const seatSlatGap = 0.012;
  const seatSlatD = (seatDepth - seatSlatGap * (seatSlatCount - 1)) / seatSlatCount;
  const seatStartZ = zRearSeat + 0.01 + seatSlatD / 2;

  for (let i = 0; i < seatSlatCount; i++) {
    const z = seatStartZ + i * (seatSlatD + seatSlatGap);
    addMesh(
      new THREE.BoxGeometry(SLAT_W, SLAT_T, seatSlatD),
      woodMat,
      `seat_slat_${i + 1}`,
      0,
      SEAT_H + SLAT_T / 2 - 0.005,
      z
    );
  }

  // 5 Backrest slats
  const backSlatCount = 5;
  const backSlatH = 0.056;
  const backSlatGap = 0.014;
  const backStartY = SEAT_H + 0.075;

  for (let i = 0; i < backSlatCount; i++) {
    const dy = i * (backSlatH + backSlatGap);
    const y = backStartY + dy * Math.cos(BACK_ANGLE);
    const z = zRearSeat + (y - SEAT_H) * Math.tan(BACK_ANGLE) + 0.004;
    addMesh(
      new THREE.BoxGeometry(SLAT_W, backSlatH, SLAT_T),
      woodMat,
      `back_slat_${i + 1}`,
      0,
      y,
      z,
      BACK_ANGLE,
      0,
      0
    );
  }

  return group;
}
