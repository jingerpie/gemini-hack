function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.50;
  const D = 0.42;
  const H = 0.46;
  const CUSHION_H = 0.06;
  const SEAT_THICK = 0.028;
  const SEAT_TOP_Y = H - CUSHION_H; // 0.40
  const SEAT_BOT_Y = SEAT_TOP_Y - SEAT_THICK; // 0.372

  const LEG_W = 0.042;
  const LEG_D = 0.042;
  const LEG_X_TOP = W / 2 - 0.16; // 0.59
  const LEG_X_BOT = W / 2 - 0.11; // 0.64 (slight outward splay in X)
  const LEG_Z_TOP = D / 2 - 0.075; // 0.135
  const LEG_Z_BOT = D / 2 - 0.025; // 0.185 (A-frame splay in Z)

  const STRETCHER_Y = 0.13;
  const STRETCHER_H = 0.036;
  const STRETCHER_T = 0.026;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a477,
    roughness: 0.62,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe8e3d9,
    roughness: 0.88,
    metalness: 0.0,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0xdfd9cd,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded rectangle shape
  function roundedRectShape(w, d, r) {
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

  // 1. Seat plank
  const seatShape = roundedRectShape(W - 0.008, D - 0.008, 0.012);
  const seatGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  seatGeom.rotateX(-Math.PI / 2);
  const seatMesh = addMesh(seatGeom, oakMat, 'seat_plank');
  seatMesh.position.y = SEAT_BOT_Y + 0.004;

  // 2. Under-seat longitudinal aprons
  const apronW = LEG_X_TOP * 2 + LEG_W;
  const apronH = 0.042;
  const apronT = 0.022;
  const apronZ = LEG_Z_TOP - LEG_D * 0.35;
  const apronGeom = new THREE.BoxGeometry(apronW, apronH, apronT);

  const apronFront = addMesh(apronGeom, oakMat, 'apron_front');
  apronFront.position.set(0, SEAT_BOT_Y - apronH / 2 + 0.002, apronZ);

  const apronBack = addMesh(apronGeom, oakMat, 'apron_back');
  apronBack.position.set(0, SEAT_BOT_Y - apronH / 2 + 0.002, -apronZ);

  // 3. Four splayed legs
  function createLeg(sx, sz, name) {
    const pTop = new THREE.Vector3(sx * LEG_X_TOP, SEAT_BOT_Y + 0.005, sz * LEG_Z_TOP);
    const pBot = new THREE.Vector3(sx * LEG_X_BOT, 0, sz * LEG_Z_BOT);
    const dir = new THREE.Vector3().subVectors(pBot, pTop);
    const len = dir.length();

    const legGeom = new THREE.BoxGeometry(LEG_W, len, LEG_D);
    const leg = addMesh(legGeom, oakMat, name);

    const mid = new THREE.Vector3().addVectors(pTop, pBot).multiplyScalar(0.5);
    leg.position.copy(mid);

    const up = new THREE.Vector3(0, -1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    leg.quaternion.copy(quat);
    return { pTop, pBot };
  }

  createLeg(-1, 1, 'leg_front_left');
  createLeg(1, 1, 'leg_front_right');
  createLeg(-1, -1, 'leg_back_left');
  createLeg(1, -1, 'leg_back_right');

  // 4. Side stretchers (connecting front and back legs at each end)
  const tStretcher = STRETCHER_Y / (SEAT_BOT_Y + 0.005);
  const stretcherX = LEG_X_BOT + (LEG_X_TOP - LEG_X_BOT) * tStretcher;
  const stretcherZ = LEG_Z_BOT + (LEG_Z_TOP - LEG_Z_BOT) * tStretcher;
  const sideStretcherLen = stretcherZ * 2 + LEG_D * 0.6;

  const sideStretcherGeom = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, sideStretcherLen);

  const stretcherLeft = addMesh(sideStretcherGeom, oakMat, 'stretcher_left');
  stretcherLeft.position.set(-stretcherX, STRETCHER_Y, 0);

  const stretcherRight = addMesh(sideStretcherGeom, oakMat, 'stretcher_right');
  stretcherRight.position.set(stretcherX, STRETCHER_Y, 0);

  // 5. Central longitudinal stretcher
  const centerStretcherLen = stretcherX * 2;
  const centerStretcherGeom = new THREE.BoxGeometry(centerStretcherLen, STRETCHER_H, STRETCHER_T);
  const stretcherCenter = addMesh(centerStretcherGeom, oakMat, 'stretcher_center');
  stretcherCenter.position.set(0, STRETCHER_Y, 0);

  // 6. Upholstered cushion
  const cushionBevel = 0.016;
  const cushionShape = roundedRectShape(W - 0.024, D - 0.024, 0.022);
  const cushionGeom = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - cushionBevel * 2,
    bevelEnabled: true,
    bevelThickness: cushionBevel,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  cushionGeom.rotateX(-Math.PI / 2);
  const cushion = addMesh(cushionGeom, fabricMat, 'cushion_main');
  cushion.position.y = SEAT_TOP_Y + cushionBevel - 0.002;

  // 7. Cushion perimeter piping / seam
  const pipingPts = [];
  const pw = (W - 0.004) / 2;
  const pd = (D - 0.004) / 2;
  const pr = 0.026;
  const py = SEAT_TOP_Y + 0.014;
  const cornerSteps = 4;

  const corners = [
    { cx: pw - pr, cz: pd - pr, a0: 0, a1: Math.PI / 2 },
    { cx: -pw + pr, cz: pd - pr, a0: Math.PI / 2, a1: Math.PI },
    { cx: -pw + pr, cz: -pd + pr, a0: Math.PI, a1: Math.PI * 1.5 },
    { cx: pw - pr, cz: -pd + pr, a0: Math.PI * 1.5, a1: Math.PI * 2 },
  ];
  for (let c = 0; c < corners.length; c++) {
    const corner = corners[c];
    for (let s = 0; s <= cornerSteps; s++) {
      const a = corner.a0 + (corner.a1 - corner.a0) * (s / cornerSteps);
      pipingPts.push(new THREE.Vector3(corner.cx + Math.cos(a) * pr, py, corner.cz + Math.sin(a) * pr));
    }
  }
  const pipingCurve = new THREE.CatmullRomCurve3(pipingPts, true);
  const pipingGeom = new THREE.TubeGeometry(pipingCurve, 48, 0.0035, 8, true);
  addMesh(pipingGeom, strapMat, 'cushion_piping');

  // 8. Two fabric straps wrapping over the front edge of the seat plank
  function createStrap(xPos, name) {
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xPos, SEAT_TOP_Y + 0.012, D / 2 - 0.015),
      new THREE.Vector3(xPos, SEAT_TOP_Y + 0.002, D / 2 + 0.004),
      new THREE.Vector3(xPos, SEAT_BOT_Y - 0.006, D / 2 + 0.002),
      new THREE.Vector3(xPos, SEAT_BOT_Y - 0.032, apronZ + apronT / 2),
      new THREE.Vector3(xPos, SEAT_BOT_Y - 0.035, apronZ - apronT / 2),
    ]);
    const strapGeom = new THREE.TubeGeometry(strapCurve, 16, 0.007, 6, false);
    strapGeom.scale(1.6, 1, 1); // flatten slightly into a strap
    const strap = addMesh(strapGeom, strapMat, name);
    // Re-center X after scaling geometry
    strap.position.x = xPos * (1 - 1.6);
  }

  createStrap(-LEG_X_TOP + 0.11, 'strap_front_left');
  createStrap(LEG_X_TOP - 0.11, 'strap_front_right');

  return group;
}
