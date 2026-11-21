function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.85;
  const H = 1.10;
  const D = 0.45;
  const SHELL_T = 0.028;
  const TRIM_D = 0.018;
  const OUTER_R = 0.095;
  const INNER_R = OUTER_R - SHELL_T;
  const BOTTOM_R = 0.015;
  const DOOR_T = 0.020;
  const DOOR_GAP = 0.004;
  const BACK_T = 0.016;
  const SHELF_T = 0.018;
  const PULL_R = 0.022;
  const PULL_Y = 0.46 * H;
  const PULL_X = 0.036;

  // Materials
  const mintMat = new THREE.MeshStandardMaterial({
    color: 0xb6cebe,
    roughness: 0.62,
    metalness: 0.02,
  });

  const mintRecessMat = new THREE.MeshStandardMaterial({
    color: 0x97b3a0,
    roughness: 0.74,
    metalness: 0.02,
  });

  const plywoodMat = new THREE.MeshStandardMaterial({
    color: 0xdfc09a,
    roughness: 0.68,
    metalness: 0.0,
  });

  const darkGapMat = new THREE.MeshStandardMaterial({
    color: 0x3b473f,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Outer shell shape (centered on X=0, bottom at Y=0)
  function createShellShape(w, h, rTop, rBot) {
    const hw = w / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw + rBot, 0);
    s.lineTo(hw - rBot, 0);
    s.quadraticCurveTo(hw, 0, hw, rBot);
    s.lineTo(hw, h - rTop);
    s.absarc(hw - rTop, h - rTop, rTop, 0, Math.PI / 2, false);
    s.lineTo(-hw + rTop, h);
    s.absarc(-hw + rTop, h - rTop, rTop, Math.PI / 2, Math.PI, false);
    s.lineTo(-hw, rBot);
    s.quadraticCurveTo(-hw, 0, -hw + rBot, 0);
    return s;
  }

  function createInnerPath(w, h, t, rInner) {
    const hw = w / 2 - t;
    const topY = h - t;
    const botY = t;
    const p = new THREE.Path();
    p.moveTo(-hw, botY);
    p.lineTo(hw, botY);
    p.lineTo(hw, topY - rInner);
    p.absarc(hw - rInner, topY - rInner, rInner, 0, Math.PI / 2, false);
    p.lineTo(-hw + rInner, topY);
    p.absarc(-hw + rInner, topY - rInner, rInner, Math.PI / 2, Math.PI, false);
    p.lineTo(-hw, botY);
    return p;
  }

  // 1. Main green outer body shell
  const shellShape = createShellShape(W, H, OUTER_R, BOTTOM_R);
  shellShape.holes.push(createInnerPath(W, H, SHELL_T, INNER_R));
  const bodyGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: D - TRIM_D,
    bevelEnabled: false,
    curveSegments: 24,
  });
  addMesh(bodyGeo, mintMat, 'cabinet_body_shell', 0, 0, -D / 2);

  // 2. Exposed plywood front trim
  const trimGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: TRIM_D,
    bevelEnabled: false,
    curveSegments: 24,
  });
  addMesh(trimGeo, plywoodMat, 'cabinet_plywood_trim', 0, 0, D / 2 - TRIM_D);

  // 3. Back panel (matches inner cavity shape)
  const backShape = new THREE.Shape();
  const bhw = W / 2 - SHELL_T;
  const bTopY = H - SHELL_T;
  const bBotY = SHELL_T;
  backShape.moveTo(-bhw, bBotY);
  backShape.lineTo(bhw, bBotY);
  backShape.lineTo(bhw, bTopY - INNER_R);
  backShape.absarc(bhw - INNER_R, bTopY - INNER_R, INNER_R, 0, Math.PI / 2, false);
  backShape.lineTo(-bhw + INNER_R, bTopY);
  backShape.absarc(-bhw + INNER_R, bTopY - INNER_R, INNER_R, Math.PI / 2, Math.PI, false);
  backShape.lineTo(-bhw, bBotY);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_T,
    bevelEnabled: false,
    curveSegments: 20,
  });
  addMesh(backGeo, mintMat, 'cabinet_back_panel', 0, 0, -D / 2 + 0.004);

  // 4 & 5. Interior shelves
  const shelfW = W - 2 * SHELL_T - 0.002;
  const shelfD = D - BACK_T - DOOR_T - 0.02;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_T, shelfD);
  addMesh(shelfGeo, mintMat, 'shelf_lower', 0, H * 0.34, -0.01);
  addMesh(shelfGeo, mintMat, 'shelf_upper', 0, H * 0.67, -0.01);

  // 6. Dark backing strip behind door gap
  const doorH = H - 2 * SHELL_T - 2 * DOOR_GAP;
  const doorFrontZ = D / 2 - 0.004;
  const doorBackZ = doorFrontZ - DOOR_T;
  const gapStripGeo = new THREE.BoxGeometry(0.016, doorH - 0.01, 0.004);
  addMesh(gapStripGeo, darkGapMat, 'door_gap_backing', 0, SHELL_T + DOOR_GAP + doorH / 2, doorBackZ - 0.003);

  // 7. Left door (rounded top-left corner)
  const doorW = (W - 2 * SHELL_T - 3 * DOOR_GAP) / 2;
  const doorR = INNER_R - DOOR_GAP;
  const leftDoorShape = new THREE.Shape();
  leftDoorShape.moveTo(0, 0);
  leftDoorShape.lineTo(doorW, 0);
  leftDoorShape.lineTo(doorW, doorH);
  leftDoorShape.lineTo(doorR, doorH);
  leftDoorShape.absarc(doorR, doorH - doorR, doorR, Math.PI / 2, Math.PI, false);
  leftDoorShape.lineTo(0, 0);

  const leftDoorGeo = new THREE.ExtrudeGeometry(leftDoorShape, {
    depth: DOOR_T,
    bevelEnabled: false,
    curveSegments: 20,
  });
  addMesh(
    leftDoorGeo,
    mintMat,
    'door_left',
    -W / 2 + SHELL_T + DOOR_GAP,
    SHELL_T + DOOR_GAP,
    doorBackZ
  );

  // 8. Right door (rounded top-right corner)
  const rightDoorShape = new THREE.Shape();
  rightDoorShape.moveTo(0, 0);
  rightDoorShape.lineTo(doorW, 0);
  rightDoorShape.lineTo(doorW, doorH - doorR);
  rightDoorShape.absarc(doorW - doorR, doorH - doorR, doorR, 0, Math.PI / 2, false);
  rightDoorShape.lineTo(0, doorH);
  rightDoorShape.lineTo(0, 0);

  const rightDoorGeo = new THREE.ExtrudeGeometry(rightDoorShape, {
    depth: DOOR_T,
    bevelEnabled: false,
    curveSegments: 20,
  });
  addMesh(
    rightDoorGeo,
    mintMat,
    'door_right',
    DOOR_GAP / 2,
    SHELL_T + DOOR_GAP,
    doorBackZ
  );

  // 9-12. Recessed circular finger pulls
  const pullDiscGeo = new THREE.CylinderGeometry(PULL_R, PULL_R, 0.004, 24);
  const pullRimGeo = new THREE.TorusGeometry(PULL_R, 0.0022, 10, 24);

  addMesh(pullDiscGeo, mintRecessMat, 'finger_pull_left_recess', -PULL_X, PULL_Y, doorFrontZ - 0.001, Math.PI / 2, 0, 0);
  addMesh(pullRimGeo, mintMat, 'finger_pull_left_rim', -PULL_X, PULL_Y, doorFrontZ + 0.0005);

  addMesh(pullDiscGeo, mintRecessMat, 'finger_pull_right_recess', PULL_X, PULL_Y, doorFrontZ - 0.001, Math.PI / 2, 0, 0);
  addMesh(pullRimGeo, mintMat, 'finger_pull_right_rim', PULL_X, PULL_Y, doorFrontZ + 0.0005);

  return group;
}
