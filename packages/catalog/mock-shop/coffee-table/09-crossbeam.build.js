function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters (120 x 65 x 36 cm)
  const W = 1.20;
  const D = 0.65;
  const H = 0.36;

  const TOP_T = 0.028;
  const TOP_R = 0.022;
  const TOP_BEVEL = 0.003;
  const OVERHANG = 0.05;

  const LEG_W = 0.042;
  const LEG_H = H - TOP_T;

  const FRAME_W = W - OVERHANG * 2;
  const FRAME_D = D - OVERHANG * 2;
  const LEG_X = FRAME_W / 2 - LEG_W / 2;
  const LEG_Z = FRAME_D / 2 - LEG_W / 2;

  const APRON_H = 0.032;
  const APRON_T = 0.022;
  const APRON_Y = LEG_H - APRON_H / 2;

  const SHELF_Y = 0.115;
  const SHELF_T = 0.020;
  const SHELF_W = FRAME_W - LEG_W;
  const SHELF_D = FRAME_D - LEG_W;

  const STRETCHER_H = 0.028;
  const STRETCHER_T = 0.022;
  const STRETCHER_Y = SHELF_Y - 0.004;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xcfb28a,
    roughness: 0.62,
    metalness: 0.02
  });

  const tenonMat = new THREE.MeshStandardMaterial({
    color: 0xb69468,
    roughness: 0.72,
    metalness: 0.02
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

  // Tabletop with rounded corners and subtle bevel
  const topW = W - TOP_BEVEL * 2;
  const topD = D - TOP_BEVEL * 2;
  const hw = topW / 2;
  const hd = topD / 2;
  const r = TOP_R;

  const topShape = new THREE.Shape();
  topShape.moveTo(-hw + r, -hd);
  topShape.lineTo(hw - r, -hd);
  topShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  topShape.lineTo(hw, hd - r);
  topShape.quadraticCurveTo(hw, hd, hw - r, hd);
  topShape.lineTo(-hw + r, hd);
  topShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  topShape.lineTo(-hw, -hd + r);
  topShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const topGeom = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T - TOP_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: TOP_BEVEL,
    bevelSize: TOP_BEVEL,
    bevelSegments: 3,
    curveSegments: 8
  });
  topGeom.rotateX(-Math.PI / 2);
  addMesh(topGeom, oakMat, 'tabletop', 0, LEG_H + TOP_BEVEL, 0);

  // Four legs
  const legGeom = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legPositions = [
    ['leg_fl', -LEG_X, LEG_Z],
    ['leg_fr', LEG_X, LEG_Z],
    ['leg_bl', -LEG_X, -LEG_Z],
    ['leg_br', LEG_X, -LEG_Z]
  ];
  for (let i = 0; i < legPositions.length; i++) {
    const [name, lx, lz] = legPositions[i];
    addMesh(legGeom, oakMat, name, lx, LEG_H / 2, lz);
  }

  // Upper apron rails
  const apronFBGeom = new THREE.BoxGeometry(FRAME_W - LEG_W * 2, APRON_H, APRON_T);
  addMesh(apronFBGeom, oakMat, 'apron_front', 0, APRON_Y, LEG_Z);
  addMesh(apronFBGeom, oakMat, 'apron_back', 0, APRON_Y, -LEG_Z);

  const apronLRGeom = new THREE.BoxGeometry(APRON_T, APRON_H, FRAME_D - LEG_W * 2);
  addMesh(apronLRGeom, oakMat, 'apron_left', -LEG_X, APRON_Y, 0);
  addMesh(apronLRGeom, oakMat, 'apron_right', LEG_X, APRON_Y, 0);

  // Lower shelf
  const shelfGeom = new THREE.BoxGeometry(SHELF_W, SHELF_T, SHELF_D);
  addMesh(shelfGeom, oakMat, 'lower_shelf', 0, SHELF_Y, 0);

  // Lower stretchers
  const stretcherFBGeom = new THREE.BoxGeometry(FRAME_W - LEG_W * 2, STRETCHER_H, STRETCHER_T);
  addMesh(stretcherFBGeom, oakMat, 'stretcher_front', 0, STRETCHER_Y, LEG_Z);
  addMesh(stretcherFBGeom, oakMat, 'stretcher_back', 0, STRETCHER_Y, -LEG_Z);

  const stretcherLRGeom = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, FRAME_D - LEG_W * 2);
  addMesh(stretcherLRGeom, oakMat, 'stretcher_left', -LEG_X, STRETCHER_Y, 0);
  addMesh(stretcherLRGeom, oakMat, 'stretcher_right', LEG_X, STRETCHER_Y, 0);

  // Exposed tenon joinery accents on outer faces of legs
  const tenonGeom = new THREE.BoxGeometry(0.002, STRETCHER_H * 0.7, STRETCHER_T * 0.65);
  addMesh(tenonGeom, tenonMat, 'tenon_fl', -LEG_X - LEG_W / 2 - 0.0005, STRETCHER_Y, LEG_Z);
  addMesh(tenonGeom, tenonMat, 'tenon_fr', LEG_X + LEG_W / 2 + 0.0005, STRETCHER_Y, LEG_Z);
  addMesh(tenonGeom, tenonMat, 'tenon_bl', -LEG_X - LEG_W / 2 - 0.0005, STRETCHER_Y, -LEG_Z);
  addMesh(tenonGeom, tenonMat, 'tenon_br', LEG_X + LEG_W / 2 + 0.0005, STRETCHER_Y, -LEG_Z);

  return group;
}
