function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.50;
  const H = 0.78;
  const D = 0.42;

  const TOP_H = 0.028;
  const TOP_OVERHANG = 0.02;

  const BASE_W = W - TOP_OVERHANG * 2;
  const BASE_D = D - TOP_OVERHANG * 2;
  const BASE_H = H - TOP_H;

  const LEG_T = 0.085;
  const APRON_H = 0.065;
  const APRON_T = 0.032;

  const SHELF_H = 0.035;
  const SHELF_Y = 0.19; // bottom of shelf from floor
  const GLIDE_H = 0.004;
  const GLIDE_R = 0.018;

  const INNER_W = BASE_W - LEG_T * 2;

  // Materials
  const marbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f0ec,
    roughness: 0.25,
    metalness: 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2
  });

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8b094,
    roughness: 0.65,
    metalness: 0.0
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.9,
    metalness: 0.0
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

  // Marble top
  const topGeo = new THREE.BoxGeometry(W, TOP_H, D);
  addMesh(topGeo, marbleMat, "marble_top", 0, H - TOP_H / 2, 0);

  // Side slab legs
  const legH = BASE_H - GLIDE_H;
  const legGeo = new THREE.BoxGeometry(LEG_T, legH, BASE_D);
  const legX = BASE_W / 2 - LEG_T / 2;
  const legY = GLIDE_H + legH / 2;
  addMesh(legGeo, oakMat, "left_leg_panel", -legX, legY, 0);
  addMesh(legGeo, oakMat, "right_leg_panel", legX, legY, 0);

  // Front and back aprons
  const apronGeo = new THREE.BoxGeometry(INNER_W, APRON_H, APRON_T);
  const apronY = BASE_H - APRON_H / 2;
  const apronZ = BASE_D / 2 - APRON_T / 2;
  addMesh(apronGeo, oakMat, "front_apron", 0, apronY, apronZ);
  addMesh(apronGeo, oakMat, "back_apron", 0, apronY, -apronZ);

  // Under-top support cleats
  const cleatH = 0.025;
  const cleatW = 0.04;
  const cleatGeo = new THREE.BoxGeometry(cleatW, cleatH, BASE_D - APRON_T * 2);
  const cleatY = BASE_H - cleatH / 2;
  addMesh(cleatGeo, oakMat, "top_cleat_left", -INNER_W / 2 + cleatW / 2, cleatY, 0);
  addMesh(cleatGeo, oakMat, "top_cleat_right", INNER_W / 2 - cleatW / 2, cleatY, 0);
  addMesh(cleatGeo, oakMat, "top_cleat_center", 0, cleatY, 0);

  // Lower shelf
  const shelfGeo = new THREE.BoxGeometry(INNER_W, SHELF_H, BASE_D);
  addMesh(shelfGeo, oakMat, "lower_shelf", 0, SHELF_Y + SHELF_H / 2, 0);

  // Underside shelf support battens
  const battenH = 0.018;
  const battenD = 0.025;
  const battenGeo = new THREE.BoxGeometry(INNER_W, battenH, battenD);
  const battenY = SHELF_Y - battenH / 2;
  const battenZ = BASE_D / 2 - battenD / 2 - 0.01;
  addMesh(battenGeo, oakMat, "shelf_support_front", 0, battenY, battenZ);
  addMesh(battenGeo, oakMat, "shelf_support_back", 0, battenY, -battenZ);

  // Floor glides
  const glideGeo = new THREE.CylinderGeometry(GLIDE_R, GLIDE_R, GLIDE_H, 16);
  const glideY = GLIDE_H / 2;
  const glideZ = BASE_D / 2 - GLIDE_R - 0.015;
  addMesh(glideGeo, glideMat, "floor_glide_fl", -legX, glideY, glideZ);
  addMesh(glideGeo, glideMat, "floor_glide_fr", legX, glideY, glideZ);
  addMesh(glideGeo, glideMat, "floor_glide_bl", -legX, glideY, -glideZ);
  addMesh(glideGeo, glideMat, "floor_glide_br", legX, glideY, -glideZ);

  return group;
}
