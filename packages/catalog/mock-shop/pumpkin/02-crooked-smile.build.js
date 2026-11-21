function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.20;
  const BODY_R = 0.095;
  const BODY_H = 0.142;
  const BASE_H = 0.008;
  const BASE_R = 0.052;
  const LOBE_COUNT = 10;
  const BODY_CENTER_Y = BASE_H + BODY_H * 0.48;

  // Materials
  const pumpkinMat = new THREE.MeshStandardMaterial({
    color: 0xd97228,
    roughness: 0.62,
    metalness: 0.02
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x8c5c38,
    roughness: 0.78,
    metalness: 0.02
  });

  const cutoutMat = new THREE.MeshStandardMaterial({
    color: 0x1a0b04,
    roughness: 0.9,
    metalness: 0.0
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffaa33,
    emissive: 0xff7711,
    emissiveIntensity: 1.5,
    roughness: 0.4
  });

  // 1. Base foot
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R * 0.94, BASE_H, 24);
  const baseMesh = new THREE.Mesh(baseGeo, pumpkinMat);
  baseMesh.name = 'pumpkin_base';
  baseMesh.position.y = BASE_H / 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Lobed pumpkin body
  const lobeGeo = new THREE.SphereGeometry(1, 20, 16);
  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = (i / LOBE_COUNT) * Math.PI * 2;
    const lobe = new THREE.Mesh(lobeGeo, pumpkinMat);
    lobe.name = 'pumpkin_lobe_' + (i + 1);
    lobe.scale.set(BODY_R * 0.44, BODY_H * 0.52, BODY_R * 0.68);
    const offsetR = BODY_R * 0.34;
    lobe.position.set(
      Math.sin(angle) * offsetR,
      BODY_CENTER_Y,
      Math.cos(angle) * offsetR
    );
    lobe.rotation.y = angle;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }

  // 3. Lid seam near top shoulder
  const seamGeo = new THREE.TorusGeometry(BODY_R * 0.68, 0.0018, 8, 28);
  const seamMesh = new THREE.Mesh(seamGeo, cutoutMat);
  seamMesh.name = 'pumpkin_lid_seam';
  seamMesh.rotation.x = Math.PI / 2;
  seamMesh.position.y = BASE_H + BODY_H * 0.84;
  seamMesh.castShadow = true;
  seamMesh.receiveShadow = true;
  group.add(seamMesh);

  // 4. Curved stem on top (reaches y = H = 0.20)
  const stemBaseY = BASE_H + BODY_H * 0.90;
  const stemTopY = H - 0.006;
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, stemBaseY, 0),
    new THREE.Vector3(0.004, stemBaseY + (stemTopY - stemBaseY) * 0.45, -0.002),
    new THREE.Vector3(0.015, stemBaseY + (stemTopY - stemBaseY) * 0.85, 0.0),
    new THREE.Vector3(0.024, stemTopY, 0.002)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 14, 0.009, 10, false);
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  stemMesh.name = 'pumpkin_stem';
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  group.add(stemMesh);

  // 5. Internal lantern glow
  const glowGeo = new THREE.SphereGeometry(0.025, 16, 12);
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.name = 'emit_lantern_glow';
  glowMesh.position.set(0, BODY_CENTER_Y, 0.02);
  glowMesh.castShadow = false;
  glowMesh.receiveShadow = false;
  group.add(glowMesh);

  // Helper for extruded face cutouts
  const extrudeSettings = {
    depth: 0.022,
    bevelEnabled: false
  };

  // 6. Left Eye
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-0.014, -0.010);
  eyeShape.lineTo(0.014, -0.012);
  eyeShape.lineTo(0.002, 0.014);
  eyeShape.closePath();

  const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, extrudeSettings);
  const leftEye = new THREE.Mesh(eyeGeo, cutoutMat);
  leftEye.name = 'face_eye_left';
  leftEye.position.set(-0.036, BODY_CENTER_Y + 0.016, BODY_R * 0.72);
  leftEye.rotation.y = -0.32;
  leftEye.rotation.x = -0.1;
  leftEye.castShadow = true;
  leftEye.receiveShadow = true;
  group.add(leftEye);

  // 7. Right Eye
  const rightEye = new THREE.Mesh(eyeGeo, cutoutMat);
  rightEye.name = 'face_eye_right';
  rightEye.scale.x = -1;
  rightEye.position.set(0.036, BODY_CENTER_Y + 0.016, BODY_R * 0.72);
  rightEye.rotation.y = 0.32;
  rightEye.rotation.x = -0.1;
  rightEye.castShadow = true;
  rightEye.receiveShadow = true;
  group.add(rightEye);

  // 8. Nose
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.008, -0.008);
  noseShape.lineTo(0.008, -0.008);
  noseShape.lineTo(0, 0.009);
  noseShape.closePath();

  const noseGeo = new THREE.ExtrudeGeometry(noseShape, extrudeSettings);
  const noseMesh = new THREE.Mesh(noseGeo, cutoutMat);
  noseMesh.name = 'face_nose';
  noseMesh.position.set(0, BODY_CENTER_Y - 0.004, BODY_R * 0.78);
  noseMesh.castShadow = true;
  noseMesh.receiveShadow = true;
  group.add(noseMesh);

  // 9. Crooked zig-zag smile mouth
  const mouthShape = new THREE.Shape();
  mouthShape.moveTo(-0.056, 0.010);
  mouthShape.lineTo(-0.038, -0.006);
  mouthShape.lineTo(-0.022, 0.004);
  mouthShape.lineTo(-0.008, -0.012);
  mouthShape.lineTo(0.008, 0.002);
  mouthShape.lineTo(0.024, -0.010);
  mouthShape.lineTo(0.040, 0.004);
  mouthShape.lineTo(0.056, 0.012);
  // Bottom edge of zig-zag
  mouthShape.lineTo(0.042, -0.012);
  mouthShape.lineTo(0.024, -0.024);
  mouthShape.lineTo(0.008, -0.012);
  mouthShape.lineTo(-0.008, -0.026);
  mouthShape.lineTo(-0.022, -0.010);
  mouthShape.lineTo(-0.038, -0.022);
  mouthShape.closePath();

  const mouthGeo = new THREE.ExtrudeGeometry(mouthShape, {
    depth: 0.025,
    bevelEnabled: false
  });
  const mouthMesh = new THREE.Mesh(mouthGeo, cutoutMat);
  mouthMesh.name = 'face_mouth';
  mouthMesh.position.set(0, BODY_CENTER_Y - 0.026, BODY_R * 0.71);
  mouthMesh.rotation.x = 0.14;
  mouthMesh.castShadow = true;
  mouthMesh.receiveShadow = true;
  group.add(mouthMesh);

  return group;
}
