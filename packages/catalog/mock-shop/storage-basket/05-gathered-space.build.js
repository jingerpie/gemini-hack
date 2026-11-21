function build(THREE) {
  const group = new THREE.Group();

  const W = 0.28;
  const H = 0.18;
  const D = 0.22;
  const WALL_T = 0.006;
  const SEAM_R = 0.0035;
  const HANDLE_W = 0.078;
  const HANDLE_H = 0.036;
  const HANDLE_Y = 0.132;
  const TRIM_W = 0.009;
  const TRIM_T = 0.002;

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x9b9893,
    roughness: 0.92,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x8a8782,
    roughness: 0.95,
    metalness: 0.0,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xa29f9a,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createPillPath(w, h) {
    const path = new THREE.Path();
    const r = h / 2;
    const hw = w / 2 - r;
    path.moveTo(-hw, -r);
    path.lineTo(hw, -r);
    path.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
    path.lineTo(-hw, r);
    path.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    return path;
  }

  function createPillShape(w, h) {
    const shape = new THREE.Shape();
    const r = h / 2;
    const hw = w / 2 - r;
    shape.moveTo(-hw, -r);
    shape.lineTo(hw, -r);
    shape.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-hw, r);
    shape.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    return shape;
  }

  // Bottom panel
  const bottomGeo = new THREE.BoxGeometry(W - WALL_T * 2, WALL_T, D - WALL_T * 2);
  addMesh(bottomGeo, feltMat, 'bottom_panel', 0, WALL_T / 2, 0);

  // Front (+Z) and Back (-Z) walls
  const fbWallGeo = new THREE.BoxGeometry(W, H, WALL_T);
  addMesh(fbWallGeo, feltMat, 'front_wall', 0, H / 2, D / 2 - WALL_T / 2);
  addMesh(fbWallGeo, feltMat, 'back_wall', 0, H / 2, -D / 2 + WALL_T / 2);

  // Left (-X) and Right (+X) walls with pill-shaped handle cutouts
  const sideWallShape = new THREE.Shape();
  const sideW = D - WALL_T * 2;
  sideWallShape.moveTo(-sideW / 2, 0);
  sideWallShape.lineTo(sideW / 2, 0);
  sideWallShape.lineTo(sideW / 2, H);
  sideWallShape.lineTo(-sideW / 2, H);
  sideWallShape.closePath();

  const holePath = createPillPath(HANDLE_W, HANDLE_H);
  holePath.curves.forEach((c) => {
    if (c.v1) c.v1.y += HANDLE_Y;
    if (c.v2) c.v2.y += HANDLE_Y;
    if (c.aY !== undefined) c.aY += HANDLE_Y;
  });
  sideWallShape.holes.push(holePath);

  const sideWallGeo = new THREE.ExtrudeGeometry(sideWallShape, {
    depth: WALL_T,
    bevelEnabled: false,
    curveSegments: 16,
  });

  addMesh(sideWallGeo, feltMat, 'left_wall', -W / 2, 0, 0, 0, Math.PI / 2, 0);
  addMesh(sideWallGeo, feltMat, 'right_wall', W / 2 - WALL_T, 0, 0, 0, Math.PI / 2, 0);

  // Handle raised trim rings
  const trimShape = createPillShape(HANDLE_W + TRIM_W * 2, HANDLE_H + TRIM_W * 2);
  const trimHole = createPillPath(HANDLE_W, HANDLE_H);
  trimShape.holes.push(trimHole);

  const trimGeo = new THREE.ExtrudeGeometry(trimShape, {
    depth: TRIM_T,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 16,
  });

  addMesh(trimGeo, trimMat, 'handle_trim_left', -W / 2 - TRIM_T, HANDLE_Y, 0, 0, Math.PI / 2, 0);
  addMesh(trimGeo, trimMat, 'handle_trim_right', W / 2, HANDLE_Y, 0, 0, Math.PI / 2, 0);

  // Vertical corner seams
  const cornerSeamGeo = new THREE.CylinderGeometry(SEAM_R, SEAM_R, H, 12);
  const cx = W / 2 - SEAM_R * 0.5;
  const cz = D / 2 - SEAM_R * 0.5;
  addMesh(cornerSeamGeo, seamMat, 'corner_seam_fl', -cx, H / 2, cz);
  addMesh(cornerSeamGeo, seamMat, 'corner_seam_fr', cx, H / 2, cz);
  addMesh(cornerSeamGeo, seamMat, 'corner_seam_bl', -cx, H / 2, -cz);
  addMesh(cornerSeamGeo, seamMat, 'corner_seam_br', cx, H / 2, -cz);

  // Bottom edge seams
  const seamFBGeo = new THREE.CylinderGeometry(SEAM_R * 0.8, SEAM_R * 0.8, W - SEAM_R, 10);
  addMesh(seamFBGeo, seamMat, 'bottom_seam_front', 0, SEAM_R * 0.8, cz, 0, 0, Math.PI / 2);
  addMesh(seamFBGeo, seamMat, 'bottom_seam_back', 0, SEAM_R * 0.8, -cz, 0, 0, Math.PI / 2);

  const seamLRGeo = new THREE.CylinderGeometry(SEAM_R * 0.8, SEAM_R * 0.8, D - SEAM_R, 10);
  addMesh(seamLRGeo, seamMat, 'bottom_seam_left', -cx, SEAM_R * 0.8, 0, Math.PI / 2, 0, 0);
  addMesh(seamLRGeo, seamMat, 'bottom_seam_right', cx, SEAM_R * 0.8, 0, Math.PI / 2, 0, 0);

  return group;
}
