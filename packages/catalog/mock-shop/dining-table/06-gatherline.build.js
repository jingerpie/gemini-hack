function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.60;
  const D = 0.90;
  const H = 0.74;

  const LEG_W = 0.05;
  const FOOT_H = 0.008;
  const TOP_RAIL_H = 0.055;
  const TOP_RAIL_T = 0.05;
  const CENTER_BAR_W = 0.035;

  const STRETCHER_H = 0.035;
  const STRETCHER_T = 0.03;
  const STRETCHER_Y = 0.16;

  const SLAT_COUNT = 9;
  const SLAT_GAP = 0.008;
  const SLAT_H = 0.025;
  const SLAT_END_GAP = 0.004;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x664e40,
    roughness: 0.55,
    metalness: 0.25,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.85,
    metalness: 0.05,
  });

  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xba8858,
    roughness: 0.65,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Legs and foot glides
  const legH = H - TOP_RAIL_H - FOOT_H;
  const legY = FOOT_H + legH / 2;
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;

  const legGeom = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
  const footGeom = new THREE.BoxGeometry(LEG_W * 0.92, FOOT_H, LEG_W * 0.92);

  const corners = [
    ['front_left', -legX, legZ],
    ['front_right', legX, legZ],
    ['back_left', -legX, -legZ],
    ['back_right', legX, -legZ],
  ];

  for (const [label, cx, cz] of corners) {
    addMesh(legGeom, frameMat, `leg_${label}`, cx, legY, cz);
    addMesh(footGeom, footMat, `foot_glide_${label}`, cx, FOOT_H / 2, cz);
  }

  // Top perimeter frame
  const topY = H - TOP_RAIL_H / 2;
  const longRailGeom = new THREE.BoxGeometry(W, TOP_RAIL_H, TOP_RAIL_T);
  const shortRailGeom = new THREE.BoxGeometry(TOP_RAIL_T, TOP_RAIL_H, D - 2 * TOP_RAIL_T);

  addMesh(longRailGeom, frameMat, 'top_rail_front', 0, topY, D / 2 - TOP_RAIL_T / 2);
  addMesh(longRailGeom, frameMat, 'top_rail_back', 0, topY, -(D / 2 - TOP_RAIL_T / 2));
  addMesh(shortRailGeom, frameMat, 'top_rail_left', -(W / 2 - TOP_RAIL_T / 2), topY, 0);
  addMesh(shortRailGeom, frameMat, 'top_rail_right', W / 2 - TOP_RAIL_T / 2, topY, 0);

  // Top center cross-bar
  const centerBarGeom = new THREE.BoxGeometry(CENTER_BAR_W, TOP_RAIL_H, D - 2 * TOP_RAIL_T);
  addMesh(centerBarGeom, frameMat, 'top_center_bar', 0, topY, 0);

  // Bottom H-stretcher
  const endStretcherLen = D - 2 * LEG_W;
  const endStretcherGeom = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, endStretcherLen);
  addMesh(endStretcherGeom, frameMat, 'stretcher_left', -legX, STRETCHER_Y, 0);
  addMesh(endStretcherGeom, frameMat, 'stretcher_right', legX, STRETCHER_Y, 0);

  const centerStretcherLen = W - 2 * LEG_W;
  const centerStretcherGeom = new THREE.BoxGeometry(centerStretcherLen, STRETCHER_H, STRETCHER_T);
  addMesh(centerStretcherGeom, frameMat, 'stretcher_center', 0, STRETCHER_Y, 0);

  // Tabletop teak slats (9 rows, split into left and right halves)
  const innerD = D - 2 * TOP_RAIL_T;
  const slatW = (innerD - (SLAT_COUNT + 1) * SLAT_GAP) / SLAT_COUNT;
  const halfInnerW = (W - 2 * TOP_RAIL_T - CENTER_BAR_W) / 2;
  const slatLen = halfInnerW - 2 * SLAT_END_GAP;
  const slatY = H - SLAT_H / 2;
  const slatXOffset = CENTER_BAR_W / 2 + halfInnerW / 2;

  const slatGeom = new THREE.BoxGeometry(slatLen, SLAT_H, slatW);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const z = -innerD / 2 + SLAT_GAP + slatW / 2 + i * (slatW + SLAT_GAP);
    addMesh(slatGeom, teakMat, `slat_left_${i + 1}`, -slatXOffset, slatY, z);
    addMesh(slatGeom, teakMat, `slat_right_${i + 1}`, slatXOffset, slatY, z);
  }

  return group;
}
