function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.08;
  const D = 1.00;
  const H = 0.82;
  const BASE_H = 0.27;
  const ARM_W = 0.16;
  const ARM_H = 0.60;
  const BACK_FRAME_H = 0.75;
  const BACK_FRAME_D = 0.18;
  const SEAT_W = W - ARM_W * 2;
  const SEAT_CUSHION_H = 0.17;
  const SEAT_CUSHION_D = D - BACK_FRAME_D + 0.02;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xa69d8e,
    roughness: 0.92,
    metalness: 0.0,
  });

  const linenSeamMat = new THREE.MeshStandardMaterial({
    color: 0x999081,
    roughness: 0.94,
    metalness: 0.0,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x3b3630,
    roughness: 0.85,
    metalness: 0.05,
  });

  function makeRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    const r = Math.min(radius, width / 2, height / 2);
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function addMesh(geo, mat, name, px, py, pz, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(px || 0, py || 0, pz || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed bottom plinth (touches y = 0)
  const plinthGeo = new THREE.BoxGeometry(W - 0.04, 0.012, D - 0.04);
  addMesh(plinthGeo, plinthMat, 'bottom_plinth', 0, 0.006, 0);

  // 2. Main upholstered base / skirt
  const baseGeo = new THREE.BoxGeometry(W, BASE_H - 0.008, D);
  addMesh(baseGeo, linenMat, 'base_skirt', 0, 0.008 + (BASE_H - 0.008) / 2, 0);

  // 3. Front tailored vertical seams on the skirt
  const seamGeo = new THREE.BoxGeometry(0.008, BASE_H - 0.012, 0.006);
  addMesh(seamGeo, linenSeamMat, 'skirt_seam_left', -W / 2 + ARM_W, BASE_H / 2, D / 2 + 0.001);
  addMesh(seamGeo, linenSeamMat, 'skirt_seam_right', W / 2 - ARM_W, BASE_H / 2, D / 2 + 0.001);

  // 4. Track arms (left & right) with softly beveled upholstered profile
  const armHeight = ARM_H - BASE_H + 0.02;
  const armProfile = makeRoundedRectShape(D - 0.02, armHeight, 0.025);
  const armGeo = new THREE.ExtrudeGeometry(armProfile, {
    depth: ARM_W - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  armGeo.center();

  const armY = BASE_H - 0.02 + armHeight / 2;
  addMesh(armGeo, linenMat, 'left_arm', -W / 2 + ARM_W / 2, armY, 0, 0, Math.PI / 2, 0);
  addMesh(armGeo, linenMat, 'right_arm', W / 2 - ARM_W / 2, armY, 0, 0, Math.PI / 2, 0);

  // 5. Backrest frame
  const backFrameH = BACK_FRAME_H - BASE_H + 0.02;
  const backProfile = makeRoundedRectShape(SEAT_W + 0.02, backFrameH, 0.02);
  const backGeo = new THREE.ExtrudeGeometry(backProfile, {
    depth: BACK_FRAME_D - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  backGeo.center();
  addMesh(
    backGeo,
    linenMat,
    'back_frame',
    0,
    BASE_H - 0.02 + backFrameH / 2,
    -D / 2 + BACK_FRAME_D / 2
  );

  // 6. Seat cushion (plush beveled box + subtle crowned top)
  const seatProfile = makeRoundedRectShape(SEAT_W - 0.02, SEAT_CUSHION_D - 0.02, 0.04);
  const seatGeo = new THREE.ExtrudeGeometry(seatProfile, {
    depth: SEAT_CUSHION_H - 0.04,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 4,
  });
  seatGeo.center();
  const seatY = BASE_H + SEAT_CUSHION_H / 2 - 0.01;
  const seatZ = (D / 2 - SEAT_CUSHION_D / 2) + 0.01;
  addMesh(seatGeo, linenMat, 'seat_cushion', 0, seatY, seatZ, Math.PI / 2, 0, 0);

  // Crowned top loft on seat cushion
  const crownGeo = new THREE.SphereGeometry(0.5, 24, 12);
  crownGeo.scale(SEAT_W * 0.92, 0.055, SEAT_CUSHION_D * 0.88);
  addMesh(crownGeo, linenMat, 'seat_cushion_crown', 0, seatY + SEAT_CUSHION_H / 2 - 0.01, seatZ);

  // Front piping / welt on seat cushion
  const weltGeo = new THREE.CylinderGeometry(0.006, 0.006, SEAT_W - 0.06, 10);
  addMesh(
    weltGeo,
    linenSeamMat,
    'seat_cushion_front_welt',
    0,
    seatY - SEAT_CUSHION_H / 2 + 0.025,
    seatZ + SEAT_CUSHION_D / 2 - 0.005,
    0,
    0,
    Math.PI / 2
  );

  // 7. Back cushion (large, plush, slightly reclined)
  const backCushionW = SEAT_W - 0.02;
  const backCushionH = H - (BASE_H + SEAT_CUSHION_H) + 0.05;
  const backCushionD = 0.20;
  const backCushionProfile = makeRoundedRectShape(backCushionW - 0.03, backCushionH - 0.03, 0.04);
  const backCushionGeo = new THREE.ExtrudeGeometry(backCushionProfile, {
    depth: backCushionD - 0.05,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 4,
  });
  backCushionGeo.center();

  const backCushionY = BASE_H + SEAT_CUSHION_H + backCushionH / 2 - 0.04;
  const backCushionZ = -D / 2 + BACK_FRAME_D + backCushionD / 2 - 0.03;
  addMesh(
    backCushionGeo,
    linenMat,
    'back_cushion',
    0,
    backCushionY,
    backCushionZ,
    -0.12,
    0,
    0
  );

  // Plush center loft on back cushion
  const backLoftGeo = new THREE.SphereGeometry(0.5, 24, 12);
  backLoftGeo.scale(backCushionW * 0.88, backCushionH * 0.85, 0.06);
  addMesh(
    backLoftGeo,
    linenMat,
    'back_cushion_loft',
    0,
    backCushionY,
    backCushionZ + backCushionD / 2 - 0.025,
    -0.12,
    0,
    0
  );

  return group;
}
