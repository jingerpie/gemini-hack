function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.55;
  const H = 0.62;
  const TOP_THICK = 0.022;
  const TILT_ANGLE = 0.24; // ~13.7 degrees forward tilt

  const LEG_X = 0.36; // X offset of left/right leg frames
  const FOOT_W = 0.042;
  const FOOT_H = 0.032;
  const FOOT_LEN = 0.50;
  const GLIDE_H = 0.006;

  const COL_Z = -D / 2 + 0.055; // Back vertical column Z position
  const LOWER_COL_W = 0.036;
  const UPPER_COL_W = 0.044;
  const ARM_H = 0.032;
  const ARM_LEN = 0.44;
  const PIVOT_Y = H - 0.055;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c396,
    roughness: 0.55,
    metalness: 0.0
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x62869c,
    roughness: 0.42,
    metalness: 0.25
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0xb0b8c0,
    roughness: 0.3,
    metalness: 0.8
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d30,
    roughness: 0.8,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Desktop (rounded rectangle extruded, then tilted)
  const topRadius = 0.035;
  const topShape = new THREE.Shape();
  const hw = W / 2;
  const hd = D / 2;
  topShape.moveTo(-hw + topRadius, -hd);
  topShape.lineTo(hw - topRadius, -hd);
  topShape.quadraticCurveTo(hw, -hd, hw, -hd + topRadius);
  topShape.lineTo(hw, hd - topRadius);
  topShape.quadraticCurveTo(hw, hd, hw - topRadius, hd);
  topShape.lineTo(-hw + topRadius, hd);
  topShape.quadraticCurveTo(-hw, hd, -hw, hd - topRadius);
  topShape.lineTo(-hw, -hd + topRadius);
  topShape.quadraticCurveTo(-hw, -hd, -hw + topRadius, -hd);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 12
  });
  topGeo.rotateX(Math.PI / 2);
  topGeo.translate(0, TOP_THICK, 0);

  // Tilt group for desktop + pencil ledge
  const topGroup = new THREE.Group();
  topGroup.name = "desktop_tilt_group";
  const pivotZ = D / 2 - 0.06;
  topGroup.position.set(0, PIVOT_Y, pivotZ);
  topGroup.rotation.x = TILT_ANGLE;
  group.add(topGroup);

  const desktopMesh = new THREE.Mesh(topGeo, woodMat);
  desktopMesh.name = "desktop_surface";
  desktopMesh.position.set(0, 0, -pivotZ);
  desktopMesh.castShadow = true;
  desktopMesh.receiveShadow = true;
  topGroup.add(desktopMesh);

  // Pencil ledge on front edge of desktop
  const ledgeW = 0.46;
  const ledgeH = 0.012;
  const ledgeD = 0.014;
  const ledgeGeo = new THREE.BoxGeometry(ledgeW, ledgeH, ledgeD);
  const ledgeMesh = new THREE.Mesh(ledgeGeo, woodMat);
  ledgeMesh.name = "pencil_ledge";
  ledgeMesh.position.set(0, TOP_THICK + ledgeH / 2, D / 2 - pivotZ - 0.032);
  ledgeMesh.castShadow = true;
  ledgeMesh.receiveShadow = true;
  topGroup.add(ledgeMesh);

  // 2. Left & Right C-Leg Assemblies
  const sides = [
    { label: "left", sign: -1 },
    { label: "right", sign: 1 }
  ];

  sides.forEach(({ label, sign }) => {
    const x = sign * LEG_X;

    // Base foot
    const footZ = COL_Z + FOOT_LEN / 2 - UPPER_COL_W / 2;
    const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_LEN);
    addMesh(footGeo, frameMat, `${label}_base_foot`, [x, GLIDE_H + FOOT_H / 2, footZ]);

    // Floor glides (front and back)
    const glideGeo = new THREE.CylinderGeometry(0.012, 0.012, GLIDE_H, 12);
    addMesh(glideGeo, glideMat, `${label}_glide_back`, [x, GLIDE_H / 2, COL_Z]);
    addMesh(glideGeo, glideMat, `${label}_glide_front`, [x, GLIDE_H / 2, footZ + FOOT_LEN / 2 - 0.02]);

    // Lower inner vertical column
    const lowerColH = (PIVOT_Y - GLIDE_H - FOOT_H) * 0.55;
    const lowerColGeo = new THREE.BoxGeometry(LOWER_COL_W, lowerColH, LOWER_COL_W);
    addMesh(
      lowerColGeo,
      frameMat,
      `${label}_lower_column`,
      [x, GLIDE_H + FOOT_H + lowerColH / 2, COL_Z]
    );

    // Upper outer vertical sleeve
    const upperColH = (PIVOT_Y - GLIDE_H - FOOT_H) * 0.62;
    const upperColY = PIVOT_Y - upperColH / 2;
    const upperColGeo = new THREE.BoxGeometry(UPPER_COL_W, upperColH, UPPER_COL_W);
    addMesh(
      upperColGeo,
      frameMat,
      `${label}_upper_column`,
      [x, upperColY, COL_Z]
    );

    // Height adjustment bolt on inner face
    const boltGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.012, 10);
    boltGeo.rotateZ(Math.PI / 2);
    addMesh(
      boltGeo,
      hardwareMat,
      `${label}_height_bolt`,
      [x - sign * (UPPER_COL_W / 2 + 0.004), upperColY - upperColH / 2 + 0.035, COL_Z]
    );

    // Horizontal top support arm
    const armZ = COL_Z + ARM_LEN / 2 - UPPER_COL_W / 2;
    const armGeo = new THREE.BoxGeometry(FOOT_W, ARM_H, ARM_LEN);
    addMesh(
      armGeo,
      frameMat,
      `${label}_support_arm`,
      [x, PIVOT_Y - ARM_H / 2, armZ]
    );

    // Tilt support strut (angled bracket between support arm and underside of desktop)
    const strutLen = 0.14;
    const strutGeo = new THREE.BoxGeometry(0.014, strutLen, 0.022);
    addMesh(
      strutGeo,
      frameMat,
      `${label}_tilt_strut`,
      [x - sign * 0.018, PIVOT_Y + 0.045, COL_Z + 0.12],
      [-0.35, 0, 0]
    );
  });

  // 3. Front pivot crossbar under desktop
  const crossbarW = LEG_X * 2 + FOOT_W;
  const crossbarGeo = new THREE.BoxGeometry(crossbarW, 0.024, 0.024);
  addMesh(
    crossbarGeo,
    frameMat,
    "front_pivot_crossbar",
    [0, PIVOT_Y - 0.012, COL_Z + ARM_LEN - UPPER_COL_W / 2 - 0.012]
  );

  // 4. Back wooden modesty / cross panel between vertical columns
  const backPanelW = LEG_X * 2 - UPPER_COL_W;
  const backPanelH = 0.11;
  const backPanelD = 0.018;
  const backPanelGeo = new THREE.BoxGeometry(backPanelW, backPanelH, backPanelD);
  addMesh(
    backPanelGeo,
    woodMat,
    "back_cross_panel",
    [0, PIVOT_Y - backPanelH / 2 - 0.025, COL_Z]
  );

  return group;
}
