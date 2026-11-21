function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions in meters
  const W = 1.20;
  const D = 0.65;
  const H = 0.42;
  const CORNER_R = 0.14;

  const TOP_T = 0.022;
  const RIM_H = 0.014;
  const RIM_T = 0.016;
  const APRON_H = 0.030;
  const APRON_T = 0.018;

  const LEG_R = 0.022;
  const LEG_X = W / 2 - 0.11;
  const LEG_Z = D / 2 - 0.085;
  const LEG_H = H - TOP_T;

  const SHELF_Y = 0.12;
  const SHELF_T = 0.018;
  const SHELF_W = LEG_X * 2;
  const SHELF_D = LEG_Z * 2;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88652,
    roughness: 0.55,
    metalness: 0.02,
  });

  const oakInnerMat = new THREE.MeshStandardMaterial({
    color: 0xa67644,
    roughness: 0.6,
    metalness: 0.02,
  });

  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
    return shape;
  }

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

  // 1. Tabletop slab
  const topShape = makeRoundedRectShape(W, D, CORNER_R);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 20,
  });
  topGeo.rotateX(-Math.PI / 2);
  addMesh(topGeo, oakMat, 'tabletop_slab', 0, H - TOP_T, 0);

  // 2. Tabletop raised rim (tray lip)
  const rimOuter = makeRoundedRectShape(W, D, CORNER_R);
  const rimInner = makeRoundedRectShape(
    W - RIM_T * 2,
    D - RIM_T * 2,
    Math.max(0.02, CORNER_R - RIM_T)
  );
  rimOuter.holes.push(rimInner);
  const rimGeo = new THREE.ExtrudeGeometry(rimOuter, {
    depth: RIM_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 20,
  });
  rimGeo.rotateX(-Math.PI / 2);
  addMesh(rimGeo, oakMat, 'tabletop_rim', 0, H, 0);

  // 3. Under-table apron rails
  const apronY = H - TOP_T - APRON_H / 2;
  const frontBackApronGeo = new THREE.BoxGeometry(SHELF_W, APRON_H, APRON_T);
  addMesh(frontBackApronGeo, oakInnerMat, 'apron_front', 0, apronY, LEG_Z);
  addMesh(frontBackApronGeo, oakInnerMat, 'apron_back', 0, apronY, -LEG_Z);

  const sideApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, SHELF_D);
  addMesh(sideApronGeo, oakInnerMat, 'apron_left', -LEG_X, apronY, 0);
  addMesh(sideApronGeo, oakInnerMat, 'apron_right', LEG_X, apronY, 0);

  // 4. Four cylindrical legs with rounded feet
  const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R, LEG_H - 0.006, 24);
  const footGeo = new THREE.SphereGeometry(LEG_R, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

  const legPositions = [
    ['leg_front_left', -LEG_X, LEG_Z],
    ['leg_front_right', LEG_X, LEG_Z],
    ['leg_back_left', -LEG_X, -LEG_Z],
    ['leg_back_right', LEG_X, -LEG_Z],
  ];

  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, oakMat, name, lx, (LEG_H - 0.006) / 2 + 0.006, lz);
    addMesh(footGeo, oakMat, `${name}_foot`, lx, LEG_R, lz);
  }

  // 5. Lower shelf
  const shelfGeo = new THREE.BoxGeometry(SHELF_W, SHELF_T, SHELF_D);
  addMesh(shelfGeo, oakMat, 'lower_shelf', 0, SHELF_Y, 0);

  // 6. Right-side cubby divider & back panel
  const cubbyH = H - TOP_T - APRON_H - (SHELF_Y + SHELF_T / 2);
  const cubbyY = SHELF_Y + SHELF_T / 2 + cubbyH / 2;
  const dividerX = LEG_X - 0.16;

  const dividerGeo = new THREE.BoxGeometry(0.018, cubbyH, SHELF_D);
  addMesh(dividerGeo, oakMat, 'cubby_divider_panel', dividerX, cubbyY, 0);

  const cubbyBackW = LEG_X - dividerX;
  const cubbyBackGeo = new THREE.BoxGeometry(cubbyBackW, cubbyH, 0.016);
  addMesh(
    cubbyBackGeo,
    oakInnerMat,
    'cubby_back_panel',
    dividerX + cubbyBackW / 2,
    cubbyY,
    -LEG_Z + 0.008
  );

  return group;
}
