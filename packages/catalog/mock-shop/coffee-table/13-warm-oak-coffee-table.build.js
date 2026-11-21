function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.90;
  const H = 0.40;
  const TOP_T = 0.03;
  const LEG_W = 0.055;
  const LEG_INSET = 0.055;
  const LEG_H = H - TOP_T;
  const APRON_H = 0.055;
  const APRON_T = 0.025;
  const SHELF_Y = 0.145;
  const RAIL_H = 0.035;
  const RAIL_T = 0.035;
  const SLAT_COUNT = 8;
  const SLAT_W = 0.055;
  const SLAT_T = 0.02;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc69862,
    roughness: 0.65,
    metalness: 0.0
  });

  const dowelMat = new THREE.MeshStandardMaterial({
    color: 0xa67947,
    roughness: 0.72,
    metalness: 0.0
  });

  function makeBox(w, h, d, mat, name) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Tabletop
  const tabletop = makeBox(W, TOP_T, D, oakMat, 'tabletop');
  tabletop.position.set(0, H - TOP_T / 2, 0);
  group.add(tabletop);

  // Legs
  const legX = W / 2 - LEG_INSET - LEG_W / 2;
  const legZ = D / 2 - LEG_INSET - LEG_W / 2;
  const legPositions = [
    [-legX, legZ, 'leg_fl'],
    [legX, legZ, 'leg_fr'],
    [-legX, -legZ, 'leg_bl'],
    [legX, -legZ, 'leg_br']
  ];

  for (const [x, z, name] of legPositions) {
    const leg = makeBox(LEG_W, LEG_H, LEG_W, oakMat, name);
    leg.position.set(x, LEG_H / 2, z);
    group.add(leg);
  }

  // Apron rails
  const spanX = 2 * (legX - LEG_W / 2);
  const spanZ = 2 * (legZ - LEG_W / 2);
  const apronY = H - TOP_T - APRON_H / 2;

  const apronFront = makeBox(spanX, APRON_H, APRON_T, oakMat, 'apron_front');
  apronFront.position.set(0, apronY, legZ);
  group.add(apronFront);

  const apronBack = makeBox(spanX, APRON_H, APRON_T, oakMat, 'apron_back');
  apronBack.position.set(0, apronY, -legZ);
  group.add(apronBack);

  const apronLeft = makeBox(APRON_T, APRON_H, spanZ, oakMat, 'apron_left');
  apronLeft.position.set(-legX, apronY, 0);
  group.add(apronLeft);

  const apronRight = makeBox(APRON_T, APRON_H, spanZ, oakMat, 'apron_right');
  apronRight.position.set(legX, apronY, 0);
  group.add(apronRight);

  // Joinery dowel details on front/back faces of legs
  const dowelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.004, 16);
  dowelGeo.rotateX(Math.PI / 2);
  const dowelPositions = [
    [-legX, apronY, legZ + LEG_W / 2, 'dowel_fl'],
    [legX, apronY, legZ + LEG_W / 2, 'dowel_fr'],
    [-legX, apronY, -legZ - LEG_W / 2, 'dowel_bl'],
    [legX, apronY, -legZ - LEG_W / 2, 'dowel_br']
  ];

  for (const [x, y, z, name] of dowelPositions) {
    const dowel = new THREE.Mesh(dowelGeo, dowelMat);
    dowel.name = name;
    dowel.position.set(x, y, z);
    dowel.castShadow = true;
    dowel.receiveShadow = true;
    group.add(dowel);
  }

  // Lower shelf stretcher rails
  const shelfRailFront = makeBox(spanX, RAIL_H, RAIL_T, oakMat, 'shelf_rail_front');
  shelfRailFront.position.set(0, SHELF_Y, legZ);
  group.add(shelfRailFront);

  const shelfRailBack = makeBox(spanX, RAIL_H, RAIL_T, oakMat, 'shelf_rail_back');
  shelfRailBack.position.set(0, SHELF_Y, -legZ);
  group.add(shelfRailBack);

  // Lower shelf slats
  const slatL = 2 * legZ + RAIL_T * 0.6;
  const slatY = SHELF_Y + RAIL_H / 2 + SLAT_T / 2;
  const usableW = spanX - 0.04;
  const stepX = (usableW - SLAT_W) / (SLAT_COUNT - 1);
  const startX = -(usableW - SLAT_W) / 2;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const slat = makeBox(SLAT_W, SLAT_T, slatL, oakMat, `shelf_slat_${i + 1}`);
    slat.position.set(startX + i * stepX, slatY, 0);
    group.add(slat);
  }

  return group;
}
