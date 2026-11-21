function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.48;
  const H = 1.15;
  const D = 0.34;

  const BODY_W = 0.46;
  const BODY_D = 0.32;
  const BASE_H = 0.06;
  const TOP_H = 0.03;
  const BODY_H = H - BASE_H - TOP_H;
  const BODY_Y = BASE_H + BODY_H / 2;

  const SIDE_T = 0.022;
  const STILE_W = 0.045;
  const RAIL_H = 0.055;
  const DOOR_T = 0.022;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x6b4730,
    roughness: 0.45,
    metalness: 0.05,
  });
  const walnutPanelMat = new THREE.MeshStandardMaterial({
    color: 0x613f2a,
    roughness: 0.48,
    metalness: 0.05,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.3,
    metalness: 0.85,
  });

  function addBox(name, w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Plinth base (resting at y = 0)
  addBox('base_plinth_lower', W, 0.04, D, 0, 0.02, 0, walnutMat);
  addBox('base_plinth_upper', BODY_W + 0.01, 0.02, BODY_D + 0.01, 0, 0.05, 0, walnutMat);

  // Top overhanging crown
  addBox('top_crown_slab', W + 0.02, 0.02, D + 0.02, 0, H - 0.01, 0, walnutMat);
  addBox('top_crown_trim', BODY_W + 0.015, 0.015, BODY_D + 0.015, 0, H - 0.0275, 0, walnutMat);

  // Back panel
  addBox('back_panel', BODY_W - 0.02, BODY_H, 0.018, 0, BODY_Y, -BODY_D / 2 + 0.009, walnutPanelMat);

  // Left & Right paneled sides
  const sideNames = ['left', 'right'];
  const sideX = [-BODY_W / 2 + SIDE_T / 2, BODY_W / 2 - SIDE_T / 2];
  for (let i = 0; i < 2; i++) {
    const s = sideNames[i];
    const x = sideX[i];
    addBox(`${s}_side_front_stile`, SIDE_T, BODY_H, STILE_W, x, BODY_Y, BODY_D / 2 - STILE_W / 2, walnutMat);
    addBox(`${s}_side_rear_stile`, SIDE_T, BODY_H, STILE_W, x, BODY_Y, -BODY_D / 2 + STILE_W / 2, walnutMat);
    addBox(`${s}_side_top_rail`, SIDE_T, RAIL_H, BODY_D - STILE_W * 2, x, BASE_H + BODY_H - RAIL_H / 2, 0, walnutMat);
    addBox(`${s}_side_bottom_rail`, SIDE_T, RAIL_H, BODY_D - STILE_W * 2, x, BASE_H + RAIL_H / 2, 0, walnutMat);
    addBox(`${s}_side_panel`, 0.012, BODY_H - RAIL_H * 2, BODY_D - STILE_W * 2, x, BODY_Y, 0, walnutPanelMat);
  }

  // Front framed door (closed at +Z)
  const doorZ = BODY_D / 2 - DOOR_T / 2;
  const doorH = BODY_H - 0.004;
  addBox('door_left_stile', STILE_W, doorH, DOOR_T, -BODY_W / 2 + STILE_W / 2, BODY_Y, doorZ, walnutMat);
  addBox('door_right_stile', STILE_W, doorH, DOOR_T, BODY_W / 2 - STILE_W / 2, BODY_Y, doorZ, walnutMat);
  addBox('door_top_rail', BODY_W - STILE_W * 2, RAIL_H, DOOR_T, 0, BASE_H + BODY_H - RAIL_H / 2 - 0.002, doorZ, walnutMat);
  addBox('door_bottom_rail', BODY_W - STILE_W * 2, RAIL_H, DOOR_T, 0, BASE_H + RAIL_H / 2 + 0.002, doorZ, walnutMat);
  addBox('door_center_panel', BODY_W - STILE_W * 2, doorH - RAIL_H * 2, 0.012, 0, BODY_Y, doorZ - 0.002, walnutPanelMat);

  // Brass hinges on left (-X) front edge
  const hingeYs = [0.22, 0.94];
  for (let i = 0; i < hingeYs.length; i++) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.045, 12), brassMat);
    hinge.name = `door_hinge_${i + 1}`;
    hinge.position.set(-BODY_W / 2, hingeYs[i], BODY_D / 2);
    hinge.castShadow = true;
    hinge.receiveShadow = true;
    group.add(hinge);
  }

  // Small brass door knob on right (+X) front
  const knobPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.003, 16), brassMat);
  knobPlate.name = 'door_knob_backplate';
  knobPlate.rotation.x = Math.PI / 2;
  knobPlate.position.set(BODY_W / 2 - STILE_W / 2, BODY_Y, BODY_D / 2 + 0.0015);
  knobPlate.castShadow = true;
  knobPlate.receiveShadow = true;
  group.add(knobPlate);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), brassMat);
  knob.name = 'door_knob';
  knob.position.set(BODY_W / 2 - STILE_W / 2, BODY_Y, BODY_D / 2 + 0.012);
  knob.castShadow = true;
  knob.receiveShadow = true;
  group.add(knob);

  return group;
}
