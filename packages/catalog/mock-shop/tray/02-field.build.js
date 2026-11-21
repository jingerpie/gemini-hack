function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const D = 0.32;
  const H = 0.055;
  const T = 0.014;
  const BASE_H = 0.010;
  const R = 0.026;
  const R_IN = R - T;

  const HANDLE_W = 0.095;
  const HANDLE_H = 0.020;
  const HANDLE_Y = 0.030;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.58,
    metalness: 0.02
  });

  function addMesh(geo, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, oakMat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
    return shape;
  }

  // 1. Bottom panel
  const baseShape = createRoundedRectShape(W - T, D - T, R - T / 2);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, 'tray_bottom', 0, 0, 0);

  // 2. Front and Back walls (+Z and -Z)
  const longWallLen = W - 2 * R;
  const longWallGeo = new THREE.BoxGeometry(longWallLen, H, T);
  addMesh(longWallGeo, 'front_wall', 0, H / 2, D / 2 - T / 2);
  addMesh(longWallGeo, 'back_wall', 0, H / 2, -D / 2 + T / 2);

  // 3. Left and Right walls (-X and +X) with capsule handle cutouts
  const shortWallLen = D - 2 * R;
  const shortWallShape = new THREE.Shape();
  shortWallShape.moveTo(-shortWallLen / 2, 0);
  shortWallShape.lineTo(shortWallLen / 2, 0);
  shortWallShape.lineTo(shortWallLen / 2, H);
  shortWallShape.lineTo(-shortWallLen / 2, H);
  shortWallShape.closePath();

  const hr = HANDLE_H / 2;
  const hStraight = HANDLE_W - HANDLE_H;
  const holePath = new THREE.Path();
  holePath.moveTo(-hStraight / 2, HANDLE_Y - hr);
  holePath.lineTo(hStraight / 2, HANDLE_Y - hr);
  holePath.absarc(hStraight / 2, HANDLE_Y, hr, -Math.PI / 2, Math.PI / 2, false);
  holePath.lineTo(-hStraight / 2, HANDLE_Y + hr);
  holePath.absarc(-hStraight / 2, HANDLE_Y, hr, Math.PI / 2, Math.PI * 1.5, false);
  shortWallShape.holes.push(holePath);

  const shortWallGeo = new THREE.ExtrudeGeometry(shortWallShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16
  });

  // Left wall (-X): extrudes from x = -W/2 to -W/2 + T
  addMesh(shortWallGeo, 'left_handle_wall', -W / 2, 0, 0, 0, Math.PI / 2, 0);
  // Right wall (+X): extrudes from x = W/2 - T to W/2
  addMesh(shortWallGeo, 'right_handle_wall', W / 2 - T, 0, 0, 0, Math.PI / 2, 0);

  // 4. Four rounded corner posts
  const cornerShape = new THREE.Shape();
  cornerShape.absarc(0, 0, R, 0, Math.PI / 2, false);
  cornerShape.lineTo(0, R_IN);
  cornerShape.absarc(0, 0, R_IN, Math.PI / 2, 0, true);
  cornerShape.closePath();

  const cornerGeo = new THREE.ExtrudeGeometry(cornerShape, {
    depth: H,
    bevelEnabled: false,
    curveSegments: 16
  });
  cornerGeo.rotateX(-Math.PI / 2);

  const cx = W / 2 - R;
  const cz = D / 2 - R;
  addMesh(cornerGeo, 'corner_br', cx, 0, -cz, 0, 0, 0);
  addMesh(cornerGeo, 'corner_bl', -cx, 0, -cz, 0, Math.PI / 2, 0);
  addMesh(cornerGeo, 'corner_fl', -cx, 0, cz, 0, Math.PI, 0);
  addMesh(cornerGeo, 'corner_fr', cx, 0, cz, 0, -Math.PI / 2, 0);

  return group;
}
