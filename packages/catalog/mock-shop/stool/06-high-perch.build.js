function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SEAT_H = 0.75;
  const TOTAL_H = 1.05;
  const SEAT_R = 0.22;
  const LEG_SPREAD_R = 0.275;
  const TUBE_R = 0.013;
  const STRETCHER_H = 0.26;
  const CUSHION_H = 0.045;
  const CUSHION_R = 0.225;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x7b8f74,
    roughness: 0.45,
    metalness: 0.25,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x899a80,
    roughness: 0.88,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.7,
    metalness: 0.1,
  });

  function makeCylinderBetween(p1, p2, rTop, rBot, mat, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 16);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Legs and Foot Glides
  const legAngles = [
    Math.PI * 0.25,
    Math.PI * 0.75,
    Math.PI * 1.25,
    Math.PI * 1.75,
  ];
  const legNames = ['front_right', 'front_left', 'back_left', 'back_right'];
  const legTops = [];
  const legBots = [];

  for (let i = 0; i < 4; i++) {
    const a = legAngles[i];
    const top = new THREE.Vector3(
      Math.cos(a) * SEAT_R,
      SEAT_H - TUBE_R,
      Math.sin(a) * SEAT_R
    );
    const bot = new THREE.Vector3(
      Math.cos(a) * LEG_SPREAD_R,
      0.01,
      Math.sin(a) * LEG_SPREAD_R
    );
    legTops.push(top);
    legBots.push(bot);

    const leg = makeCylinderBetween(
      bot,
      top,
      TUBE_R,
      TUBE_R * 0.88,
      frameMat,
      `leg_${legNames[i]}`
    );
    group.add(leg);

    // Foot glide touching y = 0
    const glideGeo = new THREE.CylinderGeometry(
      TUBE_R * 0.9,
      TUBE_R * 0.95,
      0.014,
      16
    );
    const glide = new THREE.Mesh(glideGeo, footMat);
    glide.position.set(bot.x, 0.007, bot.z);
    glide.name = `foot_glide_${legNames[i]}`;
    glide.castShadow = true;
    glide.receiveShadow = true;
    group.add(glide);
  }

  // 2. Seat Ring
  const seatRingGeo = new THREE.TorusGeometry(SEAT_R, TUBE_R, 16, 32);
  const seatRing = new THREE.Mesh(seatRingGeo, frameMat);
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.y = SEAT_H - TUBE_R;
  seatRing.name = 'seat_ring';
  seatRing.castShadow = true;
  seatRing.receiveShadow = true;
  group.add(seatRing);

  // 3. Footrest Stretchers
  const tStretcher = (STRETCHER_H - 0.01) / (SEAT_H - TUBE_R - 0.01);
  const stretcherPts = [];
  for (let i = 0; i < 4; i++) {
    stretcherPts.push(
      new THREE.Vector3().lerpVectors(legBots[i], legTops[i], tStretcher)
    );
  }
  const stretcherNames = ['front', 'left', 'back', 'right'];
  for (let i = 0; i < 4; i++) {
    const p1 = stretcherPts[i];
    const p2 = stretcherPts[(i + 1) % 4];
    const stretcher = makeCylinderBetween(
      p1,
      p2,
      TUBE_R * 0.85,
      TUBE_R * 0.85,
      frameMat,
      `stretcher_${stretcherNames[i]}`
    );
    group.add(stretcher);
  }

  // 4. Curved Backrest / Armrest Rail
  const railPoints = [];
  const railStart = 0.05;
  const railEnd = -Math.PI - 0.05;
  const railSteps = 24;
  for (let i = 0; i <= railSteps; i++) {
    const u = i / railSteps;
    const theta = railStart + u * (railEnd - railStart);
    // Smooth arch: highest at back (-PI/2), lower at armrest ends
    const backFactor = Math.sin(u * Math.PI);
    const y = SEAT_H + 0.16 + backFactor * (TOTAL_H - TUBE_R - (SEAT_H + 0.16));
    const r = SEAT_R + 0.015 + backFactor * 0.02;
    railPoints.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r)
    );
  }

  const railCurve = new THREE.CatmullRomCurve3(railPoints);
  const railGeo = new THREE.TubeGeometry(railCurve, 32, TUBE_R, 12, false);
  const railMesh = new THREE.Mesh(railGeo, frameMat);
  railMesh.name = 'backrest_rail';
  railMesh.castShadow = true;
  railMesh.receiveShadow = true;
  group.add(railMesh);

  // End caps on backrest rail
  const capGeo = new THREE.SphereGeometry(TUBE_R, 12, 12);
  const rightCap = new THREE.Mesh(capGeo, frameMat);
  rightCap.position.copy(railPoints[0]);
  rightCap.name = 'backrest_cap_right';
  rightCap.castShadow = true;
  rightCap.receiveShadow = true;
  group.add(rightCap);

  const leftCap = new THREE.Mesh(capGeo, frameMat);
  leftCap.position.copy(railPoints[railPoints.length - 1]);
  leftCap.name = 'backrest_cap_left';
  leftCap.castShadow = true;
  leftCap.receiveShadow = true;
  group.add(leftCap);

  // 5. Backrest Spindles (7 spindles fanning from seat ring to backrest rail)
  const numSpindles = 7;
  for (let i = 0; i < numSpindles; i++) {
    const u = 0.08 + (i / (numSpindles - 1)) * 0.84;
    const theta = railStart + u * (railEnd - railStart);
    const bot = new THREE.Vector3(
      Math.cos(theta) * SEAT_R,
      SEAT_H - TUBE_R,
      Math.sin(theta) * SEAT_R
    );
    const top = railCurve.getPointAt(u);
    const spindle = makeCylinderBetween(
      bot,
      top,
      TUBE_R * 0.68,
      TUBE_R * 0.68,
      frameMat,
      `backrest_spindle_${i + 1}`
    );
    group.add(spindle);
  }

  // 6. Seat Cushion (LatheGeometry for soft rounded profile)
  const cushionProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(CUSHION_R - 0.015, 0.0),
    new THREE.Vector2(CUSHION_R, 0.008),
    new THREE.Vector2(CUSHION_R, CUSHION_H - 0.012),
    new THREE.Vector2(CUSHION_R - 0.02, CUSHION_H - 0.002),
    new THREE.Vector2(0.0, CUSHION_H),
  ];
  const cushionGeo = new THREE.LatheGeometry(cushionProfile, 32);
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.y = SEAT_H - 0.004;
  cushion.name = 'seat_cushion';
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  group.add(cushion);

  // Cushion Piping
  const pipingGeo = new THREE.TorusGeometry(CUSHION_R - 0.002, 0.0045, 8, 32);
  const piping = new THREE.Mesh(pipingGeo, cushionMat);
  piping.rotation.x = Math.PI / 2;
  piping.position.y = SEAT_H - 0.004 + CUSHION_H * 0.45;
  piping.name = 'seat_cushion_piping';
  piping.castShadow = true;
  piping.receiveShadow = true;
  group.add(piping);

  return group;
}
