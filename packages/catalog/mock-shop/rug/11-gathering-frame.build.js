function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.0;          // 200 cm (short side along X)
  const D = 3.0;          // 300 cm (long side along Z)
  const H = 0.014;        // 1.4 cm rug thickness
  const DETAIL_H = 0.002; // 2 mm raised tuft relief
  const LINE_W = 0.012;   // 1.2 cm green border line width

  // Border insets from outer edge
  const DOT_INSET = 0.065;
  const DOT_RADIUS = 0.022;
  const FRAME_OUTER_INSET = 0.115;
  const FRAME_INNER1_INSET = 0.251;
  const FRAME_INNER2_INSET = 0.281;
  const LADDER_LEN = FRAME_INNER1_INSET - FRAME_OUTER_INSET;

  const BASE_Y = H / 2;
  const DETAIL_Y = H + DETAIL_H / 2 - 0.0005;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xeae3d2,
    roughness: 0.92,
    metalness: 0.0,
  });

  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x6f7d5c,
    roughness: 0.9,
    metalness: 0.0,
  });

  // 1. Main rug base
  const baseGeo = new THREE.BoxGeometry(W, H, D);
  const baseMesh = new THREE.Mesh(baseGeo, creamMat);
  baseMesh.name = 'rug_base';
  baseMesh.position.set(0, BASE_Y, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Center raised cream field
  const centerW = W - 2 * (FRAME_INNER2_INSET + LINE_W / 2);
  const centerD = D - 2 * (FRAME_INNER2_INSET + LINE_W / 2);
  const centerGeo = new THREE.BoxGeometry(centerW, DETAIL_H, centerD);
  const centerMesh = new THREE.Mesh(centerGeo, creamMat);
  centerMesh.name = 'center_field';
  centerMesh.position.set(0, DETAIL_Y, 0);
  centerMesh.castShadow = true;
  centerMesh.receiveShadow = true;
  group.add(centerMesh);

  // Helper to add a rectangular green frame (4 bars)
  function addFrame(inset, prefix) {
    const spanX = W - 2 * inset + LINE_W;
    const spanZ = D - 2 * inset - LINE_W;
    const posZ = D / 2 - inset;
    const posX = W / 2 - inset;

    const barXGeo = new THREE.BoxGeometry(spanX, DETAIL_H, LINE_W);
    const barZGeo = new THREE.BoxGeometry(LINE_W, DETAIL_H, spanZ);

    const north = new THREE.Mesh(barXGeo, greenMat);
    north.name = `${prefix}_north`;
    north.position.set(0, DETAIL_Y, -posZ);

    const south = new THREE.Mesh(barXGeo, greenMat);
    south.name = `${prefix}_south`;
    south.position.set(0, DETAIL_Y, posZ);

    const west = new THREE.Mesh(barZGeo, greenMat);
    west.name = `${prefix}_west`;
    west.position.set(-posX, DETAIL_Y, 0);

    const east = new THREE.Mesh(barZGeo, greenMat);
    east.name = `${prefix}_east`;
    east.position.set(posX, DETAIL_Y, 0);

    [north, south, west, east].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    });
  }

  addFrame(FRAME_OUTER_INSET, 'outer_green_frame');
  addFrame(FRAME_INNER1_INSET, 'inner_green_frame_1');
  addFrame(FRAME_INNER2_INSET, 'inner_green_frame_2');

  // 3. Outer border sage green dots (InstancedMesh)
  const dotsXCount = 17; // along north & south (including corners)
  const dotsZCount = 24; // interior dots along west & east
  const totalDots = dotsXCount * 2 + dotsZCount * 2;

  const dotGeo = new THREE.CylinderGeometry(DOT_RADIUS, DOT_RADIUS, DETAIL_H, 16);
  const dotsMesh = new THREE.InstancedMesh(dotGeo, greenMat, totalDots);
  dotsMesh.name = 'border_dots';
  dotsMesh.castShadow = true;
  dotsMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let idx = 0;

  const xSpan = W - 2 * DOT_INSET;
  const zSpan = D - 2 * DOT_INSET;

  // North & South rows
  for (let i = 0; i < dotsXCount; i++) {
    const x = -xSpan / 2 + (i / (dotsXCount - 1)) * xSpan;
    dummy.position.set(x, DETAIL_Y, -zSpan / 2);
    dummy.updateMatrix();
    dotsMesh.setMatrixAt(idx++, dummy.matrix);

    dummy.position.set(x, DETAIL_Y, zSpan / 2);
    dummy.updateMatrix();
    dotsMesh.setMatrixAt(idx++, dummy.matrix);
  }

  // West & East columns (excluding corners)
  for (let i = 1; i <= dotsZCount; i++) {
    const z = -zSpan / 2 + (i / (dotsZCount + 1)) * zSpan;
    dummy.position.set(-xSpan / 2, DETAIL_Y, z);
    dummy.updateMatrix();
    dotsMesh.setMatrixAt(idx++, dummy.matrix);

    dummy.position.set(xSpan / 2, DETAIL_Y, z);
    dummy.updateMatrix();
    dotsMesh.setMatrixAt(idx++, dummy.matrix);
  }

  dotsMesh.instanceMatrix.needsUpdate = true;
  group.add(dotsMesh);

  // 4. Ladder bars along North & South
  const ladderMidInset = (FRAME_OUTER_INSET + FRAME_INNER1_INSET) / 2;
  const ladderXSpan = W - 2 * FRAME_OUTER_INSET;
  const barsXCount = 17;
  const barXGeo = new THREE.BoxGeometry(LINE_W, DETAIL_H, LADDER_LEN);
  const ladderXMesh = new THREE.InstancedMesh(barXGeo, greenMat, barsXCount * 2);
  ladderXMesh.name = 'ladder_bars_x';
  ladderXMesh.castShadow = true;
  ladderXMesh.receiveShadow = true;

  idx = 0;
  for (let i = 1; i <= barsXCount; i++) {
    const x = -ladderXSpan / 2 + (i / (barsXCount + 1)) * ladderXSpan;
    dummy.position.set(x, DETAIL_Y, -(D / 2 - ladderMidInset));
    dummy.updateMatrix();
    ladderXMesh.setMatrixAt(idx++, dummy.matrix);

    dummy.position.set(x, DETAIL_Y, D / 2 - ladderMidInset);
    dummy.updateMatrix();
    ladderXMesh.setMatrixAt(idx++, dummy.matrix);
  }
  ladderXMesh.instanceMatrix.needsUpdate = true;
  group.add(ladderXMesh);

  // 5. Ladder bars along West & East
  const ladderZSpan = D - 2 * FRAME_OUTER_INSET;
  const barsZCount = 27;
  const barZGeo = new THREE.BoxGeometry(LADDER_LEN, DETAIL_H, LINE_W);
  const ladderZMesh = new THREE.InstancedMesh(barZGeo, greenMat, barsZCount * 2);
  ladderZMesh.name = 'ladder_bars_z';
  ladderZMesh.castShadow = true;
  ladderZMesh.receiveShadow = true;

  idx = 0;
  for (let i = 1; i <= barsZCount; i++) {
    const z = -ladderZSpan / 2 + (i / (barsZCount + 1)) * ladderZSpan;
    dummy.position.set(-(W / 2 - ladderMidInset), DETAIL_Y, z);
    dummy.updateMatrix();
    ladderZMesh.setMatrixAt(idx++, dummy.matrix);

    dummy.position.set(W / 2 - ladderMidInset, DETAIL_Y, z);
    dummy.updateMatrix();
    ladderZMesh.setMatrixAt(idx++, dummy.matrix);
  }
  ladderZMesh.instanceMatrix.needsUpdate = true;
  group.add(ladderZMesh);

  return group;
}
