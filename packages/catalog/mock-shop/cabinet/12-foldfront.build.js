function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.60;
  const H = 0.75;
  const D = 0.45;
  const LEG_H = 0.08;
  const BODY_H = H - LEG_H;
  const PANEL_T = 0.02;
  const CORNER_R = 0.025;
  const DOOR_GAP = 0.004;
  const DOOR_T = 0.02;

  const LEG_INSET_X = 0.14;
  const LEG_INSET_Z = 0.05;
  const LEG_T = 0.014;
  const LEG_D = D - LEG_INSET_Z * 2;
  const RAIL_H = 0.022;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xa67c52,
    roughness: 0.55,
    metalness: 0.04,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b1d,
    roughness: 0.7,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3835,
    roughness: 0.35,
    metalness: 0.75,
  });

  const addMesh = (geo, mat, name, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Base / Legs
  const legGeo = new THREE.BoxGeometry(LEG_T, LEG_H, LEG_D);
  const legX = W / 2 - LEG_INSET_X;
  addMesh(legGeo, metalMat, 'leg_left', -legX, LEG_H / 2, 0);
  addMesh(legGeo, metalMat, 'leg_right', legX, LEG_H / 2, 0);

  const railW = legX * 2 + LEG_T;
  const railGeo = new THREE.BoxGeometry(railW, RAIL_H, LEG_T);
  const railY = LEG_H - RAIL_H / 2;
  const railZ = LEG_D / 2 - LEG_T / 2;
  addMesh(railGeo, metalMat, 'base_rail_front', 0, railY, railZ);
  addMesh(railGeo, metalMat, 'base_rail_back', 0, railY, -railZ);

  // Cabinet Shell
  const bodyCenterY = LEG_H + BODY_H / 2;
  const innerW = W - CORNER_R * 2;
  const innerD = D - CORNER_R * 2;

  // Top & Bottom panels (spanning between rounded corners)
  const topBotGeo = new THREE.BoxGeometry(innerW, PANEL_T, D);
  addMesh(topBotGeo, oakMat, 'cabinet_top', 0, H - PANEL_T / 2, 0);
  addMesh(topBotGeo, oakMat, 'cabinet_bottom', 0, LEG_H + PANEL_T / 2, 0);

  // Side panels (spanning between front/back rounded corners)
  const sideGeo = new THREE.BoxGeometry(PANEL_T, BODY_H, innerD);
  addMesh(sideGeo, oakMat, 'side_panel_left', -W / 2 + PANEL_T / 2, bodyCenterY, 0);
  addMesh(sideGeo, oakMat, 'side_panel_right', W / 2 - PANEL_T / 2, bodyCenterY, 0);

  // Four rounded vertical corners
  const cornerGeo = new THREE.CylinderGeometry(CORNER_R, CORNER_R, BODY_H, 16);
  const cornerX = W / 2 - CORNER_R;
  const cornerZ = D / 2 - CORNER_R;
  addMesh(cornerGeo, oakMat, 'corner_front_left', -cornerX, bodyCenterY, cornerZ);
  addMesh(cornerGeo, oakMat, 'corner_front_right', cornerX, bodyCenterY, cornerZ);
  addMesh(cornerGeo, oakMat, 'corner_back_left', -cornerX, bodyCenterY, -cornerZ);
  addMesh(cornerGeo, oakMat, 'corner_back_right', cornerX, bodyCenterY, -cornerZ);

  // Back panel
  const backGeo = new THREE.BoxGeometry(innerW, BODY_H - PANEL_T * 2, PANEL_T);
  addMesh(backGeo, oakMat, 'cabinet_back', 0, bodyCenterY, -D / 2 + PANEL_T / 2);

  // Dark interior backing behind doors for crisp shadow gaps
  const backingGeo = new THREE.BoxGeometry(innerW - 0.004, BODY_H - PANEL_T * 2, 0.01);
  addMesh(backingGeo, oakDarkMat, 'interior_shadow_backing', 0, bodyCenterY, D / 2 - DOOR_T - 0.005);

  // Four flush-inset doors
  const doorAreaW = W - CORNER_R * 2;
  const doorW = (doorAreaW - DOOR_GAP * 5) / 4;
  const doorH = BODY_H - PANEL_T * 2 - DOOR_GAP * 2;
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, DOOR_T);
  const doorZ = D / 2 - DOOR_T / 2;

  for (let i = 0; i < 4; i++) {
    const doorX = -doorAreaW / 2 + DOOR_GAP + doorW / 2 + i * (doorW + DOOR_GAP);
    addMesh(doorGeo, oakMat, `door_${i + 1}`, doorX, bodyCenterY, doorZ);
  }

  return group;
}
