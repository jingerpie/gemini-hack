function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const H = 0.40;
  const D = 0.35;
  const T = 0.022;
  const BACK_T = 0.015;
  const PAD_H = 0.002;
  const PAD_R = 0.012;
  const TRIM_T = 0.002;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc29b6c,
    roughness: 0.62,
    metalness: 0.04,
  });

  const oakInnerMat = new THREE.MeshStandardMaterial({
    color: 0xb38a5a,
    roughness: 0.68,
    metalness: 0.04,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.9,
    metalness: 0.0,
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

  function createExtrudedPanel(points, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }

  // 4 mitered outer panels
  const topGeo = createExtrudedPanel([
    [-W / 2, H],
    [W / 2, H],
    [W / 2 - T, H - T],
    [-W / 2 + T, H - T],
  ], D);
  addMesh(topGeo, oakMat, 'top_panel', 0, 0, 0);

  const bottomGeo = createExtrudedPanel([
    [-W / 2, PAD_H],
    [W / 2, PAD_H],
    [W / 2 - T, PAD_H + T],
    [-W / 2 + T, PAD_H + T],
  ], D);
  addMesh(bottomGeo, oakMat, 'bottom_panel', 0, 0, 0);

  const leftGeo = createExtrudedPanel([
    [-W / 2, PAD_H],
    [-W / 2, H],
    [-W / 2 + T, H - T],
    [-W / 2 + T, PAD_H + T],
  ], D);
  addMesh(leftGeo, oakMat, 'left_panel', 0, 0, 0);

  const rightGeo = createExtrudedPanel([
    [W / 2, PAD_H],
    [W / 2, H],
    [W / 2 - T, H - T],
    [W / 2 - T, PAD_H + T],
  ], D);
  addMesh(rightGeo, oakMat, 'right_panel', 0, 0, 0);

  // Back panel
  const innerW = W - 2 * T;
  const innerH = H - PAD_H - 2 * T;
  const innerCenterY = PAD_H + T + innerH / 2;
  const backGeo = new THREE.BoxGeometry(innerW + 0.002, innerH + 0.002, BACK_T);
  addMesh(backGeo, oakInnerMat, 'back_panel', 0, innerCenterY, -D / 2 + BACK_T / 2);

  // Inner back corner cleats for structural detail
  const cleatSize = 0.008;
  const cleatZ = -D / 2 + BACK_T + cleatSize / 2;
  const hCleatGeo = new THREE.BoxGeometry(innerW, cleatSize, cleatSize);
  addMesh(hCleatGeo, oakInnerMat, 'top_back_cleat', 0, H - T - cleatSize / 2, cleatZ);
  addMesh(hCleatGeo, oakInnerMat, 'bottom_back_cleat', 0, PAD_H + T + cleatSize / 2, cleatZ);

  const vCleatGeo = new THREE.BoxGeometry(cleatSize, innerH - 2 * cleatSize, cleatSize);
  addMesh(vCleatGeo, oakInnerMat, 'left_back_cleat', -W / 2 + T + cleatSize / 2, innerCenterY, cleatZ);
  addMesh(vCleatGeo, oakInnerMat, 'right_back_cleat', W / 2 - T - cleatSize / 2, innerCenterY, cleatZ);

  // 4 discreet floor pads at bottom corners (touching y = 0)
  const padGeo = new THREE.CylinderGeometry(PAD_R, PAD_R, PAD_H, 16);
  const padOffsetX = W / 2 - T - PAD_R;
  const padOffsetZ = D / 2 - T - PAD_R;
  addMesh(padGeo, padMat, 'pad_front_left', -padOffsetX, PAD_H / 2, padOffsetZ);
  addMesh(padGeo, padMat, 'pad_front_right', padOffsetX, PAD_H / 2, padOffsetZ);
  addMesh(padGeo, padMat, 'pad_back_left', -padOffsetX, PAD_H / 2, -padOffsetZ);
  addMesh(padGeo, padMat, 'pad_back_right', padOffsetX, PAD_H / 2, -padOffsetZ);

  return group;
}
