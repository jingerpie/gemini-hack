function build(THREE) {
  const group = new THREE.Group();

  const BODY_RADIUS = 0.13;
  const BODY_HEIGHT = 0.21;
  const LOBE_COUNT = 16;
  const STEM_HEIGHT = 0.065;

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd96818,
    roughness: 0.62,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c4827,
    roughness: 0.88,
    metalness: 0.0
  });

  const stemTipMat = new THREE.MeshStandardMaterial({
    color: 0xb8a47c,
    roughness: 0.9,
    metalness: 0.0
  });

  // Lobed pumpkin body
  const lobeGeo = new THREE.SphereGeometry(1, 20, 16);
  const lobeRadiusX = BODY_RADIUS * 0.42;
  const lobeRadiusY = BODY_HEIGHT * 0.5;
  const lobeRadiusZ = BODY_RADIUS * 0.72;
  const lobeOffset = BODY_RADIUS * 0.28;

  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = (i / LOBE_COUNT) * Math.PI * 2;
    const lobe = new THREE.Mesh(lobeGeo, skinMat);
    lobe.name = `pumpkin_lobe_${i + 1}`;
    lobe.scale.set(lobeRadiusX, lobeRadiusY, lobeRadiusZ);
    lobe.position.set(
      Math.sin(angle) * lobeOffset,
      lobeRadiusY,
      Math.cos(angle) * lobeOffset
    );
    lobe.rotation.y = angle;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }

  // Stem base flare
  const stemBaseGeo = new THREE.CylinderGeometry(0.015, 0.032, 0.022, 14);
  const stemBase = new THREE.Mesh(stemBaseGeo, stemMat);
  stemBase.name = "pumpkin_stem_base";
  stemBase.position.set(0, BODY_HEIGHT - 0.012, 0);
  stemBase.castShadow = true;
  stemBase.receiveShadow = true;
  group.add(stemBase);

  // Curved stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BODY_HEIGHT - 0.008, 0),
    new THREE.Vector3(-0.006, BODY_HEIGHT + STEM_HEIGHT * 0.4, 0.002),
    new THREE.Vector3(-0.022, BODY_HEIGHT + STEM_HEIGHT * 0.8, 0.004),
    new THREE.Vector3(-0.038, BODY_HEIGHT + STEM_HEIGHT, 0.005)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.013, 10, false);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.name = "pumpkin_stem";
  stem.castShadow = true;
  stem.receiveShadow = true;
  group.add(stem);

  // Cut tip of stem
  const stemTipGeo = new THREE.CylinderGeometry(0.012, 0.013, 0.006, 10);
  const stemTip = new THREE.Mesh(stemTipGeo, stemTipMat);
  stemTip.name = "pumpkin_stem_tip";
  stemTip.position.set(-0.038, BODY_HEIGHT + STEM_HEIGHT, 0.005);
  stemTip.rotation.z = 0.65;
  stemTip.castShadow = true;
  stemTip.receiveShadow = true;
  group.add(stemTip);

  return group;
}
