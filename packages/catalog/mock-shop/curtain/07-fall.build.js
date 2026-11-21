function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 2.20;          // Exact listing length: 220 cm
  const PANEL_W = 0.65;
  const GAP = 0.10;
  const W = PANEL_W * 2 + GAP; // 1.40 m total width
  const D = 0.08;          // Total depth (back at z = -D/2, front at z = +D/2)

  const HEADER_H = 0.11;   // Pinch-pleat header height
  const HEM_H = 0.08;      // Bottom hem height
  const BODY_H = H - HEADER_H;
  const PLEATS = 7;        // Number of pleats per panel
  const FABRIC_T = 0.012;  // Base fabric thickness
  const WAVE_AMP = D - FABRIC_T;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xebe5d8,
    roughness: 0.9,
    metalness: 0.0
  });

  const headerMat = new THREE.MeshStandardMaterial({
    color: 0xe5dfd1,
    roughness: 0.88,
    metalness: 0.0
  });

  const trackMat = new THREE.MeshStandardMaterial({
    color: 0xd0cbc0,
    roughness: 0.45,
    metalness: 0.5
  });

  // Helper to create a wavy curtain panel profile in XY (extruded along +Z, then rotated -90 deg X)
  function createWavyShape(width, pleats, amp, thickness) {
    const shape = new THREE.Shape();
    const halfW = width / 2;
    const backY = D / 2; // Maps to z = -D / 2 after rotation.x = -Math.PI / 2

    shape.moveTo(-halfW, backY);
    shape.lineTo(halfW, backY);

    const steps = pleats * 10;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = -halfW + t * width;
      const wave = 0.5 + 0.5 * Math.cos(t * pleats * Math.PI * 2);
      const frontY = backY - (thickness + amp * wave);
      shape.lineTo(x, frontY);
    }
    shape.closePath();
    return shape;
  }

  const bodyShape = createWavyShape(PANEL_W, PLEATS, WAVE_AMP, FABRIC_T);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  bodyGeo.rotateX(-Math.PI / 2);

  const hemShape = createWavyShape(PANEL_W, PLEATS, WAVE_AMP * 0.96, FABRIC_T + 0.002);
  const hemGeo = new THREE.ExtrudeGeometry(hemShape, {
    depth: HEM_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  hemGeo.rotateX(-Math.PI / 2);

  const headerGeo = new THREE.BoxGeometry(PANEL_W, HEADER_H, FABRIC_T * 1.4);
  const pleatGeo = new THREE.CylinderGeometry(0.011, 0.018, HEADER_H * 0.92, 10);

  const panelOffsets = [-(PANEL_W / 2 + GAP / 2), PANEL_W / 2 + GAP / 2];
  const panelNames = ['left', 'right'];

  panelOffsets.forEach((px, idx) => {
    const side = panelNames[idx];

    // Main draped body (y = 0 to BODY_H)
    const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
    bodyMesh.position.set(px, 0, 0);
    bodyMesh.name = `curtain_body_${side}`;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Subtle bottom hem
    const hemMesh = new THREE.Mesh(hemGeo, headerMat);
    hemMesh.position.set(px, 0, 0);
    hemMesh.name = `curtain_hem_${side}`;
    hemMesh.castShadow = true;
    hemMesh.receiveShadow = true;
    group.add(hemMesh);

    // Flat-backed header band at top (y = BODY_H to H)
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(px, BODY_H + HEADER_H / 2, -D / 2 + (FABRIC_T * 1.4) / 2);
    headerMesh.name = `curtain_header_${side}`;
    headerMesh.castShadow = true;
    headerMesh.receiveShadow = true;
    group.add(headerMesh);

    // Pinch pleats along the header
    for (let p = 0; p < PLEATS; p++) {
      const t = (p + 0.5) / PLEATS;
      const pleatX = px - PANEL_W / 2 + t * PANEL_W;
      const pleatMesh = new THREE.Mesh(pleatGeo, fabricMat);
      pleatMesh.position.set(pleatX, BODY_H + HEADER_H / 2, -D / 2 + FABRIC_T * 1.8);
      pleatMesh.name = `pinch_pleat_${side}_${p + 1}`;
      pleatMesh.castShadow = true;
      pleatMesh.receiveShadow = true;
      group.add(pleatMesh);
    }
  });

  // Concealed top mounting track behind the header
  const trackGeo = new THREE.BoxGeometry(W, 0.02, 0.015);
  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.position.set(0, H - 0.015, -D / 2 + 0.0075);
  trackMesh.name = 'curtain_track';
  trackMesh.castShadow = true;
  trackMesh.receiveShadow = true;
  group.add(trackMesh);

  return group;
}
