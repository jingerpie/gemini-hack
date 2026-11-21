function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const W = 0.24;
  const D = 0.36;
  const H = 0.032;
  const CORNER_R = 0.036;
  const RIM_THICK = 0.022;
  const BASE_THICK = 0.012;
  const INNER_W = W - RIM_THICK * 2;
  const INNER_D = D - RIM_THICK * 2;
  const INNER_R = 0.018;
  const RIDGE_H = 0.004;

  // Materials
  const cedarMat = new THREE.MeshStandardMaterial({
    color: 0xa86c42,
    roughness: 0.55,
    metalness: 0.02
  });

  const cedarDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8c5530,
    roughness: 0.62,
    metalness: 0.02
  });

  const patinaMat = new THREE.MeshStandardMaterial({
    color: 0x4f6359,
    roughness: 0.78,
    metalness: 0.02
  });

  // Helper to create a rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
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

  // 1. Solid bottom base
  const baseShape = roundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, cedarMat);
  baseMesh.name = 'tray_base';
  baseMesh.position.y = 0.002;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Raised outer rim
  const rimShape = roundedRectShape(W, D, CORNER_R);
  const rimHole = roundedRectShape(INNER_W, INNER_D, INNER_R);
  rimShape.holes.push(rimHole);

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: H - BASE_THICK - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 16
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, cedarMat);
  rimMesh.name = 'tray_rim';
  rimMesh.position.y = BASE_THICK;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 3. Recessed patina floor
  const floorShape = roundedRectShape(INNER_W + 0.002, INNER_D + 0.002, INNER_R);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 16
  });
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, patinaMat);
  floorMesh.name = 'carved_floor_patina';
  floorMesh.position.y = BASE_THICK;
  floorMesh.castShadow = true;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // 4. Carved geometric zig-zag ridges
  const ridgeShapes = [];
  const cols = 4;
  const rows = 7;
  const usableW = INNER_W - 0.016;
  const usableD = INNER_D - 0.016;
  const colW = usableW / cols;
  const rowD = usableD / rows;
  const barThick = 0.0055;

  for (let c = 0; c < cols; c++) {
    const cx = -usableW / 2 + (c + 0.5) * colW;
    for (let r = 0; r < rows; r++) {
      const cz = -usableD / 2 + (r + 0.5) * rowD;
      const dir = (c + r) % 2 === 0 ? 1 : -1;

      const s = new THREE.Shape();
      const dx = colW * 0.42;
      const dz = rowD * 0.38 * dir;
      const t = barThick / 2;

      s.moveTo(cx - dx, cz - dz - t);
      s.lineTo(cx + dx, cz + dz - t);
      s.lineTo(cx + dx, cz + dz + t);
      s.lineTo(cx - dx, cz - dz + t);
      s.closePath();
      ridgeShapes.push(s);
    }
  }

  const ridgesGeo = new THREE.ExtrudeGeometry(ridgeShapes, {
    depth: RIDGE_H,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 1
  });
  ridgesGeo.rotateX(-Math.PI / 2);
  const ridgesMesh = new THREE.Mesh(ridgesGeo, cedarDarkMat);
  ridgesMesh.name = 'carved_ridges';
  ridgesMesh.position.y = BASE_THICK + 0.0015;
  ridgesMesh.castShadow = true;
  ridgesMesh.receiveShadow = true;
  group.add(ridgesMesh);

  return group;
}
