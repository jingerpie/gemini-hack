function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.83;           // Exact overall height (183 cm)
  const PANEL_W = 1.36;     // Curtain panel width
  const ROD_W = 1.56;       // Wooden rod width
  const ROD_R = 0.016;      // Wooden rod radius
  const TAB_THICK = 0.004;  // Tab fabric thickness
  const TAB_W = 0.048;      // Tab width
  const TAB_COUNT = 8;      // Number of tabs
  const TAB_DROP = 0.055;   // Distance from rod bottom to panel top
  const HEM_H = 0.075;      // Bottom hem height
  const PANEL_THICK = 0.007;
  const WAVE_AMP = 0.022;
  const WAVE_COUNT = 7.5;

  const ROD_Y = H - ROD_R - TAB_THICK;
  const PANEL_TOP_Y = ROD_Y - ROD_R - TAB_DROP;
  const PANEL_H = PANEL_TOP_Y;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xddd4c3,
    roughness: 0.92,
    metalness: 0.0
  });

  const hemMat = new THREE.MeshStandardMaterial({
    color: 0xd6ccb9,
    roughness: 0.94,
    metalness: 0.0
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7a4e2d,
    roughness: 0.62,
    metalness: 0.04
  });

  // 1. Wooden Rod
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 24);
  rodGeo.rotateZ(Math.PI / 2);
  const rodMesh = new THREE.Mesh(rodGeo, woodMat);
  rodMesh.position.set(0, ROD_Y, 0);
  rodMesh.name = 'curtain_rod';
  rodMesh.castShadow = true;
  rodMesh.receiveShadow = true;
  group.add(rodMesh);

  // Helper to create wavy curtain shape in X-Z (mapped to X-Y in 2D shape)
  function createWavyShape(width, thickness, amp, waves, segments) {
    const shape = new THREE.Shape();
    const halfW = width / 2;
    const halfT = thickness / 2;

    // Front edge (left to right)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfW + t * width;
      const z = Math.sin(t * Math.PI * 2 * waves) * amp;
      if (i === 0) {
        shape.moveTo(x, z + halfT);
      } else {
        shape.lineTo(x, z + halfT);
      }
    }

    // Back edge (right to left)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = -halfW + t * width;
      const z = Math.sin(t * Math.PI * 2 * waves) * amp;
      shape.lineTo(x, z - halfT);
    }

    shape.closePath();
    return shape;
  }

  // 2. Main Curtain Panel
  const panelShape = createWavyShape(PANEL_W, PANEL_THICK, WAVE_AMP, WAVE_COUNT, 96);
  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: PANEL_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  panelGeo.rotateX(-Math.PI / 2);
  const panelMesh = new THREE.Mesh(panelGeo, linenMat);
  panelMesh.position.set(0, 0, 0);
  panelMesh.name = 'curtain_panel';
  panelMesh.castShadow = true;
  panelMesh.receiveShadow = true;
  group.add(panelMesh);

  // 3. Bottom Hem Band
  const hemShape = createWavyShape(PANEL_W, PANEL_THICK + 0.003, WAVE_AMP, WAVE_COUNT, 96);
  const hemGeo = new THREE.ExtrudeGeometry(hemShape, {
    depth: HEM_H,
    bevelEnabled: false,
    curveSegments: 12
  });
  hemGeo.rotateX(-Math.PI / 2);
  const hemMesh = new THREE.Mesh(hemGeo, hemMat);
  hemMesh.position.set(0, 0, 0);
  hemMesh.name = 'curtain_hem';
  hemMesh.castShadow = true;
  hemMesh.receiveShadow = true;
  group.add(hemMesh);

  // 4. Tab Top Loops (8 tabs)
  const tabLoopShape = new THREE.Shape();
  const outerR = ROD_R + TAB_THICK;
  const innerR = ROD_R;
  const dropY = -(ROD_R + TAB_DROP + 0.005);

  // Outer profile of tab loop
  tabLoopShape.moveTo(-outerR, dropY);
  tabLoopShape.lineTo(-outerR, 0);
  tabLoopShape.absarc(0, 0, outerR, Math.PI, 0, true);
  tabLoopShape.lineTo(outerR, dropY);
  tabLoopShape.lineTo(innerR, dropY);
  tabLoopShape.lineTo(innerR, 0);
  tabLoopShape.absarc(0, 0, innerR, 0, Math.PI, false);
  tabLoopShape.lineTo(-innerR, dropY);
  tabLoopShape.closePath();

  const tabLoopGeo = new THREE.ExtrudeGeometry(tabLoopShape, {
    depth: TAB_W,
    bevelEnabled: false,
    curveSegments: 16
  });
  // Center extrusion along X, with loop in Y-Z plane
  tabLoopGeo.translate(0, 0, -TAB_W / 2);
  tabLoopGeo.rotateY(Math.PI / 2);

  const tabBaseGeo = new THREE.BoxGeometry(TAB_W, 0.038, TAB_THICK + 0.002);

  const tabSpan = PANEL_W - TAB_W;
  for (let i = 0; i < TAB_COUNT; i++) {
    const t = i / (TAB_COUNT - 1);
    const xPos = -tabSpan / 2 + t * tabSpan;
    const waveZ = Math.sin(((xPos + PANEL_W / 2) / PANEL_W) * Math.PI * 2 * WAVE_COUNT) * WAVE_AMP;

    const tabMesh = new THREE.Mesh(tabLoopGeo, linenMat);
    tabMesh.position.set(xPos, ROD_Y, 0);
    tabMesh.name = `tab_loop_${i + 1}`;
    tabMesh.castShadow = true;
    tabMesh.receiveShadow = true;
    group.add(tabMesh);

    const baseMesh = new THREE.Mesh(tabBaseGeo, hemMat);
    baseMesh.position.set(xPos, PANEL_TOP_Y - 0.019, waveZ + PANEL_THICK / 2);
    baseMesh.name = `tab_base_${i + 1}`;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);
  }

  return group;
}
