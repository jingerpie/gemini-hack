function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.38;
  const D = 0.28;
  const H = 0.20;
  const WALL_T = 0.012;
  const CORNER_R = 0.024;
  const CUFF_H = 0.032;
  const CUFF_T = 0.005;
  const HANDLE_H = 0.085;
  const STRAP_W = 0.024;
  const STRAP_T = 0.004;
  const TAB_H = 0.036;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xf2eadc,
    roughness: 0.92,
    metalness: 0.0,
  });

  const liningMat = new THREE.MeshStandardMaterial({
    color: 0xe8decc,
    roughness: 0.95,
    metalness: 0.0,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe3,
    roughness: 0.88,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xe0d4be,
    roughness: 0.95,
    metalness: 0.0,
  });

  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw * 0.9, hd * 0.9);
    shape.moveTo(-hw + cr, -hd);
    shape.lineTo(hw - cr, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    shape.lineTo(hw, hd - cr);
    shape.quadraticCurveTo(hw, hd, hw - cr, hd);
    shape.lineTo(-hw + cr, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    shape.lineTo(-hw, -hd + cr);
    shape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return shape;
  }

  function makeRoundedRectPath(w, d, r) {
    const path = new THREE.Path();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw * 0.9, hd * 0.9);
    path.moveTo(-hw + cr, -hd);
    path.lineTo(hw - cr, -hd);
    path.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    path.lineTo(hw, hd - cr);
    path.quadraticCurveTo(hw, hd, hw - cr, hd);
    path.lineTo(-hw + cr, hd);
    path.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    path.lineTo(-hw, -hd + cr);
    path.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return path;
  }

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Basket bottom
  const bottomShape = makeRoundedRectShape(W, D, CORNER_R);
  const bottomGeo = new THREE.ExtrudeGeometry(bottomShape, {
    depth: WALL_T,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.002,
    bevelSegments: 3,
    curveSegments: 16,
  });
  bottomGeo.rotateX(-Math.PI / 2);
  addMesh(bottomGeo, canvasMat, 'basket_bottom', [0, 0.003, 0]);

  // 2. Interior lining pad
  const liningShape = makeRoundedRectShape(W - WALL_T * 2.1, D - WALL_T * 2.1, CORNER_R * 0.7);
  const liningGeo = new THREE.ExtrudeGeometry(liningShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 12,
  });
  liningGeo.rotateX(-Math.PI / 2);
  addMesh(liningGeo, liningMat, 'interior_lining_bottom', [0, WALL_T + 0.002, 0]);

  // 3. Main hollow basket body
  const bodyShape = makeRoundedRectShape(W, D, CORNER_R);
  const bodyHole = makeRoundedRectPath(W - WALL_T * 2, D - WALL_T * 2, Math.max(0.005, CORNER_R - WALL_T));
  bodyShape.holes.push(bodyHole);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: H - WALL_T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  addMesh(bodyGeo, canvasMat, 'basket_body', [0, WALL_T, 0]);

  // 4. Folded-over top rim cuff
  const cuffShape = makeRoundedRectShape(W + CUFF_T * 2, D + CUFF_T * 2, CORNER_R + CUFF_T);
  const cuffHole = makeRoundedRectPath(W - WALL_T * 2.05, D - WALL_T * 2.05, Math.max(0.005, CORNER_R - WALL_T));
  cuffShape.holes.push(cuffHole);

  const cuffGeo = new THREE.ExtrudeGeometry(cuffShape, {
    depth: CUFF_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 16,
  });
  cuffGeo.rotateX(-Math.PI / 2);
  addMesh(cuffGeo, canvasMat, 'rim_cuff', [0, H - CUFF_H, 0]);

  // 5. Subtle vertical side seams on left and right walls
  const seamGeo = new THREE.BoxGeometry(0.002, H - CUFF_H - 0.01, 0.003);
  addMesh(seamGeo, seamMat, 'side_seam_left', [-W / 2 - 0.0005, (H - CUFF_H) / 2, 0]);
  addMesh(seamGeo, seamMat, 'side_seam_right', [W / 2 + 0.0005, (H - CUFF_H) / 2, 0]);

  // 6. Handles on -X and +X sides
  const handleSpanZ = 0.075;
  const tabY = H - CUFF_H + 0.002;
  const sides = [
    { dir: -1, label: 'left' },
    { dir: 1, label: 'right' },
  ];

  const tabGeo = new THREE.BoxGeometry(STRAP_T, TAB_H, STRAP_W);
  const stitchGeo = new THREE.BoxGeometry(STRAP_T + 0.001, 0.002, STRAP_W * 0.75);

  sides.forEach(({ dir, label }) => {
    const xBase = dir * (W / 2 + CUFF_T + STRAP_T * 0.45);

    // Attachment tabs (front and back of each side)
    [-1, 1].forEach((zDir) => {
      const zLabel = zDir > 0 ? 'front' : 'back';
      const zPos = zDir * handleSpanZ;
      addMesh(tabGeo, strapMat, `handle_tab_${label}_${zLabel}`, [xBase, tabY, zPos]);
      addMesh(stitchGeo, seamMat, `handle_stitch_${label}_${zLabel}`, [xBase, tabY + TAB_H * 0.3, zPos]);
    });

    // Arched webbing strap
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, tabY + TAB_H * 0.4, -handleSpanZ),
      new THREE.Vector3(0, H + HANDLE_H * 0.55, -handleSpanZ * 0.72),
      new THREE.Vector3(0, H + HANDLE_H, 0),
      new THREE.Vector3(0, H + HANDLE_H * 0.55, handleSpanZ * 0.72),
      new THREE.Vector3(0, tabY + TAB_H * 0.4, handleSpanZ),
    ]);

    const tubeGeo = new THREE.TubeGeometry(curve, 24, STRAP_W * 0.5, 10, false);
    // Flatten along X so it looks like a flat cotton webbing strap
    addMesh(
      tubeGeo,
      strapMat,
      `handle_arch_${label}`,
      [xBase, 0, 0],
      [0, 0, 0],
      [STRAP_T / STRAP_W, 1, 1]
    );
  });

  return group;
}
