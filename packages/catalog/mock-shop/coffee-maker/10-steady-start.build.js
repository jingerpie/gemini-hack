function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.16;
  const H = 0.34;
  const D = 0.25;

  const FOOT_H = 0.005;
  const BASE_H = 0.028;
  const COL_D = 0.085;
  const HEAD_H = 0.042;
  const LID_H = 0.012;
  const CORNER_R = 0.014;

  const BREW_Z = D / 2 - 0.082; // Center Z of carafe and filter basket
  const CARAFE_R = 0.066;
  const CARAFE_H = 0.118;
  const BASKET_R_TOP = 0.060;
  const BASKET_R_BOT = 0.036;
  const BASKET_H = 0.092;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2c2f33,
    roughness: 0.55,
    metalness: 0.08
  });

  const darkAccentMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.42,
    metalness: 0.12
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc8cdd0,
    roughness: 0.28,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf2f4,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.34,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const meshFilterMat = new THREE.MeshStandardMaterial({
    color: 0x6b7075,
    roughness: 0.65,
    metalness: 0.45
  });

  const waterWindowMat = new THREE.MeshStandardMaterial({
    color: 0x8d979c,
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0.45
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Recessed bottom foot
  const footShape = createRoundedRectShape(W - 0.012, D - 0.012, CORNER_R * 0.8);
  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: FOOT_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  footGeo.rotateX(Math.PI / 2);
  addMesh(footGeo, darkAccentMat, 'base_foot', 0, FOOT_H, 0);

  // 2. Main base plate
  const baseShape = createRoundedRectShape(W, D, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, bodyMat, 'base_plate', 0, FOOT_H + BASE_H, 0);

  // 3. Warming plate pad
  const padGeo = new THREE.CylinderGeometry(CARAFE_R + 0.004, CARAFE_R + 0.006, 0.004, 32);
  addMesh(padGeo, darkAccentMat, 'warming_plate', 0, FOOT_H + BASE_H + 0.002, BREW_Z);

  // 4. Vertical rear column
  const colH = H - FOOT_H - BASE_H - HEAD_H;
  const colShape = createRoundedRectShape(W, COL_D, CORNER_R);
  const colGeo = new THREE.ExtrudeGeometry(colShape, {
    depth: colH,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12
  });
  colGeo.rotateX(Math.PI / 2);
  addMesh(colGeo, bodyMat, 'rear_column', 0, FOOT_H + BASE_H + colH, -D / 2 + COL_D / 2);

  // 5. Water level window on -X side of column
  const winGeo = new THREE.CapsuleGeometry(0.0045, 0.085, 6, 12);
  addMesh(winGeo, waterWindowMat, 'water_level_window', -W / 2 - 0.001, H * 0.62, -D / 2 + COL_D * 0.52);

  // 6. Power button on -X side near bottom
  const btnGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.004, 24);
  btnGeo.rotateZ(Math.PI / 2);
  addMesh(btnGeo, darkAccentMat, 'power_button', -W / 2 - 0.0015, FOOT_H + BASE_H + 0.036, -D / 2 + COL_D * 0.45);

  // 7. Top brew head overhang
  const headMainH = HEAD_H - LID_H;
  const headShape = createRoundedRectShape(W, D, CORNER_R);
  const headGeo = new THREE.ExtrudeGeometry(headShape, {
    depth: headMainH,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12
  });
  headGeo.rotateX(Math.PI / 2);
  addMesh(headGeo, bodyMat, 'brew_head_housing', 0, H - LID_H, 0);

  // 8. Top hinged lid
  const lidShape = createRoundedRectShape(W - 0.002, D - 0.002, CORNER_R);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 12
  });
  lidGeo.rotateX(Math.PI / 2);
  addMesh(lidGeo, bodyMat, 'top_lid', 0, H, 0);

  // 9. Lid front finger tab
  const tabGeo = new THREE.BoxGeometry(0.032, 0.004, 0.010);
  addMesh(tabGeo, darkAccentMat, 'lid_finger_tab', 0, H - LID_H + 0.001, D / 2 - 0.004);

  // 10. Underside showerhead plate
  const showerGeo = new THREE.CylinderGeometry(0.048, 0.044, 0.008, 28);
  addMesh(showerGeo, darkAccentMat, 'showerhead_plate', 0, H - HEAD_H - 0.003, BREW_Z);

  // 11. Carafe glass body (LatheGeometry for rounded shoulder)
  const carafeBaseY = FOOT_H + BASE_H + 0.004;
  const carafePts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(CARAFE_R - 0.008, 0),
    new THREE.Vector2(CARAFE_R, 0.010),
    new THREE.Vector2(CARAFE_R, CARAFE_H * 0.65),
    new THREE.Vector2(CARAFE_R * 0.84, CARAFE_H * 0.82),
    new THREE.Vector2(CARAFE_R * 0.82, CARAFE_H)
  ];
  const carafeGeo = new THREE.LatheGeometry(carafePts, 32);
  addMesh(carafeGeo, glassMat, 'carafe_glass_body', 0, carafeBaseY, BREW_Z);

  // 12. Carafe stainless steel neck band
  const carafeBandGeo = new THREE.CylinderGeometry(CARAFE_R * 0.845, CARAFE_R * 0.845, 0.015, 32, 1, true);
  addMesh(carafeBandGeo, steelMat, 'carafe_steel_band', 0, carafeBaseY + CARAFE_H * 0.88, BREW_Z);

  // 13. Carafe lid
  const carafeLidGeo = new THREE.CylinderGeometry(CARAFE_R * 0.85, CARAFE_R * 0.83, 0.012, 32);
  addMesh(carafeLidGeo, darkAccentMat, 'carafe_lid', 0, carafeBaseY + CARAFE_H + 0.004, BREW_Z);

  // 14. Carafe lid center knob
  const carafeKnobGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.009, 24);
  addMesh(carafeKnobGeo, darkAccentMat, 'carafe_lid_knob', 0, carafeBaseY + CARAFE_H + 0.013, BREW_Z);

  // 15. Carafe glass handle (TubeGeometry)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, carafeBaseY + CARAFE_H * 0.86, BREW_Z + CARAFE_R * 0.82),
    new THREE.Vector3(0, carafeBaseY + CARAFE_H * 0.85, BREW_Z + CARAFE_R + 0.032),
    new THREE.Vector3(0, carafeBaseY + CARAFE_H * 0.50, BREW_Z + CARAFE_R + 0.036),
    new THREE.Vector3(0, carafeBaseY + CARAFE_H * 0.18, BREW_Z + CARAFE_R + 0.030),
    new THREE.Vector3(0, carafeBaseY + CARAFE_H * 0.16, BREW_Z + CARAFE_R * 0.96)
  ]);
  const carafeHandleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0075, 12, false);
  addMesh(carafeHandleGeo, glassMat, 'carafe_glass_handle', 0, 0, 0);

  // 16. Filter basket support bracket (connects basket to rear column)
  const basketTopY = H - HEAD_H - 0.020;
  const basketBotY = basketTopY - BASKET_H;
  const bracketGeo = new THREE.BoxGeometry(0.044, 0.018, 0.045);
  addMesh(bracketGeo, darkAccentMat, 'filter_basket_bracket', 0, basketTopY - 0.012, BREW_Z - BASKET_R_TOP - 0.015);

  // 17. Filter basket clear cone
  const basketPts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(BASKET_R_BOT, 0),
    new THREE.Vector2(BASKET_R_TOP, BASKET_H)
  ];
  const basketGeo = new THREE.LatheGeometry(basketPts, 32);
  addMesh(basketGeo, glassMat, 'filter_basket_cone', 0, basketBotY, BREW_Z);

  // 18. Inner mesh filter cone
  const innerFilterGeo = new THREE.CylinderGeometry(BASKET_R_TOP * 0.86, BASKET_R_BOT * 0.72, BASKET_H * 0.86, 28);
  addMesh(innerFilterGeo, meshFilterMat, 'inner_mesh_filter', 0, basketBotY + BASKET_H * 0.48, BREW_Z);

  // 19. Filter basket stainless steel band
  const basketBandGeo = new THREE.CylinderGeometry(BASKET_R_TOP + 0.001, BASKET_R_TOP - 0.003, 0.016, 32, 1, true);
  addMesh(basketBandGeo, steelMat, 'filter_basket_steel_band', 0, basketTopY - 0.012, BREW_Z);

  // 20. Filter basket dark rim
  const basketRimGeo = new THREE.TorusGeometry(BASKET_R_TOP, 0.005, 12, 32);
  basketRimGeo.rotateX(Math.PI / 2);
  addMesh(basketRimGeo, darkAccentMat, 'filter_basket_rim', 0, basketTopY, BREW_Z);

  // 21. Filter basket handle
  const basketHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, basketTopY - 0.012, BREW_Z + BASKET_R_TOP),
    new THREE.Vector3(0, basketTopY - 0.016, BREW_Z + BASKET_R_TOP + 0.022),
    new THREE.Vector3(0, basketBotY + 0.014, BREW_Z + BASKET_R_TOP + 0.020)
  ]);
  const basketHandleGeo = new THREE.TubeGeometry(basketHandleCurve, 16, 0.0065, 10, false);
  addMesh(basketHandleGeo, bodyMat, 'filter_basket_handle', 0, 0, 0);

  return group;
}
