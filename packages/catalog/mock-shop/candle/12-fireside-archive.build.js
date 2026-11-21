function build(THREE) {
  const group = new THREE.Group();

  const JAR_R = 0.05;
  const JAR_H = 0.105;
  const WALL_T = 0.006;
  const WAX_H = 0.088;
  const LABEL_H = 0.08;
  const LABEL_ARC = 0.42;
  const LID_T = 0.012;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xb05635,
    roughness: 0.48,
    metalness: 0.04,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xebe3cf,
    roughness: 0.65,
    metalness: 0.0,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d4,
    roughness: 0.85,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x3b3228,
    roughness: 0.9,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffbb44,
    emissive: 0xff8811,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Ceramic jar body (LatheGeometry for rounded bottom and thick rim)
  const jarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(JAR_R - 0.006, 0),
    new THREE.Vector2(JAR_R - 0.002, 0.0015),
    new THREE.Vector2(JAR_R, 0.005),
    new THREE.Vector2(JAR_R, JAR_H - 0.004),
    new THREE.Vector2(JAR_R - 0.001, JAR_H - 0.001),
    new THREE.Vector2(JAR_R - WALL_T * 0.5, JAR_H),
    new THREE.Vector2(JAR_R - WALL_T + 0.001, JAR_H - 0.001),
    new THREE.Vector2(JAR_R - WALL_T, JAR_H - 0.004),
    new THREE.Vector2(JAR_R - WALL_T, WAX_H - 0.01),
    new THREE.Vector2(0, WAX_H - 0.01),
  ];
  const jarGeo = new THREE.LatheGeometry(jarPoints, 32);
  const jarMesh = new THREE.Mesh(jarGeo, ceramicMat);
  jarMesh.name = "terracotta_jar";
  group.add(jarMesh);

  // Wax fill
  const waxR = JAR_R - WALL_T + 0.0005;
  const waxBodyH = 0.02;
  const waxGeo = new THREE.CylinderGeometry(waxR, waxR, waxBodyH, 32);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = "candle_wax";
  waxMesh.position.y = WAX_H - waxBodyH / 2;
  group.add(waxMesh);

  // Front paper label (+Z)
  const labelGeo = new THREE.CylinderGeometry(
    JAR_R + 0.0004,
    JAR_R + 0.0004,
    LABEL_H,
    16,
    1,
    true,
    -LABEL_ARC / 2,
    LABEL_ARC
  );
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.name = "front_label";
  labelMesh.position.y = JAR_H * 0.45;
  group.add(labelMesh);

  // Wick
  const wickH = 0.011;
  const wickGeo = new THREE.CylinderGeometry(0.0011, 0.0013, wickH, 8);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = "candle_wick";
  wickMesh.position.y = WAX_H + wickH / 2 - 0.001;
  group.add(wickMesh);

  // Lit flame
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.0028, 0.0025),
    new THREE.Vector2(0.0035, 0.0065),
    new THREE.Vector2(0.0022, 0.012),
    new THREE.Vector2(0.0007, 0.017),
    new THREE.Vector2(0, 0.02),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = "emit_flame";
  flameMesh.position.y = WAX_H + wickH - 0.002;
  group.add(flameMesh);

  // Matching terracotta lid leaning on the right (+X)
  const lidGeo = new THREE.CylinderGeometry(JAR_R, JAR_R, LID_T, 32);
  const lidMesh = new THREE.Mesh(lidGeo, ceramicMat);
  lidMesh.name = "terracotta_lid";
  const tilt = 0.36;
  lidMesh.rotation.z = -(Math.PI / 2 - tilt);
  lidMesh.position.set(
    JAR_R + 0.022,
    JAR_R * Math.cos(tilt) + (LID_T / 2) * Math.sin(tilt),
    0
  );
  group.add(lidMesh);

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
