function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.48;          // Overall width at crest rail
  const D = 0.48;          // Overall depth
  const H = 0.84;          // Overall height
  const SEAT_H = 0.45;     // Seat top height
  const SEAT_W = 0.45;     // Seat width
  const SEAT_D = 0.43;     // Seat depth
  const SEAT_T = 0.032;    // Seat thickness
  const LEG_R_TOP = 0.019;
  const LEG_R_BOT = 0.012;
  const STRETCHER_Y = 0.16;
  const RAIL_H = 0.058;
  const RAIL_T = 0.022;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a27,
    roughness: 0.42,
    metalness: 0.04,
  });

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Helper: create a cylinder/tapered rod between two 3D points
  function createRodBetween(p1, p2, r1, r2, radialSegs, mat, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(r2, r1, len, radialSegs);
    const mesh = addMesh(geo, mat, name);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  }

  // 1. Seat (rounded D-shape / oval-ish slab)
  const seatShape = new THREE.Shape();
  const hw = SEAT_W * 0.5 - 0.015;
  const hd = SEAT_D * 0.5 - 0.015;
  seatShape.moveTo(-hw * 0.72, -hd);
  seatShape.quadraticCurveTo(0, -hd * 1.08, hw * 0.72, -hd);
  seatShape.quadraticCurveTo(hw * 1.05, -hd * 0.9, hw, 0);
  seatShape.quadraticCurveTo(hw * 0.98, hd * 0.92, hw * 0.65, hd);
  seatShape.quadraticCurveTo(0, hd * 1.08, -hw * 0.65, hd);
  seatShape.quadraticCurveTo(-hw * 0.98, hd * 0.92, -hw, 0);
  seatShape.quadraticCurveTo(-hw * 1.05, -hd * 0.9, -hw * 0.72, -hd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_T - 0.014,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.014,
    bevelSegments: 4,
    curveSegments: 20,
  });
  seatGeo.rotateX(Math.PI / 2);
  const seatMesh = addMesh(seatGeo, woodMat, 'seat');
  seatMesh.position.set(0, SEAT_H - 0.007, 0.01);

  // 2. Four splayed tapered legs
  const legTopY = SEAT_H - SEAT_T + 0.006;
  const legBotY = 0;

  const legConfigs = [
    {
      name: 'leg_front_left',
      top: new THREE.Vector3(-0.145, legTopY, 0.145),
      bot: new THREE.Vector3(-0.205, legBotY, 0.185),
    },
    {
      name: 'leg_front_right',
      top: new THREE.Vector3(0.145, legTopY, 0.145),
      bot: new THREE.Vector3(0.205, legBotY, 0.185),
    },
    {
      name: 'leg_back_left',
      top: new THREE.Vector3(-0.135, legTopY, -0.125),
      bot: new THREE.Vector3(-0.175, legBotY, -0.195),
    },
    {
      name: 'leg_back_right',
      top: new THREE.Vector3(0.135, legTopY, -0.125),
      bot: new THREE.Vector3(0.175, legBotY, -0.195),
    },
  ];

  const stretcherPoints = {};
  const tStretcher = (STRETCHER_Y - legBotY) / (legTopY - legBotY);

  legConfigs.forEach((cfg) => {
    createRodBetween(cfg.bot, cfg.top, LEG_R_BOT, LEG_R_TOP, 16, woodMat, cfg.name);
    stretcherPoints[cfg.name] = new THREE.Vector3().lerpVectors(cfg.bot, cfg.top, tStretcher);
  });

  // 3. H-Stretcher (left, right, and center cross-stretcher)
  const sideStretcherR = 0.011;
  createRodBetween(
    stretcherPoints.leg_front_left,
    stretcherPoints.leg_back_left,
    sideStretcherR,
    sideStretcherR,
    12,
    woodMat,
    'stretcher_left'
  );
  createRodBetween(
    stretcherPoints.leg_front_right,
    stretcherPoints.leg_back_right,
    sideStretcherR,
    sideStretcherR,
    12,
    woodMat,
    'stretcher_right'
  );

  const midLeft = new THREE.Vector3().lerpVectors(
    stretcherPoints.leg_front_left,
    stretcherPoints.leg_back_left,
    0.52
  );
  const midRight = new THREE.Vector3().lerpVectors(
    stretcherPoints.leg_front_right,
    stretcherPoints.leg_back_right,
    0.52
  );
  createRodBetween(midLeft, midRight, 0.012, 0.012, 12, woodMat, 'stretcher_center');

  // 4. Curved Crest Rail (top backrest)
  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.46, H - RAIL_H * 0.5, -0.185),
    new THREE.Vector3(-W * 0.24, H - RAIL_H * 0.52, -0.225),
    new THREE.Vector3(0, H - RAIL_H * 0.53, -0.238),
    new THREE.Vector3(W * 0.24, H - RAIL_H * 0.52, -0.225),
    new THREE.Vector3(W * 0.46, H - RAIL_H * 0.5, -0.185),
  ]);

  // Build crest rail using ExtrudeGeometry along a 2D arc, then rotate upright
  const railArcShape = new THREE.Shape();
  const rw = W * 0.47;
  const rDepth = 0.055;
  railArcShape.moveTo(-rw, 0);
  railArcShape.quadraticCurveTo(0, rDepth, rw, 0);
  railArcShape.lineTo(rw - 0.004, -RAIL_T);
  railArcShape.quadraticCurveTo(0, rDepth - RAIL_T, -rw + 0.004, -RAIL_T);
  railArcShape.closePath();

  const railGeo = new THREE.ExtrudeGeometry(railArcShape, {
    depth: RAIL_H - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 24,
  });
  railGeo.rotateX(Math.PI / 2);
  const railMesh = addMesh(railGeo, woodMat, 'crest_rail');
  railMesh.position.set(0, H - 0.004, -0.245);
  railMesh.rotation.x = -0.14; // slight backward tilt

  // 5. Seven Backrest Spindles
  const numSpindles = 7;
  for (let i = 0; i < numSpindles; i++) {
    const t = i / (numSpindles - 1); // 0 to 1
    const angle = (t - 0.5) * 2;     // -1 to 1

    const isOuter = i === 0 || i === numSpindles - 1;
    const rBot = isOuter ? 0.0105 : 0.0085;
    const rTop = isOuter ? 0.012 : 0.0095;

    // Bottom point on seat
    const bx = angle * 0.155;
    const bz = -0.145 + Math.abs(angle) * 0.035;
    const by = SEAT_H - 0.005;

    // Top point into crest rail underside
    const tx = angle * (W * 0.40);
    const tz = -0.232 + Math.abs(angle) * Math.abs(angle) * 0.042;
    const ty = H - RAIL_H * 0.7;

    createRodBetween(
      new THREE.Vector3(bx, by, bz),
      new THREE.Vector3(tx, ty, tz),
      rBot,
      rTop,
      12,
      woodMat,
      `spindle_${i + 1}`
    );
  }

  return group;
}
