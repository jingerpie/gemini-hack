function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.48;
  const D = 0.38;
  const H = 0.62;
  const LEG_H = 0.05;
  const LEG_W = 0.045;
  const LEG_INSET = 0.015;
  const PANEL_T = 0.022;
  const TOP_OVERHANG = 0.015;
  const LIP_H = 0.032;
  const LIP_T = 0.018;
  const DRAWER_H = 0.16;
  const DRAWER_GAP = 0.003;

  const BODY_W = W - TOP_OVERHANG * 2;
  const BODY_D = D - TOP_OVERHANG; // Overhang on front, flush on back
  const BODY_Z = -TOP_OVERHANG / 2;
  const BODY_H = H - LEG_H - PANEL_T - LIP_H;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a34,
    roughness: 0.68,
    metalness: 0.02,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x734625,
    roughness: 0.55,
    metalness: 0.03,
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

  // 1-4. Four square block legs
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legX = BODY_W / 2 - LEG_W / 2 - LEG_INSET;
  const legZFront = BODY_Z + BODY_D / 2 - LEG_W / 2 - LEG_INSET;
  const legZBack = BODY_Z - BODY_D / 2 + LEG_W / 2 + LEG_INSET;

  addMesh(legGeo, woodMat, "front_left_leg", -legX, LEG_H / 2, legZFront);
  addMesh(legGeo, woodMat, "front_right_leg", legX, LEG_H / 2, legZFront);
  addMesh(legGeo, woodMat, "back_left_leg", -legX, LEG_H / 2, legZBack);
  addMesh(legGeo, woodMat, "back_right_leg", legX, LEG_H / 2, legZBack);

  // 5. Bottom panel
  const bottomGeo = new THREE.BoxGeometry(BODY_W - PANEL_T * 2, PANEL_T, BODY_D);
  const bottomY = LEG_H + PANEL_T / 2;
  addMesh(bottomGeo, woodMat, "bottom_panel", 0, bottomY, BODY_Z);

  // 6-7. Left and right side panels
  const sideGeo = new THREE.BoxGeometry(PANEL_T, BODY_H, BODY_D);
  const sideY = LEG_H + BODY_H / 2;
  const sideX = BODY_W / 2 - PANEL_T / 2;
  addMesh(sideGeo, woodMat, "left_side_panel", -sideX, sideY, BODY_Z);
  addMesh(sideGeo, woodMat, "right_side_panel", sideX, sideY, BODY_Z);

  // 8. Back panel
  const backGeo = new THREE.BoxGeometry(BODY_W - PANEL_T * 2, BODY_H, PANEL_T);
  const backZ = BODY_Z - BODY_D / 2 + PANEL_T / 2;
  addMesh(backGeo, woodMat, "back_panel", 0, sideY, backZ);

  // 9. Middle horizontal divider (below drawer)
  const dividerY = LEG_H + BODY_H - DRAWER_H - PANEL_T / 2 - DRAWER_GAP * 2;
  const dividerGeo = new THREE.BoxGeometry(BODY_W - PANEL_T * 2, PANEL_T, BODY_D - PANEL_T);
  addMesh(dividerGeo, woodMat, "middle_divider", 0, dividerY, BODY_Z + PANEL_T / 2);

  // 10. Top panel (with front and side overhang)
  const topGeo = new THREE.BoxGeometry(W, PANEL_T, D);
  const topY = LEG_H + BODY_H + PANEL_T / 2;
  addMesh(topGeo, woodMat, "top_panel", 0, topY, 0);

  // 11. Top back lip
  const lipGeo = new THREE.BoxGeometry(W - TOP_OVERHANG * 2, LIP_H, LIP_T);
  const lipY = topY + PANEL_T / 2 + LIP_H / 2;
  const lipZ = -D / 2 + LIP_T / 2;
  addMesh(lipGeo, woodMat, "top_back_lip", 0, lipY, lipZ);

  // 12. Drawer front
  const drawerW = BODY_W - PANEL_T * 2 - DRAWER_GAP * 2;
  const drawerFrontGeo = new THREE.BoxGeometry(drawerW, DRAWER_H, PANEL_T);
  const drawerY = dividerY + PANEL_T / 2 + DRAWER_GAP + DRAWER_H / 2;
  const drawerZ = BODY_Z + BODY_D / 2 - PANEL_T / 2;
  addMesh(drawerFrontGeo, woodMat, "drawer_front", 0, drawerY, drawerZ);

  // 13-14. Wooden drawer knob (stem + rounded head)
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.014, 16);
  stemGeo.rotateX(Math.PI / 2);
  const stemZ = drawerZ + PANEL_T / 2 + 0.007;
  addMesh(stemGeo, knobMat, "drawer_knob_stem", 0, drawerY, stemZ);

  const knobHeadGeo = new THREE.SphereGeometry(0.018, 20, 16);
  knobHeadGeo.scale(1, 1, 0.72);
  const knobZ = stemZ + 0.01;
  addMesh(knobHeadGeo, knobMat, "drawer_knob_head", 0, drawerY, knobZ);

  return group;
}
