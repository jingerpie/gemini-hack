function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.80;
  const H = 0.75;
  const D = 0.90;

  const TOP_THICK = 0.036;
  const TOP_RADIUS = 0.015;
  const CLEAT_W = 0.085;
  const CLEAT_H = 0.034;
  const CLEAT_D = 0.62;

  const TRESTLE_X = 0.58;
  const LEG_W = 0.065;
  const LEG_D = 0.075;
  const Z_BOT = 0.34;
  const Z_TOP = 0.22;

  const CROSSBAR_Y = 0.16;
  const CROSSBAR_W = 0.055;
  const CROSSBAR_H = 0.060;

  const STRETCHER_H = 0.055;
  const STRETCHER_D = 0.045;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6b472f,
    roughness: 0.55,
    metalness: 0.02
  });

  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0x4a2f1d,
    roughness: 0.65,
    metalness: 0.02
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

  // 1. Tabletop (ExtrudeGeometry with rounded corners)
  const topShape = new THREE.Shape();
  const hw = W / 2 - TOP_RADIUS;
  const hd = D / 2 - TOP_RADIUS;
  topShape.moveTo(-hw, -D / 2);
  topShape.lineTo(hw, -D / 2);
  topShape.quadraticCurveTo(W / 2, -D / 2, W / 2, -hd);
  topShape.lineTo(W / 2, hd);
  topShape.quadraticCurveTo(W / 2, D / 2, hw, D / 2);
  topShape.lineTo(-hw, D / 2);
  topShape.quadraticCurveTo(-W / 2, D / 2, -W / 2, hd);
  topShape.lineTo(-W / 2, -hd);
  topShape.quadraticCurveTo(-W / 2, -D / 2, -hw, -D / 2);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 8
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, woodMat, 'tabletop', 0, H - 0.002, 0);

  // 2. Under-top Cleats (left and right)
  const cleatGeo = new THREE.BoxGeometry(CLEAT_W, CLEAT_H, CLEAT_D);
  const cleatY = H - TOP_THICK - CLEAT_H / 2 + 0.002;
  addMesh(cleatGeo, woodMat, 'cleat_left', -TRESTLE_X, cleatY, 0);
  addMesh(cleatGeo, woodMat, 'cleat_right', TRESTLE_X, cleatY, 0);

  // 3. A-frame Trestle Legs
  const legTopY = H - TOP_THICK - CLEAT_H * 0.5;
  const dz = Z_BOT - Z_TOP;
  const legAngle = Math.atan2(dz, legTopY);
  const legLen = Math.sqrt(legTopY * legTopY + dz * dz);
  const legGeo = new THREE.BoxGeometry(LEG_W, legLen, LEG_D);

  const legCenterY = legTopY / 2 + (LEG_D / 2) * Math.sin(legAngle);
  const legCenterZ = (Z_BOT + Z_TOP) / 2;

  const sides = [
    { name: 'left', x: -TRESTLE_X },
    { name: 'right', x: TRESTLE_X }
  ];

  sides.forEach((side) => {
    // Front leg (+Z)
    addMesh(
      legGeo,
      woodMat,
      `leg_${side.name}_front`,
      side.x,
      legCenterY,
      legCenterZ,
      -legAngle,
      0,
      0
    );
    // Back leg (-Z)
    addMesh(
      legGeo,
      woodMat,
      `leg_${side.name}_back`,
      side.x,
      legCenterY,
      -legCenterZ,
      legAngle,
      0,
      0
    );

    // Crossbar connecting front and back legs
    const t = CROSSBAR_Y / legTopY;
    const zAtCrossbar = Z_BOT * (1 - t) + Z_TOP * t;
    const crossbarLen = zAtCrossbar * 2 + LEG_D * 0.4;
    const crossbarGeo = new THREE.BoxGeometry(CROSSBAR_W, CROSSBAR_H, crossbarLen);
    addMesh(
      crossbarGeo,
      woodMat,
      `crossbar_${side.name}`,
      side.x,
      CROSSBAR_Y,
      0
    );

    // Through-tenon details on outer leg faces
    const tenonGeo = new THREE.BoxGeometry(0.006, CROSSBAR_H * 0.65, LEG_D * 0.55);
    const tenonX = side.x + (side.x < 0 ? -LEG_W / 2 - 0.001 : LEG_W / 2 + 0.001);
    addMesh(tenonGeo, endGrainMat, `tenon_${side.name}_front`, tenonX, CROSSBAR_Y, zAtCrossbar);
    addMesh(tenonGeo, endGrainMat, `tenon_${side.name}_back`, tenonX, CROSSBAR_Y, -zAtCrossbar);
  });

  // 4. Central Longitudinal Stretcher
  const stretcherLen = TRESTLE_X * 2 - CROSSBAR_W * 0.5;
  const stretcherGeo = new THREE.BoxGeometry(stretcherLen, STRETCHER_H, STRETCHER_D);
  addMesh(stretcherGeo, woodMat, 'central_stretcher', 0, CROSSBAR_Y, 0);

  // Through-tenon details for central stretcher on outer crossbar faces
  const stretcherTenonGeo = new THREE.BoxGeometry(0.006, STRETCHER_H * 0.65, STRETCHER_D * 0.7);
  addMesh(
    stretcherTenonGeo,
    endGrainMat,
    'stretcher_tenon_left',
    -TRESTLE_X - CROSSBAR_W / 2 - 0.001,
    CROSSBAR_Y,
    0
  );
  addMesh(
    stretcherTenonGeo,
    endGrainMat,
    'stretcher_tenon_right',
    TRESTLE_X + CROSSBAR_W / 2 + 0.001,
    CROSSBAR_Y,
    0
  );

  return group;
}
