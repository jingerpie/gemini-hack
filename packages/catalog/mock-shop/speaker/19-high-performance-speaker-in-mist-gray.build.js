function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.22;
  const H = 0.60;
  const D_BOT = 0.28;
  const D_TOP = 0.22;
  const FOOT_H = 0.012;
  const BODY_H = H - FOOT_H;
  const CORNER_R = 0.028;
  const GRILLE_THICK = 0.018;
  const GRILLE_GAP = 0.018;
  const TILT = Math.atan2(D_BOT - D_TOP, BODY_H);

  // Materials
  const matShell = new THREE.MeshStandardMaterial({
    color: 0x8e9194,
    metalness: 0.65,
    roughness: 0.35
  });
  const matGrille = new THREE.MeshStandardMaterial({
    color: 0x9a9c9e,
    metalness: 0.05,
    roughness: 0.85
  });
  const matInner = new THREE.MeshStandardMaterial({
    color: 0x1c1d1f,
    metalness: 0.2,
    roughness: 0.7
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: 0x55585c,
    metalness: 0.7,
    roughness: 0.3
  });
  const matTweeter = new THREE.MeshStandardMaterial({
    color: 0x6a6d70,
    metalness: 0.4,
    roughness: 0.5
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x181818,
    metalness: 0.05,
    roughness: 0.9
  });

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Helper: rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  // 1. Main metallic cabinet shell (extruded along X, side profile in YZ)
  const zBack = -D_BOT / 2;
  const zFrontBot = D_BOT / 2 - GRILLE_THICK - GRILLE_GAP;
  const zFrontTop = zFrontBot - (D_BOT - D_TOP);
  const rSide = 0.024;

  const sideShape = new THREE.Shape();
  sideShape.moveTo(zBack + rSide, 0);
  sideShape.lineTo(zFrontBot - rSide, 0);
  sideShape.quadraticCurveTo(zFrontBot, 0, zFrontBot - Math.sin(TILT) * rSide, rSide);
  sideShape.lineTo(zFrontTop + Math.sin(TILT) * rSide, BODY_H - rSide);
  sideShape.quadraticCurveTo(zFrontTop, BODY_H, zFrontTop - rSide, BODY_H);
  sideShape.lineTo(zBack + rSide, BODY_H);
  sideShape.quadraticCurveTo(zBack, BODY_H, zBack, BODY_H - rSide);
  sideShape.lineTo(zBack, rSide);
  sideShape.quadraticCurveTo(zBack, 0, zBack + rSide, 0);

  const bevel = 0.016;
  const shellGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: W - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 16
  });
  shellGeo.rotateY(Math.PI / 2);
  shellGeo.translate(-(W - bevel * 2) / 2, FOOT_H, 0);
  addMesh(shellGeo, matShell, "cabinet_shell");

  // 2. Inner dark recessed baffle
  const baffleW = W * 0.78;
  const baffleH = BODY_H * 0.88;
  const baffleShape = roundedRectShape(baffleW, baffleH, CORNER_R * 0.8);
  const baffleGeo = new THREE.ExtrudeGeometry(baffleShape, {
    depth: 0.025,
    bevelEnabled: false,
    curveSegments: 12
  });
  baffleGeo.center();
  const baffle = addMesh(baffleGeo, matInner, "inner_baffle");
  const midZ = (zFrontBot + zFrontTop) / 2 + 0.008;
  const midY = FOOT_H + BODY_H / 2;
  baffle.position.set(0, midY, midZ);
  baffle.rotation.x = -TILT;

  // 3. Front fabric grille
  const grilleW = W * 0.94;
  const grilleH = BODY_H * 0.94;
  const grilleShape = roundedRectShape(grilleW, grilleH, CORNER_R);
  const grilleGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: GRILLE_THICK,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 4,
    curveSegments: 16
  });
  grilleGeo.center();
  const grille = addMesh(grilleGeo, matGrille, "front_grille");
  const grilleZ = midZ + GRILLE_GAP + GRILLE_THICK / 2;
  grille.position.set(0, midY, grilleZ);
  grille.rotation.x = -TILT;

  // 4. Standoffs connecting inner baffle to front grille
  const standoffGeo = new THREE.CylinderGeometry(0.008, 0.008, GRILLE_GAP + 0.01, 12);
  standoffGeo.rotateX(Math.PI / 2);
  const standoffOffsets = [
    [-baffleW * 0.36, baffleH * 0.38, "standoff_top_left"],
    [baffleW * 0.36, baffleH * 0.38, "standoff_top_right"],
    [-baffleW * 0.36, -baffleH * 0.38, "standoff_bot_left"],
    [baffleW * 0.36, -baffleH * 0.38, "standoff_bot_right"]
  ];
  for (const [ox, oy, name] of standoffOffsets) {
    const st = addMesh(standoffGeo, matInner, name);
    st.position.set(
      ox,
      midY + oy * Math.cos(TILT),
      midZ + GRILLE_GAP / 2 - oy * Math.sin(TILT)
    );
    st.rotation.x = -TILT;
  }

  // 5. Tweeter assembly on upper front grille
  const tweeterLocalY = grilleH * 0.28;
  const tweeterY = midY + tweeterLocalY * Math.cos(TILT);
  const tweeterZ = grilleZ + GRILLE_THICK / 2 + 0.003 - tweeterLocalY * Math.sin(TILT);

  const bezelGeo = new THREE.TorusGeometry(0.042, 0.006, 12, 32);
  const bezel = addMesh(bezelGeo, matBezel, "tweeter_bezel");
  bezel.position.set(0, tweeterY, tweeterZ);
  bezel.rotation.x = -TILT;

  const cupGeo = new THREE.CylinderGeometry(0.038, 0.036, 0.008, 24);
  cupGeo.rotateX(Math.PI / 2);
  const cup = addMesh(cupGeo, matInner, "tweeter_cup");
  cup.position.set(0, tweeterY, tweeterZ - 0.002);
  cup.rotation.x = -TILT;

  const domeGeo = new THREE.SphereGeometry(0.034, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  domeGeo.rotateX(Math.PI / 2);
  const dome = addMesh(domeGeo, matTweeter, "tweeter_dome");
  dome.position.set(0, tweeterY, tweeterZ - 0.004);
  dome.rotation.x = -TILT;

  // 6. Recessed woofers behind the grille (visible in side gap)
  const wooferOffsets = [
    [0.02, "upper_woofer"],
    [-0.14, "lower_woofer"]
  ];
  const surroundGeo = new THREE.TorusGeometry(0.068, 0.009, 10, 24);
  const coneGeo = new THREE.CylinderGeometry(0.062, 0.025, 0.015, 24);
  coneGeo.rotateX(Math.PI / 2);

  for (const [oy, prefix] of wooferOffsets) {
    const wy = midY + oy * Math.cos(TILT);
    const wz = midZ + 0.012 - oy * Math.sin(TILT);

    const sur = addMesh(surroundGeo, matRubber, `${prefix}_surround`);
    sur.position.set(0, wy, wz);
    sur.rotation.x = -TILT;

    const cone = addMesh(coneGeo, matInner, `${prefix}_cone`);
    cone.position.set(0, wy, wz - 0.005);
    cone.rotation.x = -TILT;
  }

  // 7. Four rubber feet at y = 0
  const footGeo = new THREE.CylinderGeometry(0.016, 0.018, FOOT_H, 16);
  const footX = W * 0.34;
  const footZFront = zFrontBot - 0.035;
  const footZBack = zBack + 0.035;
  const feet = [
    [-footX, footZFront, "foot_fl"],
    [footX, footZFront, "foot_fr"],
    [-footX, footZBack, "foot_bl"],
    [footX, footZBack, "foot_br"]
  ];
  for (const [fx, fz, name] of feet) {
    const foot = addMesh(footGeo, matRubber, name);
    foot.position.set(fx, FOOT_H / 2, fz);
  }

  // 8. Rear port & terminal plate
  const portGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.01, 20);
  portGeo.rotateX(Math.PI / 2);
  const port = addMesh(portGeo, matInner, "rear_port");
  port.position.set(0, FOOT_H + BODY_H * 0.72, zBack - bevel + 0.004);

  const plateGeo = new THREE.BoxGeometry(0.09, 0.11, 0.006);
  const plate = addMesh(plateGeo, matInner, "rear_terminal_plate");
  plate.position.set(0, FOOT_H + BODY_H * 0.22, zBack - bevel + 0.003);

  // Center bounding box on X = 0, Z = 0, and ensure lowest point is y = 0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;

  return group;
}
