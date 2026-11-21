function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.38;
  const D = 0.52;
  const H = 0.56;

  const PAD_H = 0.003;
  const BASE_H = 0.026;
  const BASE_FRAME_W = 0.038;
  const CORNER_R = 0.065;

  const TOP_PLATE_T = 0.016;
  const TOP_RIM_H = 0.014;
  const TOP_RIM_W = 0.016;
  const TOP_TOTAL_T = TOP_PLATE_T + TOP_RIM_H;

  const COL_W = 0.14;
  const COL_T = 0.022;
  const RIB_W = 0.022;
  const RIB_D = 0.036;
  const COL_Z = -D / 2 + BASE_FRAME_W / 2 + 0.035;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc2935e,
    roughness: 0.58,
    metalness: 0.0,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const radius = Math.min(r, hw, hd);
    const shape = new THREE.Shape();
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  // Helper: rounded rectangle THREE.Path (for holes) centered at (0, 0)
  function roundedRectHole(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const radius = Math.min(r, hw, hd);
    const path = new THREE.Path();
    path.moveTo(-hw + radius, -hd);
    path.lineTo(-hw, -hd + radius);
    path.lineTo(-hw, hd - radius);
    path.quadraticCurveTo(-hw, hd, -hw + radius, hd);
    path.lineTo(hw - radius, hd);
    path.quadraticCurveTo(hw, hd, hw, hd - radius);
    path.lineTo(hw, -hd + radius);
    path.quadraticCurveTo(hw, -hd, hw - radius, -hd);
    path.lineTo(-hw + radius, -hd);
    return path;
  }

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Foot pads (touching y = 0)
  const padGeo = new THREE.CylinderGeometry(0.012, 0.012, PAD_H, 16);
  const padX = W / 2 - BASE_FRAME_W / 2 - 0.01;
  const padZ = D / 2 - BASE_FRAME_W / 2 - 0.01;
  addMesh(padGeo, padMat, "foot_pad_fl", -padX, PAD_H / 2, padZ);
  addMesh(padGeo, padMat, "foot_pad_fr", padX, PAD_H / 2, padZ);
  addMesh(padGeo, padMat, "foot_pad_bl", -padX, PAD_H / 2, -padZ);
  addMesh(padGeo, padMat, "foot_pad_br", padX, PAD_H / 2, -padZ);

  // 2. Base frame (hollow rounded rectangle)
  const baseOuter = roundedRectShape(W, D, CORNER_R);
  const baseInner = roundedRectHole(
    W - BASE_FRAME_W * 2,
    D - BASE_FRAME_W * 2,
    Math.max(0.015, CORNER_R - BASE_FRAME_W)
  );
  baseOuter.holes.push(baseInner);

  const baseGeo = new THREE.ExtrudeGeometry(baseOuter, {
    depth: BASE_H - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16,
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, oakMat, "base_frame", 0, PAD_H + BASE_H - 0.002, 0);

  // 3. Vertical column & T-rib
  const colBottomY = PAD_H + BASE_H * 0.5;
  const colTopY = H - TOP_TOTAL_T + 0.002;
  const colH = colTopY - colBottomY;
  const colCenterY = colBottomY + colH / 2;

  const colGeo = new THREE.BoxGeometry(COL_W, colH, COL_T);
  addMesh(colGeo, oakMat, "column_main", 0, colCenterY, COL_Z);

  const ribGeo = new THREE.BoxGeometry(RIB_W, colH, RIB_D);
  addMesh(ribGeo, oakMat, "column_rib", 0, colCenterY, COL_Z + COL_T / 2 + RIB_D / 2 - 0.002);

  const colBaseBlockGeo = new THREE.BoxGeometry(COL_W, BASE_H, BASE_FRAME_W + 0.02);
  addMesh(
    colBaseBlockGeo,
    oakMat,
    "column_base_block",
    0,
    PAD_H + BASE_H / 2,
    -D / 2 + BASE_FRAME_W / 2 + 0.01
  );

  // 4. Under-tabletop support cleats
  const cleatH = 0.014;
  const cleatY = H - TOP_TOTAL_T - cleatH / 2 + 0.001;
  const cleatCenterGeo = new THREE.BoxGeometry(COL_W + 0.04, cleatH, 0.08);
  addMesh(cleatCenterGeo, oakMat, "top_cleat_center", 0, cleatY, COL_Z + 0.02);

  const sideCleatGeo = new THREE.BoxGeometry(0.024, cleatH * 0.85, D * 0.55);
  addMesh(sideCleatGeo, oakMat, "top_cleat_left", -COL_W / 2 + 0.012, cleatY, 0.02);
  addMesh(sideCleatGeo, oakMat, "top_cleat_right", COL_W / 2 - 0.012, cleatY, 0.02);

  // 5. Tabletop base plate
  const topPlateShape = roundedRectShape(W, D, CORNER_R);
  const topPlateGeo = new THREE.ExtrudeGeometry(topPlateShape, {
    depth: TOP_PLATE_T - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16,
  });
  topPlateGeo.rotateX(Math.PI / 2);
  addMesh(topPlateGeo, oakMat, "tabletop_plate", 0, H - TOP_RIM_H - 0.002, 0);

  // 6. Tabletop raised rim
  const rimOuter = roundedRectShape(W, D, CORNER_R);
  const rimInner = roundedRectHole(
    W - TOP_RIM_W * 2,
    D - TOP_RIM_W * 2,
    Math.max(0.015, CORNER_R - TOP_RIM_W)
  );
  rimOuter.holes.push(rimInner);

  const rimGeo = new THREE.ExtrudeGeometry(rimOuter, {
    depth: TOP_RIM_H - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16,
  });
  rimGeo.rotateX(Math.PI / 2);
  addMesh(rimGeo, oakMat, "tabletop_rim", 0, H - 0.002, 0);

  return group;
}
