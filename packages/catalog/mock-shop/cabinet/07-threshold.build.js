function build(THREE) {
  const group = new THREE.Group();

  const W = 1.60;
  const H = 0.86;
  const D = 0.45;
  const BASE_H = 0.24;
  const CAB_H = H - BASE_H;
  const PANEL_T = 0.022;
  const LEG_W = 0.04;
  const LEG_D = 0.04;
  const LEG_INSET_X = 0.08;
  const LEG_INSET_Z = 0.05;
  const STRETCHER_H = 0.032;
  const STRETCHER_T = 0.028;
  const STRETCHER_Y = 0.11;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc4945e,
    roughness: 0.65,
    metalness: 0.02
  });

  const darkOakMat = new THREE.MeshStandardMaterial({
    color: 0x875c32,
    roughness: 0.75,
    metalness: 0.02
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

  // Legs
  const legGeo = new THREE.BoxGeometry(LEG_W, BASE_H, LEG_D);
  const legX = W / 2 - LEG_INSET_X - LEG_W / 2;
  const legZ = D / 2 - LEG_INSET_Z - LEG_D / 2;

  addMesh(legGeo, oakMat, 'leg_front_left', -legX, BASE_H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_front_right', legX, BASE_H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_back_left', -legX, BASE_H / 2, -legZ);
  addMesh(legGeo, oakMat, 'leg_back_right', legX, BASE_H / 2, -legZ);

  // Side stretchers
  const sideStretcherLen = legZ * 2;
  const sideStretcherGeo = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, sideStretcherLen);
  addMesh(sideStretcherGeo, oakMat, 'stretcher_left', -legX, STRETCHER_Y, 0);
  addMesh(sideStretcherGeo, oakMat, 'stretcher_right', legX, STRETCHER_Y, 0);

  // Center stretcher
  const centerStretcherLen = legX * 2;
  const centerStretcherGeo = new THREE.BoxGeometry(centerStretcherLen, STRETCHER_H, STRETCHER_T);
  addMesh(centerStretcherGeo, oakMat, 'stretcher_center', 0, STRETCHER_Y, 0);

  // Cabinet carcass
  const topBottomGeo = new THREE.BoxGeometry(W, PANEL_T, D);
  addMesh(topBottomGeo, oakMat, 'panel_top', 0, H - PANEL_T / 2, 0);
  addMesh(topBottomGeo, oakMat, 'panel_bottom', 0, BASE_H + PANEL_T / 2, 0);

  const sidePanelH = CAB_H - PANEL_T * 2;
  const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, sidePanelH, D);
  addMesh(sidePanelGeo, oakMat, 'panel_left', -W / 2 + PANEL_T / 2, BASE_H + CAB_H / 2, 0);
  addMesh(sidePanelGeo, oakMat, 'panel_right', W / 2 - PANEL_T / 2, BASE_H + CAB_H / 2, 0);

  const backPanelW = W - PANEL_T * 2;
  const backPanelGeo = new THREE.BoxGeometry(backPanelW, sidePanelH, PANEL_T);
  addMesh(backPanelGeo, oakMat, 'panel_back', 0, BASE_H + CAB_H / 2, -D / 2 + PANEL_T / 2);

  // Sliding doors
  const doorW = (W - PANEL_T * 2) / 2 + 0.01;
  const doorH = sidePanelH - 0.004;
  const doorT = 0.018;
  const doorCenterY = BASE_H + CAB_H / 2;
  const doorLeftX = -W / 2 + PANEL_T + doorW / 2 - 0.002;
  const doorRightX = W / 2 - PANEL_T - doorW / 2 + 0.002;

  const doorGeo = new THREE.BoxGeometry(doorW, doorH, doorT);
  const doorLeftZ = D / 2 - PANEL_T * 0.7;
  const doorRightZ = doorLeftZ - doorT - 0.004;

  addMesh(doorGeo, oakMat, 'door_left', doorLeftX, doorCenterY, doorLeftZ);
  addMesh(doorGeo, oakMat, 'door_right', doorRightX, doorCenterY, doorRightZ);

  // Recessed vertical handles
  const handleW = 0.014;
  const handleH = 0.14;
  const handleD = 0.006;
  const handleGeo = new THREE.BoxGeometry(handleW, handleH, handleD);
  const handleInsetX = 0.035;

  addMesh(
    handleGeo,
    darkOakMat,
    'handle_left',
    doorLeftX - doorW / 2 + handleInsetX,
    doorCenterY - 0.02,
    doorLeftZ + doorT / 2 - handleD / 2 + 0.001
  );
  addMesh(
    handleGeo,
    darkOakMat,
    'handle_right',
    doorRightX + doorW / 2 - handleInsetX,
    doorCenterY - 0.02,
    doorRightZ + doorT / 2 - handleD / 2 + 0.001
  );

  return group;
}
