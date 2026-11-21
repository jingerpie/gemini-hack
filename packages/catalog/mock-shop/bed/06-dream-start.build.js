function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const BED_W = 0.76;
  const BED_L = 1.46;
  const HEAD_H = 0.62;
  const PANEL_T = 0.022;
  const LEG_H = 0.11;
  const LEG_W = 0.085;
  const ARCH_DROP = 0.11;
  const RAIL_BOTTOM_Y = 0.11;
  const RAIL_LOW_Y = 0.23;
  const RAIL_HIGH_Y = 0.40;
  const SLAT_Y = 0.165;
  const SLAT_COUNT = 9;
  const SLAT_W = 0.065;
  const SLAT_T = 0.016;

  // Materials
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xebd98d,
    roughness: 0.55,
    metalness: 0.02
  });

  const plyEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd6b888,
    roughness: 0.65,
    metalness: 0.0
  });

  const slatWoodMat = new THREE.MeshStandardMaterial({
    color: 0xdfc092,
    roughness: 0.62,
    metalness: 0.0
  });

  const fastenerMat = new THREE.MeshStandardMaterial({
    color: 0xb89f74,
    roughness: 0.5,
    metalness: 0.2
  });

  const panelMaterials = [yellowMat, plyEdgeMat];

  // Helper to create Headboard / Footboard shape
  function createEndPanelGeometry() {
    const hw = BED_W / 2;
    const r = 0.035;
    const shape = new THREE.Shape();

    // Start at bottom-left leg outer corner
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw + LEG_W, 0);
    shape.lineTo(-hw + LEG_W, LEG_H - r);
    shape.quadraticCurveTo(-hw + LEG_W, LEG_H, -hw + LEG_W + r, LEG_H);
    shape.lineTo(hw - LEG_W - r, LEG_H);
    shape.quadraticCurveTo(hw - LEG_W, LEG_H, hw - LEG_W, LEG_H - r);
    shape.lineTo(hw - LEG_W, 0);
    shape.lineTo(hw, 0);

    // Right side up to arch start
    shape.lineTo(hw, HEAD_H - ARCH_DROP);
    // Gentle top arch
    shape.quadraticCurveTo(0, HEAD_H + 0.05, -hw, HEAD_H - ARCH_DROP);
    shape.lineTo(-hw, 0);

    const extrudeSettings = {
      depth: PANEL_T,
      bevelEnabled: false,
      curveSegments: 24
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -PANEL_T / 2);
    return geo;
  }

  const endPanelGeo = createEndPanelGeometry();

  // Headboard (-Z)
  const headboard = new THREE.Mesh(endPanelGeo, panelMaterials);
  headboard.name = 'headboard';
  headboard.position.set(0, 0, -BED_L / 2 + PANEL_T / 2);
  headboard.castShadow = true;
  headboard.receiveShadow = true;
  group.add(headboard);

  // Footboard (+Z)
  const footboard = new THREE.Mesh(endPanelGeo, panelMaterials);
  footboard.name = 'footboard';
  footboard.position.set(0, 0, BED_L / 2 - PANEL_T / 2);
  footboard.castShadow = true;
  footboard.receiveShadow = true;
  group.add(footboard);

  // Side Rail Geometry (shaped in XY, then rotated so X becomes Z)
  function createSideRailGeometry() {
    const railLen = BED_L - 2 * PANEL_T;
    const hl = railLen / 2;
    const shape = new THREE.Shape();

    // X in shape corresponds to Z in world (from -hl at headboard to +hl at footboard)
    shape.moveTo(-hl, RAIL_BOTTOM_Y);
    shape.lineTo(hl, RAIL_BOTTOM_Y);
    shape.lineTo(hl, RAIL_LOW_Y);

    // Low section from footboard (+hl) toward middle
    const transitionEnd = 0.04;
    const transitionStart = -0.10;
    shape.lineTo(transitionEnd, RAIL_LOW_Y);

    // Smooth S-curve up to guard rail height
    shape.bezierCurveTo(
      transitionEnd - 0.06, RAIL_LOW_Y,
      transitionStart + 0.06, RAIL_HIGH_Y,
      transitionStart, RAIL_HIGH_Y
    );

    // High guard rail section to headboard (-hl)
    shape.lineTo(-hl, RAIL_HIGH_Y);
    shape.lineTo(-hl, RAIL_BOTTOM_Y);

    const extrudeSettings = {
      depth: PANEL_T,
      bevelEnabled: false,
      curveSegments: 20
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -PANEL_T / 2);
    // Rotate -90 deg around Y so shape +X becomes world +Z
    geo.rotateY(-Math.PI / 2);
    return geo;
  }

  const sideRailGeo = createSideRailGeometry();

  // Left Side Rail (-X)
  const leftRail = new THREE.Mesh(sideRailGeo, panelMaterials);
  leftRail.name = 'left_side_rail';
  leftRail.position.set(-BED_W / 2 + PANEL_T / 2, 0, 0);
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;
  group.add(leftRail);

  // Right Side Rail (+X)
  const rightRail = new THREE.Mesh(sideRailGeo, panelMaterials);
  rightRail.name = 'right_side_rail';
  rightRail.position.set(BED_W / 2 - PANEL_T / 2, 0, 0);
  rightRail.castShadow = true;
  rightRail.receiveShadow = true;
  group.add(rightRail);

  // Inner Support Cleats
  const cleatLen = BED_L - 2 * PANEL_T;
  const cleatGeo = new THREE.BoxGeometry(0.022, 0.025, cleatLen);

  const leftCleat = new THREE.Mesh(cleatGeo, slatWoodMat);
  leftCleat.name = 'left_slat_cleat';
  leftCleat.position.set(-BED_W / 2 + PANEL_T + 0.011, SLAT_Y - SLAT_T / 2 - 0.0125, 0);
  leftCleat.castShadow = true;
  leftCleat.receiveShadow = true;
  group.add(leftCleat);

  const rightCleat = new THREE.Mesh(cleatGeo, slatWoodMat);
  rightCleat.name = 'right_slat_cleat';
  rightCleat.position.set(BED_W / 2 - PANEL_T - 0.011, SLAT_Y - SLAT_T / 2 - 0.0125, 0);
  rightCleat.castShadow = true;
  rightCleat.receiveShadow = true;
  group.add(rightCleat);

  // Bed Slats
  const slatLen = BED_W - 2 * PANEL_T - 0.004;
  const slatGeo = new THREE.BoxGeometry(slatLen, SLAT_T, SLAT_W);
  const usableL = BED_L - 2 * PANEL_T - 0.14;
  const startZ = -usableL / 2;
  const stepZ = usableL / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const slat = new THREE.Mesh(slatGeo, slatWoodMat);
    slat.name = `bed_slat_${i + 1}`;
    slat.position.set(0, SLAT_Y, startZ + i * stepZ);
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }

  // Fastener dots on outer faces of footboard and headboard
  const fastenerGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12);
  fastenerGeo.rotateX(Math.PI / 2);

  const fastenerHeights = [0.145, 0.18, 0.215];
  const fastenerX = BED_W / 2 - PANEL_T / 2;
  const endPositionsZ = [BED_L / 2 + 0.0005, -BED_L / 2 - 0.0005];

  endPositionsZ.forEach((zPos, endIdx) => {
    const endLabel = endIdx === 0 ? 'footboard' : 'headboard';
    [-1, 1].forEach((sideSign) => {
      const sideLabel = sideSign < 0 ? 'left' : 'right';
      fastenerHeights.forEach((yPos, fIdx) => {
        const fastener = new THREE.Mesh(fastenerGeo, fastenerMat);
        fastener.name = `${endLabel}_${sideLabel}_fastener_${fIdx + 1}`;
        fastener.position.set(sideSign * fastenerX, yPos, zPos);
        fastener.castShadow = true;
        fastener.receiveShadow = true;
        group.add(fastener);
      });
    });
  });

  return group;
}
