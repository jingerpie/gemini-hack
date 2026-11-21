function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.60;
  const H = 0.36;

  const PLINTH_H = 0.055;
  const PLINTH_INSET = 0.05;
  const PLINTH_W = W - 2 * PLINTH_INSET;
  const PLINTH_D = D - 2 * PLINTH_INSET;

  const PANEL_T = 0.020;
  const TOP_THICK = 0.022;
  const GAP = 0.003;

  const BODY_H = H - PLINTH_H - TOP_THICK;
  const INNER_W = W - 2 * PANEL_T;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xd4b895,
    roughness: 0.65,
    metalness: 0.02,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xc8c8c8,
    roughness: 0.35,
    metalness: 0.85,
  });

  const mechMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.45,
    metalness: 0.75,
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

  // 1. Recessed Plinth Base
  addMesh(
    new THREE.BoxGeometry(PLINTH_W, PLINTH_H, PLINTH_D),
    oakMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // 2. Main Box Bottom Panel
  addMesh(
    new THREE.BoxGeometry(INNER_W, PANEL_T, D),
    oakMat,
    'bottom_panel',
    0,
    PLINTH_H + PANEL_T / 2,
    0
  );

  // 3. Left & Right Side Panels
  addMesh(
    new THREE.BoxGeometry(PANEL_T, BODY_H, D),
    oakMat,
    'left_side_panel',
    -W / 2 + PANEL_T / 2,
    PLINTH_H + BODY_H / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(PANEL_T, BODY_H, D),
    oakMat,
    'right_side_panel',
    W / 2 - PANEL_T / 2,
    PLINTH_H + BODY_H / 2,
    0
  );

  // 4. Back Panel
  addMesh(
    new THREE.BoxGeometry(INNER_W, BODY_H - PANEL_T, PANEL_T),
    oakMat,
    'back_panel',
    0,
    PLINTH_H + PANEL_T + (BODY_H - PANEL_T) / 2,
    -D / 2 + PANEL_T / 2
  );

  // 5. Front Bottom Rail
  const RAIL_H = PANEL_T;
  addMesh(
    new THREE.BoxGeometry(INNER_W, RAIL_H, PANEL_T),
    oakMat,
    'front_bottom_rail',
    0,
    PLINTH_H + RAIL_H / 2,
    D / 2 - PANEL_T / 2
  );

  // 6. Front Drawer (closed)
  const DRAWER_W = INNER_W - 2 * GAP;
  const DRAWER_H = BODY_H - RAIL_H - 2 * GAP;
  const DRAWER_Y = PLINTH_H + RAIL_H + GAP + DRAWER_H / 2;
  const DRAWER_Z = D / 2 - PANEL_T / 2;

  addMesh(
    new THREE.BoxGeometry(DRAWER_W, DRAWER_H, PANEL_T),
    oakMat,
    'drawer_front',
    0,
    DRAWER_Y,
    DRAWER_Z
  );

  // 7. Drawer Tab Handle (top center of drawer front)
  const HANDLE_W = 0.055;
  const HANDLE_H = 0.006;
  const HANDLE_D = 0.022;
  addMesh(
    new THREE.BoxGeometry(HANDLE_W, HANDLE_H, HANDLE_D),
    handleMat,
    'drawer_handle',
    0,
    PLINTH_H + BODY_H - GAP - HANDLE_H / 2,
    D / 2 + HANDLE_D / 2 - 0.008
  );

  // 8. Internal Drawer Box (tucked behind drawer front)
  const DBOX_W = INNER_W - 0.04;
  const DBOX_H = DRAWER_H - 0.03;
  const DBOX_D = D - 0.08;
  const DBOX_Z = D / 2 - PANEL_T - DBOX_D / 2;
  const DBOX_Y = PLINTH_H + PANEL_T + DBOX_H / 2;

  addMesh(
    new THREE.BoxGeometry(DBOX_W, 0.012, DBOX_D),
    oakMat,
    'drawer_box_bottom',
    0,
    PLINTH_H + PANEL_T + 0.006,
    DBOX_Z
  );
  addMesh(
    new THREE.BoxGeometry(0.012, DBOX_H, DBOX_D),
    oakMat,
    'drawer_box_left',
    -DBOX_W / 2 + 0.006,
    DBOX_Y,
    DBOX_Z
  );
  addMesh(
    new THREE.BoxGeometry(0.012, DBOX_H, DBOX_D),
    oakMat,
    'drawer_box_right',
    DBOX_W / 2 - 0.006,
    DBOX_Y,
    DBOX_Z
  );
  addMesh(
    new THREE.BoxGeometry(DBOX_W - 0.024, DBOX_H, 0.012),
    oakMat,
    'drawer_box_back',
    0,
    DBOX_Y,
    DBOX_Z - DBOX_D / 2 + 0.006
  );

  // 9. Folded Lift-Top Mechanism Arms (inside)
  const MECH_Y = H - TOP_THICK - 0.015;
  addMesh(
    new THREE.BoxGeometry(0.015, 0.020, D - 0.14),
    mechMat,
    'lift_mechanism_left',
    -INNER_W / 2 + 0.015,
    MECH_Y,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.015, 0.020, D - 0.14),
    mechMat,
    'lift_mechanism_right',
    INNER_W / 2 - 0.015,
    MECH_Y,
    0
  );

  // 10. Lift-Top Lid (closed)
  addMesh(
    new THREE.BoxGeometry(W, TOP_THICK, D),
    oakMat,
    'lift_top_lid',
    0,
    H - TOP_THICK / 2,
    0
  );

  return group;
}
