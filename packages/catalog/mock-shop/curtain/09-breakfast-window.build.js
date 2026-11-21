function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const W = 1.22; // 48 in total width
  const H = 0.61; // 24 in total height
  const FOLD_AMP = 0.016;
  const FABRIC_T = 0.004;
  const D = 2 * FOLD_AMP + FABRIC_T;

  const FINIAL_R = 0.011;
  const FINIAL_L = 0.022;
  const ROD_R = 0.007;
  const ROD_LEN = W - 2 * FINIAL_L;
  const ROD_Y = H - FINIAL_R - 0.004;

  const CENTER_GAP = 0.032;
  const END_MARGIN = 0.024;
  const PANEL_W = (ROD_LEN - 2 * END_MARGIN - CENTER_GAP) / 2;
  const PANEL_H = H;
  const POCKET_H = 0.038;
  const HEM_H = 0.035;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9c9286,
    roughness: 0.88,
    metalness: 0.0
  });

  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xa8a9ad,
    roughness: 0.35,
    metalness: 0.85
  });

  // Helper to create a wavy curtain panel shape in XZ
  function createWavyShape(width, amp, thickness, waves) {
    const shape = new THREE.Shape();
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -width / 2 + t * width;
      const z = Math.sin(t * waves * Math.PI * 2) * amp;
      if (i === 0) shape.moveTo(x, z + thickness / 2);
      else shape.lineTo(x, z + thickness / 2);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = -width / 2 + t * width;
      const z = Math.sin(t * waves * Math.PI * 2) * amp;
      shape.lineTo(x, z - thickness / 2);
    }
    shape.closePath();
    return shape;
  }

  // 1. Curtain Rod
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_LEN, 20);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.name = 'curtain_rod';
  rod.position.set(0, ROD_Y, 0);
  group.add(rod);

  // 2. Finials & Collar Rings
  const finialGeo = new THREE.CylinderGeometry(FINIAL_R, FINIAL_R, FINIAL_L, 20);
  finialGeo.rotateZ(Math.PI / 2);
  const ringGeo = new THREE.CylinderGeometry(FINIAL_R * 0.85, FINIAL_R * 0.85, 0.004, 20);
  ringGeo.rotateZ(Math.PI / 2);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const finial = new THREE.Mesh(finialGeo, rodMat);
    finial.name = `finial_${label}`;
    finial.position.set(side * (W / 2 - FINIAL_L / 2), ROD_Y, 0);
    group.add(finial);

    const ring = new THREE.Mesh(ringGeo, rodMat);
    ring.name = `finial_ring_${label}`;
    ring.position.set(side * (W / 2 - FINIAL_L - 0.002), ROD_Y, 0);
    group.add(ring);
  });

  // 3. Wall Mount Brackets (at back plane z = -D/2)
  const bracketDepth = D / 2;
  const bracketGeo = new THREE.BoxGeometry(0.012, 0.024, bracketDepth);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const bracket = new THREE.Mesh(bracketGeo, rodMat);
    bracket.name = `bracket_${label}`;
    bracket.position.set(side * (ROD_LEN / 2 - END_MARGIN * 0.5), ROD_Y, -bracketDepth / 2);
    group.add(bracket);
  });

  // 4. Curtain Panels (Left & Right)
  const panelShape = createWavyShape(PANEL_W, FOLD_AMP, FABRIC_T, 6.5);
  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: PANEL_H,
    bevelEnabled: false,
    steps: 1
  });
  panelGeo.rotateX(-Math.PI / 2);

  const pocketShape = createWavyShape(PANEL_W, FOLD_AMP * 0.9, FABRIC_T * 2.2, 6.5);
  const pocketGeo = new THREE.ExtrudeGeometry(pocketShape, {
    depth: POCKET_H,
    bevelEnabled: false,
    steps: 1
  });
  pocketGeo.rotateX(-Math.PI / 2);

  const hemShape = createWavyShape(PANEL_W, FOLD_AMP, FABRIC_T * 1.5, 6.5);
  const hemGeo = new THREE.ExtrudeGeometry(hemShape, {
    depth: HEM_H,
    bevelEnabled: false,
    steps: 1
  });
  hemGeo.rotateX(-Math.PI / 2);

  const sideHemGeo = new THREE.BoxGeometry(0.012, PANEL_H, FABRIC_T * 1.5);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const panelX = side * (CENTER_GAP / 2 + PANEL_W / 2);

    const panel = new THREE.Mesh(panelGeo, fabricMat);
    panel.name = `panel_${label}`;
    panel.position.set(panelX, 0, 0);
    group.add(panel);

    const pocket = new THREE.Mesh(pocketGeo, fabricMat);
    pocket.name = `rod_pocket_${label}`;
    pocket.position.set(panelX, PANEL_H - POCKET_H, 0);
    group.add(pocket);

    const hem = new THREE.Mesh(hemGeo, fabricMat);
    hem.name = `hem_${label}`;
    hem.position.set(panelX, 0, 0);
    group.add(hem);

    const outerHem = new THREE.Mesh(sideHemGeo, fabricMat);
    outerHem.name = `side_hem_${label}_outer`;
    outerHem.position.set(panelX + side * (PANEL_W / 2 - 0.006), PANEL_H / 2, 0);
    group.add(outerHem);

    const innerHem = new THREE.Mesh(sideHemGeo, fabricMat);
    innerHem.name = `side_hem_${label}_inner`;
    innerHem.position.set(panelX - side * (PANEL_W / 2 - 0.006), PANEL_H / 2, 0);
    group.add(innerHem);
  });

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
