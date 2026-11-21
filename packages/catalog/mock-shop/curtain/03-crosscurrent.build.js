function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.40;
  const H = 2.20;
  const D = 0.07;

  const FINIAL_R = 0.014;
  const FINIAL_LEN = 0.025;
  const ROD_R = 0.009;
  const ROD_W = W - FINIAL_LEN * 2;
  const ROD_Y = H - 0.035;
  const ROD_Z = -D / 2 + ROD_R + 0.008;

  const PANEL_GAP = 0.07;
  const PANEL_W = (W - FINIAL_LEN * 2 - 0.04 - PANEL_GAP) / 2;
  const PANEL_H = H - 0.015;
  const PANEL_BACK_Z = -D / 2;
  const FOLD_AMP = 0.016;
  const FOLD_FREQ = 5; // number of pleats per panel

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x5d1f3c,
    roughness: 0.88,
    metalness: 0.02,
  });

  const patternMat = new THREE.MeshStandardMaterial({
    color: 0xdcc7cc,
    roughness: 0.82,
    metalness: 0.02,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8b8b2,
    roughness: 0.35,
    metalness: 0.85,
  });

  // Helper to compute curtain Z at local x in [0, PANEL_W]
  function getFoldZ(localX) {
    const t = localX / PANEL_W;
    return PANEL_BACK_Z + 0.028 + FOLD_AMP * Math.sin(t * Math.PI * 2 * FOLD_FREQ);
  }

  // Build pleated panel geometry
  function createPanelGeometry() {
    const shape = new THREE.Shape();
    const steps = 48;
    const thickness = 0.008;

    // Front wavy edge (left to right)
    for (let i = 0; i <= steps; i++) {
      const lx = (i / steps) * PANEL_W;
      const lz = getFoldZ(lx) + thickness * 0.5;
      if (i === 0) shape.moveTo(lx, lz);
      else shape.lineTo(lx, lz);
    }
    // Back wavy edge (right to left)
    for (let i = steps; i >= 0; i--) {
      const lx = (i / steps) * PANEL_W;
      const lz = getFoldZ(lx) - thickness * 0.5;
      shape.lineTo(lx, lz);
    }
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: PANEL_H,
      bevelEnabled: false,
      curveSegments: 1,
    });
    // ExtrudeGeometry extrudes along +Z; rotate -90 deg around X so it extrudes along +Y
    geom.rotateX(-Math.PI / 2);
    return geom;
  }

  // Curtain rod
  const rodGeom = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 20);
  rodGeom.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeom, metalMat);
  rod.name = 'curtain_rod';
  rod.position.set(0, ROD_Y, ROD_Z);
  rod.castShadow = true;
  rod.receiveShadow = true;
  group.add(rod);

  // Finials
  const finialGeom = new THREE.CylinderGeometry(FINIAL_R, FINIAL_R, FINIAL_LEN, 20);
  finialGeom.rotateZ(Math.PI / 2);

  const finialLeft = new THREE.Mesh(finialGeom, metalMat);
  finialLeft.name = 'finial_left';
  finialLeft.position.set(-W / 2 + FINIAL_LEN / 2, ROD_Y, ROD_Z);
  finialLeft.castShadow = true;
  finialLeft.receiveShadow = true;
  group.add(finialLeft);

  const finialRight = new THREE.Mesh(finialGeom, metalMat);
  finialRight.name = 'finial_right';
  finialRight.position.set(W / 2 - FINIAL_LEN / 2, ROD_Y, ROD_Z);
  finialRight.castShadow = true;
  finialRight.receiveShadow = true;
  group.add(finialRight);

  // Wall brackets
  const bracketLen = ROD_Z - PANEL_BACK_Z;
  const bracketGeom = new THREE.CylinderGeometry(0.006, 0.006, bracketLen, 12);
  bracketGeom.rotateX(Math.PI / 2);

  const bracketLeft = new THREE.Mesh(bracketGeom, metalMat);
  bracketLeft.name = 'bracket_left';
  bracketLeft.position.set(-W / 2 + FINIAL_LEN + 0.02, ROD_Y, PANEL_BACK_Z + bracketLen / 2);
  bracketLeft.castShadow = true;
  bracketLeft.receiveShadow = true;
  group.add(bracketLeft);

  const bracketRight = new THREE.Mesh(bracketGeom, metalMat);
  bracketRight.name = 'bracket_right';
  bracketRight.position.set(W / 2 - FINIAL_LEN - 0.02, ROD_Y, PANEL_BACK_Z + bracketLen / 2);
  bracketRight.castShadow = true;
  bracketRight.receiveShadow = true;
  group.add(bracketRight);

  // Panels
  const panelGeom = createPanelGeometry();
  const leftPanelX = -PANEL_GAP / 2 - PANEL_W;
  const rightPanelX = PANEL_GAP / 2;

  const panelLeft = new THREE.Mesh(panelGeom, fabricMat);
  panelLeft.name = 'panel_left';
  panelLeft.position.set(leftPanelX, 0, 0);
  panelLeft.castShadow = true;
  panelLeft.receiveShadow = true;
  group.add(panelLeft);

  const panelRight = new THREE.Mesh(panelGeom, fabricMat);
  panelRight.name = 'panel_right';
  panelRight.position.set(rightPanelX, 0, 0);
  panelRight.castShadow = true;
  panelRight.receiveShadow = true;
  group.add(panelRight);

  // Crosscurrent intersecting ribbon pattern on each panel
  function addPanelRibbons(panelX, sideName) {
    const ribbonConfigs = [
      // Sweeping S-curves from top-left to bottom-right
      { p0: [0.18, 0.98], p1: [0.35, 0.72], p2: [0.68, 0.45], p3: [0.85, 0.02], offsets: [-0.035, 0, 0.035] },
      // Sweeping S-curves from top-right to bottom-left
      { p0: [0.82, 0.98], p1: [0.65, 0.70], p2: [0.32, 0.42], p3: [0.15, 0.02], offsets: [-0.035, 0, 0.035] },
    ];

    let idx = 0;
    for (const cfg of ribbonConfigs) {
      for (const off of cfg.offsets) {
        const pts = [];
        const samples = 18;
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          // Cubic Bezier interpolation
          const u = 1 - t;
          const nx =
            u * u * u * cfg.p0[0] +
            3 * u * u * t * cfg.p1[0] +
            3 * u * t * t * cfg.p2[0] +
            t * t * t * cfg.p3[0] +
            off;
          const ny =
            u * u * u * cfg.p0[1] +
            3 * u * u * t * cfg.p1[1] +
            3 * u * t * t * cfg.p2[1] +
            t * t * t * cfg.p3[1];

          const clampedX = Math.max(0.02, Math.min(0.98, nx)) * PANEL_W;
          const py = ny * PANEL_H;
          const pz = getFoldZ(clampedX) + 0.005;
          pts.push(new THREE.Vector3(panelX + clampedX, py, pz));
        }

        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeom = new THREE.TubeGeometry(curve, 24, 0.0055, 6, false);
        const ribbon = new THREE.Mesh(tubeGeom, patternMat);
        ribbon.name = `ribbon_${sideName}_${idx++}`;
        ribbon.castShadow = true;
        ribbon.receiveShadow = true;
        group.add(ribbon);
      }
    }
  }

  addPanelRibbons(leftPanelX, 'left');
  addPanelRibbons(rightPanelX, 'right');

  return group;
}
