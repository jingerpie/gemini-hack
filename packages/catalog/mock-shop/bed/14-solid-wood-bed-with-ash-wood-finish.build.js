function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - Queen size bed
  const W = 1.66;          // Frame width
  const D = 2.14;          // Frame depth
  const H = 1.05;          // Headboard total height
  const LEG_H = 0.16;      // Clearance under rails
  const RAIL_H = 0.17;     // Side & footboard rail height
  const RAIL_T = 0.04;     // Rail thickness
  const LEG_W = 0.065;     // Leg width at top
  const LEG_TAPER = 0.042; // Leg width at bottom
  const HB_T = 0.055;      // Headboard thickness
  const HB_STILE = 0.08;   // Headboard side stile width
  const HB_TOP = 0.09;     // Headboard top rail height

  const MAT_W = 1.54;      // Mattress width
  const MAT_D = 2.02;      // Mattress depth
  const MAT_H = 0.24;      // Mattress thickness
  const MAT_Y = LEG_H + 0.06; // Mattress bottom Y

  // Materials
  const ashWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc9ad88,
    roughness: 0.55,
    metalness: 0.02
  });

  const ashWoodDarkMat = new THREE.MeshStandardMaterial({
    color: 0xbfa17a,
    roughness: 0.6,
    metalness: 0.02
  });

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xd8d7d2,
    roughness: 0.92,
    metalness: 0.0
  });

  const linenFoldMat = new THREE.MeshStandardMaterial({
    color: 0xd2d1cc,
    roughness: 0.94,
    metalness: 0.0
  });

  const sheetMat = new THREE.MeshStandardMaterial({
    color: 0xe6e5e0,
    roughness: 0.88,
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

  // Helper for tapered leg
  function createTaperedLeg(topW, botW, height) {
    const geo = new THREE.CylinderGeometry(topW * 0.707, botW * 0.707, height, 4);
    geo.rotateY(Math.PI / 4);
    return geo;
  }

  const frontZ = D / 2 - LEG_W / 2;
  const backZ = -D / 2 + HB_T / 2;
  const sideX = W / 2 - LEG_W / 2;

  // 1. Four Legs
  const frontLegGeo = createTaperedLeg(LEG_W, LEG_TAPER, LEG_H + RAIL_H);
  addMesh(frontLegGeo, ashWoodMat, 'leg_front_left', -sideX, (LEG_H + RAIL_H) / 2, frontZ);
  addMesh(frontLegGeo, ashWoodMat, 'leg_front_right', sideX, (LEG_H + RAIL_H) / 2, frontZ);

  const backLegGeo = createTaperedLeg(LEG_W, LEG_TAPER, LEG_H + RAIL_H);
  addMesh(backLegGeo, ashWoodMat, 'leg_back_left', -sideX, (LEG_H + RAIL_H) / 2, backZ);
  addMesh(backLegGeo, ashWoodMat, 'leg_back_right', sideX, (LEG_H + RAIL_H) / 2, backZ);

  // 2. Footboard & Side Rails
  const railY = LEG_H + RAIL_H / 2;
  const footRailGeo = new THREE.BoxGeometry(W - LEG_W * 1.4, RAIL_H, RAIL_T);
  addMesh(footRailGeo, ashWoodMat, 'footboard_rail', 0, railY, frontZ);

  const sideRailLen = D - LEG_W - HB_T;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailLen);
  addMesh(sideRailGeo, ashWoodMat, 'side_rail_left', -W / 2 + RAIL_T / 2, railY, (frontZ + backZ) / 2);
  addMesh(sideRailGeo, ashWoodMat, 'side_rail_right', W / 2 - RAIL_T / 2, railY, (frontZ + backZ) / 2);

  // 3. Headboard (at -Z)
  const hbPanelH = H - LEG_H - RAIL_H;
  const hbBaseY = LEG_H + RAIL_H;

  // Headboard side stiles
  const stileGeo = new THREE.BoxGeometry(HB_STILE, hbPanelH, HB_T);
  addMesh(stileGeo, ashWoodMat, 'headboard_stile_left', -W / 2 + HB_STILE / 2, hbBaseY + hbPanelH / 2, backZ);
  addMesh(stileGeo, ashWoodMat, 'headboard_stile_right', W / 2 - HB_STILE / 2, hbBaseY + hbPanelH / 2, backZ);

  // Headboard top rail
  const topRailW = W - HB_STILE * 2;
  const topRailGeo = new THREE.BoxGeometry(topRailW, HB_TOP, HB_T);
  addMesh(topRailGeo, ashWoodMat, 'headboard_top_rail', 0, H - HB_TOP / 2, backZ);

  // Headboard recessed center panel
  const centerPanelH = hbPanelH - HB_TOP;
  const centerPanelGeo = new THREE.BoxGeometry(topRailW, centerPanelH, HB_T * 0.65);
  addMesh(centerPanelGeo, ashWoodDarkMat, 'headboard_center_panel', 0, hbBaseY + centerPanelH / 2, backZ - 0.005);

  // 4. Mattress & Slats Base
  const baseGeo = new THREE.BoxGeometry(MAT_W, 0.04, MAT_D);
  addMesh(baseGeo, ashWoodDarkMat, 'slat_base', 0, MAT_Y - 0.02, 0.02);

  const mattressGeo = new THREE.BoxGeometry(MAT_W, MAT_H, MAT_D);
  addMesh(mattressGeo, sheetMat, 'mattress', 0, MAT_Y + MAT_H / 2, 0.02);

  // 5. Duvet / Comforter
  const duvetTopY = MAT_Y + MAT_H + 0.025;
  const duvetW = MAT_W + 0.14;
  const duvetD = MAT_D * 0.78;
  const duvetZ = 0.22;

  // Main duvet top body
  const duvetMainGeo = new THREE.BoxGeometry(duvetW, 0.07, duvetD);
  addMesh(duvetMainGeo, linenMat, 'duvet_main', 0, duvetTopY, duvetZ);

  // Duvet folded top edge near pillows
  const duvetFoldGeo = new THREE.CapsuleGeometry(0.045, duvetW - 0.06, 6, 16);
  duvetFoldGeo.rotateZ(Math.PI / 2);
  addMesh(duvetFoldGeo, linenFoldMat, 'duvet_top_fold', 0, duvetTopY + 0.015, duvetZ - duvetD / 2 + 0.02);

  // Duvet side drapes (left & right)
  const drapeH = 0.26;
  const drapeGeo = new THREE.BoxGeometry(0.055, drapeH, duvetD + 0.04);
  addMesh(drapeGeo, linenMat, 'duvet_drape_left', -duvetW / 2 - 0.01, duvetTopY - drapeH / 2 + 0.02, duvetZ, 0, 0, -0.14);
  addMesh(drapeGeo, linenMat, 'duvet_drape_right', duvetW / 2 + 0.01, duvetTopY - drapeH / 2 + 0.02, duvetZ, 0, 0, 0.14);

  // Duvet front drape (+Z)
  const frontDrapeGeo = new THREE.BoxGeometry(duvetW + 0.06, drapeH * 0.85, 0.06);
  addMesh(frontDrapeGeo, linenMat, 'duvet_drape_front', 0, duvetTopY - (drapeH * 0.85) / 2 + 0.02, duvetZ + duvetD / 2 + 0.01, 0.12, 0, 0);

  // Duvet front corner folds
  const cornerFoldGeo = new THREE.ConeGeometry(0.09, 0.24, 12);
  addMesh(cornerFoldGeo, linenFoldMat, 'duvet_corner_left', -duvetW / 2 - 0.02, duvetTopY - 0.1, duvetZ + duvetD / 2 - 0.02, 0.15, 0, -0.25);
  addMesh(cornerFoldGeo, linenFoldMat, 'duvet_corner_right', duvetW / 2 + 0.02, duvetTopY - 0.1, duvetZ + duvetD / 2 - 0.02, 0.15, 0, 0.25);

  // 6. Pillows (2 large pillows + 1 central lumbar pillow)
  const pillowY = MAT_Y + MAT_H + 0.11;
  const pillowZ = backZ + HB_T + 0.14;

  function createPillow(w, h, d, name, x, y, z, rx) {
    const pGeo = new THREE.CapsuleGeometry(h * 0.45, w - h * 0.8, 6, 16);
    pGeo.rotateZ(Math.PI / 2);
    pGeo.scale(1, 1, d / h);
    addMesh(pGeo, linenMat, name, x, y, z, rx, 0, 0);
  }

  createPillow(0.66, 0.24, 0.16, 'pillow_left', -0.37, pillowY, pillowZ, -0.28);
  createPillow(0.66, 0.24, 0.16, 'pillow_right', 0.37, pillowY, pillowZ, -0.28);

  // Central lumbar pillow
  createPillow(0.44, 0.18, 0.13, 'pillow_lumbar_center', 0, pillowY - 0.03, pillowZ + 0.13, -0.2);

  return group;
}
