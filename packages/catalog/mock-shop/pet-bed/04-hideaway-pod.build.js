function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.38;
  const H = 0.40;
  const D = 0.38;
  const R = W / 2; // 0.19
  const WALL_T = 0.012;
  const OPENING_ANGLE = 0.56; // radians from +Z pole

  // Materials
  const feltOuterMat = new THREE.MeshStandardMaterial({
    color: 0xece5d8,
    roughness: 0.92,
    metalness: 0.0,
  });

  const feltInnerMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  const feltSeamMat = new THREE.MeshStandardMaterial({
    color: 0xd5cbb9,
    roughness: 0.9,
    metalness: 0.0,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.85,
    metalness: 0.0,
  });

  const zipperTapeMat = new THREE.MeshStandardMaterial({
    color: 0xe2dbd0,
    roughness: 0.8,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc4c8cc,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 1. Outer felt shell (sphere with circular opening facing +Z)
  const outerShellGeo = new THREE.SphereGeometry(
    R,
    32,
    24,
    0,
    Math.PI * 2,
    OPENING_ANGLE,
    Math.PI - OPENING_ANGLE
  );
  const outerShell = new THREE.Mesh(outerShellGeo, feltOuterMat);
  outerShell.name = 'outer_felt_shell';
  outerShell.rotation.x = Math.PI / 2;
  outerShell.scale.set(1, 1, H / W);
  outerShell.position.y = H / 2;
  outerShell.castShadow = true;
  outerShell.receiveShadow = true;
  group.add(outerShell);

  // 2. Inner felt shell
  const innerR = R - WALL_T;
  const innerShellGeo = new THREE.SphereGeometry(
    innerR,
    32,
    24,
    0,
    Math.PI * 2,
    OPENING_ANGLE,
    Math.PI - OPENING_ANGLE
  );
  const innerShell = new THREE.Mesh(innerShellGeo, feltInnerMat);
  innerShell.name = 'inner_felt_shell';
  innerShell.rotation.x = Math.PI / 2;
  innerShell.scale.set(1, 1, (H - WALL_T * 2) / (W - WALL_T * 2));
  innerShell.position.y = H / 2;
  innerShell.castShadow = true;
  innerShell.receiveShadow = true;
  group.add(innerShell);

  // 3. Opening rim (connects outer and inner shell at the cut edge)
  const rimRadius = ((R + innerR) / 2) * Math.sin(OPENING_ANGLE);
  const rimZ = ((R + innerR) / 2) * Math.cos(OPENING_ANGLE);
  const rimGeo = new THREE.TorusGeometry(rimRadius, WALL_T / 2 + 0.001, 14, 32);
  const openingRim = new THREE.Mesh(rimGeo, feltOuterMat);
  openingRim.name = 'opening_rim';
  openingRim.scale.set(1, H / W, 1);
  openingRim.position.set(0, H / 2, rimZ);
  openingRim.castShadow = true;
  openingRim.receiveShadow = true;
  group.add(openingRim);

  // 4. Flat bottom base pad (touches y = 0)
  const baseRadius = R * 0.86;
  const baseH = 0.022;
  const baseGeo = new THREE.CylinderGeometry(baseRadius * 1.04, baseRadius, baseH, 32);
  const basePad = new THREE.Mesh(baseGeo, feltOuterMat);
  basePad.name = 'base_pad';
  basePad.position.y = baseH / 2;
  basePad.castShadow = true;
  basePad.receiveShadow = true;
  group.add(basePad);

  // 5. Base stitched seam welt
  const seamGeo = new THREE.TorusGeometry(baseRadius * 1.03, 0.004, 10, 32);
  const baseSeam = new THREE.Mesh(seamGeo, feltSeamMat);
  baseSeam.name = 'base_seam_welt';
  baseSeam.rotation.x = Math.PI / 2;
  baseSeam.position.y = baseH;
  baseSeam.castShadow = true;
  baseSeam.receiveShadow = true;
  group.add(baseSeam);

  // 6. Inner floor liner
  const floorGeo = new THREE.CylinderGeometry(innerR * 0.84, innerR * 0.84, 0.015, 32);
  const innerFloor = new THREE.Mesh(floorGeo, feltSeamMat);
  innerFloor.name = 'inner_floor_pad';
  innerFloor.position.y = 0.02;
  innerFloor.castShadow = true;
  innerFloor.receiveShadow = true;
  group.add(innerFloor);

  // 7. Interior cushion body
  const cushionR = innerR * 0.82;
  const cushionH = 0.065;
  const cushionY = 0.028 + cushionH / 2;
  const cushionGeo = new THREE.SphereGeometry(cushionR, 32, 18);
  const cushionBody = new THREE.Mesh(cushionGeo, cushionMat);
  cushionBody.name = 'cushion_body';
  cushionBody.scale.set(1, cushionH / (cushionR * 2), 1);
  cushionBody.position.set(0, cushionY, -0.005);
  cushionBody.castShadow = true;
  cushionBody.receiveShadow = true;
  group.add(cushionBody);

  // 8. Cushion zipper tape / piping around equator
  const zipperTapeGeo = new THREE.TorusGeometry(cushionR * 0.99, 0.0045, 10, 32);
  const zipperTape = new THREE.Mesh(zipperTapeGeo, zipperTapeMat);
  zipperTape.name = 'cushion_zipper_tape';
  zipperTape.rotation.x = Math.PI / 2;
  zipperTape.position.set(0, cushionY - 0.003, -0.005);
  zipperTape.castShadow = true;
  zipperTape.receiveShadow = true;
  group.add(zipperTape);

  // 9. Zipper slider
  const zipperZ = cushionR * 0.99 - 0.005;
  const sliderGeo = new THREE.BoxGeometry(0.01, 0.007, 0.008);
  const zipperSlider = new THREE.Mesh(sliderGeo, metalMat);
  zipperSlider.name = 'zipper_slider';
  zipperSlider.position.set(0.035, cushionY - 0.003, zipperZ);
  zipperSlider.rotation.y = 0.22;
  zipperSlider.castShadow = true;
  zipperSlider.receiveShadow = true;
  group.add(zipperSlider);

  // 10. Zipper pull ring
  const pullRingGeo = new THREE.TorusGeometry(0.003, 0.0009, 8, 16);
  const pullRing = new THREE.Mesh(pullRingGeo, metalMat);
  pullRing.name = 'zipper_pull_ring';
  pullRing.position.set(0.036, cushionY - 0.007, zipperZ + 0.004);
  pullRing.rotation.y = 0.22;
  pullRing.castShadow = true;
  pullRing.receiveShadow = true;
  group.add(pullRing);

  // 11. Zipper pull tab
  const pullTabGeo = new THREE.BoxGeometry(0.005, 0.016, 0.002);
  const pullTab = new THREE.Mesh(pullTabGeo, metalMat);
  pullTab.name = 'zipper_pull_tab';
  pullTab.position.set(0.0365, cushionY - 0.016, zipperZ + 0.006);
  pullTab.rotation.set(-0.2, 0.22, 0);
  pullTab.castShadow = true;
  pullTab.receiveShadow = true;
  group.add(pullTab);

  // 12. Subtle cushion center tuft
  const tuftGeo = new THREE.SphereGeometry(0.006, 12, 8);
  const cushionTuft = new THREE.Mesh(tuftGeo, zipperTapeMat);
  cushionTuft.name = 'cushion_center_tuft';
  cushionTuft.scale.set(1, 0.4, 1);
  cushionTuft.position.set(0, cushionY + cushionH / 2 - 0.002, -0.005);
  cushionTuft.castShadow = true;
  cushionTuft.receiveShadow = true;
  group.add(cushionTuft);

  return group;
}
