function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_W = 1.95;
  const TOTAL_D = 0.65;
  const MODULES = 3;
  const MOD_W = TOTAL_W / MODULES; // 0.65 m per module
  const MOD_GAP = 0.004;
  const CUSHION_W = MOD_W - MOD_GAP;
  const CUSHION_D = TOTAL_D;

  const FOOT_H = 0.015;
  const FOOT_R = 0.018;

  const SEAT_H = 0.14;
  const SEAT_BEVEL = 0.022;
  const SEAT_CORNER_R = 0.04;

  const BACK_W = CUSHION_W - 0.006;
  const BACK_H = 0.22;
  const BACK_D = 0.135;
  const BACK_BEVEL = 0.022;
  const BACK_CORNER_R = 0.035;
  const BACK_TILT = -0.14; // radians, leans back toward -Z

  const PIPE_R = 0.005;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8b8985,
    roughness: 0.9,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x7b7975,
    roughness: 0.85,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Helper: rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  // Helper: closed piping loop along rounded rectangle perimeter
  function createPipingGeometry(w, d, r, tubeR) {
    const hw = w / 2;
    const hd = d / 2;
    const pts = [];
    const corners = [
      { cx: hw - r, cz: hd - r, a0: 0, a1: Math.PI / 2 },
      { cx: -hw + r, cz: hd - r, a0: Math.PI / 2, a1: Math.PI },
      { cx: -hw + r, cz: -hd + r, a0: Math.PI, a1: (3 * Math.PI) / 2 },
      { cx: hw - r, cz: -hd + r, a0: (3 * Math.PI) / 2, a1: 2 * Math.PI },
    ];
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const a = c.a0 + ((c.a1 - c.a0) * s) / steps;
        pts.push(new THREE.Vector3(c.cx + Math.cos(a) * r, 0, c.cz + Math.sin(a) * r));
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 48, tubeR, 8, true);
  }

  // Shared geometries
  const seatShape = createRoundedRectShape(
    CUSHION_W - SEAT_BEVEL * 2,
    CUSHION_D - SEAT_BEVEL * 2,
    SEAT_CORNER_R
  );
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_H - SEAT_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: SEAT_BEVEL,
    bevelSize: SEAT_BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  seatGeo.rotateX(Math.PI / 2);
  seatGeo.center();

  const seatPipeGeo = createPipingGeometry(
    CUSHION_W - SEAT_BEVEL * 0.5,
    CUSHION_D - SEAT_BEVEL * 0.5,
    SEAT_CORNER_R + SEAT_BEVEL * 0.75,
    PIPE_R
  );

  const backShape = createRoundedRectShape(
    BACK_W - BACK_BEVEL * 2,
    BACK_H - BACK_BEVEL * 2,
    BACK_CORNER_R
  );
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_D - BACK_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BACK_BEVEL,
    bevelSize: BACK_BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  backGeo.center();

  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.85, FOOT_H, 12);

  // Build 3 modular units
  for (let i = 0; i < MODULES; i++) {
    const modX = (i - 1) * MOD_W;
    const modName = `module_${i + 1}`;

    // Base seat cushion
    const seatMesh = new THREE.Mesh(seatGeo, fabricMat);
    seatMesh.name = `${modName}_seat_cushion`;
    seatMesh.position.set(modX, FOOT_H + SEAT_H / 2, 0);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    group.add(seatMesh);

    // Seat top piping
    const pipeMesh = new THREE.Mesh(seatPipeGeo, pipingMat);
    pipeMesh.name = `${modName}_seat_piping`;
    pipeMesh.position.set(modX, FOOT_H + SEAT_H - SEAT_BEVEL * 0.35, 0);
    pipeMesh.castShadow = true;
    pipeMesh.receiveShadow = true;
    group.add(pipeMesh);

    // Backrest cushion
    const backMesh = new THREE.Mesh(backGeo, fabricMat);
    backMesh.name = `${modName}_back_cushion`;
    const backZ = -CUSHION_D / 2 + BACK_D / 2 + 0.015;
    const backY = FOOT_H + SEAT_H + BACK_H / 2 - 0.018;
    backMesh.position.set(modX, backY, backZ);
    backMesh.rotation.x = BACK_TILT;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    group.add(backMesh);

    // 4 low-profile feet per module
    const footOffsetX = CUSHION_W / 2 - 0.055;
    const footOffsetZ = CUSHION_D / 2 - 0.055;
    const footPositions = [
      [-footOffsetX, -footOffsetZ],
      [footOffsetX, -footOffsetZ],
      [-footOffsetX, footOffsetZ],
      [footOffsetX, footOffsetZ],
    ];
    for (let f = 0; f < footPositions.length; f++) {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.name = `${modName}_foot_${f + 1}`;
      foot.position.set(
        modX + footPositions[f][0],
        FOOT_H / 2,
        footPositions[f][1]
      );
      foot.castShadow = true;
      foot.receiveShadow = true;
      group.add(foot);
    }
  }

  // Subtle side fabric tab detail on the outer right module
  const tabGeo = new THREE.BoxGeometry(0.008, 0.018, 0.085);
  const tabMesh = new THREE.Mesh(tabGeo, pipingMat);
  tabMesh.name = 'right_side_fabric_tab';
  tabMesh.position.set(TOTAL_W / 2 - 0.002, FOOT_H + SEAT_H * 0.45, -CUSHION_D * 0.25);
  tabMesh.castShadow = true;
  tabMesh.receiveShadow = true;
  group.add(tabMesh);

  return group;
}
