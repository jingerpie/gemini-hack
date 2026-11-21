function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const H = 0.40;
  const D = 0.14;
  const CENTER_Y = H / 2;

  // Materials
  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x182238,
    roughness: 0.9,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x141c2e,
    roughness: 0.85,
    metalness: 0.0,
  });

  const pumpkinMat = new THREE.MeshStandardMaterial({
    color: 0xd96218,
    roughness: 0.85,
    metalness: 0.0,
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0xb84c0e,
    roughness: 0.8,
    metalness: 0.0,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.85,
    metalness: 0.0,
  });

  // 1. Pillow body (rounded square with soft puffed bevel)
  const hw = W * 0.42;
  const hh = H * 0.42;
  const cornerR = 0.035;
  const pillowShape = new THREE.Shape();
  pillowShape.moveTo(-hw + cornerR, -hh);
  pillowShape.quadraticCurveTo(0, -hh + 0.012, hw - cornerR, -hh);
  pillowShape.quadraticCurveTo(hw, -hh, hw, -hh + cornerR);
  pillowShape.quadraticCurveTo(hw - 0.012, 0, hw, hh - cornerR);
  pillowShape.quadraticCurveTo(hw, hh, hw - cornerR, hh);
  pillowShape.quadraticCurveTo(0, hh - 0.012, -hw + cornerR, hh);
  pillowShape.quadraticCurveTo(-hw, hh, -hw, hh - cornerR);
  pillowShape.quadraticCurveTo(-hw + 0.012, 0, -hw, -hh + cornerR);
  pillowShape.quadraticCurveTo(-hw, -hh, -hw + cornerR, -hh);

  const bevelSize = 0.032;
  const bevelThickness = D * 0.42;
  const pillowGeo = new THREE.ExtrudeGeometry(pillowShape, {
    depth: D * 0.16,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelThickness,
  });
  pillowGeo.center();

  const pillowBody = new THREE.Mesh(pillowGeo, navyMat);
  pillowBody.name = 'pillow_body';
  pillowBody.position.set(0, CENTER_Y, 0);
  pillowBody.castShadow = true;
  pillowBody.receiveShadow = true;
  group.add(pillowBody);

  // 2. Perimeter piping
  const pw = W * 0.485;
  const ph = H * 0.485;
  const pipingCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-pw + 0.02, CENTER_Y - ph, 0),
      new THREE.Vector3(0, CENTER_Y - ph + 0.012, 0),
      new THREE.Vector3(pw - 0.02, CENTER_Y - ph, 0),
      new THREE.Vector3(pw, CENTER_Y - ph + 0.02, 0),
      new THREE.Vector3(pw - 0.012, CENTER_Y, 0),
      new THREE.Vector3(pw, CENTER_Y + ph - 0.02, 0),
      new THREE.Vector3(pw - 0.02, CENTER_Y + ph, 0),
      new THREE.Vector3(0, CENTER_Y + ph - 0.012, 0),
      new THREE.Vector3(-pw + 0.02, CENTER_Y + ph, 0),
      new THREE.Vector3(-pw, CENTER_Y + ph - 0.02, 0),
      new THREE.Vector3(-pw + 0.012, CENTER_Y, 0),
      new THREE.Vector3(-pw, CENTER_Y - ph + 0.02, 0),
    ],
    true
  );
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, 0.006, 10, true);
  const pipingMesh = new THREE.Mesh(pipingGeo, pipingMat);
  pipingMesh.name = 'pillow_piping';
  pipingMesh.castShadow = true;
  pipingMesh.receiveShadow = true;
  group.add(pipingMesh);

  // Front face Z offset for appliqué
  const frontZ = D * 0.49;

  // 3. Pumpkin appliqué body (5 overlapping lobes for realistic pumpkin silhouette)
  const lobeSpecs = [
    { name: 'pumpkin_lobe_center', x: 0, y: -0.004, rx: 0.048, ry: 0.056, zOff: 0.002 },
    { name: 'pumpkin_lobe_inner_left', x: -0.036, y: -0.002, rx: 0.042, ry: 0.054, zOff: 0.001 },
    { name: 'pumpkin_lobe_inner_right', x: 0.036, y: -0.002, rx: 0.042, ry: 0.054, zOff: 0.001 },
    { name: 'pumpkin_lobe_outer_left', x: -0.064, y: 0.0, rx: 0.034, ry: 0.048, zOff: 0.0 },
    { name: 'pumpkin_lobe_outer_right', x: 0.064, y: 0.0, rx: 0.034, ry: 0.048, zOff: 0.0 },
  ];

  const lobeGeo = new THREE.SphereGeometry(1, 24, 16);
  lobeSpecs.forEach((spec) => {
    const lobe = new THREE.Mesh(lobeGeo, pumpkinMat);
    lobe.name = spec.name;
    lobe.scale.set(spec.rx, spec.ry, 0.006);
    lobe.position.set(spec.x, CENTER_Y + spec.y, frontZ + spec.zOff);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  });

  // 4. Pumpkin stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, CENTER_Y + 0.048, frontZ + 0.002),
    new THREE.Vector3(-0.002, CENTER_Y + 0.064, frontZ + 0.002),
    new THREE.Vector3(-0.01, CENTER_Y + 0.076, frontZ + 0.002),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.007, 10, false);
  const stemMesh = new THREE.Mesh(stemGeo, pumpkinMat);
  stemMesh.name = 'pumpkin_stem';
  stemMesh.scale.set(1, 1, 0.45);
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  group.add(stemMesh);

  // 5. Pumpkin rib stitch lines
  const ribOffsets = [-0.042, -0.02, 0.02, 0.042];
  ribOffsets.forEach((rx, idx) => {
    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(rx * 0.7, CENTER_Y + 0.045, frontZ + 0.006),
      new THREE.Vector3(rx * 1.15, CENTER_Y, frontZ + 0.007),
      new THREE.Vector3(rx * 0.7, CENTER_Y - 0.048, frontZ + 0.006),
    ]);
    const ribGeo = new THREE.TubeGeometry(ribCurve, 14, 0.0014, 6, false);
    const ribMesh = new THREE.Mesh(ribGeo, stitchMat);
    ribMesh.name = `pumpkin_rib_${idx + 1}`;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  });

  // 6. Winking left eye (-X)
  const winkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.056, CENTER_Y + 0.006, frontZ + 0.008),
    new THREE.Vector3(-0.036, CENTER_Y - 0.004, frontZ + 0.009),
    new THREE.Vector3(-0.016, CENTER_Y + 0.005, frontZ + 0.008),
  ]);
  const winkGeo = new THREE.TubeGeometry(winkCurve, 14, 0.0028, 8, false);
  const winkMesh = new THREE.Mesh(winkGeo, blackMat);
  winkMesh.name = 'pumpkin_wink_eye';
  winkMesh.castShadow = true;
  winkMesh.receiveShadow = true;
  group.add(winkMesh);

  // 7. Open right eye (+X): almond outline + vertical pupil
  const eyeCenterX = 0.036;
  const eyeCenterY = CENTER_Y + 0.005;
  const eyeOutlineCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(eyeCenterX - 0.022, eyeCenterY, frontZ + 0.008),
      new THREE.Vector3(eyeCenterX, eyeCenterY + 0.011, frontZ + 0.009),
      new THREE.Vector3(eyeCenterX + 0.022, eyeCenterY, frontZ + 0.008),
      new THREE.Vector3(eyeCenterX, eyeCenterY - 0.011, frontZ + 0.009),
    ],
    true
  );
  const eyeOutlineGeo = new THREE.TubeGeometry(eyeOutlineCurve, 24, 0.0022, 8, true);
  const eyeOutlineMesh = new THREE.Mesh(eyeOutlineGeo, blackMat);
  eyeOutlineMesh.name = 'pumpkin_open_eye_outline';
  eyeOutlineMesh.castShadow = true;
  eyeOutlineMesh.receiveShadow = true;
  group.add(eyeOutlineMesh);

  const pupilGeo = new THREE.SphereGeometry(1, 16, 12);
  const pupilMesh = new THREE.Mesh(pupilGeo, blackMat);
  pupilMesh.name = 'pumpkin_open_eye_pupil';
  pupilMesh.scale.set(0.009, 0.0095, 0.003);
  pupilMesh.position.set(eyeCenterX, eyeCenterY, frontZ + 0.008);
  pupilMesh.castShadow = true;
  pupilMesh.receiveShadow = true;
  group.add(pupilMesh);

  return group;
}
