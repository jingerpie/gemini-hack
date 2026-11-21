function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.20;
  const D = 0.65;
  const H = 0.75;
  const TOP_T = 0.026;
  const TOP_R = 0.012;
  const BEVEL_SIZE = 0.002;
  const OVERHANG = 0.014;
  const APRON_H = 0.068;
  const APRON_T = 0.024;
  const LEG_TOP_W = 0.048;
  const LEG_BOT_W = 0.028;
  const LEG_H = H - TOP_T;
  const DRAWER_W = 0.46;
  const SEAM_W = 0.0025;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88652,
    roughness: 0.52,
    metalness: 0.02
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x4a331d,
    roughness: 0.8,
    metalness: 0.0
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

  // 1. Tabletop with rounded corners (account for bevelSize so total width == W)
  const topShape = new THREE.Shape();
  const topW = W - BEVEL_SIZE * 2;
  const topD = D - BEVEL_SIZE * 2;
  const hw = topW / 2 - TOP_R;
  const hd = topD / 2 - TOP_R;
  topShape.moveTo(-hw, -topD / 2);
  topShape.lineTo(hw, -topD / 2);
  topShape.quadraticCurveTo(topW / 2, -topD / 2, topW / 2, -hd);
  topShape.lineTo(topW / 2, hd);
  topShape.quadraticCurveTo(topW / 2, topD / 2, hw, topD / 2);
  topShape.lineTo(-hw, topD / 2);
  topShape.quadraticCurveTo(-topW / 2, topD / 2, -topW / 2, hd);
  topShape.lineTo(-topW / 2, -hd);
  topShape.quadraticCurveTo(-topW / 2, -topD / 2, -hw, -topD / 2);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T,
    bevelEnabled: true,
    bevelThickness: BEVEL_SIZE,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 2,
    curveSegments: 8
  });
  topGeo.rotateX(-Math.PI / 2);
  addMesh(topGeo, oakMat, 'tabletop_main', 0, LEG_H, 0);

  // 2. Cable management hatch on back-center of tabletop
  const hatchW = 0.25;
  const hatchD = 0.11;
  const hatchZ = -D / 2 + 0.11;
  const hatchY = H + 0.0015;
  addMesh(
    new THREE.BoxGeometry(hatchW + 0.006, 0.002, hatchD + 0.006),
    seamMat,
    'cable_hatch_seam',
    0,
    hatchY - 0.0005,
    hatchZ
  );
  addMesh(
    new THREE.BoxGeometry(hatchW, 0.0025, hatchD),
    oakMat,
    'cable_hatch_lid',
    0,
    hatchY,
    hatchZ
  );

  // Frame bounds (inset from tabletop edge)
  const frameW = W - OVERHANG * 2;
  const frameD = D - OVERHANG * 2;
  const legCenterX = frameW / 2 - LEG_TOP_W / 2;
  const legCenterZ = frameD / 2 - LEG_TOP_W / 2;
  const apronY = LEG_H - APRON_H / 2;

  // 3. Four tapered legs
  const legTopR = (LEG_TOP_W / 2) * Math.SQRT2;
  const legBotR = (LEG_BOT_W / 2) * Math.SQRT2;
  const legGeo = new THREE.CylinderGeometry(legTopR, legBotR, LEG_H, 4, 1);

  addMesh(legGeo, oakMat, 'leg_front_left', -legCenterX, LEG_H / 2, legCenterZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_front_right', legCenterX, LEG_H / 2, legCenterZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_back_left', -legCenterX, LEG_H / 2, -legCenterZ, 0, Math.PI / 4, 0);
  addMesh(legGeo, oakMat, 'leg_back_right', legCenterX, LEG_H / 2, -legCenterZ, 0, Math.PI / 4, 0);

  // 4. Front apron + center drawer
  const frontSpan = frameW - LEG_TOP_W * 2;
  const sideApronFrontW = (frontSpan - DRAWER_W - SEAM_W * 2) / 2;
  const frontZ = frameD / 2 - APRON_T / 2;

  addMesh(
    new THREE.BoxGeometry(DRAWER_W, APRON_H, APRON_T),
    oakMat,
    'drawer_front',
    0,
    apronY,
    frontZ
  );

  const seamX = DRAWER_W / 2 + SEAM_W / 2;
  addMesh(
    new THREE.BoxGeometry(SEAM_W, APRON_H, APRON_T * 0.9),
    seamMat,
    'drawer_seam_left',
    -seamX,
    apronY,
    frontZ
  );
  addMesh(
    new THREE.BoxGeometry(SEAM_W, APRON_H, APRON_T * 0.9),
    seamMat,
    'drawer_seam_right',
    seamX,
    apronY,
    frontZ
  );

  const sideFrontX = DRAWER_W / 2 + SEAM_W + sideApronFrontW / 2;
  addMesh(
    new THREE.BoxGeometry(sideApronFrontW, APRON_H, APRON_T),
    oakMat,
    'apron_front_left',
    -sideFrontX,
    apronY,
    frontZ
  );
  addMesh(
    new THREE.BoxGeometry(sideApronFrontW, APRON_H, APRON_T),
    oakMat,
    'apron_front_right',
    sideFrontX,
    apronY,
    frontZ
  );

  // 5. Back and side aprons
  addMesh(
    new THREE.BoxGeometry(frontSpan, APRON_H, APRON_T),
    oakMat,
    'apron_back',
    0,
    apronY,
    -frontZ
  );

  const sideSpan = frameD - LEG_TOP_W * 2;
  const sideX = frameW / 2 - APRON_T / 2;
  addMesh(
    new THREE.BoxGeometry(APRON_T, APRON_H, sideSpan),
    oakMat,
    'apron_left',
    -sideX,
    apronY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(APRON_T, APRON_H, sideSpan),
    oakMat,
    'apron_right',
    sideX,
    apronY,
    0
  );

  return group;
}
