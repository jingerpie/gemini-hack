function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const D = 0.65;
  const H = 0.34;

  const LEG_SIZE = 0.038;
  const TOP_SLAT_H = 0.022;
  const TOP_RAIL_H = 0.036;
  const LOWER_RAIL_H = 0.032;
  const LOWER_SHELF_Y = 0.11;
  const LOWER_SLAT_H = 0.018;

  const TOP_SLAT_COUNT = 18;
  const TOP_SLAT_GAP = 0.008;
  const LOWER_SLAT_COUNT = 5;
  const LOWER_SLAT_GAP = 0.008;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x7d7a72,
    roughness: 0.55,
    metalness: 0.35
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3f,
    roughness: 0.68,
    metalness: 0.02
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 4 Corner Legs
  const legH = H - TOP_SLAT_H;
  const legGeo = new THREE.BoxGeometry(LEG_SIZE, legH, LEG_SIZE);
  const legX = W / 2 - LEG_SIZE / 2;
  const legZ = D / 2 - LEG_SIZE / 2;

  addMesh(legGeo, frameMat, 'leg_front_left', -legX, legH / 2, legZ);
  addMesh(legGeo, frameMat, 'leg_front_right', legX, legH / 2, legZ);
  addMesh(legGeo, frameMat, 'leg_back_left', -legX, legH / 2, -legZ);
  addMesh(legGeo, frameMat, 'leg_back_right', legX, legH / 2, -legZ);

  // Top Frame Rails
  const topRailY = H - TOP_SLAT_H - TOP_RAIL_H / 2;
  const railSpanX = W - 2 * LEG_SIZE;
  const railSpanZ = D - 2 * LEG_SIZE;

  const topRailXGeo = new THREE.BoxGeometry(railSpanX, TOP_RAIL_H, LEG_SIZE);
  const topRailZGeo = new THREE.BoxGeometry(LEG_SIZE, TOP_RAIL_H, railSpanZ);

  addMesh(topRailXGeo, frameMat, 'top_rail_front', 0, topRailY, legZ);
  addMesh(topRailXGeo, frameMat, 'top_rail_back', 0, topRailY, -legZ);
  addMesh(topRailZGeo, frameMat, 'top_rail_left', -legX, topRailY, 0);
  addMesh(topRailZGeo, frameMat, 'top_rail_right', legX, topRailY, 0);

  // Lower Frame Rails
  const lowerRailY = LOWER_SHELF_Y - LOWER_RAIL_H / 2;
  const lowerRailXGeo = new THREE.BoxGeometry(railSpanX, LOWER_RAIL_H, LEG_SIZE);
  const lowerRailZGeo = new THREE.BoxGeometry(LEG_SIZE, LOWER_RAIL_H, railSpanZ);

  addMesh(lowerRailXGeo, frameMat, 'lower_rail_front', 0, lowerRailY, legZ);
  addMesh(lowerRailXGeo, frameMat, 'lower_rail_back', 0, lowerRailY, -legZ);
  addMesh(lowerRailZGeo, frameMat, 'lower_rail_left', -legX, lowerRailY, 0);
  addMesh(lowerRailZGeo, frameMat, 'lower_rail_right', legX, lowerRailY, 0);

  // Top Wooden Slats (running front-to-back along Z)
  const topSlatW = (W - (TOP_SLAT_COUNT - 1) * TOP_SLAT_GAP) / TOP_SLAT_COUNT;
  const topSlatGeo = new THREE.BoxGeometry(topSlatW, TOP_SLAT_H, D);
  const topSlatY = H - TOP_SLAT_H / 2;

  for (let i = 0; i < TOP_SLAT_COUNT; i++) {
    const x = -W / 2 + topSlatW / 2 + i * (topSlatW + TOP_SLAT_GAP);
    addMesh(topSlatGeo, woodMat, `top_slat_${i + 1}`, x, topSlatY, 0);
  }

  // Lower Shelf Wooden Slats (running left-to-right along X)
  const lowerShelfD = D - 2 * LEG_SIZE;
  const lowerSlatD = (lowerShelfD - (LOWER_SLAT_COUNT - 1) * LOWER_SLAT_GAP) / LOWER_SLAT_COUNT;
  const lowerSlatGeo = new THREE.BoxGeometry(railSpanX, LOWER_SLAT_H, lowerSlatD);
  const lowerSlatY = LOWER_SHELF_Y + LOWER_SLAT_H / 2;

  for (let i = 0; i < LOWER_SLAT_COUNT; i++) {
    const z = -lowerShelfD / 2 + lowerSlatD / 2 + i * (lowerSlatD + LOWER_SLAT_GAP);
    addMesh(lowerSlatGeo, woodMat, `lower_slat_${i + 1}`, 0, lowerSlatY, z);
  }

  return group;
}
