function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions for a children's reading armchair (meters)
  const W = 0.72;           // total width
  const H = 0.72;           // total height
  const D = 0.68;           // total depth
  const SEAT_H = 0.34;      // top of seat cushion
  const CUSHION_H = 0.16;   // thick seat cushion height
  const ARM_H = 0.43;       // top of armrests
  const HIDDEN_BASE_H = 0.045; // recessed base so chair appears to float
  const APRON_TOP = 0.19;   // top of lower tub apron (under seat cushion)

  const SEAT_W = 0.46;
  const SEAT_D = 0.48;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xebd0bd,
    roughness: 0.88,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xe3c5b0,
    roughness: 0.9,
    metalness: 0.0
  });

  const hiddenBaseMat = new THREE.MeshStandardMaterial({
    color: 0x3a322d,
    roughness: 0.95,
    metalness: 0.0
  });

  // Helper to create a rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const cr = Math.min(r, hw, hh);
    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    shape.lineTo(hw, hh - cr);
    shape.quadraticCurveTo(hw, hh, hw - cr, hh);
    shape.lineTo(-hw + cr, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    shape.lineTo(-hw, -hh + cr);
    shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
    return shape;
  }

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Hidden recessed base (touches y = 0, inset so the chair looks like it floats)
  const plinthGeo = new THREE.BoxGeometry(W - 0.22, HIDDEN_BASE_H, D - 0.20);
  addMesh(plinthGeo, hiddenBaseMat, 'hidden_base', [0, HIDDEN_BASE_H / 2, -0.02]);

  // 2. Lower tub apron (smooth rounded front/bottom body under the seat cushion)
  const apronBevel = 0.04;
  const apronH = APRON_TOP - HIDDEN_BASE_H;
  const apronShape = roundedRectShape(W - 0.14 - apronBevel * 2, D - 0.10 - apronBevel * 2, 0.06);
  const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
    depth: apronH - apronBevel * 2,
    bevelEnabled: true,
    bevelThickness: apronBevel,
    bevelSize: apronBevel,
    bevelSegments: 8,
    curveSegments: 16
  });
  apronGeo.rotateX(Math.PI / 2);
  addMesh(apronGeo, fabricMat, 'tub_apron', [0, APRON_TOP - apronBevel, 0.0]);

  // 3. Thick seat cushion (plush rounded cushion)
  const seatBevel = 0.038;
  const seatShape = roundedRectShape(SEAT_W - seatBevel * 2, SEAT_D - seatBevel * 2, 0.05);
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: CUSHION_H - seatBevel * 2,
    bevelEnabled: true,
    bevelThickness: seatBevel,
    bevelSize: seatBevel,
    bevelSegments: 8,
    curveSegments: 16
  });
  seatGeo.rotateX(Math.PI / 2);
  addMesh(seatGeo, fabricMat, 'seat_cushion', [0, SEAT_H - seatBevel, 0.055]);

  // Seat cushion piping (top & bottom welt)
  function createPipingLoop(w, d, r, yPos, name) {
    const hw = w / 2;
    const hd = d / 2;
    const pts = [
      new THREE.Vector3(-hw + r, yPos, hd),
      new THREE.Vector3(0, yPos, hd + 0.004),
      new THREE.Vector3(hw - r, yPos, hd),
      new THREE.Vector3(hw, yPos, hd - r),
      new THREE.Vector3(hw, yPos, -hd + r),
      new THREE.Vector3(hw - r, yPos, -hd),
      new THREE.Vector3(-hw + r, yPos, -hd),
      new THREE.Vector3(-hw, yPos, -hd + r),
      new THREE.Vector3(-hw, yPos, hd - r),
      new THREE.Vector3(-hw + r, yPos, hd)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.0045, 8, true);
    addMesh(tubeGeo, pipingMat, name, [0, 0, 0.055]);
  }

  createPipingLoop(SEAT_W - 0.01, SEAT_D - 0.01, 0.06, SEAT_H - 0.022, 'seat_piping_top');
  createPipingLoop(SEAT_W - 0.015, SEAT_D - 0.015, 0.06, SEAT_H - CUSHION_H + 0.022, 'seat_piping_bottom');

  // 4. Backrest (two plush horizontal sections creating the signature horizontal seam)
  const backW = SEAT_W - 0.01;
  const backZ = -D / 2 + 0.14;
  const backTilt = -0.14; // slight recline

  // Lower backrest cushion
  const backLowerH = 0.21;
  const backLowerShape = roundedRectShape(backW - 0.04, backLowerH - 0.04, 0.03);
  const backLowerGeo = new THREE.ExtrudeGeometry(backLowerShape, {
    depth: 0.10,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 6,
    curveSegments: 12
  });
  addMesh(backLowerGeo, fabricMat, 'backrest_lower', [0, SEAT_H + 0.03, backZ - 0.04], [backTilt, 0, 0]);

  // Upper backrest cushion
  const backUpperH = 0.22;
  const backUpperShape = roundedRectShape(backW - 0.03, backUpperH - 0.04, 0.035);
  const backUpperGeo = new THREE.ExtrudeGeometry(backUpperShape, {
    depth: 0.10,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 6,
    curveSegments: 12
  });
  addMesh(backUpperGeo, fabricMat, 'backrest_upper', [0, SEAT_H + backLowerH + 0.02, backZ - 0.07], [backTilt, 0, 0]);

  // 5. Continuous sculpted side arms & wings (one smooth piece per side)
  // Profile in Z-Y plane (x in shape = +Z, y in shape = +Y)
  const sideShape = new THREE.Shape();
  const zFront = D / 2 - 0.07;
  const zBack = -D / 2 + 0.09;
  const yBot = HIDDEN_BASE_H + 0.035;
  const yArm = ARM_H - 0.045;
  const yTop = H - 0.045;

  sideShape.moveTo(zFront - 0.06, yBot);
  sideShape.quadraticCurveTo(zFront + 0.02, yBot, zFront + 0.02, yBot + 0.09);
  sideShape.lineTo(zFront, yArm - 0.05);
  sideShape.quadraticCurveTo(zFront - 0.01, yArm, zFront - 0.08, yArm);
  // Curve smoothly from armrest up into the wing
  sideShape.bezierCurveTo(
    0.04, yArm,
    -0.02, yArm + 0.06,
    -0.05, yTop - 0.06
  );
  sideShape.quadraticCurveTo(-0.07, yTop, -0.14, yTop);
  sideShape.lineTo(zBack + 0.04, yTop - 0.02);
  sideShape.quadraticCurveTo(zBack, yTop - 0.03, zBack, yTop - 0.10);
  sideShape.lineTo(zBack - 0.02, yBot + 0.08);
  sideShape.quadraticCurveTo(zBack - 0.02, yBot, zBack + 0.06, yBot);
  sideShape.closePath();

  const armBevel = 0.045;
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: armBevel,
    bevelSize: armBevel,
    bevelSegments: 10,
    curveSegments: 20
  });
  // Rotate so shape X -> +Z, shape Y -> +Y, extrude depth -> +X
  sideGeo.rotateY(-Math.PI / 2);
  sideGeo.translate(0.025, 0, 0);

  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? 'left' : 'right';
    const xPos = side * (W / 2 - 0.095);
    addMesh(
      sideGeo,
      fabricMat,
      `${sideName}_wing_arm`,
      [xPos, 0, 0],
      [0, 0, -side * 0.075]
    );
  });

  // 6. Back outer shell (smooth back panel connecting the two wings)
  const backShellShape = roundedRectShape(W - 0.18, H - 0.14, 0.08);
  const backShellGeo = new THREE.ExtrudeGeometry(backShellShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 6,
    curveSegments: 16
  });
  addMesh(backShellGeo, fabricMat, 'back_shell', [0, H / 2 - 0.01, -D / 2 + 0.05], [backTilt, 0, 0]);

  return group;
}
