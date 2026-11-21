function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 1.60; // Exact height required (63 in)
  const W = 1.40;
  const D = 0.06;
  const GAP = 0.06;
  const PANEL_W = (W - GAP) / 2; // 0.67 m
  const BORDER_W = 0.055;
  const HEM_H = 0.035;
  const HEADER_H = 0.075;
  const ROD_R = 0.011;
  const FINIAL_R = 0.018;
  const FINIAL_L = 0.03;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xcab698,
    roughness: 0.88,
    metalness: 0.0,
  });

  const borderBaseMat = new THREE.MeshStandardMaterial({
    color: 0xd8cbb4,
    roughness: 0.85,
    metalness: 0.0,
  });

  const navyTrimMat = new THREE.MeshStandardMaterial({
    color: 0x2a3b47,
    roughness: 0.78,
    metalness: 0.0,
  });

  const rustAccentMat = new THREE.MeshStandardMaterial({
    color: 0x8c4a2f,
    roughness: 0.8,
    metalness: 0.0,
  });

  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x3b3530,
    roughness: 0.45,
    metalness: 0.65,
  });

  // Helper to create a wavy curtain panel shape in XZ (extruded along Y)
  function createWavyPanelGeometry(width, height, depth, waves) {
    const shape = new THREE.Shape();
    const segs = 48;
    const halfW = width / 2;
    const thickness = 0.012;
    const amp = (depth - thickness) / 2;

    // Front wavy edge (left to right)
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -halfW + t * width;
      const z = amp * Math.sin(t * Math.PI * 2 * waves) + thickness / 2;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }

    // Back wavy edge (right to left)
    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const x = -halfW + t * width;
      const z = amp * Math.sin(t * Math.PI * 2 * waves) - thickness / 2;
      shape.lineTo(x, z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 1,
    });
    // Rotate so extrusion is along +Y (from y = 0 to y = height)
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  const panelGeo = createWavyPanelGeometry(PANEL_W, H, D, 5.5);
  const headerGeo = new THREE.BoxGeometry(PANEL_W, HEADER_H, D * 0.88);
  const hemGeo = new THREE.BoxGeometry(PANEL_W, HEM_H, D * 0.85);
  const borderBaseGeo = new THREE.BoxGeometry(BORDER_W, H - 0.004, 0.014);
  const borderLineGeo = new THREE.BoxGeometry(0.005, H - 0.004, 0.016);
  const diamondOuterGeo = new THREE.BoxGeometry(0.022, 0.022, 0.017);
  const diamondInnerGeo = new THREE.BoxGeometry(0.01, 0.01, 0.018);

  const diamondCount = 11;
  const diamondStep = (H - HEADER_H - HEM_H - 0.08) / (diamondCount - 1);
  const diamondStartY = HEM_H + 0.04;

  const sides = [
    { name: 'left', sign: -1 },
    { name: 'right', sign: 1 },
  ];

  sides.forEach(({ name, sign }) => {
    const panelX = sign * (PANEL_W / 2 + GAP / 2);

    // Main wavy panel
    const panel = new THREE.Mesh(panelGeo, linenMat);
    panel.name = `${name}_curtain_panel`;
    panel.position.set(panelX, 0, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    // Top gathered header band
    const header = new THREE.Mesh(headerGeo, linenMat);
    header.name = `${name}_curtain_header`;
    header.position.set(panelX, H - HEADER_H / 2, 0);
    header.castShadow = true;
    header.receiveShadow = true;
    group.add(header);

    // Bottom hem
    const hem = new THREE.Mesh(hemGeo, linenMat);
    hem.name = `${name}_curtain_hem`;
    hem.position.set(panelX, HEM_H / 2, 0);
    hem.castShadow = true;
    hem.receiveShadow = true;
    group.add(hem);

    // Inner decorative border strip
    const innerEdgeX = panelX - sign * (PANEL_W / 2 - BORDER_W / 2 - 0.015);
    const borderZ = D / 2 - 0.007;

    const borderBase = new THREE.Mesh(borderBaseGeo, borderBaseMat);
    borderBase.name = `${name}_border_strip`;
    borderBase.position.set(innerEdgeX, H / 2, borderZ);
    borderBase.castShadow = true;
    borderBase.receiveShadow = true;
    group.add(borderBase);

    // Two thin navy vertical lines flanking the border
    const line1 = new THREE.Mesh(borderLineGeo, navyTrimMat);
    line1.name = `${name}_border_line_outer`;
    line1.position.set(innerEdgeX - BORDER_W / 2 + 0.004, H / 2, borderZ);
    line1.castShadow = true;
    line1.receiveShadow = true;
    group.add(line1);

    const line2 = new THREE.Mesh(borderLineGeo, navyTrimMat);
    line2.name = `${name}_border_line_inner`;
    line2.position.set(innerEdgeX + BORDER_W / 2 - 0.004, H / 2, borderZ);
    line2.castShadow = true;
    line2.receiveShadow = true;
    group.add(line2);

    // Repeating diamond motifs along the border
    for (let i = 0; i < diamondCount; i++) {
      const dy = diamondStartY + i * diamondStep;
      const dOuter = new THREE.Mesh(diamondOuterGeo, navyTrimMat);
      dOuter.name = `${name}_border_diamond_outer_${i}`;
      dOuter.position.set(innerEdgeX, dy, borderZ);
      dOuter.rotation.z = Math.PI / 4;
      dOuter.castShadow = true;
      dOuter.receiveShadow = true;
      group.add(dOuter);

      const dInner = new THREE.Mesh(diamondInnerGeo, rustAccentMat);
      dInner.name = `${name}_border_diamond_inner_${i}`;
      dInner.position.set(innerEdgeX, dy, borderZ + 0.001);
      dInner.rotation.z = Math.PI / 4;
      dInner.castShadow = true;
      dInner.receiveShadow = true;
      group.add(dInner);
    }
  });

  // Subtle curtain rod inside the top pocket
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, W + 0.06, 16);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.name = 'curtain_rod';
  rod.position.set(0, H - HEADER_H / 2, 0);
  rod.castShadow = true;
  rod.receiveShadow = true;
  group.add(rod);

  // Rod finials
  const finialGeo = new THREE.SphereGeometry(FINIAL_R, 16, 12);
  const finialLeft = new THREE.Mesh(finialGeo, rodMat);
  finialLeft.name = 'curtain_rod_finial_left';
  finialLeft.position.set(-(W / 2 + 0.03 + FINIAL_L / 2), H - HEADER_H / 2, 0);
  finialLeft.castShadow = true;
  finialLeft.receiveShadow = true;
  group.add(finialLeft);

  const finialRight = new THREE.Mesh(finialGeo, rodMat);
  finialRight.name = 'curtain_rod_finial_right';
  finialRight.position.set(W / 2 + 0.03 + FINIAL_L / 2, H - HEADER_H / 2, 0);
  finialRight.castShadow = true;
  finialRight.receiveShadow = true;
  group.add(finialRight);

  return group;
}
