function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const DIAMETER = 1.20;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.75;
  const TOP_THICK = 0.038;
  const BEVEL_INSET = 0.024;
  const LEG_TOP_W = 0.068;
  const LEG_BOT_W = 0.040;
  const PAD_H = 0.004;
  const LEG_H = HEIGHT - TOP_THICK - PAD_H;
  const LEG_OFFSET = 0.34; // distance from center along X and Z
  const APRON_H = 0.042;
  const APRON_THICK = 0.024;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xcab08e,
    roughness: 0.62,
    metalness: 0.02,
  });

  const oakUnderMat = new THREE.MeshStandardMaterial({
    color: 0xbda17e,
    roughness: 0.68,
    metalness: 0.02,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x4a4036,
    roughness: 0.9,
    metalness: 0.0,
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

  // 1. Tabletop with beveled underside using LatheGeometry
  const topProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS - BEVEL_INSET, 0),
    new THREE.Vector2(RADIUS, TOP_THICK * 0.55),
    new THREE.Vector2(RADIUS, TOP_THICK),
    new THREE.Vector2(0, TOP_THICK),
  ];
  const topGeo = new THREE.LatheGeometry(topProfile, 32);
  addMesh(topGeo, oakMat, 'tabletop', 0, HEIGHT - TOP_THICK, 0);

  // 2. Four tapered square-section legs + floor pads
  const legTopR = (LEG_TOP_W * Math.SQRT2) / 2;
  const legBotR = (LEG_BOT_W * Math.SQRT2) / 2;
  const legGeo = new THREE.CylinderGeometry(legTopR, legBotR, LEG_H, 4);
  const padGeo = new THREE.CylinderGeometry(legBotR * 0.92, legBotR * 0.92, PAD_H, 4);

  const legPositions = [
    { name: 'fl', x: -LEG_OFFSET, z: LEG_OFFSET },
    { name: 'fr', x: LEG_OFFSET, z: LEG_OFFSET },
    { name: 'bl', x: -LEG_OFFSET, z: -LEG_OFFSET },
    { name: 'br', x: LEG_OFFSET, z: -LEG_OFFSET },
  ];

  for (const pos of legPositions) {
    addMesh(
      legGeo,
      oakMat,
      `leg_${pos.name}`,
      pos.x,
      PAD_H + LEG_H / 2,
      pos.z,
      0,
      Math.PI / 4,
      0
    );
    addMesh(
      padGeo,
      padMat,
      `foot_pad_${pos.name}`,
      pos.x,
      PAD_H / 2,
      pos.z,
      0,
      Math.PI / 4,
      0
    );
  }

  // 3. Apron rails connecting the legs under the tabletop
  const apronSpan = LEG_OFFSET * 2;
  const apronY = HEIGHT - TOP_THICK - APRON_H / 2;
  const apronGeoZ = new THREE.BoxGeometry(apronSpan, APRON_H, APRON_THICK);
  const apronGeoX = new THREE.BoxGeometry(APRON_THICK, APRON_H, apronSpan);

  addMesh(apronGeoZ, oakUnderMat, 'apron_front', 0, apronY, LEG_OFFSET);
  addMesh(apronGeoZ, oakUnderMat, 'apron_back', 0, apronY, -LEG_OFFSET);
  addMesh(apronGeoX, oakUnderMat, 'apron_left', -LEG_OFFSET, apronY, 0);
  addMesh(apronGeoX, oakUnderMat, 'apron_right', LEG_OFFSET, apronY, 0);

  // 4. Under-top cross braces
  const braceH = 0.024;
  const braceW = 0.036;
  const braceY = HEIGHT - TOP_THICK - braceH / 2;
  const braceGeoX = new THREE.BoxGeometry(apronSpan, braceH, braceW);
  const braceGeoZ = new THREE.BoxGeometry(braceW, braceH, apronSpan);

  addMesh(braceGeoX, oakUnderMat, 'under_brace_x', 0, braceY, 0);
  addMesh(braceGeoZ, oakUnderMat, 'under_brace_z', 0, braceY, 0);

  return group;
}
