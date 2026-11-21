function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.60;
  const W = 0.88;
  const D = 0.40;

  const LEG_H = 0.16;
  const LEG_W = 0.036;
  const APRON_H = 0.035;
  const APRON_T = 0.022;

  const BODY_H = H - LEG_H;
  const PANEL_T = 0.022;
  const BACK_T = 0.012;

  const DOOR_T = 0.022;
  const DOOR_GAP = 0.004;
  const DOOR_W = (W - PANEL_T * 2 - DOOR_GAP * 3) / 2;
  const DOOR_H = BODY_H - PANEL_T * 2 - DOOR_GAP * 2;
  const STILE_W = 0.048;
  const RAIL_H = 0.048;
  const GLASS_T = 0.006;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.62,
    metalness: 0.02,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x7a5632,
    roughness: 0.7,
    metalness: 0.02,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdce4e2,
    roughness: 0.25,
    metalness: 0.0,
    transparent: true,
    opacity: 0.42,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
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

  // 1. Legs (4)
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legX = W / 2 - LEG_W / 2 - 0.006;
  const legZ = D / 2 - LEG_W / 2 - 0.006;
  addMesh(legGeo, oakMat, 'leg_front_left', -legX, LEG_H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_front_right', legX, LEG_H / 2, legZ);
  addMesh(legGeo, oakMat, 'leg_back_left', -legX, LEG_H / 2, -legZ);
  addMesh(legGeo, oakMat, 'leg_back_right', legX, LEG_H / 2, -legZ);

  // 2. Base Apron Rails (4)
  const apronY = LEG_H - APRON_H / 2;
  const apronFrontBackGeo = new THREE.BoxGeometry(W - LEG_W * 2 - 0.012, APRON_H, APRON_T);
  addMesh(apronFrontBackGeo, oakMat, 'apron_front', 0, apronY, legZ);
  addMesh(apronFrontBackGeo, oakMat, 'apron_back', 0, apronY, -legZ);

  const apronSideGeo = new THREE.BoxGeometry(APRON_T, APRON_H, D - LEG_W * 2 - 0.012);
  addMesh(apronSideGeo, oakMat, 'apron_left', -legX, apronY, 0);
  addMesh(apronSideGeo, oakMat, 'apron_right', legX, apronY, 0);

  // 3. Cabinet Body
  const bodyCenterY = LEG_H + BODY_H / 2;

  const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, BODY_H, D);
  addMesh(sidePanelGeo, oakMat, 'side_panel_left', -W / 2 + PANEL_T / 2, bodyCenterY, 0);
  addMesh(sidePanelGeo, oakMat, 'side_panel_right', W / 2 - PANEL_T / 2, bodyCenterY, 0);

  const topBottomGeo = new THREE.BoxGeometry(W - PANEL_T * 2, PANEL_T, D);
  addMesh(topBottomGeo, oakMat, 'top_panel', 0, H - PANEL_T / 2, 0);
  addMesh(topBottomGeo, oakMat, 'bottom_panel', 0, LEG_H + PANEL_T / 2, 0);

  const backPanelGeo = new THREE.BoxGeometry(W - PANEL_T * 2, BODY_H - PANEL_T * 2, BACK_T);
  addMesh(backPanelGeo, oakMat, 'back_panel', 0, bodyCenterY, -D / 2 + BACK_T / 2);

  // 4. Interior Shelves (3)
  const shelfW = W - PANEL_T * 2;
  const shelfD = D - BACK_T - DOOR_T - 0.015;
  const shelfZ = -D / 2 + BACK_T + shelfD / 2;
  const shelfGeo = new THREE.BoxGeometry(shelfW, PANEL_T, shelfD);
  const interiorH = BODY_H - PANEL_T * 2;

  for (let i = 1; i <= 3; i++) {
    const shelfY = LEG_H + PANEL_T + (interiorH / 4) * i;
    addMesh(shelfGeo, oakMat, `shelf_${i}`, 0, shelfY, shelfZ);
  }

  // 5. Doors (Left and Right)
  const doorZ = D / 2 - DOOR_T / 2;
  const doorCenterY = LEG_H + PANEL_T + DOOR_GAP + DOOR_H / 2;

  const stileGeo = new THREE.BoxGeometry(STILE_W, DOOR_H, DOOR_T);
  const railGeo = new THREE.BoxGeometry(DOOR_W - STILE_W * 2, RAIL_H, DOOR_T);
  const glassGeo = new THREE.BoxGeometry(DOOR_W - STILE_W * 2, DOOR_H - RAIL_H * 2, GLASS_T);
  const handleGeo = new THREE.BoxGeometry(0.014, 0.14, 0.006);

  const doors = [
    { name: 'left', centerX: -DOOR_W / 2 - DOOR_GAP / 2, handleSide: 1 },
    { name: 'right', centerX: DOOR_W / 2 + DOOR_GAP / 2, handleSide: -1 },
  ];

  for (const d of doors) {
    addMesh(
      stileGeo,
      oakMat,
      `door_${d.name}_stile_left`,
      d.centerX - DOOR_W / 2 + STILE_W / 2,
      doorCenterY,
      doorZ
    );
    addMesh(
      stileGeo,
      oakMat,
      `door_${d.name}_stile_right`,
      d.centerX + DOOR_W / 2 - STILE_W / 2,
      doorCenterY,
      doorZ
    );
    addMesh(
      railGeo,
      oakMat,
      `door_${d.name}_rail_top`,
      d.centerX,
      doorCenterY + DOOR_H / 2 - RAIL_H / 2,
      doorZ
    );
    addMesh(
      railGeo,
      oakMat,
      `door_${d.name}_rail_bottom`,
      d.centerX,
      doorCenterY - DOOR_H / 2 + RAIL_H / 2,
      doorZ
    );
    addMesh(glassGeo, glassMat, `door_${d.name}_glass`, d.centerX, doorCenterY, doorZ);

    // Recessed vertical finger pull on inner stile
    const handleX = d.centerX + d.handleSide * (DOOR_W / 2 - STILE_W * 0.35);
    addMesh(
      handleGeo,
      oakDarkMat,
      `door_${d.name}_handle_recess`,
      handleX,
      doorCenterY - 0.04,
      doorZ + DOOR_T / 2 - 0.002
    );
  }

  return group;
}
