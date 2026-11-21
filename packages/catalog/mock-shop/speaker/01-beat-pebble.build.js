function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.11;
  const H = 0.11;
  const D = 0.054;
  const CORNER_R = 0.026;
  const BEVEL = 0.008;
  const BODY_D = D - BEVEL * 2;

  // Materials
  const mintMat = new THREE.MeshStandardMaterial({
    color: 0x76b8a8,
    roughness: 0.62,
    metalness: 0.04,
  });

  const mintDarkMat = new THREE.MeshStandardMaterial({
    color: 0x64a394,
    roughness: 0.68,
    metalness: 0.05,
  });

  const grilleDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1d2b27,
    roughness: 0.85,
    metalness: 0.1,
  });

  const driverMat = new THREE.MeshStandardMaterial({
    color: 0x2c3d38,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Helper to create a rounded-square THREE.Shape centered at (0, 0)
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(radius, hw, hh);
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

  // 1. Main pebble body
  const bodyShape = createRoundedRectShape(W - BEVEL * 2, H - BEVEL * 2, CORNER_R - BEVEL);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 8,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0, -BODY_D / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mintMat);
  bodyMesh.name = 'speaker_body';
  bodyMesh.position.set(0, H / 2, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Subtle rubberized base pad at y = 0
  const basePadGeo = new THREE.BoxGeometry(W * 0.48, 0.002, D * 0.52);
  const basePad = new THREE.Mesh(basePadGeo, mintDarkMat);
  basePad.name = 'base_pad';
  basePad.position.set(0, 0.001, 0);
  basePad.castShadow = true;
  basePad.receiveShadow = true;
  group.add(basePad);

  // 3. Front recessed grille backing (+Z)
  const grilleW = W * 0.78;
  const grilleH = H * 0.78;
  const grilleR = CORNER_R * 0.75;
  const grilleShape = createRoundedRectShape(grilleW, grilleH, grilleR);
  const grilleBackGeo = new THREE.ExtrudeGeometry(grilleShape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 14,
  });
  const grilleBack = new THREE.Mesh(grilleBackGeo, grilleDarkMat);
  grilleBack.name = 'grille_backing';
  grilleBack.position.set(0, H / 2, D / 2 - 0.0025);
  grilleBack.castShadow = true;
  grilleBack.receiveShadow = true;
  group.add(grilleBack);

  // 4. Internal speaker driver silhouette
  const driverGeo = new THREE.CylinderGeometry(grilleW * 0.34, grilleW * 0.34, 0.002, 24);
  driverGeo.rotateX(Math.PI / 2);
  const driverMesh = new THREE.Mesh(driverGeo, driverMat);
  driverMesh.name = 'speaker_driver';
  driverMesh.position.set(0, H / 2, D / 2 - 0.0005);
  driverMesh.castShadow = true;
  driverMesh.receiveShadow = true;
  group.add(driverMesh);

  // 5. Front grille outer rim
  const rimOuter = createRoundedRectShape(grilleW + 0.004, grilleH + 0.004, grilleR + 0.002);
  const rimHole = createRoundedRectShape(grilleW - 0.002, grilleH - 0.002, grilleR - 0.001);
  rimOuter.holes.push(rimHole);
  const rimGeo = new THREE.ExtrudeGeometry(rimOuter, {
    depth: 0.0025,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 3,
    curveSegments: 14,
  });
  const rimMesh = new THREE.Mesh(rimGeo, mintMat);
  rimMesh.name = 'grille_rim';
  rimMesh.position.set(0, H / 2, D / 2 - 0.001);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 6. Grille perforated-style slats (horizontal + vertical mint bars)
  const slatCount = 5;
  const slatSpan = grilleW * 0.86;
  const slatStep = (grilleH * 0.72) / (slatCount - 1);
  for (let i = 0; i < slatCount; i++) {
    const yOff = (i - (slatCount - 1) / 2) * slatStep;
    const hSlatGeo = new THREE.BoxGeometry(slatSpan, 0.0014, 0.0012);
    const hSlat = new THREE.Mesh(hSlatGeo, mintMat);
    hSlat.name = `grille_slat_h_${i}`;
    hSlat.position.set(0, H / 2 + yOff, D / 2 + 0.0008);
    hSlat.castShadow = true;
    hSlat.receiveShadow = true;
    group.add(hSlat);
  }

  // 7. Top control buttons (-, +, power)
  const btnY = H - 0.0005;
  const btnRadius = 0.0075;
  const btnHeight = 0.0028;
  const btnSpacing = 0.021;

  // Minus button (left)
  const btnMinusGeo = new THREE.CylinderGeometry(btnRadius, btnRadius * 1.05, btnHeight, 20);
  const btnMinus = new THREE.Mesh(btnMinusGeo, mintMat);
  btnMinus.name = 'button_minus';
  btnMinus.position.set(-btnSpacing, btnY + btnHeight / 2, 0);
  btnMinus.castShadow = true;
  btnMinus.receiveShadow = true;
  group.add(btnMinus);

  const minusBarGeo = new THREE.BoxGeometry(0.007, 0.001, 0.0018);
  const minusBar = new THREE.Mesh(minusBarGeo, mintDarkMat);
  minusBar.name = 'button_minus_icon';
  minusBar.position.set(-btnSpacing, btnY + btnHeight + 0.0004, 0);
  minusBar.castShadow = true;
  minusBar.receiveShadow = true;
  group.add(minusBar);

  // Plus button (center)
  const btnPlusGeo = new THREE.CylinderGeometry(btnRadius, btnRadius * 1.05, btnHeight, 20);
  const btnPlus = new THREE.Mesh(btnPlusGeo, mintMat);
  btnPlus.name = 'button_plus';
  btnPlus.position.set(0, btnY + btnHeight / 2, 0);
  btnPlus.castShadow = true;
  btnPlus.receiveShadow = true;
  group.add(btnPlus);

  const plusHGeo = new THREE.BoxGeometry(0.007, 0.001, 0.0018);
  const plusH = new THREE.Mesh(plusHGeo, mintDarkMat);
  plusH.name = 'button_plus_icon_h';
  plusH.position.set(0, btnY + btnHeight + 0.0004, 0);
  plusH.castShadow = true;
  plusH.receiveShadow = true;
  group.add(plusH);

  const plusVGeo = new THREE.BoxGeometry(0.0018, 0.001, 0.007);
  const plusV = new THREE.Mesh(plusVGeo, mintDarkMat);
  plusV.name = 'button_plus_icon_v';
  plusV.position.set(0, btnY + btnHeight + 0.0004, 0);
  plusV.castShadow = true;
  plusV.receiveShadow = true;
  group.add(plusV);

  // Power button (right)
  const btnPowerGeo = new THREE.CylinderGeometry(btnRadius, btnRadius * 1.05, btnHeight, 20);
  const btnPower = new THREE.Mesh(btnPowerGeo, mintMat);
  btnPower.name = 'button_power';
  btnPower.position.set(btnSpacing, btnY + btnHeight / 2, 0);
  btnPower.castShadow = true;
  btnPower.receiveShadow = true;
  group.add(btnPower);

  const powerRingGeo = new THREE.TorusGeometry(0.003, 0.0007, 8, 16);
  powerRingGeo.rotateX(Math.PI / 2);
  const powerRing = new THREE.Mesh(powerRingGeo, mintDarkMat);
  powerRing.name = 'button_power_icon';
  powerRing.position.set(btnSpacing, btnY + btnHeight + 0.0004, 0);
  powerRing.castShadow = true;
  powerRing.receiveShadow = true;
  group.add(powerRing);

  // 8. Carrying strap loop at top-right corner (+X, +Y)
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.012, 0.026, 0.0),
    new THREE.Vector3(0.028, 0.042, 0.0),
    new THREE.Vector3(0.042, 0.036, 0.0),
    new THREE.Vector3(0.038, 0.018, 0.0),
    new THREE.Vector3(0.018, 0.004, 0.0),
    new THREE.Vector3(0.004, -0.004, 0.0),
  ]);
  const strapGeo = new THREE.TubeGeometry(strapCurve, 28, 0.0045, 10, false);
  strapGeo.scale(1, 1, 1.5);
  const strapMesh = new THREE.Mesh(strapGeo, mintMat);
  strapMesh.name = 'carrying_strap';
  strapMesh.position.set(W / 2 - 0.016, H - 0.012, 0);
  strapMesh.castShadow = true;
  strapMesh.receiveShadow = true;
  group.add(strapMesh);

  return group;
}
