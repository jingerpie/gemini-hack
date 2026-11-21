function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.80;
  const D = 0.45;
  const H = 0.50;

  const GLIDE_H = 0.006;
  const LEG_H = 0.21;
  const LEG_W = 0.026;
  const RAIL_H = 0.024;
  const RAIL_W = 0.024;

  const BOX_Y = GLIDE_H + LEG_H;
  const BOX_H = 0.205;
  const PANEL_T = 0.02;

  const CUSHION_BASE_H = 0.008;
  const CUSHION_H = H - BOX_Y - BOX_H - CUSHION_BASE_H;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3b3c,
    roughness: 0.45,
    metalness: 0.75,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.85,
    metalness: 0.1,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c734b,
    roughness: 0.58,
    metalness: 0.05,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3522,
    roughness: 0.7,
    metalness: 0.05,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcbc2b4,
    roughness: 0.92,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Legs and Glides
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const glideGeo = new THREE.CylinderGeometry(LEG_W * 0.42, LEG_W * 0.42, GLIDE_H, 16);

  const legPositions = [
    ['fl', -legX, legZ],
    ['fr', legX, legZ],
    ['bl', -legX, -legZ],
    ['br', legX, -legZ],
  ];

  for (const [tag, lx, lz] of legPositions) {
    addMesh(glideGeo, glideMat, `glide_${tag}`, lx, GLIDE_H / 2, lz);
    addMesh(legGeo, metalMat, `leg_${tag}`, lx, GLIDE_H + LEG_H / 2, lz);
  }

  // 2. Metal Frame Rails
  const railY = BOX_Y - RAIL_H / 2;
  const frontBackRailGeo = new THREE.BoxGeometry(W - LEG_W * 2, RAIL_H, RAIL_W);
  const sideRailGeo = new THREE.BoxGeometry(RAIL_W, RAIL_H, D - LEG_W * 2);

  addMesh(frontBackRailGeo, metalMat, 'rail_front', 0, railY, D / 2 - RAIL_W / 2);
  addMesh(frontBackRailGeo, metalMat, 'rail_back', 0, railY, -D / 2 + RAIL_W / 2);
  addMesh(sideRailGeo, metalMat, 'rail_left', -W / 2 + RAIL_W / 2, railY, 0);
  addMesh(sideRailGeo, metalMat, 'rail_right', W / 2 - RAIL_W / 2, railY, 0);

  // 3. Wooden Storage Box
  // Bottom panel
  const bottomGeo = new THREE.BoxGeometry(W - PANEL_T * 2, PANEL_T, D - PANEL_T * 2);
  addMesh(bottomGeo, woodMat, 'box_bottom', 0, BOX_Y + PANEL_T / 2, 0);

  // Side panels
  const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, BOX_H, D - PANEL_T * 2);
  addMesh(sidePanelGeo, woodMat, 'box_left', -W / 2 + PANEL_T / 2, BOX_Y + BOX_H / 2, 0);
  addMesh(sidePanelGeo, woodMat, 'box_right', W / 2 - PANEL_T / 2, BOX_Y + BOX_H / 2, 0);

  // Back panel
  const backPanelGeo = new THREE.BoxGeometry(W, BOX_H, PANEL_T);
  addMesh(backPanelGeo, woodMat, 'box_back', 0, BOX_Y + BOX_H / 2, -D / 2 + PANEL_T / 2);

  // Front panel with recessed finger-pull notch at top center
  const notchW = 0.095;
  const notchH = 0.016;
  const notchR = 0.008;

  const frontShape = new THREE.Shape();
  frontShape.moveTo(-W / 2, 0);
  frontShape.lineTo(W / 2, 0);
  frontShape.lineTo(W / 2, BOX_H);
  frontShape.lineTo(notchW / 2 + notchR, BOX_H);
  frontShape.quadraticCurveTo(notchW / 2, BOX_H, notchW / 2, BOX_H - notchR);
  frontShape.lineTo(notchW / 2, BOX_H - notchH + notchR);
  frontShape.quadraticCurveTo(notchW / 2, BOX_H - notchH, notchW / 2 - notchR, BOX_H - notchH);
  frontShape.lineTo(-notchW / 2 + notchR, BOX_H - notchH);
  frontShape.quadraticCurveTo(-notchW / 2, BOX_H - notchH, -notchW / 2, BOX_H - notchH + notchR);
  frontShape.lineTo(-notchW / 2, BOX_H - notchR);
  frontShape.quadraticCurveTo(-notchW / 2, BOX_H, -notchW / 2 - notchR, BOX_H);
  frontShape.lineTo(-W / 2, BOX_H);
  frontShape.closePath();

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: PANEL_T,
    bevelEnabled: false,
    curveSegments: 12,
  });
  addMesh(frontGeo, woodMat, 'box_front', 0, BOX_Y, D / 2 - PANEL_T);

  // Dark backing behind the finger-pull notch
  const recessGeo = new THREE.BoxGeometry(notchW + 0.02, notchH + 0.01, 0.008);
  addMesh(
    recessGeo,
    darkWoodMat,
    'finger_pull_recess',
    0,
    BOX_Y + BOX_H - (notchH + 0.01) / 2,
    D / 2 - PANEL_T - 0.004
  );

  // 4. Cushion Base & Upholstered Top
  const cushionBaseY = BOX_Y + BOX_H;
  const cushionBaseGeo = new THREE.BoxGeometry(W - 0.006, CUSHION_BASE_H, D - 0.006);
  addMesh(cushionBaseGeo, darkWoodMat, 'cushion_base', 0, cushionBaseY + CUSHION_BASE_H / 2, 0);

  // Rounded upholstered cushion using ExtrudeGeometry
  const bevel = 0.014;
  const cw = W - bevel * 2;
  const cd = D - bevel * 2;
  const cr = 0.018;

  const cushionShape = new THREE.Shape();
  cushionShape.moveTo(-cw / 2 + cr, -cd / 2);
  cushionShape.lineTo(cw / 2 - cr, -cd / 2);
  cushionShape.quadraticCurveTo(cw / 2, -cd / 2, cw / 2, -cd / 2 + cr);
  cushionShape.lineTo(cw / 2, cd / 2 - cr);
  cushionShape.quadraticCurveTo(cw / 2, cd / 2, cw / 2 - cr, cd / 2);
  cushionShape.lineTo(-cw / 2 + cr, cd / 2);
  cushionShape.quadraticCurveTo(-cw / 2, cd / 2, -cw / 2, cd / 2 - cr);
  cushionShape.lineTo(-cw / 2, -cd / 2 + cr);
  cushionShape.quadraticCurveTo(-cw / 2, -cd / 2, -cw / 2 + cr, -cd / 2);

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 12,
  });
  cushionGeo.rotateX(Math.PI / 2);

  const cushionTopY = cushionBaseY + CUSHION_BASE_H + CUSHION_H - bevel;
  addMesh(cushionGeo, fabricMat, 'cushion_top', 0, cushionTopY, 0);

  return group;
}
