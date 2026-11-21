function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.25;          // overall width along X
  const D = 0.20;          // overall depth along Z
  const H = 0.18;          // overall height along Y
  const BODY_H = 0.145;    // bin body height
  const HANDLE_RISE = H - BODY_H; // 0.035m handle arch above rim
  const CORNER_R = 0.022;
  const WALL_T = 0.006;
  const BOTTOM_T = 0.008;
  const RIM_H = 0.012;
  const RIM_OVERHANG = 0.002;
  const HANDLE_SPAN = 0.072;
  const HANDLE_R = HANDLE_SPAN / 2;
  const TAB_W = 0.016;
  const TAB_H = 0.032;
  const TAB_T = 0.0035;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x5c5c5e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const liningMat = new THREE.MeshStandardMaterial({
    color: 0x454547,
    roughness: 0.72,
    metalness: 0.0,
  });

  const webbingMat = new THREE.MeshStandardMaterial({
    color: 0x555557,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Helper: create a rounded rectangle Shape centered at (0, 0)
  function createRoundedRectShape(w, d, r) {
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

  // Helper: create a rounded rectangle Path (for holes) centered at (0, 0)
  function createRoundedRectPath(w, d, r) {
    const path = new THREE.Path();
    const hw = w / 2;
    const hd = d / 2;
    path.moveTo(-hw + r, -hd);
    path.lineTo(hw - r, -hd);
    path.quadraticCurveTo(hw, -hd, hw, -hd + r);
    path.lineTo(hw, hd - r);
    path.quadraticCurveTo(hw, hd, hw - r, hd);
    path.lineTo(-hw + r, hd);
    path.quadraticCurveTo(-hw, hd, -hw, hd - r);
    path.lineTo(-hw, -hd + r);
    path.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return path;
  }

  function addMesh(geom, mat, name) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Outer body shell
  const outerShape = createRoundedRectShape(W, D, CORNER_R);
  outerShape.holes.push(
    createRoundedRectPath(W - WALL_T * 2, D - WALL_T * 2, CORNER_R - WALL_T)
  );
  const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: BODY_H - RIM_H * 0.5,
    bevelEnabled: false,
    curveSegments: 16,
  });
  outerGeo.rotateX(-Math.PI / 2);
  const outerBody = addMesh(outerGeo, canvasMat, 'outer_body');
  outerBody.position.y = 0;

  // 2. Bottom panel
  const bottomShape = createRoundedRectShape(W - 0.002, D - 0.002, CORNER_R - 0.001);
  const bottomGeo = new THREE.ExtrudeGeometry(bottomShape, {
    depth: BOTTOM_T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  bottomGeo.rotateX(-Math.PI / 2);
  const bottomPanel = addMesh(bottomGeo, canvasMat, 'bottom_panel');
  bottomPanel.position.y = 0;

  // 3. Inner lining walls
  const liningW = W - WALL_T * 2;
  const liningD = D - WALL_T * 2;
  const liningT = 0.002;
  const liningShape = createRoundedRectShape(liningW, liningD, CORNER_R - WALL_T);
  liningShape.holes.push(
    createRoundedRectPath(
      liningW - liningT * 2,
      liningD - liningT * 2,
      CORNER_R - WALL_T - liningT
    )
  );
  const liningGeo = new THREE.ExtrudeGeometry(liningShape, {
    depth: BODY_H - BOTTOM_T - RIM_H * 0.5,
    bevelEnabled: false,
    curveSegments: 16,
  });
  liningGeo.rotateX(-Math.PI / 2);
  const innerLiningWalls = addMesh(liningGeo, liningMat, 'inner_lining_walls');
  innerLiningWalls.position.y = BOTTOM_T;

  // 4. Inner lining bottom
  const innerBottomShape = createRoundedRectShape(
    liningW - liningT,
    liningD - liningT,
    CORNER_R - WALL_T - liningT
  );
  const innerBottomGeo = new THREE.ExtrudeGeometry(innerBottomShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 16,
  });
  innerBottomGeo.rotateX(-Math.PI / 2);
  const innerLiningBottom = addMesh(innerBottomGeo, liningMat, 'inner_lining_bottom');
  innerLiningBottom.position.y = BOTTOM_T;

  // 5. Top rim (folded stitched binding)
  const rimShape = createRoundedRectShape(
    W + RIM_OVERHANG * 2,
    D + RIM_OVERHANG * 2,
    CORNER_R + RIM_OVERHANG
  );
  rimShape.holes.push(
    createRoundedRectPath(
      liningW - liningT * 2,
      liningD - liningT * 2,
      CORNER_R - WALL_T - liningT
    )
  );
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RIM_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 16,
  });
  rimGeo.rotateX(-Math.PI / 2);
  const topRim = addMesh(rimGeo, canvasMat, 'top_rim');
  topRim.position.y = BODY_H - RIM_H;

  // 6. Bottom piping / seam
  const pipingShape = createRoundedRectShape(W + 0.001, D + 0.001, CORNER_R);
  pipingShape.holes.push(
    createRoundedRectPath(W - 0.004, D - 0.004, CORNER_R - 0.002)
  );
  const pipingGeo = new THREE.ExtrudeGeometry(pipingShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 16,
  });
  pipingGeo.rotateX(-Math.PI / 2);
  const bottomPiping = addMesh(pipingGeo, canvasMat, 'bottom_piping');
  bottomPiping.position.y = 0;

  // 7 & 8. Vertical side seams on -X and +X walls
  const seamGeo = new THREE.BoxGeometry(0.002, BODY_H - RIM_H, 0.003);
  const seamLeft = addMesh(seamGeo, canvasMat, 'seam_left');
  seamLeft.position.set(-W / 2 - 0.0005, (BODY_H - RIM_H) / 2, 0);

  const seamRight = addMesh(seamGeo, canvasMat, 'seam_right');
  seamRight.position.set(W / 2 + 0.0005, (BODY_H - RIM_H) / 2, 0);

  // 9-14. Handles on -X and +X sides
  const tabGeo = new THREE.BoxGeometry(TAB_T, TAB_H, TAB_W);
  const loopGeo = new THREE.TorusGeometry(HANDLE_R, 0.0035, 8, 24, Math.PI);
  // Flatten torus along its local Z axis so it forms a flat webbing ribbon
  loopGeo.scale(1, HANDLE_RISE / HANDLE_R, 2.4);
  loopGeo.rotateY(Math.PI / 2);

  const tabY = BODY_H - RIM_H - TAB_H / 2 + 0.004;
  const loopY = BODY_H - 0.002;

  const sides = [
    { sign: -1, prefix: 'left' },
    { sign: 1, prefix: 'right' },
  ];

  for (const side of sides) {
    const xTab = side.sign * (W / 2 + TAB_T / 2 - 0.0005);
    const tabFront = addMesh(tabGeo, webbingMat, `handle_${side.prefix}_tab_front`);
    tabFront.position.set(xTab, tabY, HANDLE_R);

    const tabBack = addMesh(tabGeo, webbingMat, `handle_${side.prefix}_tab_back`);
    tabBack.position.set(xTab, tabY, -HANDLE_R);

    const loop = addMesh(loopGeo, webbingMat, `handle_${side.prefix}_loop`);
    loop.position.set(side.sign * (W / 2 - 0.001), loopY, 0);
  }

  return group;
}
