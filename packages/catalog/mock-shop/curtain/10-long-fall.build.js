function build(THREE) {
  const group = new THREE.Group();

  const H = 2.13;
  const W = 1.44;
  const D = 0.10;

  const ROD_R = 0.010;
  const RING_R = 0.015;
  const RING_TUBE = 0.0025;
  const ROD_Y = H - RING_R - RING_TUBE;
  const PANEL_H = ROD_Y - RING_R + 0.004;

  const PANEL_W = 0.62;
  const GAP_W = 0.10;
  const PLEATS = 6;
  const WAVE_AMP = 0.024;
  const FABRIC_THICK = 0.007;

  const Z_BACK = -D / 2;
  const Z_ROD = Z_BACK + 0.045;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9e9282,
    roughness: 0.92,
    metalness: 0.0
  });

  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xe6e4df,
    roughness: 0.35,
    metalness: 0.25
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd0cec8,
    roughness: 0.3,
    metalness: 0.6
  });

  function createCurtainPanel(width, height, pleats) {
    const shape = new THREE.Shape();
    const steps = pleats * 12;
    const frontPts = [];
    const backPts = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (t - 0.5) * width;
      const zCenter = Math.sin(t * pleats * Math.PI * 2) * WAVE_AMP;
      frontPts.push(new THREE.Vector2(x, zCenter + FABRIC_THICK / 2));
      backPts.push(new THREE.Vector2(x, zCenter - FABRIC_THICK / 2));
    }

    shape.moveTo(frontPts[0].x, frontPts[0].y);
    for (let i = 1; i < frontPts.length; i++) {
      shape.lineTo(frontPts[i].x, frontPts[i].y);
    }
    for (let i = backPts.length - 1; i >= 0; i--) {
      shape.lineTo(backPts[i].x, backPts[i].y);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 12
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  const leftPanelGeo = createCurtainPanel(PANEL_W, PANEL_H, PLEATS);
  const leftPanel = new THREE.Mesh(leftPanelGeo, fabricMat);
  leftPanel.name = 'left_curtain_panel';
  leftPanel.position.set(-(GAP_W / 2 + PANEL_W / 2), 0, Z_ROD);
  leftPanel.castShadow = true;
  leftPanel.receiveShadow = true;
  group.add(leftPanel);

  const rightPanelGeo = createCurtainPanel(PANEL_W, PANEL_H, PLEATS);
  const rightPanel = new THREE.Mesh(rightPanelGeo, fabricMat);
  rightPanel.name = 'right_curtain_panel';
  rightPanel.position.set(GAP_W / 2 + PANEL_W / 2, 0, Z_ROD);
  rightPanel.castShadow = true;
  rightPanel.receiveShadow = true;
  group.add(rightPanel);

  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, W, 16);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.name = 'curtain_rod';
  rod.position.set(0, ROD_Y, Z_ROD);
  rod.castShadow = true;
  rod.receiveShadow = true;
  group.add(rod);

  const finialGeo = new THREE.CylinderGeometry(ROD_R * 1.25, ROD_R * 1.25, 0.015, 16);
  finialGeo.rotateZ(Math.PI / 2);

  const leftFinial = new THREE.Mesh(finialGeo, rodMat);
  leftFinial.name = 'left_rod_finial';
  leftFinial.position.set(-W / 2, ROD_Y, Z_ROD);
  leftFinial.castShadow = true;
  leftFinial.receiveShadow = true;
  group.add(leftFinial);

  const rightFinial = new THREE.Mesh(finialGeo, rodMat);
  rightFinial.name = 'right_rod_finial';
  rightFinial.position.set(W / 2, ROD_Y, Z_ROD);
  rightFinial.castShadow = true;
  rightFinial.receiveShadow = true;
  group.add(rightFinial);

  const bracketDepth = Z_ROD - Z_BACK + ROD_R;
  const bracketGeo = new THREE.BoxGeometry(0.016, 0.024, bracketDepth);

  const leftBracket = new THREE.Mesh(bracketGeo, rodMat);
  leftBracket.name = 'left_wall_bracket';
  leftBracket.position.set(-W / 2 + 0.04, ROD_Y, Z_BACK + bracketDepth / 2);
  leftBracket.castShadow = true;
  leftBracket.receiveShadow = true;
  group.add(leftBracket);

  const rightBracket = new THREE.Mesh(bracketGeo, rodMat);
  rightBracket.name = 'right_wall_bracket';
  rightBracket.position.set(W / 2 - 0.04, ROD_Y, Z_BACK + bracketDepth / 2);
  rightBracket.castShadow = true;
  rightBracket.receiveShadow = true;
  group.add(rightBracket);

  const ringGeo = new THREE.TorusGeometry(RING_R, RING_TUBE, 8, 20);
  ringGeo.rotateY(Math.PI / 2);

  const panelCenters = [
    -(GAP_W / 2 + PANEL_W / 2),
    GAP_W / 2 + PANEL_W / 2
  ];
  const panelNames = ['left', 'right'];

  for (let p = 0; p < 2; p++) {
    const cx = panelCenters[p];
    for (let i = 0; i < PLEATS; i++) {
      const t = (i + 0.25) / PLEATS;
      const rx = cx + (t - 0.5) * PANEL_W;
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = `${panelNames[p]}_curtain_ring_${i + 1}`;
      ring.position.set(rx, ROD_Y, Z_ROD);
      ring.castShadow = true;
      ring.receiveShadow = true;
      group.add(ring);
    }
  }

  return group;
}
