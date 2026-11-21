function build(THREE) {
  const group = new THREE.Group();

  const W = 0.22;
  const H = 0.52;
  const D = 0.065;
  const WALL_T = 0.008;
  const FRONT_T = 0.016;
  const RECESS_H = 0.265;
  const UPPER_H = H - RECESS_H - WALL_T;
  const DIAL_Y = RECESS_H + WALL_T + UPPER_H * 0.5;
  const DIAL_R = 0.088;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8c9092,
    roughness: 0.68,
    metalness: 0.05
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xd4d6d4,
    roughness: 0.35,
    metalness: 0.45
  });

  const darkTickMat = new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    roughness: 0.5,
    metalness: 0.1
  });

  const lightTickMat = new THREE.MeshStandardMaterial({
    color: 0xd8dad8,
    roughness: 0.4,
    metalness: 0.3
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Back panel
  addMesh(
    new THREE.BoxGeometry(W, H, WALL_T),
    bodyMat,
    "back_panel",
    0,
    H / 2,
    -D / 2 + WALL_T / 2
  );

  // Left & Right walls
  addMesh(
    new THREE.BoxGeometry(WALL_T, H, D),
    bodyMat,
    "left_wall",
    -W / 2 + WALL_T / 2,
    H / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(WALL_T, H, D),
    bodyMat,
    "right_wall",
    W / 2 - WALL_T / 2,
    H / 2,
    0
  );

  // Bottom, Top, and Divider walls
  const innerW = W - 2 * WALL_T;
  addMesh(
    new THREE.BoxGeometry(innerW, WALL_T, D),
    bodyMat,
    "bottom_wall",
    0,
    WALL_T / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(innerW, WALL_T, D),
    bodyMat,
    "top_wall",
    0,
    H - WALL_T / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(innerW, WALL_T, D),
    bodyMat,
    "divider_wall",
    0,
    RECESS_H + WALL_T / 2,
    0
  );

  // Upper front panel with circular cutout
  const panelShape = new THREE.Shape();
  panelShape.moveTo(-innerW / 2, -UPPER_H / 2);
  panelShape.lineTo(innerW / 2, -UPPER_H / 2);
  panelShape.lineTo(innerW / 2, UPPER_H / 2);
  panelShape.lineTo(-innerW / 2, UPPER_H / 2);
  panelShape.closePath();

  const holePath = new THREE.Path();
  holePath.absarc(0, 0, DIAL_R, 0, Math.PI * 2, true);
  panelShape.holes.push(holePath);

  const frontGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: FRONT_T,
    bevelEnabled: false,
    curveSegments: 32
  });
  addMesh(
    frontGeo,
    bodyMat,
    "upper_front_panel",
    0,
    DIAL_Y,
    D / 2 - FRONT_T
  );

  // Recessed dial face
  const dialZ = D / 2 - FRONT_T;
  addMesh(
    new THREE.BoxGeometry(innerW, UPPER_H, WALL_T),
    bodyMat,
    "dial_face",
    0,
    DIAL_Y,
    dialZ - WALL_T / 2
  );

  // 12 Tick marks
  const tickR = DIAL_R * 0.82;
  const tickLen = 0.013;
  const tickW = 0.0022;
  const tickD = 0.0015;
  const tickGeo = new THREE.BoxGeometry(tickW, tickLen, tickD);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isCardinal = i % 3 === 0;
    const tx = Math.sin(angle) * tickR;
    const ty = DIAL_Y + Math.cos(angle) * tickR;
    addMesh(
      tickGeo,
      isCardinal ? lightTickMat : darkTickMat,
      `tick_mark_${i}`,
      tx,
      ty,
      dialZ + tickD / 2,
      0,
      0,
      -angle
    );
  }

  // Clock hands (approx 10:10)
  const hourAngle = (10 / 12) * Math.PI * 2;
  const hourLen = DIAL_R * 0.54;
  const hourGeo = new THREE.BoxGeometry(0.0055, hourLen, 0.0025);
  hourGeo.translate(0, hourLen / 2 - 0.006, 0);
  addMesh(
    hourGeo,
    handMat,
    "hour_hand",
    0,
    DIAL_Y,
    dialZ + 0.003,
    0,
    0,
    -hourAngle
  );

  const minAngle = (2 / 12) * Math.PI * 2;
  const minLen = DIAL_R * 0.78;
  const minGeo = new THREE.BoxGeometry(0.004, minLen, 0.0025);
  minGeo.translate(0, minLen / 2 - 0.008, 0);
  addMesh(
    minGeo,
    handMat,
    "minute_hand",
    0,
    DIAL_Y,
    dialZ + 0.0055,
    0,
    0,
    -minAngle
  );

  // Center pin
  addMesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.006, 16),
    handMat,
    "center_pin",
    0,
    DIAL_Y,
    dialZ + 0.005,
    Math.PI / 2,
    0,
    0
  );

  // Pendulum
  const bobR = 0.036;
  const bobY = WALL_T + 0.072;
  const rodTopY = RECESS_H;
  const rodLen = rodTopY - bobY;
  const pendZ = -0.004;

  addMesh(
    new THREE.CylinderGeometry(0.0028, 0.0028, rodLen, 12),
    bodyMat,
    "pendulum_rod",
    0,
    bobY + rodLen / 2,
    pendZ
  );

  addMesh(
    new THREE.CylinderGeometry(bobR, bobR, 0.012, 32),
    bodyMat,
    "pendulum_bob",
    0,
    bobY,
    pendZ,
    Math.PI / 2,
    0,
    0
  );

  addMesh(
    new THREE.CylinderGeometry(0.0032, 0.0032, 0.007, 12),
    bodyMat,
    "pendulum_nut",
    0,
    bobY - bobR - 0.002,
    pendZ
  );

  return group;
}
