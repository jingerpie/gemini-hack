function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale)
  const H = 0.24;
  const CAP_R = 0.044;
  const CAP_H = 0.018;
  const BASE_FLANGE_R = 0.068;
  const BASE_FLANGE_H = 0.010;
  const COLLAR_R = 0.048;
  const COLLAR_H = 0.008;

  const CHAMBER_R = 0.042;
  const CHAMBER_WALL = 0.0025;
  const CHAMBER_H = 0.135;
  const CHAMBER_Y = CAP_H + BASE_FLANGE_H;

  const PLUNGER_R = 0.034;
  const PLUNGER_SEAL_R = 0.039;
  const PLUNGER_SEAL_H = 0.016;
  const PLUNGER_SEAL_Y = CHAMBER_Y + 0.045;
  const PLUNGER_TOP_R = 0.048;
  const PLUNGER_TOP_H = 0.012;
  const PLUNGER_BODY_H = H - PLUNGER_SEAL_Y - PLUNGER_SEAL_H - PLUNGER_TOP_H;

  // Materials
  const darkCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x26292c,
    roughness: 0.45,
    metalness: 0.08,
  });

  const blackRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.65,
    metalness: 0.02,
  });

  const frostedChamberMat = new THREE.MeshPhysicalMaterial({
    color: 0xdce2e6,
    roughness: 0.32,
    metalness: 0.0,
    transparent: true,
    opacity: 0.42,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  });

  const markingMat = new THREE.MeshStandardMaterial({
    color: 0xe8ecef,
    roughness: 0.5,
    metalness: 0.0,
    transparent: true,
    opacity: 0.55,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bottom filter cap
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R * 0.98, CAP_H, 32);
  addMesh(capGeo, blackRubberMat, 'filter_cap_base', 0, CAP_H / 2, 0);

  const numCapRibs = 12;
  const ribGeo = new THREE.BoxGeometry(0.004, CAP_H * 0.85, 0.004);
  for (let i = 0; i < numCapRibs; i++) {
    const angle = (i / numCapRibs) * Math.PI * 2;
    const rx = Math.sin(angle) * (CAP_R - 0.0005);
    const rz = Math.cos(angle) * (CAP_R - 0.0005);
    const rib = addMesh(ribGeo, blackRubberMat, `filter_cap_rib_${i}`, rx, CAP_H / 2, rz);
    rib.rotation.y = angle;
  }

  // 2. Wide base flange & collar
  const flangePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BASE_FLANGE_R - 0.004, 0),
    new THREE.Vector2(BASE_FLANGE_R, BASE_FLANGE_H * 0.4),
    new THREE.Vector2(BASE_FLANGE_R, BASE_FLANGE_H * 0.8),
    new THREE.Vector2(BASE_FLANGE_R - 0.003, BASE_FLANGE_H),
    new THREE.Vector2(COLLAR_R, BASE_FLANGE_H + 0.002),
    new THREE.Vector2(0, BASE_FLANGE_H + 0.002),
  ];
  const flangeGeo = new THREE.LatheGeometry(flangePoints, 32);
  addMesh(flangeGeo, darkCharcoalMat, 'base_flange', 0, CAP_H, 0);

  const collarGeo = new THREE.CylinderGeometry(COLLAR_R, COLLAR_R + 0.002, COLLAR_H, 32);
  addMesh(collarGeo, darkCharcoalMat, 'base_collar', 0, CAP_H + BASE_FLANGE_H + COLLAR_H / 2 - 0.002, 0);

  // 3. Translucent frosted brew chamber
  const chamberPoints = [
    new THREE.Vector2(CHAMBER_R - CHAMBER_WALL, 0),
    new THREE.Vector2(CHAMBER_R, 0),
    new THREE.Vector2(CHAMBER_R, CHAMBER_H),
    new THREE.Vector2(CHAMBER_R - CHAMBER_WALL, CHAMBER_H),
    new THREE.Vector2(CHAMBER_R - CHAMBER_WALL, 0),
  ];
  const chamberGeo = new THREE.LatheGeometry(chamberPoints, 32);
  addMesh(chamberGeo, frostedChamberMat, 'brew_chamber', 0, CHAMBER_Y, 0);

  const chamberRimGeo = new THREE.TorusGeometry(CHAMBER_R - CHAMBER_WALL / 2, CHAMBER_WALL * 0.8, 12, 32);
  const chamberRim = addMesh(chamberRimGeo, frostedChamberMat, 'chamber_bottom_rim', 0, CHAMBER_Y + 0.002, 0);
  chamberRim.rotation.x = Math.PI / 2;

  // 4. Measurement markings on front (+Z) of chamber
  const scaleH = CHAMBER_H * 0.65;
  const scaleY = CHAMBER_Y + CHAMBER_H * 0.16 + scaleH / 2;
  const vLineGeo = new THREE.BoxGeometry(0.001, scaleH, 0.0008);
  addMesh(vLineGeo, markingMat, 'scale_vertical_line', -0.005, scaleY, CHAMBER_R + 0.0002);

  const numTicks = 6;
  const tickGeo = new THREE.BoxGeometry(0.008, 0.001, 0.0008);
  for (let i = 0; i < numTicks; i++) {
    const ty = CHAMBER_Y + CHAMBER_H * 0.18 + (i / (numTicks - 1)) * (scaleH * 0.9);
    addMesh(tickGeo, markingMat, `scale_tick_${i}`, -0.001, ty, CHAMBER_R + 0.0002);
  }

  // 5. Inner plunger seal (visible inside chamber)
  const sealPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(PLUNGER_SEAL_R, 0),
    new THREE.Vector2(PLUNGER_SEAL_R, 0.003),
    new THREE.Vector2(PLUNGER_R, PLUNGER_SEAL_H),
    new THREE.Vector2(0, PLUNGER_SEAL_H),
  ];
  const sealGeo = new THREE.LatheGeometry(sealPoints, 32);
  addMesh(sealGeo, blackRubberMat, 'plunger_seal', 0, PLUNGER_SEAL_Y, 0);

  // 6. Plunger body shaft
  const plungerBodyGeo = new THREE.CylinderGeometry(PLUNGER_R, PLUNGER_R, PLUNGER_BODY_H, 32);
  const plungerBodyY = PLUNGER_SEAL_Y + PLUNGER_SEAL_H + PLUNGER_BODY_H / 2;
  addMesh(plungerBodyGeo, darkCharcoalMat, 'plunger_body', 0, plungerBodyY, 0);

  const plungerRibGeo = new THREE.BoxGeometry(0.003, PLUNGER_BODY_H * 0.92, 0.003);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const rx = Math.sin(angle) * (PLUNGER_R - 0.0005);
    const rz = Math.cos(angle) * (PLUNGER_R - 0.0005);
    const pRib = addMesh(plungerRibGeo, darkCharcoalMat, `plunger_rib_${i}`, rx, plungerBodyY, rz);
    pRib.rotation.y = angle;
  }

  // 7. Plunger top flange
  const topFlangeY = H - PLUNGER_TOP_H;
  const topPoints = [
    new THREE.Vector2(PLUNGER_R - 0.004, 0),
    new THREE.Vector2(PLUNGER_TOP_R - 0.004, 0),
    new THREE.Vector2(PLUNGER_TOP_R, PLUNGER_TOP_H * 0.35),
    new THREE.Vector2(PLUNGER_TOP_R, PLUNGER_TOP_H * 0.65),
    new THREE.Vector2(PLUNGER_TOP_R - 0.004, PLUNGER_TOP_H),
    new THREE.Vector2(PLUNGER_R - 0.006, PLUNGER_TOP_H),
    new THREE.Vector2(PLUNGER_R - 0.008, PLUNGER_TOP_H * 0.3),
  ];
  const topFlangeGeo = new THREE.LatheGeometry(topPoints, 32);
  addMesh(topFlangeGeo, darkCharcoalMat, 'plunger_top_flange', 0, topFlangeY, 0);

  const topInnerGeo = new THREE.CylinderGeometry(PLUNGER_R - 0.007, PLUNGER_R - 0.007, 0.004, 24);
  addMesh(topInnerGeo, blackRubberMat, 'plunger_top_inner', 0, topFlangeY + 0.002, 0);

  return group;
}
