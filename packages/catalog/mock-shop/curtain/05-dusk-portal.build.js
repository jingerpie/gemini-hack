function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 1.80; // Exact overall height
  const PANEL_W = 0.62;
  const GAP_W = 0.14;
  const W = PANEL_W * 2 + GAP_W; // 1.38 m total width
  const FOLD_D = 0.042;
  const THICK = 0.006;
  const D = FOLD_D + THICK; // 0.048 m total depth
  const ROD_R = 0.011;
  const ROD_Y = H - 0.032;
  const CAP_R = 0.015;
  const CAP_L = 0.012;
  const Z_CENTER_OFFSET = -D / 2;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d5,
    roughness: 0.88,
    metalness: 0.0,
  });

  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0eb,
    roughness: 0.35,
    metalness: 0.15,
  });

  const purpleMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c6b,
    roughness: 0.78,
    metalness: 0.0,
  });

  const moundMat = new THREE.MeshStandardMaterial({
    color: 0x76746b,
    roughness: 0.85,
    metalness: 0.0,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc29b45,
    roughness: 0.65,
    metalness: 0.08,
  });

  // Helper to create a wavy curtain panel
  function createPanel(xStart, width, phaseOffset, name) {
    const steps = 48;
    const freq = (Math.PI * 2 * 4.5) / width;
    const shape = new THREE.Shape();

    const getZ = (t) => {
      const wave = 0.5 * (1 + Math.sin(t * width * freq + phaseOffset));
      return wave * FOLD_D;
    };

    // Front profile (in shape -Y so after -PI/2 X-rotation it becomes +Z)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = xStart + t * width;
      const yShape = -(getZ(t) + THICK);
      if (i === 0) shape.moveTo(x, yShape);
      else shape.lineTo(x, yShape);
    }

    // Back profile
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = xStart + t * width;
      const yShape = -getZ(t);
      shape.lineTo(x, yShape);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: H,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, fabricMat);
    mesh.position.z = Z_CENTER_OFFSET;
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Left and right panels
  const leftPanelX = -GAP_W / 2 - PANEL_W;
  const rightPanelX = GAP_W / 2;
  group.add(createPanel(leftPanelX, PANEL_W, 0.4, 'panel_left'));
  group.add(createPanel(rightPanelX, PANEL_W, 0.4, 'panel_right'));

  // Curtain rod
  const rodLen = W + 0.02;
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, rodLen, 20);
  rodGeo.rotateZ(Math.PI / 2);
  const rodMesh = new THREE.Mesh(rodGeo, rodMat);
  rodMesh.position.set(0, ROD_Y, Z_CENTER_OFFSET + D * 0.45);
  rodMesh.name = 'curtain_rod';
  rodMesh.castShadow = true;
  rodMesh.receiveShadow = true;
  group.add(rodMesh);

  // Rod end caps
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_L, 20);
  capGeo.rotateZ(Math.PI / 2);

  const capLeft = new THREE.Mesh(capGeo, rodMat);
  capLeft.position.set(-rodLen / 2 - CAP_L / 2, ROD_Y, Z_CENTER_OFFSET + D * 0.45);
  capLeft.name = 'rod_cap_left';
  capLeft.castShadow = true;
  capLeft.receiveShadow = true;
  group.add(capLeft);

  const capRight = new THREE.Mesh(capGeo, rodMat);
  capRight.position.set(rodLen / 2 + CAP_L / 2, ROD_Y, Z_CENTER_OFFSET + D * 0.45);
  capRight.name = 'rod_cap_right';
  capRight.castShadow = true;
  capRight.receiveShadow = true;
  group.add(capRight);

  // Helper to get front Z surface of a panel at a given X
  function getPanelFrontZ(panelXStart, width, phaseOffset, x) {
    const t = (x - panelXStart) / width;
    const freq = (Math.PI * 2 * 4.5) / width;
    const wave = 0.5 * (1 + Math.sin(t * width * freq + phaseOffset));
    return Z_CENTER_OFFSET + wave * FOLD_D + THICK;
  }

  // Decorative "Dusk Portal" motifs (purple arches, grey mounds, gold ribbons/crescents)
  const archW = 0.075;
  const archH = 0.14;
  const archTubeR = 0.008;

  function addPortalMotif(x, y, z, idx) {
    // Purple arch
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-archW / 2, 0, 0),
      new THREE.Vector3(-archW / 2, archH * 0.68, 0),
      new THREE.Vector3(-archW * 0.3, archH, 0),
      new THREE.Vector3(0, archH * 1.05, 0),
      new THREE.Vector3(archW * 0.3, archH, 0),
      new THREE.Vector3(archW / 2, archH * 0.68, 0),
      new THREE.Vector3(archW / 2, 0, 0),
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 20, archTubeR, 8, false);
    archGeo.scale(1, 1, 0.35);
    const archMesh = new THREE.Mesh(archGeo, purpleMat);
    archMesh.position.set(x, y, z);
    archMesh.name = `portal_arch_${idx}`;
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    group.add(archMesh);

    // Grey mound base
    const moundGeo = new THREE.SphereGeometry(0.065, 16, 12);
    moundGeo.scale(1.15, 0.32, 0.12);
    const moundMesh = new THREE.Mesh(moundGeo, moundMat);
    moundMesh.position.set(x, y - 0.005, z);
    moundMesh.name = `portal_mound_${idx}`;
    moundMesh.castShadow = true;
    moundMesh.receiveShadow = true;
    group.add(moundMesh);
  }

  const motifPositions = [
    { panel: 'left', x: leftPanelX + 0.18, y: 1.42 },
    { panel: 'left', x: leftPanelX + 0.44, y: 1.18 },
    { panel: 'left', x: leftPanelX + 0.16, y: 0.78 },
    { panel: 'left', x: leftPanelX + 0.42, y: 0.45 },
    { panel: 'right', x: rightPanelX + 0.18, y: 1.42 },
    { panel: 'right', x: rightPanelX + 0.44, y: 1.18 },
    { panel: 'right', x: rightPanelX + 0.16, y: 0.78 },
    { panel: 'right', x: rightPanelX + 0.42, y: 0.45 },
  ];

  motifPositions.forEach((m, i) => {
    const pStart = m.panel === 'left' ? leftPanelX : rightPanelX;
    const z = getPanelFrontZ(pStart, PANEL_W, 0.4, m.x);
    addPortalMotif(m.x, m.y, z, i + 1);
  });

  // Gold wavy ribbons
  const ribbonPositions = [
    { panel: 'left', x: leftPanelX + 0.28, y: 0.92 },
    { panel: 'left', x: leftPanelX + 0.30, y: 0.32 },
    { panel: 'right', x: rightPanelX + 0.28, y: 0.92 },
    { panel: 'right', x: rightPanelX + 0.30, y: 0.32 },
  ];

  ribbonPositions.forEach((r, i) => {
    const pStart = r.panel === 'left' ? leftPanelX : rightPanelX;
    const z = getPanelFrontZ(pStart, PANEL_W, 0.4, r.x);
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.09, 0),
      new THREE.Vector3(0.025, -0.03, 0),
      new THREE.Vector3(-0.02, 0.03, 0),
      new THREE.Vector3(0.02, 0.09, 0),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 16, 0.005, 6, false);
    ribbonGeo.scale(1, 1, 0.35);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, goldMat);
    ribbonMesh.position.set(r.x, r.y, z);
    ribbonMesh.name = `gold_ribbon_${i + 1}`;
    ribbonMesh.castShadow = true;
    ribbonMesh.receiveShadow = true;
    group.add(ribbonMesh);
  });

  return group;
}
