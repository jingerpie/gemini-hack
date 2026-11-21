function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.70;           // Overall width along X
  const D = 0.55;           // Overall depth along Z
  const H = 0.22;           // Overall height along Y
  const PAD_H = 0.005;      // Non-slip bottom pad height
  const BASE_H = 0.075;     // Lower base/skirt height
  const BOLSTER_H = H - BASE_H - PAD_H; // Upper bolster height
  const BOLSTER_T = 0.105;  // Bolster wall thickness
  const THRESHOLD_H = 0.125; // Low-entry front threshold height from floor
  const CORNER_R = 0.08;    // Outer corner radius
  const BEVEL = 0.018;      // Soft fabric bevel

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x9b8e82,
    roughness: 0.88,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x877a6e,
    roughness: 0.92,
    metalness: 0.0,
  });

  const bottomMat = new THREE.MeshStandardMaterial({
    color: 0x2a2623,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Helper: create a rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const radius = Math.min(r, hw, hd);
    const shape = new THREE.Shape();
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  // Helper: add mesh with shadows enabled
  function addMesh(geometry, material, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Non-slip bottom pad (y = 0 to PAD_H)
  const padGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(W - 0.02, D - 0.02, CORNER_R - 0.01),
    { depth: PAD_H, bevelEnabled: false, curveSegments: 16 }
  );
  padGeo.rotateX(Math.PI / 2);
  addMesh(padGeo, bottomMat, 'bottom_pad', [0, PAD_H, 0]);

  // 2. Lower base/skirt (y = PAD_H to PAD_H + BASE_H)
  const baseW = W - BEVEL * 2;
  const baseD = D - BEVEL * 2;
  const baseGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(baseW, baseD, CORNER_R - BEVEL),
    {
      depth: BASE_H - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 16,
    }
  );
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, fabricMat, 'base_platform', [0, PAD_H + BASE_H - BEVEL, 0]);

  // 3. Horizontal seam/piping ring between base and upper bolster
  const seamY = PAD_H + BASE_H;
  const seamPts = [];
  const seamShape = roundedRectShape(W - 0.008, D - 0.008, CORNER_R);
  const spacedPts = seamShape.getSpacedPoints(48);
  for (let i = 0; i < spacedPts.length; i++) {
    seamPts.push(new THREE.Vector3(spacedPts[i].x, seamY, spacedPts[i].y));
  }
  const seamCurve = new THREE.CatmullRomCurve3(seamPts, true);
  const seamGeo = new THREE.TubeGeometry(seamCurve, 48, 0.005, 8, true);
  addMesh(seamGeo, seamMat, 'base_seam_piping');

  // 4. Inner mattress / cushion
  const innerW = W - BOLSTER_T * 2 + 0.02;
  const innerD = D - BOLSTER_T * 2 + 0.02;
  const cushionH = 0.065;
  const cushionBevel = 0.022;
  const cushionGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(innerW - cushionBevel * 2, innerD - cushionBevel * 2, 0.05),
    {
      depth: cushionH - cushionBevel * 2,
      bevelEnabled: true,
      bevelThickness: cushionBevel,
      bevelSize: cushionBevel,
      bevelSegments: 4,
      curveSegments: 16,
    }
  );
  cushionGeo.rotateX(Math.PI / 2);
  addMesh(
    cushionGeo,
    fabricMat,
    'inner_cushion_base',
    [0, seamY + cushionH - cushionBevel - 0.005, 0]
  );

  // Subtle domed crown on top of the inner cushion
  const crownGeo = new THREE.SphereGeometry(0.5, 24, 16);
  crownGeo.scale(innerW * 0.92, 0.032, innerD * 0.92);
  addMesh(crownGeo, fabricMat, 'inner_cushion_crown', [0, seamY + cushionH - 0.015, 0]);

  // 5. Back bolster (-Z)
  const backW = W - BEVEL * 2;
  const backD = BOLSTER_T - BEVEL * 2;
  const backH = BOLSTER_H - BEVEL * 2;
  const backGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(backW, backD, 0.035),
    {
      depth: backH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 12,
    }
  );
  backGeo.rotateX(Math.PI / 2);
  addMesh(
    backGeo,
    fabricMat,
    'back_bolster',
    [0, seamY + BOLSTER_H - BEVEL, -D / 2 + BOLSTER_T / 2]
  );

  // 6. Left & Right side bolsters (-X and +X)
  const sideW = BOLSTER_T - BEVEL * 2;
  const sideD = D - BOLSTER_T * 0.6 - BEVEL * 2;
  const sideGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(sideW, sideD, 0.035),
    {
      depth: backH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 12,
    }
  );
  sideGeo.rotateX(Math.PI / 2);
  addMesh(
    sideGeo,
    fabricMat,
    'left_bolster',
    [-W / 2 + BOLSTER_T / 2, seamY + BOLSTER_H - BEVEL, 0]
  );
  addMesh(
    sideGeo,
    fabricMat,
    'right_bolster',
    [W / 2 - BOLSTER_T / 2, seamY + BOLSTER_H - BEVEL, 0]
  );

  // 7. Front low-entry bolster (+Z) - extruded in XY plane along Z
  const frontHalfW = W / 2 - BEVEL;
  const frontTopY = BOLSTER_H - BEVEL;
  const frontLowY = THRESHOLD_H - seamY - BEVEL;
  const dipStart = 0.16; // X distance from center where dip begins
  const dipFlat = 0.10;  // X distance from center of flat low threshold

  const frontShape = new THREE.Shape();
  frontShape.moveTo(-frontHalfW, 0);
  frontShape.lineTo(frontHalfW, 0);
  frontShape.lineTo(frontHalfW, frontTopY);
  frontShape.lineTo(dipStart, frontTopY);
  frontShape.bezierCurveTo(
    dipStart - 0.03, frontTopY,
    dipFlat + 0.03, frontLowY,
    dipFlat, frontLowY
  );
  frontShape.lineTo(-dipFlat, frontLowY);
  frontShape.bezierCurveTo(
    -dipFlat - 0.03, frontLowY,
    -dipStart + 0.03, frontTopY,
    -dipStart, frontTopY
  );
  frontShape.lineTo(-frontHalfW, frontTopY);
  frontShape.closePath();

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: BOLSTER_T - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 16,
  });
  addMesh(
    frontGeo,
    fabricMat,
    'front_low_entry_bolster',
    [0, seamY + BEVEL, D / 2 - BOLSTER_T + BEVEL]
  );

  // 8. Corner vertical seam welts for tailored upholstery look
  const cornerPositions = [
    [-W / 2 + 0.02, -D / 2 + 0.02, 'seam_back_left'],
    [W / 2 - 0.02, -D / 2 + 0.02, 'seam_back_right'],
    [-W / 2 + 0.02, D / 2 - 0.02, 'seam_front_left'],
    [W / 2 - 0.02, D / 2 - 0.02, 'seam_front_right'],
  ];
  const cornerSeamGeo = new THREE.CapsuleGeometry(0.004, BOLSTER_H - 0.04, 4, 8);
  for (let i = 0; i < cornerPositions.length; i++) {
    const [cx, cz, name] = cornerPositions[i];
    addMesh(cornerSeamGeo, seamMat, name, [cx, seamY + BOLSTER_H / 2, cz]);
  }

  return group;
}
