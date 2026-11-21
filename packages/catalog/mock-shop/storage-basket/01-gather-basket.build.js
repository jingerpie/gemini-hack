function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const D = 0.36;
  const FRAME_H = 0.56;
  const TUBE_R = 0.008;
  const FOOT_R = 0.011;
  const FOOT_H = 0.006;

  const BAG_W = W - 0.03;
  const BAG_D = D - 0.04;
  const BAG_BOTTOM_Y = 0.20;
  const BAG_H = FRAME_H - BAG_BOTTOM_Y;
  const WALL_T = 0.012;

  const HANDLE_H = 0.18;
  const HANDLE_SPAN = 0.16;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4d8,
    roughness: 0.45,
    metalness: 0.15,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0xd8d3c5,
    roughness: 0.8,
    metalness: 0.0,
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.92,
    metalness: 0.0,
  });

  const snapMat = new THREE.MeshStandardMaterial({
    color: 0xe2ddd0,
    roughness: 0.35,
    metalness: 0.25,
  });

  // Helper to create a closed U-frame loop
  function createFrameLoop(topX, botX, zOffset) {
    const hw = topX;
    const bw = botX;
    const hz = D / 2 + zOffset;
    const topY = FRAME_H;
    const botY = TUBE_R + FOOT_H * 0.5;
    const c = 0.035; // corner rounding offset

    const pts = [
      new THREE.Vector3(hw, topY, -hz + c),
      new THREE.Vector3(hw, topY, hz - c),
      new THREE.Vector3(hw + (bw > hw ? c * 0.4 : -c * 0.4), topY - c * 0.6, hz),
      new THREE.Vector3(bw - (bw > hw ? c * 0.4 : -c * 0.4), botY + c * 0.6, hz),
      new THREE.Vector3(bw, botY, hz - c),
      new THREE.Vector3(bw, botY, -hz + c),
      new THREE.Vector3(bw - (bw > hw ? c * 0.4 : -c * 0.4), botY + c * 0.6, -hz),
      new THREE.Vector3(hw + (bw > hw ? c * 0.4 : -c * 0.4), topY - c * 0.6, -hz),
    ];

    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.25);
    return new THREE.TubeGeometry(curve, 64, TUBE_R, 12, true);
  }

  // X-Frame tubes
  const frameLeftTop = new THREE.Mesh(
    createFrameLoop(-W / 2, W / 2 - 0.03, 0.002),
    frameMat
  );
  frameLeftTop.name = 'frame_left_top';
  group.add(frameLeftTop);

  const frameRightTop = new THREE.Mesh(
    createFrameLoop(W / 2, -W / 2 + 0.03, -0.002),
    frameMat
  );
  frameRightTop.name = 'frame_right_top';
  group.add(frameRightTop);

  // Pivot pins at X-intersections
  const pinGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.016, 12);
  pinGeo.rotateX(Math.PI / 2);
  const crossY = (FRAME_H + TUBE_R) * 0.5;

  const pinFront = new THREE.Mesh(pinGeo, frameMat);
  pinFront.position.set(0, crossY, D / 2);
  pinFront.name = 'pivot_pin_front';
  group.add(pinFront);

  const pinBack = new THREE.Mesh(pinGeo, frameMat);
  pinBack.position.set(0, crossY, -D / 2);
  pinBack.name = 'pivot_pin_back';
  group.add(pinBack);

  // 4 Rubber feet glides
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footX = W / 2 - 0.03;
  const footZ = D / 2 - 0.035;
  const footCoords = [
    [-footX, footZ, 'foot_fl'],
    [footX, footZ, 'foot_fr'],
    [-footX, -footZ, 'foot_bl'],
    [footX, -footZ, 'foot_br'],
  ];
  footCoords.forEach(([fx, fz, name]) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.name = name;
    group.add(foot);
  });

  // Canvas bag (hollow box: bottom + 4 walls)
  const bagBottom = new THREE.Mesh(
    new THREE.BoxGeometry(BAG_W, WALL_T, BAG_D),
    canvasMat
  );
  bagBottom.position.set(0, BAG_BOTTOM_Y + WALL_T / 2, 0);
  bagBottom.name = 'bag_bottom';
  group.add(bagBottom);

  const wallFBGeo = new THREE.BoxGeometry(BAG_W, BAG_H, WALL_T);
  const bagWallFront = new THREE.Mesh(wallFBGeo, canvasMat);
  bagWallFront.position.set(0, BAG_BOTTOM_Y + BAG_H / 2, BAG_D / 2 - WALL_T / 2);
  bagWallFront.name = 'bag_wall_front';
  group.add(bagWallFront);

  const bagWallBack = new THREE.Mesh(wallFBGeo, canvasMat);
  bagWallBack.position.set(0, BAG_BOTTOM_Y + BAG_H / 2, -BAG_D / 2 + WALL_T / 2);
  bagWallBack.name = 'bag_wall_back';
  group.add(bagWallBack);

  const wallLRGeo = new THREE.BoxGeometry(WALL_T, BAG_H, BAG_D - WALL_T * 2);
  const bagWallLeft = new THREE.Mesh(wallLRGeo, canvasMat);
  bagWallLeft.position.set(-BAG_W / 2 + WALL_T / 2, BAG_BOTTOM_Y + BAG_H / 2, 0);
  bagWallLeft.name = 'bag_wall_left';
  group.add(bagWallLeft);

  const bagWallRight = new THREE.Mesh(wallLRGeo, canvasMat);
  bagWallRight.position.set(BAG_W / 2 - WALL_T / 2, BAG_BOTTOM_Y + BAG_H / 2, 0);
  bagWallRight.name = 'bag_wall_right';
  group.add(bagWallRight);

  // Top fabric sleeves wrapping around the frame bars
  const sleeveGeo = new THREE.CylinderGeometry(0.015, 0.015, BAG_D, 16);
  sleeveGeo.rotateX(Math.PI / 2);

  const sleeveLeft = new THREE.Mesh(sleeveGeo, canvasMat);
  sleeveLeft.position.set(-W / 2, FRAME_H, 0);
  sleeveLeft.name = 'sleeve_left';
  group.add(sleeveLeft);

  const sleeveRight = new THREE.Mesh(sleeveGeo, canvasMat);
  sleeveRight.position.set(W / 2, FRAME_H, 0);
  sleeveRight.name = 'sleeve_right';
  group.add(sleeveRight);

  // Handles (front and back)
  function createHandle(zPos) {
    const pts = [
      new THREE.Vector3(-HANDLE_SPAN / 2, FRAME_H - 0.02, zPos),
      new THREE.Vector3(-HANDLE_SPAN * 0.35, FRAME_H + HANDLE_H * 0.65, zPos),
      new THREE.Vector3(0, FRAME_H + HANDLE_H, zPos),
      new THREE.Vector3(HANDLE_SPAN * 0.35, FRAME_H + HANDLE_H * 0.65, zPos),
      new THREE.Vector3(HANDLE_SPAN / 2, FRAME_H - 0.02, zPos),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 24, 0.011, 8, false);
    geo.scale(1, 1, 0.45);
    return geo;
  }

  const handleFrontZ = BAG_D / 2 + 0.004;
  const handleBackZ = -BAG_D / 2 - 0.004;

  const handleFront = new THREE.Mesh(createHandle(handleFrontZ), canvasMat);
  handleFront.name = 'handle_front';
  group.add(handleFront);

  const handleBack = new THREE.Mesh(createHandle(handleBackZ), canvasMat);
  handleBack.name = 'handle_back';
  group.add(handleBack);

  // Handle attachment tabs and snap buttons
  const tabGeo = new THREE.BoxGeometry(0.03, 0.044, 0.006);
  const snapGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12);
  snapGeo.rotateX(Math.PI / 2);

  const tabPositions = [
    [-HANDLE_SPAN / 2, handleFrontZ, 1, 'handle_tab_fl', 'snap_fl'],
    [HANDLE_SPAN / 2, handleFrontZ, 1, 'handle_tab_fr', 'snap_fr'],
    [-HANDLE_SPAN / 2, handleBackZ, -1, 'handle_tab_bl', 'snap_bl'],
    [HANDLE_SPAN / 2, handleBackZ, -1, 'handle_tab_br', 'snap_br'],
  ];

  tabPositions.forEach(([tx, tz, dir, tabName, snapName]) => {
    const tab = new THREE.Mesh(tabGeo, canvasMat);
    tab.position.set(tx, FRAME_H - 0.032, tz);
    tab.name = tabName;
    group.add(tab);

    const snap = new THREE.Mesh(snapGeo, snapMat);
    snap.position.set(tx, FRAME_H - 0.032, tz + dir * 0.004);
    snap.name = snapName;
    group.add(snap);
  });

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
