function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.0;
  const H = 0.82;
  const D = 0.44;
  const FOOT_H = 0.016;
  const FOOT_W = 0.055;
  const FOOT_D = 0.045;
  const FRAME_T = 0.032; // Frame tube thickness
  const GLASS_T = 0.006;
  const SHELF_T = 0.016;
  const PANEL_T = 0.012;

  const BODY_H = H - FOOT_H;
  const INNER_W = W - FRAME_T * 2;
  const INNER_H = BODY_H - FRAME_T * 2;
  const INNER_D = D - FRAME_T * 2;

  // Materials
  const aluMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.35,
    metalness: 0.8,
  });
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0xbac0c4,
    roughness: 0.4,
    metalness: 0.75,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xd6dade,
    roughness: 0.55,
    metalness: 0.25,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x4a4d50,
    roughness: 0.8,
    metalness: 0.1,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef6f8,
    roughness: 0.05,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
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

  // 1. Feet (4)
  const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_D);
  const footX = W / 2 - FOOT_W / 2 - 0.012;
  const footZ = D / 2 - FOOT_D / 2 - 0.012;
  addMesh(footGeo, footMat, "foot_front_left", -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, "foot_front_right", footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, "foot_back_left", -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, footMat, "foot_back_right", footX, FOOT_H / 2, -footZ);

  // 2. Corner blocks (8)
  const cornerGeo = new THREE.BoxGeometry(FRAME_T, FRAME_T, FRAME_T);
  const cx = W / 2 - FRAME_T / 2;
  const cz = D / 2 - FRAME_T / 2;
  const cyBot = FOOT_H + FRAME_T / 2;
  const cyTop = H - FRAME_T / 2;

  const corners = [
    ["corner_bot_fl", -cx, cyBot, cz],
    ["corner_bot_fr", cx, cyBot, cz],
    ["corner_bot_bl", -cx, cyBot, -cz],
    ["corner_bot_br", cx, cyBot, -cz],
    ["corner_top_fl", -cx, cyTop, cz],
    ["corner_top_fr", cx, cyTop, cz],
    ["corner_top_bl", -cx, cyTop, -cz],
    ["corner_top_br", cx, cyTop, -cz],
  ];
  corners.forEach(([name, x, y, z]) => {
    addMesh(cornerGeo, cornerMat, name, x, y, z);
  });

  // 3. Vertical Frame Posts (4)
  const postGeo = new THREE.CylinderGeometry(FRAME_T / 2, FRAME_T / 2, INNER_H, 16);
  const postY = FOOT_H + BODY_H / 2;
  addMesh(postGeo, aluMat, "post_front_left", -cx, postY, cz);
  addMesh(postGeo, aluMat, "post_front_right", cx, postY, cz);
  addMesh(postGeo, aluMat, "post_back_left", -cx, postY, -cz);
  addMesh(postGeo, aluMat, "post_back_right", cx, postY, -cz);

  // 4. Horizontal X Rails (4)
  const railXGeo = new THREE.CylinderGeometry(FRAME_T / 2, FRAME_T / 2, INNER_W, 16);
  addMesh(railXGeo, aluMat, "rail_bot_front", 0, cyBot, cz, 0, 0, Math.PI / 2);
  addMesh(railXGeo, aluMat, "rail_bot_back", 0, cyBot, -cz, 0, 0, Math.PI / 2);
  addMesh(railXGeo, aluMat, "rail_top_front", 0, cyTop, cz, 0, 0, Math.PI / 2);
  addMesh(railXGeo, aluMat, "rail_top_back", 0, cyTop, -cz, 0, 0, Math.PI / 2);

  // 5. Horizontal Z Rails (4)
  const railZGeo = new THREE.CylinderGeometry(FRAME_T / 2, FRAME_T / 2, INNER_D, 16);
  addMesh(railZGeo, aluMat, "rail_bot_left", -cx, cyBot, 0, Math.PI / 2, 0, 0);
  addMesh(railZGeo, aluMat, "rail_bot_right", cx, cyBot, 0, Math.PI / 2, 0, 0);
  addMesh(railZGeo, aluMat, "rail_top_left", -cx, cyTop, 0, Math.PI / 2, 0, 0);
  addMesh(railZGeo, aluMat, "rail_top_right", cx, cyTop, 0, Math.PI / 2, 0, 0);

  // 6. Back Panel (opaque)
  const backGeo = new THREE.BoxGeometry(INNER_W + 0.01, INNER_H + 0.01, PANEL_T);
  addMesh(backGeo, panelMat, "back_panel", 0, postY, -cz);

  // 7. Bottom Panel (opaque)
  const bottomGeo = new THREE.BoxGeometry(INNER_W + 0.01, PANEL_T, INNER_D + 0.01);
  addMesh(bottomGeo, panelMat, "bottom_panel", 0, cyBot, 0);

  // 8. Top Glass Panel
  const topGlassGeo = new THREE.BoxGeometry(INNER_W + 0.01, GLASS_T, INNER_D + 0.01);
  addMesh(topGlassGeo, glassMat, "top_glass_panel", 0, cyTop, 0);

  // 9. Side Glass Panels (2)
  const sideGlassGeo = new THREE.BoxGeometry(GLASS_T, INNER_H + 0.01, INNER_D + 0.01);
  addMesh(sideGlassGeo, glassMat, "left_glass_panel", -cx, postY, 0);
  addMesh(sideGlassGeo, glassMat, "right_glass_panel", cx, postY, 0);

  // 10. Interior Shelves (2)
  const shelfGeo = new THREE.BoxGeometry(INNER_W, SHELF_T, INNER_D - 0.01);
  const shelf1Y = FOOT_H + FRAME_T + INNER_H * 0.33;
  const shelf2Y = FOOT_H + FRAME_T + INNER_H * 0.66;
  addMesh(shelfGeo, panelMat, "shelf_lower", 0, shelf1Y, 0);
  addMesh(shelfGeo, panelMat, "shelf_upper", 0, shelf2Y, 0);

  // 11. Front Glass Doors (2)
  const doorGap = 0.004;
  const doorW = (INNER_W - doorGap) / 2;
  const doorH = INNER_H - 0.004;
  const doorZ = cz + FRAME_T / 2 - GLASS_T / 2 - 0.004;
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, GLASS_T);
  addMesh(doorGeo, glassMat, "door_left", -(doorW / 2 + doorGap / 2), postY, doorZ);
  addMesh(doorGeo, glassMat, "door_right", doorW / 2 + doorGap / 2, postY, doorZ);

  // 12. Door Hinges (4)
  const hingeGeo = new THREE.BoxGeometry(0.026, 0.042, 0.016);
  const hingeYTop = H - FRAME_T - 0.065;
  const hingeYBot = FOOT_H + FRAME_T + 0.065;
  const hingeX = INNER_W / 2 - 0.01;
  addMesh(hingeGeo, aluMat, "hinge_top_left", -hingeX, hingeYTop, doorZ + 0.002);
  addMesh(hingeGeo, aluMat, "hinge_bot_left", -hingeX, hingeYBot, doorZ + 0.002);
  addMesh(hingeGeo, aluMat, "hinge_top_right", hingeX, hingeYTop, doorZ + 0.002);
  addMesh(hingeGeo, aluMat, "hinge_bot_right", hingeX, hingeYBot, doorZ + 0.002);

  // 13. Door Handles (2) using TubeGeometry
  function createHandle(name, xPos, dir) {
    const hHalf = 0.032;
    const hDepth = 0.022;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -hHalf, 0),
      new THREE.Vector3(dir * 0.004, -hHalf, hDepth),
      new THREE.Vector3(dir * 0.004, hHalf, hDepth),
      new THREE.Vector3(0, hHalf, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(curve, 16, 0.0045, 8, false);
    addMesh(handleGeo, aluMat, name, xPos, postY, doorZ + GLASS_T / 2);
  }

  createHandle("handle_left", -0.022, -1);
  createHandle("handle_right", 0.022, 1);

  return group;
}
