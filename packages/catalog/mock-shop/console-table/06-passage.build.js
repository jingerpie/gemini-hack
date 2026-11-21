function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.78;
  const D = 0.40;

  const TOP_THICK = 0.026;
  const LEG_SIZE = 0.045;
  const GLIDE_H = 0.003;

  const APRON_H = 0.11;
  const APRON_THICK = 0.022;

  const STRETCHER_Y = 0.14;
  const STRETCHER_W = 0.028;
  const STRETCHER_H = 0.032;

  const DRAWER_W = 0.54;
  const GAP = 0.002;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc2935e,
    roughness: 0.62,
    metalness: 0.02
  });

  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x241a10,
    roughness: 0.85,
    metalness: 0.0
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.8,
    metalness: 0.1
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

  // 1. Tabletop
  const topGeom = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeom, oakMat, 'table_top', 0, H - TOP_THICK / 2, 0);

  // 2. Legs & Glides
  const legH = H - TOP_THICK - GLIDE_H;
  const legGeom = new THREE.BoxGeometry(LEG_SIZE, legH, LEG_SIZE);
  const glideGeom = new THREE.CylinderGeometry(LEG_SIZE * 0.4, LEG_SIZE * 0.4, GLIDE_H, 16);

  const legX = W / 2 - LEG_SIZE / 2;
  const legZ = D / 2 - LEG_SIZE / 2;
  const legY = GLIDE_H + legH / 2;
  const glideY = GLIDE_H / 2;

  const legPositions = [
    ['front_left', -legX, legZ],
    ['front_right', legX, legZ],
    ['back_left', -legX, -legZ],
    ['back_right', legX, -legZ]
  ];

  for (const [label, lx, lz] of legPositions) {
    addMesh(legGeom, oakMat, `leg_${label}`, lx, legY, lz);
    addMesh(glideGeom, glideMat, `glide_${label}`, lx, glideY, lz);
  }

  // 3. Aprons (Left, Right, Back)
  const apronY = H - TOP_THICK - APRON_H / 2;
  const sideApronLen = D - 2 * LEG_SIZE;
  const sideApronGeom = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideApronLen);

  addMesh(sideApronGeom, oakMat, 'apron_left', -W / 2 + APRON_THICK / 2 + 0.004, apronY, 0);
  addMesh(sideApronGeom, oakMat, 'apron_right', W / 2 - APRON_THICK / 2 - 0.004, apronY, 0);

  const backApronLen = W - 2 * LEG_SIZE;
  const backApronGeom = new THREE.BoxGeometry(backApronLen, APRON_H, APRON_THICK);
  addMesh(backApronGeom, oakMat, 'apron_back', 0, apronY, -D / 2 + APRON_THICK / 2 + 0.004);

  // 4. Front Apron Panels & Center Drawer
  const frontSpan = W - 2 * LEG_SIZE;
  const sidePanelW = (frontSpan - DRAWER_W - 2 * GAP) / 2;
  const frontZ = D / 2 - APRON_THICK / 2 - 0.002;

  const sidePanelGeom = new THREE.BoxGeometry(sidePanelW, APRON_H, APRON_THICK);
  const leftPanelX = -frontSpan / 2 + sidePanelW / 2;
  const rightPanelX = frontSpan / 2 - sidePanelW / 2;

  addMesh(sidePanelGeom, oakMat, 'front_panel_left', leftPanelX, apronY, frontZ);
  addMesh(sidePanelGeom, oakMat, 'front_panel_right', rightPanelX, apronY, frontZ);

  // Center Drawer Front with top-center finger-pull cutout
  const cutTopW = 0.085;
  const cutBotW = 0.062;
  const cutH = 0.018;

  const drawerShape = new THREE.Shape();
  drawerShape.moveTo(-DRAWER_W / 2, -APRON_H / 2);
  drawerShape.lineTo(DRAWER_W / 2, -APRON_H / 2);
  drawerShape.lineTo(DRAWER_W / 2, APRON_H / 2);
  drawerShape.lineTo(cutTopW / 2, APRON_H / 2);
  drawerShape.lineTo(cutBotW / 2, APRON_H / 2 - cutH);
  drawerShape.lineTo(-cutBotW / 2, APRON_H / 2 - cutH);
  drawerShape.lineTo(-cutTopW / 2, APRON_H / 2);
  drawerShape.lineTo(-DRAWER_W / 2, APRON_H / 2);
  drawerShape.closePath();

  const drawerGeom = new THREE.ExtrudeGeometry(drawerShape, {
    depth: APRON_THICK,
    bevelEnabled: false
  });
  drawerGeom.translate(0, 0, -APRON_THICK / 2);

  addMesh(drawerGeom, oakMat, 'drawer_front', 0, apronY, frontZ);

  // Dark recess behind the drawer finger-pull
  const recessGeom = new THREE.BoxGeometry(cutTopW + 0.02, cutH + 0.01, 0.012);
  addMesh(recessGeom, darkRecessMat, 'drawer_pull_recess', 0, apronY + APRON_H / 2 - cutH / 2 - 0.002, frontZ - APRON_THICK / 2 - 0.006);

  // 5. Lower H-Stretcher
  const sideStretcherLen = D - 2 * LEG_SIZE;
  const sideStretcherGeom = new THREE.BoxGeometry(STRETCHER_W, STRETCHER_H, sideStretcherLen);

  addMesh(sideStretcherGeom, oakMat, 'stretcher_left', -legX, STRETCHER_Y, 0);
  addMesh(sideStretcherGeom, oakMat, 'stretcher_right', legX, STRETCHER_Y, 0);

  const centerStretcherLen = W - 2 * LEG_SIZE;
  const centerStretcherGeom = new THREE.BoxGeometry(centerStretcherLen, STRETCHER_H, STRETCHER_W);
  addMesh(centerStretcherGeom, oakMat, 'stretcher_center', 0, STRETCHER_Y, 0);

  return group;
}
