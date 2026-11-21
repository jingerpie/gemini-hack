function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.50;
  const H = 0.68;
  const D = 0.22;

  const WALL_T = 0.022;
  const BACK_T = 0.012;
  const DOOR_T = 0.022;
  const FRAME_W = 0.055;
  const GLASS_T = 0.004;

  const BODY_D = D - DOOR_T;
  const BODY_Z = -DOOR_T / 2;
  const DOOR_Z = D / 2 - DOOR_T / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6e492c,
    roughness: 0.62,
    metalness: 0.04,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x9e7b3e,
    roughness: 0.35,
    metalness: 0.85,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef6fa,
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
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

  // Carcass sides
  const sideGeo = new THREE.BoxGeometry(WALL_T, H, BODY_D);
  addMesh(sideGeo, woodMat, "carcass_left_side", -W / 2 + WALL_T / 2, H / 2, BODY_Z);
  addMesh(sideGeo, woodMat, "carcass_right_side", W / 2 - WALL_T / 2, H / 2, BODY_Z);

  // Carcass top & bottom
  const innerW = W - 2 * WALL_T;
  const topBotGeo = new THREE.BoxGeometry(innerW, WALL_T, BODY_D);
  addMesh(topBotGeo, woodMat, "carcass_top", 0, H - WALL_T / 2, BODY_Z);
  addMesh(topBotGeo, woodMat, "carcass_bottom", 0, WALL_T / 2, BODY_Z);

  // Carcass back
  const innerH = H - 2 * WALL_T;
  const backGeo = new THREE.BoxGeometry(innerW, innerH, BACK_T);
  addMesh(backGeo, woodMat, "carcass_back", 0, H / 2, -D / 2 + BACK_T / 2);

  // Interior shelves
  const shelfD = BODY_D - BACK_T - 0.015;
  const shelfZ = BODY_Z + BACK_T / 2 - 0.005;
  const shelfGeo = new THREE.BoxGeometry(innerW, WALL_T * 0.85, shelfD);
  addMesh(shelfGeo, woodMat, "shelf_lower", 0, WALL_T + innerH / 3, shelfZ);
  addMesh(shelfGeo, woodMat, "shelf_upper", 0, WALL_T + (2 * innerH) / 3, shelfZ);

  // Door frame (stiles & rails)
  const stileGeo = new THREE.BoxGeometry(FRAME_W, H, DOOR_T);
  addMesh(stileGeo, woodMat, "door_stile_left", -W / 2 + FRAME_W / 2, H / 2, DOOR_Z);
  addMesh(stileGeo, woodMat, "door_stile_right", W / 2 - FRAME_W / 2, H / 2, DOOR_Z);

  const railW = W - 2 * FRAME_W;
  const railGeo = new THREE.BoxGeometry(railW, FRAME_W, DOOR_T);
  addMesh(railGeo, woodMat, "door_rail_top", 0, H - FRAME_W / 2, DOOR_Z);
  addMesh(railGeo, woodMat, "door_rail_bottom", 0, FRAME_W / 2, DOOR_Z);

  // Door glass pane
  const glassW = W - 2 * FRAME_W + 0.004;
  const glassH = H - 2 * FRAME_W + 0.004;
  const glassGeo = new THREE.BoxGeometry(glassW, glassH, GLASS_T);
  addMesh(glassGeo, glassMat, "door_glass", 0, H / 2, DOOR_Z);

  // Brass hinges on left edge (-X)
  const hingeGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.048, 12);
  const hingeX = -W / 2 - 0.001;
  const hingeZ = DOOR_Z - DOOR_T / 2;
  addMesh(hingeGeo, brassMat, "hinge_top", hingeX, H - 0.11, hingeZ);
  addMesh(hingeGeo, brassMat, "hinge_bottom", hingeX, 0.11, hingeZ);

  // Turned wooden door knob on right stile (+X)
  const knobPoints = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.006, 0.000),
    new THREE.Vector2(0.005, 0.010),
    new THREE.Vector2(0.012, 0.014),
    new THREE.Vector2(0.013, 0.020),
    new THREE.Vector2(0.009, 0.024),
    new THREE.Vector2(0.000, 0.025),
  ];
  const knobGeo = new THREE.LatheGeometry(knobPoints, 20);
  knobGeo.rotateX(Math.PI / 2);
  addMesh(knobGeo, woodMat, "door_knob", W / 2 - FRAME_W / 2, H / 2, DOOR_Z + DOOR_T / 2);

  return group;
}
