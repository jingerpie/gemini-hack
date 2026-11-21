function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.75;
  const D = 0.60;

  const TOP_THICK = 0.032;
  const TOP_RADIUS = 0.014;
  const LEG_W = 0.032;
  const LEG_D = 0.032;
  const METAL_THICK = 0.024;
  const MID_RAIL_Y = 0.25;

  const DRAWER_W = 0.52;
  const DRAWER_H = 0.072;
  const DRAWER_D = 0.40;
  const DRAWER_FRONT_THICK = 0.018;
  const DRAWER_CHEEK_W = 0.016;
  const DRAWER_RECESS_Z = 0.025;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa67649,
    roughness: 0.55,
    metalness: 0.05
  });

  const drawerGapMat = new THREE.MeshStandardMaterial({
    color: 0x5c3e24,
    roughness: 0.7,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x6b6762,
    roughness: 0.38,
    metalness: 0.75
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tabletop with rounded corners
  const topShape = new THREE.Shape();
  const hw = W / 2 - TOP_RADIUS;
  const hd = D / 2 - TOP_RADIUS;
  topShape.moveTo(-hw, -D / 2);
  topShape.lineTo(hw, -D / 2);
  topShape.absarc(hw, -hd, TOP_RADIUS, -Math.PI / 2, 0, false);
  topShape.lineTo(W / 2, hd);
  topShape.absarc(hw, hd, TOP_RADIUS, 0, Math.PI / 2, false);
  topShape.lineTo(-hw, D / 2);
  topShape.absarc(-hw, hd, TOP_RADIUS, Math.PI / 2, Math.PI, false);
  topShape.lineTo(-W / 2, -hd);
  topShape.absarc(-hw, -hd, TOP_RADIUS, Math.PI, Math.PI * 1.5, false);

  const topGeom = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK,
    bevelEnabled: false,
    curveSegments: 12
  });
  topGeom.rotateX(Math.PI / 2);
  addMesh(topGeom, woodMat, 'tabletop', 0, H, 0);

  // Under-tabletop drawer unit
  const drawerTopY = H - TOP_THICK;
  const drawerCenterY = drawerTopY - DRAWER_H / 2;
  const drawerFrontZ = D / 2 - DRAWER_RECESS_Z - DRAWER_FRONT_THICK / 2;

  // Drawer box
  const boxGeom = new THREE.BoxGeometry(DRAWER_W - 0.004, DRAWER_H - 0.004, DRAWER_D);
  addMesh(
    boxGeom,
    drawerGapMat,
    'drawer_box',
    0,
    drawerCenterY,
    drawerFrontZ - DRAWER_D / 2
  );

  // Drawer front
  const frontGeom = new THREE.BoxGeometry(DRAWER_W - 0.006, DRAWER_H - 0.004, DRAWER_FRONT_THICK);
  addMesh(frontGeom, woodMat, 'drawer_front', 0, drawerCenterY, drawerFrontZ);

  // Drawer side cheeks
  const cheekGeom = new THREE.BoxGeometry(DRAWER_CHEEK_W, DRAWER_H, DRAWER_D + DRAWER_FRONT_THICK);
  const cheekOffsetX = DRAWER_W / 2 + DRAWER_CHEEK_W / 2;
  const cheekCenterZ = drawerFrontZ + DRAWER_FRONT_THICK / 2 - (DRAWER_D + DRAWER_FRONT_THICK) / 2;
  addMesh(cheekGeom, woodMat, 'drawer_apron_left', -cheekOffsetX, drawerCenterY, cheekCenterZ);
  addMesh(cheekGeom, woodMat, 'drawer_apron_right', cheekOffsetX, drawerCenterY, cheekCenterZ);

  // Leg & metal frame coordinates
  const sideOuterX = W / 2;
  const woodLegCenterX = sideOuterX - LEG_W / 2;
  const woodLegCenterZ = D / 2 - LEG_D / 2;
  const woodLegH = H - TOP_THICK;

  const metalCenterX = sideOuterX - LEG_W + METAL_THICK / 2;
  const metalFrontZ = woodLegCenterZ - LEG_D / 2 - METAL_THICK / 2;
  const metalRearZ = -D / 2 + METAL_THICK / 2;
  const metalSpanZ = metalFrontZ - metalRearZ + METAL_THICK;
  const metalCenterZ = (metalFrontZ + metalRearZ) / 2;

  const sideConfigs = [
    { name: 'left', sign: -1 },
    { name: 'right', sign: 1 }
  ];

  const woodLegGeom = new THREE.BoxGeometry(LEG_W, woodLegH, LEG_D);
  const metalVertGeom = new THREE.BoxGeometry(METAL_THICK, woodLegH, METAL_THICK);
  const metalHorizGeom = new THREE.BoxGeometry(METAL_THICK, METAL_THICK, metalSpanZ);

  for (let i = 0; i < sideConfigs.length; i++) {
    const side = sideConfigs[i];
    const s = side.sign;

    // Wooden front leg
    addMesh(
      woodLegGeom,
      woodMat,
      'wood_leg_front_' + side.name,
      s * woodLegCenterX,
      woodLegH / 2,
      woodLegCenterZ
    );

    // Metal side frame: front vertical, rear vertical, bottom rail, mid rail, top rail
    addMesh(
      metalVertGeom,
      metalMat,
      'metal_frame_' + side.name + '_front',
      s * metalCenterX,
      woodLegH / 2,
      metalFrontZ
    );

    addMesh(
      metalVertGeom,
      metalMat,
      'metal_frame_' + side.name + '_rear',
      s * metalCenterX,
      woodLegH / 2,
      metalRearZ
    );

    addMesh(
      metalHorizGeom,
      metalMat,
      'metal_frame_' + side.name + '_bottom',
      s * metalCenterX,
      METAL_THICK / 2,
      metalCenterZ
    );

    addMesh(
      metalHorizGeom,
      metalMat,
      'metal_frame_' + side.name + '_mid',
      s * metalCenterX,
      MID_RAIL_Y,
      metalCenterZ
    );

    addMesh(
      metalHorizGeom,
      metalMat,
      'metal_frame_' + side.name + '_top',
      s * metalCenterX,
      woodLegH - METAL_THICK / 2,
      metalCenterZ
    );
  }

  // Rear horizontal metal stretcher connecting left and right frames
  const stretcherW = (metalCenterX - METAL_THICK / 2) * 2;
  const stretcherGeom = new THREE.BoxGeometry(stretcherW, METAL_THICK, METAL_THICK);
  addMesh(stretcherGeom, metalMat, 'metal_stretcher_rear', 0, MID_RAIL_Y, metalRearZ);

  return group;
}
