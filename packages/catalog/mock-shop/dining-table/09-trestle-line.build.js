function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.20; // Overall width along X (2200 mm)
  const D = 1.00; // Overall depth along Z
  const H = 0.75; // Overall height along Y

  const TOP_THICK = 0.042;
  const TOP_RADIUS = 0.025;

  const TRESTLE_X = 0.72; // X offset of each trestle from center
  const LEG_W = 0.072; // Leg thickness along X
  const LEG_D = 0.065; // Leg width along Z
  const LEG_TOP_Z = 0.25; // Z half-span at top of legs
  const LEG_BOT_Z = 0.39; // Z half-span at bottom of legs

  const BEARER_H = 0.048;
  const BEARER_D = 0.68;

  const CROSSBAR_Y = 0.175; // Height of lower crossbar center
  const CROSSBAR_H = 0.065;
  const CROSSBAR_W = 0.055;

  const STRETCHER_H = 0.065;
  const STRETCHER_D = 0.065;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8c7d6d,
    roughness: 0.76,
    metalness: 0.0,
  });

  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0x736455,
    roughness: 0.82,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop (rounded rectangle extruded along Y)
  const hw = W / 2 - TOP_RADIUS;
  const hd = D / 2 - TOP_RADIUS;
  const topShape = new THREE.Shape();
  topShape.moveTo(-hw, -D / 2);
  topShape.lineTo(hw, -D / 2);
  topShape.absarc(hw, -hd, TOP_RADIUS, -Math.PI / 2, 0, false);
  topShape.lineTo(W / 2, hd);
  topShape.absarc(hw, hd, TOP_RADIUS, 0, Math.PI / 2, false);
  topShape.lineTo(-hw, D / 2);
  topShape.absarc(-hw, hd, TOP_RADIUS, Math.PI / 2, Math.PI, false);
  topShape.lineTo(-W / 2, -hd);
  topShape.absarc(-hw, -hd, TOP_RADIUS, Math.PI, Math.PI * 1.5, false);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK - 0.006,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 8,
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, woodMat, 'tabletop', [0, H - 0.003, 0]);

  // 2. Trestle assemblies (left: -X, right: +X)
  const legTopY = H - TOP_THICK;
  const dy = legTopY;
  const dz = LEG_BOT_Z - LEG_TOP_Z;
  const legLen = Math.sqrt(dy * dy + dz * dz) + 0.01;
  const legAngle = Math.atan2(dz, dy);
  const legCenterY = legTopY / 2;
  const legCenterZ = (LEG_TOP_Z + LEG_BOT_Z) / 2;

  const legGeo = new THREE.BoxGeometry(LEG_W, legLen, LEG_D);
  const bearerGeo = new THREE.BoxGeometry(LEG_W + 0.01, BEARER_H, BEARER_D);
  const pegGeo = new THREE.BoxGeometry(0.012, 0.014, 0.022);

  // Crossbar span between splayed legs at CROSSBAR_Y
  const tCross = CROSSBAR_Y / legTopY;
  const crossZHalf = LEG_BOT_Z - tCross * (LEG_BOT_Z - LEG_TOP_Z);
  const crossbarLen = crossZHalf * 2 + LEG_D * 0.6;
  const crossbarGeo = new THREE.BoxGeometry(CROSSBAR_W, CROSSBAR_H, crossbarLen);

  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? 'left' : 'right';
    const tx = side * TRESTLE_X;

    // Upper bearer under tabletop
    addMesh(
      bearerGeo,
      woodMat,
      `${sideName}_trestle_bearer`,
      [tx, H - TOP_THICK - BEARER_H / 2, 0]
    );

    // Front (+Z) and Back (-Z) splayed legs
    addMesh(
      legGeo,
      woodMat,
      `${sideName}_front_leg`,
      [tx, legCenterY, legCenterZ],
      [-legAngle, 0, 0]
    );
    addMesh(
      legGeo,
      woodMat,
      `${sideName}_back_leg`,
      [tx, legCenterY, -legCenterZ],
      [legAngle, 0, 0]
    );

    // Lower crossbar
    addMesh(
      crossbarGeo,
      woodMat,
      `${sideName}_lower_crossbar`,
      [tx, CROSSBAR_Y, 0]
    );

    // Wedged tenon details on outer face of lower crossbar (from central stretcher)
    const outerX = tx + side * (CROSSBAR_W / 2 + 0.002);
    addMesh(pegGeo, endGrainMat, `${sideName}_stretcher_tenon_top`, [outerX, CROSSBAR_Y + 0.012, 0]);
    addMesh(pegGeo, endGrainMat, `${sideName}_stretcher_tenon_bot`, [outerX, CROSSBAR_Y - 0.012, 0]);

    // Tenon details on outer faces of legs (from lower crossbar)
    const legPegGeo = new THREE.BoxGeometry(0.02, 0.014, 0.012);
    addMesh(legPegGeo, endGrainMat, `${sideName}_front_leg_tenon`, [tx, CROSSBAR_Y, crossZHalf + LEG_D / 2]);
    addMesh(legPegGeo, endGrainMat, `${sideName}_back_leg_tenon`, [tx, CROSSBAR_Y, -crossZHalf - LEG_D / 2]);
  });

  // 3. Central longitudinal stretcher
  const stretcherLen = TRESTLE_X * 2;
  const stretcherGeo = new THREE.BoxGeometry(stretcherLen, STRETCHER_H, STRETCHER_D);
  addMesh(stretcherGeo, woodMat, 'central_stretcher', [0, CROSSBAR_Y, 0]);

  return group;
}
