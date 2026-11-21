function build(THREE) {
  const group = new THREE.Group();

  const W = 0.22;
  const H = 0.16;
  const D = 0.22;
  const LOBE_COUNT = 10;
  const LOBE_OFFSET = 0.046;
  const LOBE_RX = 0.048;
  const LOBE_RY = H * 0.5;
  const LOBE_RZ = 0.064;

  const resinMat = new THREE.MeshStandardMaterial({
    color: 0xd95a0a,
    roughness: 0.45,
    metalness: 0.02
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xffb833,
    emissive: 0xff9d1a,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0
  });

  const lobeGeo = new THREE.SphereGeometry(1, 20, 16);
  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = (i / LOBE_COUNT) * Math.PI * 2;
    const lobe = new THREE.Mesh(lobeGeo, resinMat);
    lobe.name = `pumpkin_lobe_${i + 1}`;
    lobe.scale.set(LOBE_RX, LOBE_RY, LOBE_RZ);
    lobe.position.set(
      Math.sin(angle) * LOBE_OFFSET,
      H * 0.5,
      Math.cos(angle) * LOBE_OFFSET
    );
    lobe.rotation.y = angle;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }

  const coreGeo = new THREE.CylinderGeometry(W * 0.28, W * 0.26, H * 0.72, 20);
  const core = new THREE.Mesh(coreGeo, emitMat);
  core.name = "emit_glow_core";
  core.position.set(0, H * 0.52, 0);
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-0.018, -0.014);
  eyeShape.lineTo(0.018, -0.014);
  eyeShape.lineTo(0.002, 0.018);
  eyeShape.closePath();

  const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, {
    depth: 0.012,
    bevelEnabled: false
  });
  eyeGeo.center();

  const eyeLeft = new THREE.Mesh(eyeGeo, emitMat);
  eyeLeft.name = "emit_eye_left";
  eyeLeft.position.set(-0.042, H * 0.62, D * 0.43);
  eyeLeft.rotation.set(-0.18, -0.32, 0.12);
  eyeLeft.castShadow = true;
  eyeLeft.receiveShadow = true;
  group.add(eyeLeft);

  const eyeRight = new THREE.Mesh(eyeGeo, emitMat);
  eyeRight.name = "emit_eye_right";
  eyeRight.position.set(0.042, H * 0.62, D * 0.43);
  eyeRight.rotation.set(-0.18, 0.32, -0.12);
  eyeRight.castShadow = true;
  eyeRight.receiveShadow = true;
  group.add(eyeRight);

  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.013, -0.011);
  noseShape.lineTo(0.013, -0.011);
  noseShape.lineTo(0, 0.014);
  noseShape.closePath();

  const noseGeo = new THREE.ExtrudeGeometry(noseShape, {
    depth: 0.012,
    bevelEnabled: false
  });
  noseGeo.center();

  const nose = new THREE.Mesh(noseGeo, emitMat);
  nose.name = "emit_nose";
  nose.position.set(0, H * 0.47, D * 0.465);
  nose.rotation.set(-0.05, 0, 0);
  nose.castShadow = true;
  nose.receiveShadow = true;
  group.add(nose);

  const mouthShape = new THREE.Shape();
  mouthShape.moveTo(-0.058, 0.018);
  mouthShape.quadraticCurveTo(-0.036, 0.004, -0.022, 0.004);
  mouthShape.lineTo(-0.022, -0.006);
  mouthShape.lineTo(-0.01, -0.006);
  mouthShape.lineTo(-0.01, 0.003);
  mouthShape.lineTo(0.01, 0.003);
  mouthShape.lineTo(0.01, -0.006);
  mouthShape.lineTo(0.022, -0.006);
  mouthShape.lineTo(0.022, 0.004);
  mouthShape.quadraticCurveTo(0.036, 0.004, 0.058, 0.018);
  mouthShape.quadraticCurveTo(0.046, -0.018, 0.012, -0.022);
  mouthShape.lineTo(0.01, -0.012);
  mouthShape.lineTo(-0.01, -0.012);
  mouthShape.lineTo(-0.012, -0.022);
  mouthShape.quadraticCurveTo(-0.046, -0.018, -0.058, 0.018);
  mouthShape.closePath();

  const mouthGeo = new THREE.ExtrudeGeometry(mouthShape, {
    depth: 0.014,
    bevelEnabled: false
  });
  mouthGeo.center();

  const mouth = new THREE.Mesh(mouthGeo, emitMat);
  mouth.name = "emit_mouth";
  mouth.position.set(0, H * 0.28, D * 0.44);
  mouth.rotation.set(0.18, 0, 0);
  mouth.castShadow = true;
  mouth.receiveShadow = true;
  group.add(mouth);

  return group;
}
