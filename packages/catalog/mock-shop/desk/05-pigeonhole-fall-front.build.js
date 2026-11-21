function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.92;
  const H = 1.02;
  const D = 0.48;

  const FOOT_H = 0.095;
  const PLINTH_H = 0.025;
  const BASE_H = FOOT_H + PLINTH_H; // 0.12
  const WAIST_H = 0.72;
  const TOP_D = 0.25; // depth of flat top before slant

  const PANEL_T = 0.022;
  const PLINTH_OVERHANG = 0.012;
  const DRAWER_INSET = 0.006;
  const RAIL_H = 0.018;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c24,
    roughness: 0.55,
    metalness: 0.05
  });

  const trimWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2f1b,
    roughness: 0.6,
    metalness: 0.05
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x9e7e3e,
    roughness: 0.35,
    metalness: 0.85
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bracket Feet (4 corners)
  const footW = 0.11;
  const footT = 0.028;
  const footShape = new THREE.Shape();
  footShape.moveTo(0, 0);
  footShape.lineTo(0.045, 0);
  footShape.quadraticCurveTo(0.055, FOOT_H * 0.65, footW, FOOT_H);
  footShape.lineTo(0, FOOT_H);
  footShape.closePath();

  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: footT,
    bevelEnabled: false
  });

  const fx = W / 2;
  const fz = D / 2;

  // Front-left foot
  addMesh(footGeo, trimWoodMat, 'foot_front_left', -fx, 0, fz - footT);
  // Front-right foot (mirrored along X)
  addMesh(footGeo, trimWoodMat, 'foot_front_right', fx, 0, fz, 0, Math.PI, 0);
  // Back-left foot
  addMesh(footGeo, trimWoodMat, 'foot_back_left', -fx, 0, -fz);
  // Back-right foot
  addMesh(footGeo, trimWoodMat, 'foot_back_right', fx, 0, -fz + footT, 0, Math.PI, 0);

  // 2. Base Plinth Molding
  const plinthGeo = new THREE.BoxGeometry(W + PLINTH_OVERHANG * 2, PLINTH_H, D + PLINTH_OVERHANG * 2);
  addMesh(plinthGeo, trimWoodMat, 'base_plinth', 0, FOOT_H + PLINTH_H / 2, 0);

  // 3. Side Panels (Extruded profile from BASE_H to H)
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-D / 2, BASE_H);
  sideShape.lineTo(D / 2, BASE_H);
  sideShape.lineTo(D / 2, WAIST_H);
  sideShape.lineTo(D / 2 - (D - TOP_D), H);
  sideShape.lineTo(-D / 2, H);
  sideShape.closePath();

  const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: PANEL_T,
    bevelEnabled: false
  });

  // Extrude goes along +Z in local space; rotate Y by -PI/2 so shape X->Z and extrude Z->-X
  addMesh(sideGeo, woodMat, 'side_panel_left', -W / 2 + PANEL_T, 0, 0, 0, -Math.PI / 2, 0);
  addMesh(sideGeo, woodMat, 'side_panel_right', W / 2, 0, 0, 0, -Math.PI / 2, 0);

  // 4. Back, Bottom, Top Panels
  const innerW = W - PANEL_T * 2;
  const backH = H - BASE_H;
  const backGeo = new THREE.BoxGeometry(innerW, backH, PANEL_T);
  addMesh(backGeo, woodMat, 'back_panel', 0, BASE_H + backH / 2, -D / 2 + PANEL_T / 2);

  const bottomGeo = new THREE.BoxGeometry(innerW, PANEL_T, D - PANEL_T);
  addMesh(bottomGeo, woodMat, 'bottom_panel', 0, BASE_H + PANEL_T / 2, PANEL_T / 2);

  const topGeo = new THREE.BoxGeometry(innerW, PANEL_T, TOP_D - PANEL_T);
  addMesh(topGeo, woodMat, 'top_panel', 0, H - PANEL_T / 2, -D / 2 + TOP_D / 2 + PANEL_T / 2);

  // 5. Lower Chest: 3 Drawers + Divider Rails
  const chestBottom = BASE_H + PANEL_T;
  const chestTop = WAIST_H;
  const chestH = chestTop - chestBottom;
  const numDrawers = 3;
  const numRails = 4;
  const totalRailH = numRails * RAIL_H;
  const drawerH = (chestH - totalRailH) / numDrawers;

  const railGeo = new THREE.BoxGeometry(innerW, RAIL_H, PANEL_T);
  const drawerGeo = new THREE.BoxGeometry(innerW - 0.004, drawerH - 0.004, PANEL_T);
  const bailGeo = new THREE.TorusGeometry(0.026, 0.0035, 8, 16, Math.PI);
  const escutcheonGeo = new THREE.BoxGeometry(0.008, 0.018, 0.004);

  for (let i = 0; i < numRails; i++) {
    const ry = chestBottom + RAIL_H / 2 + i * (drawerH + RAIL_H);
    addMesh(railGeo, trimWoodMat, `drawer_rail_${i + 1}`, 0, ry, D / 2 - PANEL_T / 2);
  }

  for (let i = 0; i < numDrawers; i++) {
    const dy = chestBottom + RAIL_H + drawerH / 2 + i * (drawerH + RAIL_H);
    const dz = D / 2 - PANEL_T / 2 - DRAWER_INSET;
    addMesh(drawerGeo, woodMat, `drawer_front_${i + 1}`, 0, dy, dz);

    // Central keyhole escutcheon
    addMesh(escutcheonGeo, brassMat, `drawer_escutcheon_${i + 1}`, 0, dy + drawerH * 0.15, dz + PANEL_T / 2 + 0.002);

    // Two bail-pull handles per drawer
    const handleX = innerW * 0.28;
    const handleZ = dz + PANEL_T / 2 + 0.003;
    addMesh(bailGeo, brassMat, `drawer_handle_left_${i + 1}`, -handleX, dy, handleZ, 0, 0, Math.PI);
    addMesh(bailGeo, brassMat, `drawer_handle_right_${i + 1}`, handleX, dy, handleZ, 0, 0, Math.PI);
  }

  // 6. Two Loper Fronts (flush just below waist)
  const loperW = 0.045;
  const loperH = 0.022;
  const loperGeo = new THREE.BoxGeometry(loperW, loperH, PANEL_T);
  const loperY = WAIST_H - RAIL_H / 2;
  const loperX = innerW / 2 - loperW / 2 - 0.008;
  addMesh(loperGeo, trimWoodMat, 'loper_left', -loperX, loperY, D / 2 - PANEL_T / 2 + 0.002);
  addMesh(loperGeo, trimWoodMat, 'loper_right', loperX, loperY, D / 2 - PANEL_T / 2 + 0.002);

  // 7. Slanted Fall-Front Lid (closed)
  const slantRise = H - WAIST_H;
  const slantRun = D - TOP_D;
  const slantLen = Math.sqrt(slantRise * slantRise + slantRun * slantRun);
  const slantAngle = Math.atan2(slantRun, slantRise); // angle from vertical

  const lidGeo = new THREE.BoxGeometry(innerW - 0.004, slantLen - 0.004, PANEL_T);
  const lidY = WAIST_H + slantRise / 2;
  const lidZ = D / 2 - slantRun / 2 - PANEL_T * 0.35;
  addMesh(lidGeo, woodMat, 'fall_front_lid', 0, lidY, lidZ, -slantAngle, 0, 0);

  // Brass escutcheon on the lid
  const lidEscY = H - 0.045;
  const lidEscZ = D / 2 - slantRun + (0.045 / slantRise) * slantRun + PANEL_T * 0.25;
  addMesh(escutcheonGeo, brassMat, 'lid_escutcheon', 0, lidEscY, lidEscZ, -slantAngle, 0, 0);

  return group;
}
