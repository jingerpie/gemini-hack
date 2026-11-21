function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const D = 0.50;
  const H = 0.52;
  const TOP_T = 0.022;
  const SHELF_T = 0.022;
  const SHELF_Y = 0.13;
  const LEG_W = 0.036;
  const LEG_H = H - TOP_T;
  const CLEAT_W = 0.022;
  const CLEAT_H = 0.024;
  const CLEAT_L = 0.075;
  const SCREW_R = 0.0035;
  const SCREW_L = 0.004;

  // Materials
  const paleWoodMat = new THREE.MeshStandardMaterial({
    color: 0xdfd6c7,
    roughness: 0.55,
    metalness: 0.02,
  });

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb59264,
    roughness: 0.62,
    metalness: 0.02,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.4,
    metalness: 0.75,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Top panel
  const topGeo = new THREE.BoxGeometry(W, TOP_T, D);
  addMesh(topGeo, paleWoodMat, "top_panel", 0, H - TOP_T / 2, 0);

  // Lower shelf (fits between the 4 legs)
  const shelfW = W - LEG_W * 2;
  const shelfD = D - LEG_W * 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_T, shelfD);
  addMesh(shelfGeo, paleWoodMat, "lower_shelf", 0, SHELF_Y + SHELF_T / 2, 0);

  // Legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;

  const legPositions = [
    ["leg_fl", -legX, legZ],
    ["leg_fr", legX, legZ],
    ["leg_bl", -legX, -legZ],
    ["leg_br", legX, -legZ],
  ];

  for (const [name, x, z] of legPositions) {
    addMesh(legGeo, oakMat, name, x, LEG_H / 2, z);
  }

  // Cleats under top panel and lower shelf
  const cleatGeo = new THREE.BoxGeometry(CLEAT_W, CLEAT_H, CLEAT_L);
  const screwGeo = new THREE.CylinderGeometry(SCREW_R, SCREW_R, SCREW_L, 12);

  const topCleatY = H - TOP_T - CLEAT_H / 2;
  const bottomCleatY = SHELF_Y - CLEAT_H / 2;

  const cleatConfigs = [
    ["fl", -1, 1],
    ["fr", 1, 1],
    ["bl", -1, -1],
    ["br", 1, -1],
  ];

  for (const [suffix, sx, sz] of cleatConfigs) {
    const cx = sx * (W / 2 - LEG_W - CLEAT_W / 2);
    const cz = sz * (D / 2 - LEG_W / 2 - CLEAT_L / 2);

    // Top cleat
    addMesh(cleatGeo, oakMat, `top_cleat_${suffix}`, cx, topCleatY, cz);

    // Screw on inner face of top cleat
    const screwX = cx - sx * (CLEAT_W / 2 + SCREW_L / 2 - 0.001);
    const screwZ = cz - sz * (CLEAT_L * 0.15);
    addMesh(
      screwGeo,
      screwMat,
      `top_cleat_screw_${suffix}`,
      screwX,
      topCleatY,
      screwZ,
      0,
      0,
      Math.PI / 2
    );

    // Bottom cleat
    addMesh(cleatGeo, oakMat, `bottom_cleat_${suffix}`, cx, bottomCleatY, cz);
  }

  return group;
}
