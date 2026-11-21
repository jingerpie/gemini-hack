function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 2.13;           // Exact overall height (84 in)
  const W = 1.40;           // Total curtain width
  const ROD_W = 1.56;       // Curtain rod width
  const PLEAT_AMP = 0.045;  // Half-depth of pleats (total depth = 0.09 m)
  const FABRIC_T = 0.008;   // Fabric thickness
  const ROD_R = 0.013;      // Rod radius
  const FINIAL_R = 0.022;   // Finial sphere radius
  const RING_R = 0.022;     // Curtain ring major radius
  const RING_TUBE = 0.004;  // Curtain ring tube radius
  const TRIM_W = 0.012;     // Gold edge trim width

  const ROD_Y = H - (RING_R + RING_TUBE);
  const PANEL_TOP_Y = ROD_Y - RING_R + 0.004;
  const PANEL_H = PANEL_TOP_Y;
  const BACK_Z = -PLEAT_AMP;

  // Materials
  const silkMat = new THREE.MeshPhysicalMaterial({
    color: 0x4e244c,
    roughness: 0.42,
    metalness: 0.06,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xb89456,
    roughness: 0.35,
    metalness: 0.72
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.28,
    metalness: 0.85
  });

  // Helper to create a wavy pleated curtain panel
  function createPanel(xStart, xEnd, pleatCount, name) {
    const width = xEnd - xStart;
    const steps = pleatCount * 16;
    const shape = new THREE.Shape();

    // Front wave
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = xStart + t * width;
      const z = Math.sin(t * pleatCount * Math.PI * 2) * (PLEAT_AMP - FABRIC_T * 0.5);
      if (i === 0) {
        shape.moveTo(x, z + FABRIC_T * 0.5);
      } else {
        shape.lineTo(x, z + FABRIC_T * 0.5);
      }
    }

    // Back wave (offset by fabric thickness)
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = xStart + t * width;
      const z = Math.sin(t * pleatCount * Math.PI * 2) * (PLEAT_AMP - FABRIC_T * 0.5);
      shape.lineTo(x, z - FABRIC_T * 0.5);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: PANEL_H,
      bevelEnabled: false,
      curveSegments: 8
    });
    // Rotate so extrusion goes up along +Y, and shape Z maps to +Z
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, silkMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const GAP = 0.006;
  const leftPanel = createPanel(-W / 2, -GAP / 2, 5, 'left_curtain_panel');
  group.add(leftPanel);

  const rightPanel = createPanel(GAP / 2, W / 2, 5, 'right_curtain_panel');
  group.add(rightPanel);

  // Outer vertical gold trim
  const sideTrimGeo = new THREE.BoxGeometry(TRIM_W, PANEL_H, FABRIC_T * 1.4);

  const leftTrim = new THREE.Mesh(sideTrimGeo, goldMat);
  leftTrim.position.set(-W / 2 + TRIM_W * 0.3, PANEL_H / 2, 0);
  leftTrim.name = 'left_gold_trim';
  leftTrim.castShadow = true;
  leftTrim.receiveShadow = true;
  group.add(leftTrim);

  const rightTrim = new THREE.Mesh(sideTrimGeo, goldMat);
  rightTrim.position.set(W / 2 - TRIM_W * 0.3, PANEL_H / 2, 0);
  rightTrim.name = 'right_gold_trim';
  rightTrim.castShadow = true;
  rightTrim.receiveShadow = true;
  group.add(rightTrim);

  // Bottom hem gold trim
  const hemW = W / 2 - GAP / 2;
  const hemGeo = new THREE.BoxGeometry(hemW, TRIM_W, PLEAT_AMP * 2);

  const leftHem = new THREE.Mesh(hemGeo, goldMat);
  leftHem.position.set(-W / 4 - GAP / 4, TRIM_W / 2, 0);
  leftHem.name = 'left_bottom_hem_trim';
  leftHem.castShadow = true;
  leftHem.receiveShadow = true;
  group.add(leftHem);

  const rightHem = new THREE.Mesh(hemGeo, goldMat);
  rightHem.position.set(W / 4 + GAP / 4, TRIM_W / 2, 0);
  rightHem.name = 'right_bottom_hem_trim';
  rightHem.castShadow = true;
  rightHem.receiveShadow = true;
  group.add(rightHem);

  // Curtain rod
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 24);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, brassMat);
  rod.position.set(0, ROD_Y, 0);
  rod.name = 'curtain_rod';
  rod.castShadow = true;
  rod.receiveShadow = true;
  group.add(rod);

  // Finials
  const finialGeo = new THREE.SphereGeometry(FINIAL_R, 20, 16);

  const leftFinial = new THREE.Mesh(finialGeo, brassMat);
  leftFinial.position.set(-ROD_W / 2, ROD_Y, 0);
  leftFinial.name = 'left_finial';
  leftFinial.castShadow = true;
  leftFinial.receiveShadow = true;
  group.add(leftFinial);

  const rightFinial = new THREE.Mesh(finialGeo, brassMat);
  rightFinial.position.set(ROD_W / 2, ROD_Y, 0);
  rightFinial.name = 'right_finial';
  rightFinial.castShadow = true;
  rightFinial.receiveShadow = true;
  group.add(rightFinial);

  // Wall brackets connecting rod to back plane
  const bracketLen = -BACK_Z;
  const bracketGeo = new THREE.CylinderGeometry(0.008, 0.008, bracketLen, 12);
  bracketGeo.rotateX(Math.PI / 2);

  const leftBracket = new THREE.Mesh(bracketGeo, brassMat);
  leftBracket.position.set(-W / 2 - 0.02, ROD_Y, BACK_Z / 2);
  leftBracket.name = 'left_rod_bracket';
  leftBracket.castShadow = true;
  leftBracket.receiveShadow = true;
  group.add(leftBracket);

  const rightBracket = new THREE.Mesh(bracketGeo, brassMat);
  rightBracket.position.set(W / 2 + 0.02, ROD_Y, BACK_Z / 2);
  rightBracket.name = 'right_rod_bracket';
  rightBracket.castShadow = true;
  rightBracket.receiveShadow = true;
  group.add(rightBracket);

  // Curtain rings
  const ringGeo = new THREE.TorusGeometry(RING_R, RING_TUBE, 10, 24);
  ringGeo.rotateY(Math.PI / 2);

  const ringsPerPanel = 6;
  for (let i = 0; i < ringsPerPanel; i++) {
    const t = i / (ringsPerPanel - 1);

    const lx = -W / 2 + 0.03 + t * (hemW - 0.06);
    const lRing = new THREE.Mesh(ringGeo, brassMat);
    lRing.position.set(lx, ROD_Y, 0);
    lRing.name = `left_curtain_ring_${i + 1}`;
    lRing.castShadow = true;
    lRing.receiveShadow = true;
    group.add(lRing);

    const rx = GAP / 2 + 0.03 + t * (hemW - 0.06);
    const rRing = new THREE.Mesh(ringGeo, brassMat);
    rRing.position.set(rx, ROD_Y, 0);
    rRing.name = `right_curtain_ring_${i + 1}`;
    rRing.castShadow = true;
    rRing.receiveShadow = true;
    group.add(rRing);
  }

  return group;
}
