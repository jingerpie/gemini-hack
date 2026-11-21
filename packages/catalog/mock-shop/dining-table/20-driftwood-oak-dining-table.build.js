function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.0;
  const D = 1.0;
  const H = 0.76;

  const TOP_T = 0.045;
  const OVERHANG_X = 0.09;
  const OVERHANG_Z = 0.07;

  const LEG_W = 0.095;
  const LEG_D = 0.095;
  const LEG_H = H - TOP_T;

  const APRON_H = 0.08;
  const APRON_T = 0.03;

  const STRETCHER_Y = 0.14;
  const STRETCHER_H = 0.065;
  const STRETCHER_T = 0.055;
  const PEG_SIZE = 0.022;

  const LEG_X = W / 2 - OVERHANG_X - LEG_W / 2;
  const LEG_Z = D / 2 - OVERHANG_Z - LEG_D / 2;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8bca8,
    roughness: 0.78,
    metalness: 0.02,
  });

  const pegMat = new THREE.MeshStandardMaterial({
    color: 0x5c4d3c,
    roughness: 0.75,
    metalness: 0.02,
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

  // Tabletop
  addMesh(
    new THREE.BoxGeometry(W, TOP_T, D),
    oakMat,
    'table_top',
    0,
    H - TOP_T / 2,
    0
  );

  // 4 Legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const legPositions = [
    ['leg_front_left', -LEG_X, LEG_Z],
    ['leg_front_right', LEG_X, LEG_Z],
    ['leg_back_left', -LEG_X, -LEG_Z],
    ['leg_back_right', LEG_X, -LEG_Z],
  ];
  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, oakMat, name, lx, LEG_H / 2, lz);
  }

  // Aprons
  const apronY = H - TOP_T - APRON_H / 2;
  const longApronGeo = new THREE.BoxGeometry(2 * LEG_X - LEG_W, APRON_H, APRON_T);
  addMesh(longApronGeo, oakMat, 'apron_front', 0, apronY, LEG_Z);
  addMesh(longApronGeo, oakMat, 'apron_back', 0, apronY, -LEG_Z);

  const shortApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, 2 * LEG_Z - LEG_D);
  addMesh(shortApronGeo, oakMat, 'apron_left', -LEG_X, apronY, 0);
  addMesh(shortApronGeo, oakMat, 'apron_right', LEG_X, apronY, 0);

  // H-Stretcher Base
  const sideStretcherGeo = new THREE.BoxGeometry(
    STRETCHER_T,
    STRETCHER_H,
    2 * LEG_Z - LEG_D
  );
  addMesh(sideStretcherGeo, oakMat, 'stretcher_left', -LEG_X, STRETCHER_Y, 0);
  addMesh(sideStretcherGeo, oakMat, 'stretcher_right', LEG_X, STRETCHER_Y, 0);

  const centerStretcherGeo = new THREE.BoxGeometry(
    2 * LEG_X - LEG_W,
    STRETCHER_H,
    STRETCHER_T
  );
  addMesh(centerStretcherGeo, oakMat, 'stretcher_center', 0, STRETCHER_Y, 0);

  // Exposed Tenon Pegs on Side Stretchers
  const pegGeo = new THREE.BoxGeometry(0.008, PEG_SIZE, PEG_SIZE);
  addMesh(
    pegGeo,
    pegMat,
    'tenon_peg_left',
    -(LEG_X + STRETCHER_T / 2 + 0.002),
    STRETCHER_Y,
    0
  );
  addMesh(
    pegGeo,
    pegMat,
    'tenon_peg_right',
    LEG_X + STRETCHER_T / 2 + 0.002,
    STRETCHER_Y,
    0
  );

  return group;
}
