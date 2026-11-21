function build(THREE) {
  const group = new THREE.Group();

  const BODY_W = 0.10;
  const BODY_H = 0.068;
  const LOBE_COUNT = 8;
  const LOBE_R = BODY_W * 0.29;
  const LOBE_OFFSET = BODY_W * 0.21;
  const BODY_CENTER_Y = BODY_H * 0.5;
  const STEM_R = 0.0085;
  const STEM_H = 0.026;

  const yarnMat = new THREE.MeshStandardMaterial({
    color: 0xb25f30,
    roughness: 0.92,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x9b4e23,
    roughness: 0.92,
    metalness: 0.0
  });

  const faceMat = new THREE.MeshStandardMaterial({
    color: 0x6b3519,
    roughness: 0.9,
    metalness: 0.0
  });

  // Central core to keep the pumpkin solid
  const coreGeo = new THREE.SphereGeometry(BODY_W * 0.36, 20, 16);
  const core = new THREE.Mesh(coreGeo, yarnMat);
  core.name = "pumpkin_core";
  core.scale.set(1, BODY_H / (BODY_W * 0.72), 1);
  core.position.y = BODY_CENTER_Y;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  // Lobed body segments
  const lobeGeo = new THREE.SphereGeometry(LOBE_R, 20, 16);
  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = (i / LOBE_COUNT) * Math.PI * 2;
    const lobe = new THREE.Mesh(lobeGeo, yarnMat);
    lobe.name = `pumpkin_lobe_${i + 1}`;
    lobe.scale.set(0.95, BODY_H / (LOBE_R * 2), 1.05);
    lobe.position.set(
      Math.sin(angle) * LOBE_OFFSET,
      BODY_CENTER_Y,
      Math.cos(angle) * LOBE_OFFSET
    );
    lobe.rotation.y = angle;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }

  // Stem on top, slightly curved/tilted
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BODY_H - 0.006, 0),
    new THREE.Vector3(0.002, BODY_H + STEM_H * 0.45, 0),
    new THREE.Vector3(0.006, BODY_H + STEM_H, 0.001)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 10, STEM_R, 12, false);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.name = "pumpkin_stem";
  stem.castShadow = true;
  stem.receiveShadow = true;
  group.add(stem);

  // Rounded cap on top of stem
  const stemCapGeo = new THREE.SphereGeometry(STEM_R, 12, 10);
  const stemCap = new THREE.Mesh(stemCapGeo, stemMat);
  stemCap.name = "pumpkin_stem_tip";
  stemCap.position.set(0.006, BODY_H + STEM_H, 0.001);
  stemCap.castShadow = true;
  stemCap.receiveShadow = true;
  group.add(stemCap);

  // Leaf on the left side (-X) of the stem
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(-0.014, 0.012, -0.032, 0.015);
  leafShape.quadraticCurveTo(-0.018, -0.004, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2
  });
  leafGeo.center();

  const leaf = new THREE.Mesh(leafGeo, stemMat);
  leaf.name = "pumpkin_leaf";
  leaf.position.set(-0.02, BODY_H + 0.005, 0.002);
  leaf.rotation.set(0.35, 0.15, -0.2);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  group.add(leaf);

  // Embroidered eyes on front (+Z)
  const eyeGeo = new THREE.CapsuleGeometry(0.0022, 0.0035, 6, 8);
  const eyeZ = BODY_W * 0.485;
  const eyeY = BODY_CENTER_Y + 0.002;
  const eyeX = 0.013;

  const leftEye = new THREE.Mesh(eyeGeo, faceMat);
  leftEye.name = "face_eye_left";
  leftEye.position.set(-eyeX, eyeY, eyeZ);
  leftEye.castShadow = true;
  leftEye.receiveShadow = true;
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, faceMat);
  rightEye.name = "face_eye_right";
  rightEye.position.set(eyeX, eyeY, eyeZ);
  rightEye.castShadow = true;
  rightEye.receiveShadow = true;
  group.add(rightEye);

  // Small V-shaped embroidered smile
  const smileGeo = new THREE.CapsuleGeometry(0.0012, 0.005, 4, 8);
  const smileY = BODY_CENTER_Y - 0.005;
  const smileZ = BODY_W * 0.492;

  const smileLeft = new THREE.Mesh(smileGeo, faceMat);
  smileLeft.name = "face_smile_left";
  smileLeft.position.set(-0.0025, smileY, smileZ);
  smileLeft.rotation.z = 0.85;
  smileLeft.castShadow = true;
  smileLeft.receiveShadow = true;
  group.add(smileLeft);

  const smileRight = new THREE.Mesh(smileGeo, faceMat);
  smileRight.name = "face_smile_right";
  smileRight.position.set(0.0025, smileY, smileZ);
  smileRight.rotation.z = -0.85;
  smileRight.castShadow = true;
  smileRight.receiveShadow = true;
  group.add(smileRight);

  return group;
}
