function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.92;
  const H = 0.94;
  const D = 0.48;

  const TOP_H = 0.032;
  const TOP_OVERHANG = 0.02;
  const FOOT_H = 0.085;
  const PLINTH_H = 0.03;

  const CARCASS_W = W - 2 * TOP_OVERHANG;
  const CARCASS_D = D - TOP_OVERHANG;
  const CARCASS_H = H - FOOT_H - PLINTH_H - TOP_H;
  const CARCASS_Z = -TOP_OVERHANG / 2;
  const CARCASS_Y = FOOT_H + PLINTH_H + CARCASS_H / 2;

  const DRAWER_DEPTH = 0.016;
  const DRAWER_FRONT_Z = CARCASS_Z + CARCASS_D / 2 + DRAWER_DEPTH / 2;
  const RAIL_H = 0.018;
  const SIDE_FRAME = 0.022;
  const CENTER_STILE = 0.018;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa67346,
    roughness: 0.58,
    metalness: 0.04,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x8c5b34,
    roughness: 0.5,
    metalness: 0.05,
  });

  const keyholeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    roughness: 0.8,
    metalness: 0.2,
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

  // 1. Main Carcass
  const carcassGeo = new THREE.BoxGeometry(CARCASS_W, CARCASS_H, CARCASS_D);
  addMesh(carcassGeo, woodMat, 'carcass_body', 0, CARCASS_Y, CARCASS_Z);

  // 2. Overhanging Top
  const topGeo = new THREE.BoxGeometry(W, TOP_H, D);
  addMesh(topGeo, woodMat, 'top_panel', 0, H - TOP_H / 2, 0);

  // 3. Base Plinth / Molding
  const plinthGeo = new THREE.BoxGeometry(CARCASS_W + 0.016, PLINTH_H, CARCASS_D + 0.012);
  addMesh(plinthGeo, woodMat, 'base_plinth', 0, FOOT_H + PLINTH_H / 2, CARCASS_Z + 0.006);

  // 4. Four Bracket Feet (Extruded L-profile / curved cutout)
  const footW = 0.11;
  const footD = 0.045;
  const footShape = new THREE.Shape();
  footShape.moveTo(0, 0);
  footShape.lineTo(0.042, 0);
  footShape.lineTo(0.046, 0.032);
  footShape.quadraticCurveTo(0.055, 0.058, footW, 0.062);
  footShape.lineTo(footW, FOOT_H);
  footShape.lineTo(0, FOOT_H);
  footShape.closePath();

  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: footD,
    bevelEnabled: false,
  });

  const footX = CARCASS_W / 2 + 0.004;
  const footFrontZ = CARCASS_Z + CARCASS_D / 2 + 0.008 - footD;
  const footBackZ = CARCASS_Z - CARCASS_D / 2;

  // Front Left
  addMesh(footGeo, woodMat, 'foot_front_left', -footX, 0, footFrontZ);
  // Front Right (mirrored in X)
  const footRightGeo = footGeo.clone();
  footRightGeo.scale(-1, 1, 1);
  addMesh(footRightGeo, woodMat, 'foot_front_right', footX, 0, footFrontZ);
  // Back Left
  addMesh(footGeo, woodMat, 'foot_back_left', -footX, 0, footBackZ);
  // Back Right
  addMesh(footRightGeo, woodMat, 'foot_back_right', footX, 0, footBackZ);

  // 5. Turned Wooden Knob Geometry (LatheGeometry)
  const knobPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.012, 0.0),
    new THREE.Vector2(0.012, 0.005),
    new THREE.Vector2(0.009, 0.010),
    new THREE.Vector2(0.019, 0.016),
    new THREE.Vector2(0.021, 0.024),
    new THREE.Vector2(0.016, 0.031),
    new THREE.Vector2(0.006, 0.034),
    new THREE.Vector2(0.0, 0.035),
  ];
  const knobGeo = new THREE.LatheGeometry(knobPoints, 20);
  knobGeo.rotateX(Math.PI / 2);

  // Keyhole Geometry
  const keyholeGeo = new THREE.BoxGeometry(0.005, 0.013, 0.004);

  // 6. Graduated Drawers (from top to bottom)
  const drawerHeights = [0.135, 0.160, 0.190, 0.218];
  const fullDrawerW = CARCASS_W - 2 * SIDE_FRAME;
  const halfDrawerW = (fullDrawerW - CENTER_STILE) / 2;

  let currentTopY = FOOT_H + PLINTH_H + CARCASS_H - RAIL_H;

  // Row 1: Two small top drawers
  const topDrawerH = drawerHeights[0];
  const topDrawerY = currentTopY - topDrawerH / 2;
  const topDrawerGeo = new THREE.BoxGeometry(halfDrawerW, topDrawerH, DRAWER_DEPTH);

  const leftDrawerX = -(halfDrawerW / 2 + CENTER_STILE / 2);
  const rightDrawerX = halfDrawerW / 2 + CENTER_STILE / 2;

  addMesh(topDrawerGeo, woodMat, 'drawer_top_left', leftDrawerX, topDrawerY, DRAWER_FRONT_Z);
  addMesh(topDrawerGeo, woodMat, 'drawer_top_right', rightDrawerX, topDrawerY, DRAWER_FRONT_Z);

  // Knobs & keyholes for top drawers
  const knobZ = DRAWER_FRONT_Z + DRAWER_DEPTH / 2;
  const keyholeZ = knobZ + 0.001;
  addMesh(knobGeo, knobMat, 'knob_top_left', leftDrawerX, topDrawerY - 0.006, knobZ);
  addMesh(knobGeo, knobMat, 'knob_top_right', rightDrawerX, topDrawerY - 0.006, knobZ);
  addMesh(keyholeGeo, keyholeMat, 'keyhole_top_left', leftDrawerX, topDrawerY + topDrawerH * 0.24, keyholeZ);
  addMesh(keyholeGeo, keyholeMat, 'keyhole_top_right', rightDrawerX, topDrawerY + topDrawerH * 0.24, keyholeZ);

  currentTopY -= topDrawerH + RAIL_H;

  // Rows 2, 3, 4: Three full-width graduated drawers
  for (let i = 1; i < drawerHeights.length; i++) {
    const dh = drawerHeights[i];
    const dy = currentTopY - dh / 2;
    const dGeo = new THREE.BoxGeometry(fullDrawerW, dh, DRAWER_DEPTH);
    addMesh(dGeo, woodMat, `drawer_row_${i + 1}`, 0, dy, DRAWER_FRONT_Z);

    const knobOffsetX = fullDrawerW * 0.27;
    addMesh(knobGeo, knobMat, `knob_row_${i + 1}_left`, -knobOffsetX, dy, knobZ);
    addMesh(knobGeo, knobMat, `knob_row_${i + 1}_right`, knobOffsetX, dy, knobZ);
    addMesh(keyholeGeo, keyholeMat, `keyhole_row_${i + 1}`, 0, dy + dh * 0.28, keyholeZ);

    currentTopY -= dh + RAIL_H;
  }

  return group;
}
