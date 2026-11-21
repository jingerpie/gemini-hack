function build(THREE) {
  const group = new THREE.Group();

  const W = 0.30;
  const D = 0.20;
  const H = 0.042;
  const WALL_T = 0.008;
  const BASE_T = 0.006;
  const RIM_T = 0.0015;

  const HANDLE_W = 0.072;
  const HANDLE_H = 0.015;
  const HANDLE_Y = H * 0.58;

  const matYellow = new THREE.MeshPhysicalMaterial({
    color: 0xd49b27,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });

  const matWoodEdge = new THREE.MeshStandardMaterial({
    color: 0xd8b88a,
    roughness: 0.55,
    metalness: 0.0,
  });

  // Base plate
  const baseGeo = new THREE.BoxGeometry(W - 2 * WALL_T, BASE_T, D - 2 * WALL_T);
  const baseMesh = new THREE.Mesh(baseGeo, matYellow);
  baseMesh.name = 'tray_base';
  baseMesh.position.set(0, BASE_T / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Front and back long walls (along X, at +Z and -Z)
  const longWallH = H - RIM_T;
  const longWallGeo = new THREE.BoxGeometry(W, longWallH, WALL_T);

  const wallFront = new THREE.Mesh(longWallGeo, matYellow);
  wallFront.name = 'wall_front';
  wallFront.position.set(0, longWallH / 2, D / 2 - WALL_T / 2);
  wallFront.castShadow = true;
  wallFront.receiveShadow = true;
  group.add(wallFront);

  const wallBack = new THREE.Mesh(longWallGeo, matYellow);
  wallBack.name = 'wall_back';
  wallBack.position.set(0, longWallH / 2, -D / 2 + WALL_T / 2);
  wallBack.castShadow = true;
  wallBack.receiveShadow = true;
  group.add(wallBack);

  // Side walls with pill-shaped handle cutouts (along Z, at -X and +X)
  const sideSpan = D - 2 * WALL_T;
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-sideSpan / 2, 0);
  sideShape.lineTo(sideSpan / 2, 0);
  sideShape.lineTo(sideSpan / 2, longWallH);
  sideShape.lineTo(-sideSpan / 2, longWallH);
  sideShape.closePath();

  const hr = HANDLE_H / 2;
  const hw = HANDLE_W / 2 - hr;
  const holePath = new THREE.Path();
  holePath.moveTo(-hw, HANDLE_Y - hr);
  holePath.lineTo(hw, HANDLE_Y - hr);
  holePath.absarc(hw, HANDLE_Y, hr, -Math.PI / 2, Math.PI / 2, false);
  holePath.lineTo(-hw, HANDLE_Y + hr);
  holePath.absarc(-hw, HANDLE_Y, hr, Math.PI / 2, (3 * Math.PI) / 2, false);
  sideShape.holes.push(holePath);

  const sideWallGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: WALL_T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  sideWallGeo.rotateY(Math.PI / 2);
  sideWallGeo.translate(-WALL_T / 2, 0, 0);

  const wallLeft = new THREE.Mesh(sideWallGeo, matYellow);
  wallLeft.name = 'wall_left';
  wallLeft.position.set(-W / 2 + WALL_T / 2, 0, 0);
  wallLeft.castShadow = true;
  wallLeft.receiveShadow = true;
  group.add(wallLeft);

  const wallRight = new THREE.Mesh(sideWallGeo, matYellow);
  wallRight.name = 'wall_right';
  wallRight.position.set(W / 2 - WALL_T / 2, 0, 0);
  wallRight.castShadow = true;
  wallRight.receiveShadow = true;
  group.add(wallRight);

  // Exposed natural wood top rims
  const rimLongGeo = new THREE.BoxGeometry(W, RIM_T, WALL_T);
  const rimFront = new THREE.Mesh(rimLongGeo, matWoodEdge);
  rimFront.name = 'rim_front';
  rimFront.position.set(0, H - RIM_T / 2, D / 2 - WALL_T / 2);
  rimFront.castShadow = true;
  rimFront.receiveShadow = true;
  group.add(rimFront);

  const rimBack = new THREE.Mesh(rimLongGeo, matWoodEdge);
  rimBack.name = 'rim_back';
  rimBack.position.set(0, H - RIM_T / 2, -D / 2 + WALL_T / 2);
  rimBack.castShadow = true;
  rimBack.receiveShadow = true;
  group.add(rimBack);

  const rimSideGeo = new THREE.BoxGeometry(WALL_T, RIM_T, sideSpan);
  const rimLeft = new THREE.Mesh(rimSideGeo, matWoodEdge);
  rimLeft.name = 'rim_left';
  rimLeft.position.set(-W / 2 + WALL_T / 2, H - RIM_T / 2, 0);
  rimLeft.castShadow = true;
  rimLeft.receiveShadow = true;
  group.add(rimLeft);

  const rimRight = new THREE.Mesh(rimSideGeo, matWoodEdge);
  rimRight.name = 'rim_right';
  rimRight.position.set(W / 2 - WALL_T / 2, H - RIM_T / 2, 0);
  rimRight.castShadow = true;
  rimRight.receiveShadow = true;
  group.add(rimRight);

  return group;
}
