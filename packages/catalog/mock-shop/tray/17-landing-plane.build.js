function build(THREE) {
  const group = new THREE.Group();

  const W = 0.28;
  const D = 0.28;
  const H = 0.030;
  const T = 0.0022;
  const FOOT_H = 0.0025;
  const FOOT_R = 0.008;
  const FOOT_INSET = 0.018;
  const CORNER_R = 0.012;
  const WALL_INSET = 0.011;
  const WALL_TOP_R = 0.008;
  const WALL_H = H - FOOT_H;

  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,
    roughness: 0.35,
    metalness: 0.75
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.85,
    metalness: 0.05
  });

  // Base plate with rounded corners
  const baseShape = new THREE.Shape();
  const bx = W / 2;
  const bz = D / 2;
  baseShape.moveTo(-bx + CORNER_R, -bz);
  baseShape.lineTo(bx - CORNER_R, -bz);
  baseShape.quadraticCurveTo(bx, -bz, bx, -bz + CORNER_R);
  baseShape.lineTo(bx, bz - CORNER_R);
  baseShape.quadraticCurveTo(bx, bz, bx - CORNER_R, bz);
  baseShape.lineTo(-bx + CORNER_R, bz);
  baseShape.quadraticCurveTo(-bx, bz, -bx, bz - CORNER_R);
  baseShape.lineTo(-bx, -bz + CORNER_R);
  baseShape.quadraticCurveTo(-bx, -bz, -bx + CORNER_R, -bz);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 12
  });
  baseGeo.rotateX(-Math.PI / 2);

  const baseMesh = new THREE.Mesh(baseGeo, trayMat);
  baseMesh.name = 'tray_base_plate';
  baseMesh.position.y = FOOT_H;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Helper to create a side wall with rounded top corners
  function createWallGeo(length) {
    const hw = length / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, WALL_H - WALL_TOP_R);
    shape.quadraticCurveTo(hw, WALL_H, hw - WALL_TOP_R, WALL_H);
    shape.lineTo(-hw + WALL_TOP_R, WALL_H);
    shape.quadraticCurveTo(-hw, WALL_H, -hw, WALL_H - WALL_TOP_R);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.0005,
      bevelSize: 0.0005,
      bevelSegments: 2,
      curveSegments: 12
    });
  }

  const wallLenX = W - 2 * WALL_INSET;
  const wallLenZ = D - 2 * WALL_INSET;
  const wallGeoX = createWallGeo(wallLenX);
  const wallGeoZ = createWallGeo(wallLenZ);

  // Front wall (+Z)
  const frontWall = new THREE.Mesh(wallGeoX, trayMat);
  frontWall.name = 'tray_wall_front';
  frontWall.position.set(0, FOOT_H, D / 2 - T);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  // Back wall (-Z)
  const backWall = new THREE.Mesh(wallGeoX, trayMat);
  backWall.name = 'tray_wall_back';
  backWall.position.set(0, FOOT_H, -D / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Right wall (+X)
  const rightWall = new THREE.Mesh(wallGeoZ, trayMat);
  rightWall.name = 'tray_wall_right';
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(W / 2 - T, FOOT_H, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Left wall (-X)
  const leftWall = new THREE.Mesh(wallGeoZ, trayMat);
  leftWall.name = 'tray_wall_left';
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-W / 2, FOOT_H, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // 4 corner feet pads
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + FOOT_INSET, D / 2 - FOOT_INSET, 'foot_front_left'],
    [W / 2 - FOOT_INSET, D / 2 - FOOT_INSET, 'foot_front_right'],
    [-W / 2 + FOOT_INSET, -D / 2 + FOOT_INSET, 'foot_back_left'],
    [W / 2 - FOOT_INSET, -D / 2 + FOOT_INSET, 'foot_back_right']
  ];

  for (const [fx, fz, name] of footPositions) {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = name;
    foot.position.set(fx, FOOT_H / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  return group;
}
