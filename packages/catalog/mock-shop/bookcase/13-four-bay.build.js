function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.76;
  const D = 0.35;
  const H = 1.75;
  const POST_W = 0.024;
  const FOOT_H = 0.016;
  const SHELF_THICK = 0.018;
  const SIDE_FLANGE_H = 0.045;
  const SIDE_FLANGE_T = 0.008;
  const BRACE_W = 0.018;
  const BRACE_T = 0.006;
  const TAB_H = 0.036;
  const TAB_W = 0.024;
  const TAB_T = 0.004;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x9b978f,
    roughness: 0.48,
    metalness: 0.32,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x3a3936,
    roughness: 0.6,
    metalness: 0.4,
  });

  const halfW = W / 2 - POST_W / 2;
  const halfD = D / 2 - POST_W / 2;
  const postH = H - FOOT_H;
  const postCenterY = FOOT_H + postH / 2;

  // 4 Vertical Posts
  const postGeo = new THREE.BoxGeometry(POST_W, postH, POST_W);
  const postPositions = [
    { name: 'post_front_left', x: -halfW, z: halfD },
    { name: 'post_front_right', x: halfW, z: halfD },
    { name: 'post_back_left', x: -halfW, z: -halfD },
    { name: 'post_back_right', x: halfW, z: -halfD },
  ];

  for (const p of postPositions) {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.name = p.name;
    post.position.set(p.x, postCenterY, p.z);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }

  // 4 Leveling Feet
  const footGeo = new THREE.CylinderGeometry(0.013, 0.015, FOOT_H, 16);
  const footPositions = [
    { name: 'foot_front_left', x: -halfW, z: halfD },
    { name: 'foot_front_right', x: halfW, z: halfD },
    { name: 'foot_back_left', x: -halfW, z: -halfD },
    { name: 'foot_back_right', x: halfW, z: -halfD },
  ];

  for (const f of footPositions) {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = f.name;
    foot.position.set(f.x, FOOT_H / 2, f.z);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  // 5 Shelves & Side Flanges
  const shelfYLevels = [
    0.085,
    0.495,
    0.905,
    1.315,
    H - SHELF_THICK / 2,
  ];

  const shelfW = W - POST_W * 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_THICK, D);
  const flangeD = D - POST_W * 2;
  const flangeGeo = new THREE.BoxGeometry(SIDE_FLANGE_T, SIDE_FLANGE_H, flangeD);

  for (let i = 0; i < shelfYLevels.length; i++) {
    const sy = shelfYLevels[i];

    const shelf = new THREE.Mesh(shelfGeo, frameMat);
    shelf.name = `shelf_${i + 1}`;
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);

    // Side flanges (aligned at bottom with shelf bottom, except top shelf where flange goes down)
    const isTop = i === shelfYLevels.length - 1;
    const flangeY = isTop
      ? sy + SHELF_THICK / 2 - SIDE_FLANGE_H / 2
      : sy - SHELF_THICK / 2 + SIDE_FLANGE_H / 2;

    const leftFlange = new THREE.Mesh(flangeGeo, frameMat);
    leftFlange.name = `shelf_${i + 1}_flange_left`;
    leftFlange.position.set(-halfW, flangeY, 0);
    leftFlange.castShadow = true;
    leftFlange.receiveShadow = true;
    group.add(leftFlange);

    const rightFlange = new THREE.Mesh(flangeGeo, frameMat);
    rightFlange.name = `shelf_${i + 1}_flange_right`;
    rightFlange.position.set(halfW, flangeY, 0);
    rightFlange.castShadow = true;
    rightFlange.receiveShadow = true;
    group.add(rightFlange);
  }

  // Rear X-Braces (2 bays each: lower X from shelf 1 to 3, upper X from shelf 3 to 5)
  const braceZ = -halfD;
  const braceSpanX = W - POST_W * 2;

  function addXBrace(namePrefix, yBottom, yTop) {
    const spanY = yTop - yBottom;
    const length = Math.hypot(braceSpanX, spanY);
    const angle = Math.atan2(spanY, braceSpanX);
    const centerY = (yBottom + yTop) / 2;
    const barGeo = new THREE.BoxGeometry(length, BRACE_W, BRACE_T);

    const bar1 = new THREE.Mesh(barGeo, frameMat);
    bar1.name = `${namePrefix}_diag_1`;
    bar1.position.set(0, centerY, braceZ - BRACE_T * 0.5);
    bar1.rotation.z = angle;
    bar1.castShadow = true;
    bar1.receiveShadow = true;
    group.add(bar1);

    const bar2 = new THREE.Mesh(barGeo, frameMat);
    bar2.name = `${namePrefix}_diag_2`;
    bar2.position.set(0, centerY, braceZ + BRACE_T * 0.5);
    bar2.rotation.z = -angle;
    bar2.castShadow = true;
    bar2.receiveShadow = true;
    group.add(bar2);
  }

  addXBrace('xbrace_lower', shelfYLevels[0], shelfYLevels[2]);
  addXBrace('xbrace_upper', shelfYLevels[2], shelfYLevels[4]);

  // Top Rear Wall-Mounting Tabs
  const tabGeo = new THREE.BoxGeometry(TAB_W, TAB_H, TAB_T);
  const tabY = H + TAB_H / 2 - 0.004;
  const tabZ = -halfD - POST_W / 2 + TAB_T / 2;

  const leftTab = new THREE.Mesh(tabGeo, frameMat);
  leftTab.name = 'wall_tab_left';
  leftTab.position.set(-halfW, tabY, tabZ);
  leftTab.castShadow = true;
  leftTab.receiveShadow = true;
  group.add(leftTab);

  const rightTab = new THREE.Mesh(tabGeo, frameMat);
  rightTab.name = 'wall_tab_right';
  rightTab.position.set(halfW, tabY, tabZ);
  rightTab.castShadow = true;
  rightTab.receiveShadow = true;
  group.add(rightTab);

  return group;
}
