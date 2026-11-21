function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.26;
  const D = 0.26;
  const H = 1.60;
  const POST_T = 0.022;
  const RAIL_T = 0.022;
  const SHELF_T = 0.018;

  const SHELF_1_Y = 0.42;
  const SHELF_2_Y = 0.82;
  const SHADE_BOT_Y = 1.22;
  const SHADE_H = H - SHADE_BOT_Y;
  const SHADE_INSET = 0.014;
  const SHADE_WALL_T = 0.004;

  // Materials
  const matFrame = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.55,
    metalness: 0.35
  });

  const matShelf = new THREE.MeshStandardMaterial({
    color: 0x202020,
    roughness: 0.72,
    metalness: 0.05
  });

  const matShadeOuter = new THREE.MeshStandardMaterial({
    color: 0x1f1d1b,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x2a1808,
    emissiveIntensity: 0.25
  });

  const matShadeInner = new THREE.MeshStandardMaterial({
    color: 0xfff0d6,
    roughness: 0.85,
    metalness: 0.0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.85
  });

  const matBulb = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffdfa8,
    emissiveIntensity: 1.5
  });

  const matCord = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.65,
    metalness: 0.1
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

  // 4 Vertical Corner Posts
  const postGeo = new THREE.BoxGeometry(POST_T, H, POST_T);
  const halfW = W / 2 - POST_T / 2;
  const halfD = D / 2 - POST_T / 2;

  const postCoords = [
    [-halfW, halfD, 'post_front_left'],
    [halfW, halfD, 'post_front_right'],
    [-halfW, -halfD, 'post_back_left'],
    [halfW, -halfD, 'post_back_right']
  ];

  for (const [px, pz, name] of postCoords) {
    addMesh(postGeo, matFrame, name, px, H / 2, pz);
  }

  // Helper to build a 4-rail square frame at a given center Y
  const railXGeo = new THREE.BoxGeometry(W - POST_T * 2, RAIL_T, RAIL_T);
  const railZGeo = new THREE.BoxGeometry(RAIL_T, RAIL_T, D - POST_T * 2);

  function addSquareFrame(yCenter, prefix) {
    addMesh(railXGeo, matFrame, `${prefix}_rail_front`, 0, yCenter, halfD);
    addMesh(railXGeo, matFrame, `${prefix}_rail_back`, 0, yCenter, -halfD);
    addMesh(railZGeo, matFrame, `${prefix}_rail_left`, -halfW, yCenter, 0);
    addMesh(railZGeo, matFrame, `${prefix}_rail_right`, halfW, yCenter, 0);
  }

  // Bottom frame, shade-bottom frame, and top frame
  addSquareFrame(RAIL_T / 2, 'bottom');
  addSquareFrame(SHADE_BOT_Y, 'shade_base');
  addSquareFrame(H - RAIL_T / 2, 'top');

  // Two middle shelves
  const shelfW = W - POST_T * 0.6;
  const shelfD = D - POST_T * 0.6;
  const shelfGeo = new THREE.BoxGeometry(shelfW, SHELF_T, shelfD);

  addMesh(shelfGeo, matShelf, 'shelf_lower', 0, SHELF_1_Y, 0);
  addMesh(shelfGeo, matShelf, 'shelf_middle', 0, SHELF_2_Y, 0);

  // Lampshade (hollow square box made of 4 outer panels + 4 inner glowing panels)
  const shadeSpan = W - POST_T * 2 - SHADE_INSET * 2;
  const shadeH = SHADE_H - RAIL_T;
  const shadeY = SHADE_BOT_Y + shadeH / 2 + RAIL_T / 2;

  const shadePanelXGeo = new THREE.BoxGeometry(shadeSpan, shadeH, SHADE_WALL_T);
  const shadePanelZGeo = new THREE.BoxGeometry(SHADE_WALL_T, shadeH, shadeSpan);

  const shadeOffset = shadeSpan / 2 - SHADE_WALL_T / 2;
  addMesh(shadePanelXGeo, matShadeOuter, 'shade_outer_front', 0, shadeY, shadeOffset);
  addMesh(shadePanelXGeo, matShadeOuter, 'shade_outer_back', 0, shadeY, -shadeOffset);
  addMesh(shadePanelZGeo, matShadeOuter, 'shade_outer_left', -shadeOffset, shadeY, 0);
  addMesh(shadePanelZGeo, matShadeOuter, 'shade_outer_right', shadeOffset, shadeY, 0);

  // Inner warm lining
  const innerSpan = shadeSpan - SHADE_WALL_T * 2;
  const innerPanelXGeo = new THREE.BoxGeometry(innerSpan, shadeH - 0.004, 0.002);
  const innerPanelZGeo = new THREE.BoxGeometry(0.002, shadeH - 0.004, innerSpan);
  const innerOffset = innerSpan / 2 - 0.001;

  addMesh(innerPanelXGeo, matShadeInner, 'shade_inner_front', 0, shadeY, innerOffset);
  addMesh(innerPanelXGeo, matShadeInner, 'shade_inner_back', 0, shadeY, -innerOffset);
  addMesh(innerPanelZGeo, matShadeInner, 'shade_inner_left', -innerOffset, shadeY, 0);
  addMesh(innerPanelZGeo, matShadeInner, 'shade_inner_right', innerOffset, shadeY, 0);

  // Bulb socket & glowing bulb inside shade
  const socketGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.055, 16);
  addMesh(socketGeo, matFrame, 'lamp_socket', 0, SHADE_BOT_Y + 0.04, 0);

  const bulbGeo = new THREE.SphereGeometry(0.036, 16, 12);
  addMesh(bulbGeo, matBulb, 'lamp_bulb', 0, SHADE_BOT_Y + 0.095, 0);

  // Power cord running down from socket along back-left post to the floor
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, SHADE_BOT_Y + 0.015, 0),
    new THREE.Vector3(-0.04, SHADE_BOT_Y - 0.08, -0.05),
    new THREE.Vector3(-halfW + 0.015, SHELF_2_Y + 0.05, -halfD + 0.015),
    new THREE.Vector3(-halfW + 0.015, SHELF_1_Y, -halfD + 0.015),
    new THREE.Vector3(-halfW + 0.01, 0.08, -halfD + 0.01),
    new THREE.Vector3(-halfW - 0.05, 0.006, -halfD + 0.02),
    new THREE.Vector3(-0.36, 0.006, -0.05)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 32, 0.004, 8, false);
  addMesh(cordGeo, matCord, 'power_cord', 0, 0, 0);

  // Inline floor/hand switch on the cord
  const switchBodyGeo = new THREE.BoxGeometry(0.06, 0.016, 0.028);
  addMesh(switchBodyGeo, matCord, 'cord_switch_body', -0.28, 0.008, -0.06);

  const switchBtnGeo = new THREE.BoxGeometry(0.018, 0.008, 0.014);
  addMesh(switchBtnGeo, matFrame, 'cord_switch_button', -0.28, 0.018, -0.06);

  return group;
}
