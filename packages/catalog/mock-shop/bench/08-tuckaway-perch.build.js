function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.80;          // Overall width along X
  const D = 0.40;          // Overall depth along Z
  const H = 0.50;          // Overall height along Y
  const T = 0.018;         // Plywood board thickness
  const SEAT_H = 0.29;     // Top of seat height
  const BACK_H = 0.11;     // Backrest rail height
  const BACK_TOP_GAP = 0.02; // Offset from top of side panels
  const BIN_GAP = 0.008;   // Clearance around bins
  const BIN_TOP_GAP = 0.018; // Clearance above bins
  const BIN_WALL = 0.014;  // Bin wall thickness

  // Materials
  const mintMat = new THREE.MeshStandardMaterial({
    color: 0xa8d5c2,
    roughness: 0.55,
    metalness: 0.02
  });

  const plyEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8be98,
    roughness: 0.72,
    metalness: 0.0
  });

  const binInsideMat = new THREE.MeshStandardMaterial({
    color: 0x92bfa9,
    roughness: 0.65,
    metalness: 0.02
  });

  const panelMats = [mintMat, plyEdgeMat];

  function makeRoundedRectShape(w, h, rTL, rTR, rBR, rBL) {
    const shape = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -h / 2;
    const x1 = w / 2;
    const y1 = h / 2;

    shape.moveTo(x0 + rBL, y0);
    shape.lineTo(x1 - rBR, y0);
    if (rBR > 0) shape.quadraticCurveTo(x1, y0, x1, y0 + rBR);
    shape.lineTo(x1, y1 - rTR);
    if (rTR > 0) shape.quadraticCurveTo(x1, y1, x1 - rTR, y1);
    shape.lineTo(x0 + rTL, y1);
    if (rTL > 0) shape.quadraticCurveTo(x0, y1, x0, y1 - rTL);
    shape.lineTo(x0, y0 + rBL);
    if (rBL > 0) shape.quadraticCurveTo(x0, y0, x0 + rBL, y0);
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

  // 1. Side Panels (Left and Right)
  // Profile in XY, then rotated so +X becomes +Z (front)
  const sideShape = makeRoundedRectShape(D, H, 0.02, 0.085, 0.02, 0.015);
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16
  });
  sideGeo.translate(0, 0, -T / 2);

  addMesh(sideGeo, panelMats, 'left_side_panel', -W / 2 + T / 2, H / 2, 0, 0, -Math.PI / 2, 0);
  addMesh(sideGeo, panelMats, 'right_side_panel', W / 2 - T / 2, H / 2, 0, 0, -Math.PI / 2, 0);

  // 2. Seat Panel
  const innerW = W - 2 * T;
  const seatGeo = new THREE.BoxGeometry(innerW, T, D);
  const seatMats = [mintMat, mintMat, mintMat, mintMat, plyEdgeMat, plyEdgeMat];
  addMesh(seatGeo, seatMats, 'seat_panel', 0, SEAT_H - T / 2, 0);

  // 3. Backrest Rail
  const backGeo = new THREE.BoxGeometry(innerW, BACK_H, T);
  const backMats = [mintMat, mintMat, plyEdgeMat, plyEdgeMat, mintMat, mintMat];
  const backY = H - BACK_TOP_GAP - BACK_H / 2;
  addMesh(backGeo, backMats, 'backrest_rail', 0, backY, -D / 2 + T / 2);

  // 4. Center Vertical Divider
  const divH = SEAT_H - T;
  const divD = D - 0.01;
  const divGeo = new THREE.BoxGeometry(T, divH, divD);
  const divMats = [mintMat, mintMat, mintMat, plyEdgeMat, plyEdgeMat, plyEdgeMat];
  addMesh(divGeo, divMats, 'center_divider', 0, divH / 2, -0.005);

  // 5. Two Storage Bins
  const compW = (W - 3 * T) / 2;
  const binW = compW - 2 * BIN_GAP;
  const binH = divH - BIN_TOP_GAP;
  const binD = D - 0.02;
  const binBaseY = 0.004;
  const binCenterZ = 0.0;

  // Front face with rounded-rect cutout handle
  const frontShape = makeRoundedRectShape(binW, binH, 0.004, 0.004, 0.004, 0.004);
  const handleW = 0.075;
  const handleH = 0.022;
  const handleR = handleH / 2;
  const handleY = binH / 2 - 0.038;

  const hole = new THREE.Path();
  hole.moveTo(-handleW / 2 + handleR, handleY - handleH / 2);
  hole.lineTo(handleW / 2 - handleR, handleY - handleH / 2);
  hole.absarc(handleW / 2 - handleR, handleY, handleR, -Math.PI / 2, Math.PI / 2, false);
  hole.lineTo(-handleW / 2 + handleR, handleY + handleH / 2);
  hole.absarc(-handleW / 2 + handleR, handleY, handleR, Math.PI / 2, (3 * Math.PI) / 2, false);
  frontShape.holes.push(hole);

  const binFrontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: BIN_WALL,
    bevelEnabled: false,
    curveSegments: 12
  });
  binFrontGeo.translate(0, 0, -BIN_WALL / 2);

  const binSideGeo = new THREE.BoxGeometry(BIN_WALL, binH - 0.004, binD - 2 * BIN_WALL);
  const binBackGeo = new THREE.BoxGeometry(binW, binH - 0.004, BIN_WALL);
  const binBottomGeo = new THREE.BoxGeometry(binW - 2 * BIN_WALL, BIN_WALL, binD - 2 * BIN_WALL);

  const binSideMats = [mintMat, mintMat, plyEdgeMat, plyEdgeMat, mintMat, mintMat];

  const binCentersX = [-(T / 2 + compW / 2), T / 2 + compW / 2];
  const binNames = ['left_bin', 'right_bin'];

  for (let i = 0; i < 2; i++) {
    const bx = binCentersX[i];
    const prefix = binNames[i];
    const cy = binBaseY + binH / 2;

    addMesh(
      binFrontGeo,
      panelMats,
      prefix + '_front',
      bx,
      cy,
      binCenterZ + binD / 2 - BIN_WALL / 2
    );

    addMesh(
      binBackGeo,
      binSideMats,
      prefix + '_back',
      bx,
      cy - 0.002,
      binCenterZ - binD / 2 + BIN_WALL / 2
    );

    addMesh(
      binSideGeo,
      binSideMats,
      prefix + '_left_wall',
      bx - binW / 2 + BIN_WALL / 2,
      cy - 0.002,
      binCenterZ
    );

    addMesh(
      binSideGeo,
      binSideMats,
      prefix + '_right_wall',
      bx + binW / 2 - BIN_WALL / 2,
      cy - 0.002,
      binCenterZ
    );

    addMesh(
      binBottomGeo,
      binInsideMat,
      prefix + '_bottom',
      bx,
      binBaseY + BIN_WALL / 2,
      binCenterZ
    );
  }

  return group;
}
