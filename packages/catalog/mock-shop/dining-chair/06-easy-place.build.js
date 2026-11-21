function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.62;
  const D = 0.60;
  const H = 0.80;
  const SEAT_FRAME_H = 0.37;
  const CUSHION_H = 0.065;
  const ARM_H = 0.63;
  const TUBE_R = 0.013;
  const GLIDE_H = 0.012;

  const HALF_W = W / 2;
  const HALF_D = D / 2;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x7d8d77,
    roughness: 0.45,
    metalness: 0.25,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x93a18c,
    roughness: 0.85,
    metalness: 0.0,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.7,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Front legs + armrests (continuous tubular frame on each side)
  for (const side of [-1, 1]) {
    const xFoot = side * (HALF_W - 0.02);
    const xArm = side * (HALF_W - 0.03);
    const xBack = side * (HALF_W - 0.065);
    const zFront = HALF_D - 0.02;
    const zBack = -HALF_D + 0.11;

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xFoot, GLIDE_H, zFront),
      new THREE.Vector3(xArm, SEAT_FRAME_H, zFront - 0.02),
      new THREE.Vector3(xArm, ARM_H - 0.05, zFront - 0.03),
      new THREE.Vector3(xArm, ARM_H, zFront - 0.09),
      new THREE.Vector3(xArm, ARM_H, 0.0),
      new THREE.Vector3(xBack, ARM_H, zBack),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 32, TUBE_R, 12, false);
    addMesh(armGeo, frameMat, side < 0 ? 'left_arm_leg_frame' : 'right_arm_leg_frame');

    // Front leg glide
    const glideGeo = new THREE.CylinderGeometry(TUBE_R * 0.95, TUBE_R * 0.9, GLIDE_H, 12);
    const glide = addMesh(glideGeo, glideMat, side < 0 ? 'glide_fl' : 'glide_fr');
    glide.position.set(xFoot, GLIDE_H / 2, zFront);
  }

  // 2. Back legs
  for (const side of [-1, 1]) {
    const xFoot = side * (HALF_W - 0.04);
    const xTop = side * (HALF_W - 0.065);
    const zFoot = -HALF_D + 0.02;
    const zTop = -HALF_D + 0.11;

    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xFoot, GLIDE_H, zFoot),
      new THREE.Vector3((xFoot + xTop) * 0.5, SEAT_FRAME_H, (zFoot + zTop) * 0.5),
      new THREE.Vector3(xTop, ARM_H, zTop),
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 16, TUBE_R, 12, false);
    addMesh(legGeo, frameMat, side < 0 ? 'back_left_leg' : 'back_right_leg');

    // Back leg glide
    const glideGeo = new THREE.CylinderGeometry(TUBE_R * 0.95, TUBE_R * 0.9, GLIDE_H, 12);
    const glide = addMesh(glideGeo, glideMat, side < 0 ? 'glide_bl' : 'glide_br');
    glide.position.set(xFoot, GLIDE_H / 2, zFoot);
  }

  // 3. Seat frame (curved perimeter tube)
  const seatW = HALF_W - 0.03;
  const seatZFront = HALF_D - 0.04;
  const seatZBack = -HALF_D + 0.09;
  const seatCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-seatW, SEAT_FRAME_H, seatZFront - 0.04),
      new THREE.Vector3(0, SEAT_FRAME_H - 0.015, seatZFront),
      new THREE.Vector3(seatW, SEAT_FRAME_H, seatZFront - 0.04),
      new THREE.Vector3(seatW - 0.02, SEAT_FRAME_H, seatZBack),
      new THREE.Vector3(0, SEAT_FRAME_H, seatZBack - 0.01),
      new THREE.Vector3(-seatW + 0.02, SEAT_FRAME_H, seatZBack),
    ],
    true
  );
  const seatFrameGeo = new THREE.TubeGeometry(seatCurve, 32, TUBE_R * 0.95, 10, true);
  addMesh(seatFrameGeo, frameMat, 'seat_frame');

  // 4. Seat slats (underneath cushion)
  const slatCount = 5;
  for (let i = 0; i < slatCount; i++) {
    const t = i / (slatCount - 1);
    const z = seatZBack + 0.05 + t * (seatZFront - seatZBack - 0.11);
    const slatGeo = new THREE.BoxGeometry((seatW - 0.015) * 2, 0.008, 0.032);
    const slat = addMesh(slatGeo, frameMat, `seat_slat_${i}`);
    slat.position.set(0, SEAT_FRAME_H - 0.004, z);
  }

  // 5. Backrest hoop (tilted slightly backward)
  const backW = HALF_W - 0.075;
  const backBottomZ = seatZBack;
  const backTopZ = -HALF_D + 0.01;
  const backCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-backW, SEAT_FRAME_H, backBottomZ),
    new THREE.Vector3(-backW, H - 0.08, backTopZ + 0.02),
    new THREE.Vector3(-backW + 0.05, H, backTopZ),
    new THREE.Vector3(0, H, backTopZ),
    new THREE.Vector3(backW - 0.05, H, backTopZ),
    new THREE.Vector3(backW, H - 0.08, backTopZ + 0.02),
    new THREE.Vector3(backW, SEAT_FRAME_H, backBottomZ),
  ]);
  const backHoopGeo = new THREE.TubeGeometry(backCurve, 32, TUBE_R * 0.95, 10, false);
  addMesh(backHoopGeo, frameMat, 'backrest_hoop');

  // 6. Backrest vertical slats (8 slats)
  const backSlatCount = 8;
  const backTilt = Math.atan2(backBottomZ - backTopZ, H - SEAT_FRAME_H);
  const slatLen = Math.hypot(H - SEAT_FRAME_H - 0.01, backBottomZ - backTopZ);
  for (let i = 0; i < backSlatCount; i++) {
    const t = (i + 0.5) / backSlatCount;
    const x = -backW + 0.035 + t * (backW * 2 - 0.07);
    const slatGeo = new THREE.BoxGeometry(0.024, slatLen, 0.007);
    const slat = addMesh(slatGeo, frameMat, `back_slat_${i}`);
    slat.position.set(x, (SEAT_FRAME_H + H) / 2, (backBottomZ + backTopZ) / 2);
    slat.rotation.x = -backTilt;
  }

  // 7. Seat cushion (rounded extruded shape)
  const cw = seatW - 0.015;
  const cd = (seatZFront - seatZBack) * 0.5 - 0.01;
  const r = 0.04;
  const cushionShape = new THREE.Shape();
  cushionShape.moveTo(-cw + r, -cd);
  cushionShape.lineTo(cw - r, -cd);
  cushionShape.quadraticCurveTo(cw, -cd, cw, -cd + r);
  cushionShape.lineTo(cw, cd - r);
  cushionShape.quadraticCurveTo(cw, cd, cw - r, cd);
  cushionShape.lineTo(-cw + r, cd);
  cushionShape.quadraticCurveTo(-cw, cd, -cw, cd - r);
  cushionShape.lineTo(-cw, -cd + r);
  cushionShape.quadraticCurveTo(-cw, -cd, -cw + r, -cd);

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - 0.024,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  cushionGeo.rotateX(Math.PI / 2);
  const cushion = addMesh(cushionGeo, cushionMat, 'seat_cushion');
  cushion.position.set(0, SEAT_FRAME_H + CUSHION_H - 0.012, (seatZFront + seatZBack) / 2);

  // 8. Cushion back tie straps
  for (const side of [-1, 1]) {
    const tieGeo = new THREE.TorusGeometry(0.015, 0.004, 8, 16);
    const tie = addMesh(tieGeo, cushionMat, side < 0 ? 'cushion_tie_left' : 'cushion_tie_right');
    tie.position.set(side * (backW - 0.01), SEAT_FRAME_H + 0.02, seatZBack + 0.01);
    tie.rotation.y = Math.PI / 2;
  }

  return group;
}
