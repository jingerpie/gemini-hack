function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const H = 0.21;
  const D = 0.095;

  const DISP_W = 0.28;
  const DISP_H = 0.165;
  const DISP_D = 0.032;
  const DISP_R = 0.018;

  const BASE_H = 0.045;
  const BASE_W_BOT = 0.155;
  const BASE_W_TOP = 0.125;
  const BASE_D = 0.072;

  const SCREEN_W = 0.246;
  const SCREEN_H = 0.118;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8e3d5,
    roughness: 0.55,
    metalness: 0.02
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0xd9d3c3,
    roughness: 0.75,
    metalness: 0.02
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x222224,
    roughness: 0.85,
    metalness: 0.05
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e1014,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  const emitScreenMat = new THREE.MeshStandardMaterial({
    color: 0x1a2634,
    emissive: 0xa6c8ff,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.05
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xdcd8cc,
    roughness: 0.65,
    metalness: 0.0
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

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  // 1. Rubber foot pad at y = 0
  const footGeo = new THREE.BoxGeometry(BASE_W_BOT - 0.008, 0.0025, BASE_D - 0.008);
  addMesh(footGeo, darkRubberMat, "base_rubber_foot", 0, 0.00125, -0.005);

  // 2. Trapezoidal pedestal base
  const baseShape = new THREE.Shape();
  const bwBot = BASE_W_BOT / 2 - 0.006;
  const bwTop = BASE_W_TOP / 2 - 0.006;
  const bh = BASE_H - 0.006;
  baseShape.moveTo(-bwBot, 0);
  baseShape.lineTo(bwBot, 0);
  baseShape.lineTo(bwTop, bh);
  baseShape.lineTo(-bwTop, bh);
  baseShape.closePath();

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_D - 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 4
  });
  baseGeo.center();
  addMesh(baseGeo, creamMat, "base_pedestal", 0, BASE_H / 2 + 0.002, -0.005);

  // 3. Display outer housing (cream rounded frame)
  const dispY = BASE_H + DISP_H / 2 - 0.002;
  const dispZ = 0.012;

  const housingShape = createRoundedRectShape(DISP_W - 0.012, DISP_H - 0.012, DISP_R - 0.004);
  const housingGeo = new THREE.ExtrudeGeometry(housingShape, {
    depth: DISP_D - 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 4
  });
  housingGeo.center();
  addMesh(housingGeo, creamMat, "display_housing", 0, dispY, dispZ);

  // 4. Rear contoured housing bump
  const backShape = createRoundedRectShape(DISP_W - 0.045, DISP_H - 0.04, 0.014);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3
  });
  backGeo.center();
  addMesh(backGeo, creamMat, "display_back_shell", 0, dispY, dispZ - DISP_D / 2 - 0.004);

  // 5. Front dark glass bezel
  const glassShape = createRoundedRectShape(DISP_W - 0.016, DISP_H - 0.016, DISP_R - 0.004);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.002,
    bevelEnabled: false
  });
  glassGeo.center();
  const frontZ = dispZ + DISP_D / 2;
  addMesh(glassGeo, glassMat, "front_bezel_glass", 0, dispY, frontZ + 0.0005);

  // 6. Active lit screen (emit_screen) slightly in front of bezel
  const screenGeo = new THREE.BoxGeometry(SCREEN_W, SCREEN_H, 0.0015);
  addMesh(screenGeo, emitScreenMat, "emit_screen", 0, dispY + 0.007, frontZ + 0.0018);

  // 7. Bottom speaker grille strip
  const grilleW = DISP_W - 0.018;
  const grilleH = 0.022;
  const grilleShape = createRoundedRectShape(grilleW, grilleH, 0.006);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.002,
    bevelEnabled: false
  });
  grilleGeo.center();
  addMesh(grilleGeo, grilleMat, "speaker_grille", 0, dispY - DISP_H / 2 + 0.018, frontZ + 0.0012);

  // 8. Top-right physical buttons (volume down, volume up, mic switch)
  const topY = dispY + DISP_H / 2 + 0.001;
  const btnGeo = new THREE.BoxGeometry(0.016, 0.003, 0.007);
  addMesh(btnGeo, creamMat, "button_vol_down", 0.048, topY, dispZ);
  addMesh(btnGeo, creamMat, "button_vol_up", 0.068, topY, dispZ);

  const switchGeo = new THREE.BoxGeometry(0.012, 0.0035, 0.006);
  addMesh(switchGeo, grilleMat, "switch_mic_mute", 0.095, topY, dispZ);

  // 9. Rear power port recess
  const portGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.004, 16);
  addMesh(portGeo, darkRubberMat, "rear_power_port", 0.02, 0.014, -BASE_D / 2 - 0.004, Math.PI / 2, 0, 0);

  // 10. Power cord curving out from rear to the right
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.014, -BASE_D / 2 - 0.004),
    new THREE.Vector3(0.045, 0.010, -BASE_D / 2 - 0.016),
    new THREE.Vector3(0.085, 0.004, -BASE_D / 2 - 0.012),
    new THREE.Vector3(0.135, 0.0035, -BASE_D / 2 + 0.005)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 20, 0.003, 12, false);
  addMesh(cordGeo, cordMat, "power_cord", 0, 0, 0);

  return group;
}
