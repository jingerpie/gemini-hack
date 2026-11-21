function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const D = 0.16;
  const H = 0.022;
  const CORNER_R = 0.022;
  const WALL_T = 0.011;
  const FOOT_H = 0.003;
  const BASE_H = 0.007;
  const RIM_H = H - FOOT_H - BASE_H;

  // Materials
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x9b8f86,
    roughness: 0.35,
    metalness: 0.04
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x5c5c5e,
    roughness: 0.85,
    metalness: 0.02
  });

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Base plate
  const baseShape = createRoundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 3,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, ceramicMat);
  baseMesh.name = 'tray_base';
  baseMesh.position.y = FOOT_H;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Raised rim
  const rimShape = createRoundedRectShape(W, D, CORNER_R);
  const innerW = W - WALL_T * 2;
  const innerD = D - WALL_T * 2;
  const innerR = Math.max(0.004, CORNER_R - WALL_T);
  const holePath = createRoundedRectShape(innerW, innerD, innerR);
  rimShape.holes.push(holePath);

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RIM_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.0025,
    bevelSegments: 4,
    curveSegments: 16
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, ceramicMat);
  rimMesh.name = 'tray_rim';
  rimMesh.position.y = FOOT_H + BASE_H - 0.001;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 3. Corner feet
  const footGeo = new THREE.CylinderGeometry(0.014, 0.013, FOOT_H + 0.001, 16);
  const footOffsetX = W / 2 - CORNER_R - 0.004;
  const footOffsetZ = D / 2 - CORNER_R - 0.004;
  const footPositions = [
    [-footOffsetX, -footOffsetZ, 'foot_back_left'],
    [footOffsetX, -footOffsetZ, 'foot_back_right'],
    [-footOffsetX, footOffsetZ, 'foot_front_left'],
    [footOffsetX, footOffsetZ, 'foot_front_right']
  ];

  for (const [fx, fz, name] of footPositions) {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = name;
    foot.position.set(fx, (FOOT_H + 0.001) / 2, fz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  return group;
}
