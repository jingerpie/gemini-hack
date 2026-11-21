function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.00;
  const D = 0.90;
  const H = 0.78;
  const SEAT_H = 0.42;

  const ARM_W = 0.14;
  const ARM_H = 0.44;
  const ARM_BOTTOM_Y = 0.14;
  const ARM_D = D;

  const INNER_W = W - ARM_W * 2;
  const MOD_GAP = 0.012;
  const MOD_W = (INNER_W - MOD_GAP) / 2;

  const LEG_T = 0.036;
  const RAIL_H = 0.048;
  const RAIL_Y = 0.21;
  const RUNNER_Y = 0.025;

  const SEAT_THICK = SEAT_H - (RAIL_Y + RAIL_H / 2);
  const SEAT_D = D - 0.06;
  const BACK_THICK = 0.16;
  const BACK_H = 0.42;
  const BACK_PANEL_T = 0.05;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcfc2b0,
    roughness: 0.88,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    roughness: 0.42,
    metalness: 0.65
  });

  const boltMat = new THREE.MeshStandardMaterial({
    color: 0x45484a,
    roughness: 0.35,
    metalness: 0.8
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

  function createRoundedBoxGeo(w, h, d, radius, bevel = 0.015) {
    const bw = w - bevel * 2;
    const bh = h - bevel * 2;
    const r = Math.min(radius, bw / 2, bh / 2);
    const shape = new THREE.Shape();
    const x0 = -bw / 2;
    const y0 = -bh / 2;

    shape.moveTo(x0 + r, y0);
    shape.lineTo(x0 + bw - r, y0);
    shape.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + r);
    shape.lineTo(x0 + bw, y0 + bh - r);
    shape.quadraticCurveTo(x0 + bw, y0 + bh, x0 + bw - r, y0 + bh);
    shape.lineTo(x0 + r, y0 + bh);
    shape.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh - r);
    shape.lineTo(x0, y0 + r);
    shape.quadraticCurveTo(x0, y0, x0 + r, y0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3
    });
    geo.center();
    return geo;
  }

  // Build metal frame for each module
  const frameZFront = D / 2 - LEG_T / 2 - 0.02;
  const frameZBack = -D / 2 + LEG_T / 2 + 0.04;
  const frameSpanZ = frameZFront - frameZBack;
  const legH = RAIL_Y + RAIL_H / 2;

  const legGeo = new THREE.BoxGeometry(LEG_T, legH, LEG_T);
  const runnerGeo = new THREE.BoxGeometry(LEG_T, LEG_T, frameSpanZ);
  const railGeo = new THREE.BoxGeometry(MOD_W - LEG_T * 2, RAIL_H, LEG_T);
  const boltGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12);
  boltGeo.rotateX(Math.PI / 2);

  const moduleCenters = [
    -(MOD_W / 2 + MOD_GAP / 2),
    (MOD_W / 2 + MOD_GAP / 2)
  ];
  const moduleNames = ['left_module', 'right_module'];

  moduleCenters.forEach((cx, idx) => {
    const prefix = moduleNames[idx];
    const leftLegX = cx - MOD_W / 2 + LEG_T / 2;
    const rightLegX = cx + MOD_W / 2 - LEG_T / 2;

    // Front rail
    addMesh(railGeo, metalMat, `${prefix}_front_rail`, cx, RAIL_Y, frameZFront);

    // Left side leg assembly
    addMesh(legGeo, metalMat, `${prefix}_left_leg_front`, leftLegX, legH / 2, frameZFront);
    addMesh(legGeo, metalMat, `${prefix}_left_leg_back`, leftLegX, legH / 2, frameZBack);
    addMesh(runnerGeo, metalMat, `${prefix}_left_runner`, leftLegX, RUNNER_Y, (frameZFront + frameZBack) / 2);

    // Right side leg assembly
    addMesh(legGeo, metalMat, `${prefix}_right_leg_front`, rightLegX, legH / 2, frameZFront);
    addMesh(legGeo, metalMat, `${prefix}_right_leg_back`, rightLegX, legH / 2, frameZBack);
    addMesh(runnerGeo, metalMat, `${prefix}_right_runner`, rightLegX, RUNNER_Y, (frameZFront + frameZBack) / 2);

    // Decorative front rail bolts
    addMesh(boltGeo, boltMat, `${prefix}_bolt_left`, leftLegX + LEG_T + 0.03, RAIL_Y, frameZFront + LEG_T / 2 + 0.002);
    addMesh(boltGeo, boltMat, `${prefix}_bolt_right`, rightLegX - LEG_T - 0.03, RAIL_Y, frameZFront + LEG_T / 2 + 0.002);
  });

  // Seat cushions
  const seatGeo = createRoundedBoxGeo(MOD_W, SEAT_THICK, SEAT_D, 0.035, 0.02);
  const seatY = RAIL_Y + RAIL_H / 2 + SEAT_THICK / 2 - 0.005;
  const seatZ = (D - SEAT_D) / 2 - 0.01;

  addMesh(seatGeo, fabricMat, 'left_seat_cushion', moduleCenters[0], seatY, seatZ);
  addMesh(seatGeo, fabricMat, 'right_seat_cushion', moduleCenters[1], seatY, seatZ);

  // Backrest cushions
  const backGeo = createRoundedBoxGeo(MOD_W, BACK_H, BACK_THICK, 0.04, 0.022);
  const backY = SEAT_H + BACK_H / 2 - 0.06;
  const backZ = -D / 2 + BACK_PANEL_T + BACK_THICK / 2 + 0.02;

  addMesh(backGeo, fabricMat, 'left_back_cushion', moduleCenters[0], backY, backZ, -0.1, 0, 0);
  addMesh(backGeo, fabricMat, 'right_back_cushion', moduleCenters[1], backY, backZ, -0.1, 0, 0);

  // Backrest support panel
  const backPanelH = 0.42;
  const backPanelGeo = createRoundedBoxGeo(INNER_W, backPanelH, BACK_PANEL_T, 0.015, 0.01);
  addMesh(backPanelGeo, fabricMat, 'back_panel', 0, RAIL_Y + backPanelH / 2, -D / 2 + BACK_PANEL_T / 2 + 0.01);

  // Armrests
  const armGeo = createRoundedBoxGeo(ARM_W, ARM_H, ARM_D, 0.025, 0.015);
  const armY = ARM_BOTTOM_Y + ARM_H / 2;
  const armX = W / 2 - ARM_W / 2;

  addMesh(armGeo, fabricMat, 'left_armrest', -armX, armY, 0);
  addMesh(armGeo, fabricMat, 'right_armrest', armX, armY, 0);

  return group;
}
