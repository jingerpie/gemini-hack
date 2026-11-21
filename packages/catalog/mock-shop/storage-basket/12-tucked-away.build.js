function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const DIAMETER = 0.30;
  const TOTAL_H = 0.28;
  const LID_R = DIAMETER / 2; // 0.15
  const BODY_R = 0.142;
  const HANDLE_H = 0.045;
  const LID_TOP_Y = TOTAL_H - HANDLE_H; // 0.235
  const LID_H = 0.024;
  const LID_BOTTOM_Y = LID_TOP_Y - LID_H; // 0.211
  const COIL_R = 0.0058;
  const BODY_COIL_COUNT = 18;
  const WIRE_R = 0.0018;

  // Materials
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xb99d74,
    roughness: 0.88,
    metalness: 0.0,
  });

  const strawDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa4885f,
    roughness: 0.9,
    metalness: 0.0,
  });

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x33302d,
    roughness: 0.45,
    metalness: 0.7,
  });

  function makeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Inner core cylinder of the basket body
  const coreH = LID_BOTTOM_Y - COIL_R;
  const coreGeo = new THREE.CylinderGeometry(BODY_R - COIL_R * 0.4, BODY_R - COIL_R * 0.4, coreH, 32);
  const coreMesh = makeMesh(coreGeo, strawDarkMat, 'basket_core');
  coreMesh.position.y = COIL_R + coreH / 2;
  group.add(coreMesh);

  // Stacked horizontal woven coils for the basket body
  const bodyStartY = COIL_R;
  const bodyEndY = LID_BOTTOM_Y - WIRE_R * 2 - COIL_R;
  const bodyStep = (bodyEndY - bodyStartY) / (BODY_COIL_COUNT - 1);

  for (let i = 0; i < BODY_COIL_COUNT; i++) {
    const y = bodyStartY + i * bodyStep;
    const coilGeo = new THREE.TorusGeometry(BODY_R - COIL_R, COIL_R, 10, 32);
    coilGeo.rotateX(Math.PI / 2);
    const mat = i % 2 === 0 ? strawMat : strawDarkMat;
    const coil = makeMesh(coilGeo, mat, `body_coil_${i}`);
    coil.position.y = y;
    group.add(coil);
  }

  // Dark metal wire rim just below the lid
  const wireGeo = new THREE.TorusGeometry(BODY_R - WIRE_R, WIRE_R, 8, 32);
  wireGeo.rotateX(Math.PI / 2);
  const wireMesh = makeMesh(wireGeo, wireMat, 'wire_rim');
  wireMesh.position.y = LID_BOTTOM_Y - WIRE_R;
  group.add(wireMesh);

  // Lid base disc
  const lidCoreGeo = new THREE.CylinderGeometry(LID_R - COIL_R, LID_R - COIL_R, LID_H - COIL_R, 32);
  const lidCore = makeMesh(lidCoreGeo, strawDarkMat, 'lid_base');
  lidCore.position.y = LID_BOTTOM_Y + (LID_H - COIL_R) / 2;
  group.add(lidCore);

  // Lid outer rim coils (2 stacked rings)
  for (let i = 0; i < 2; i++) {
    const rimGeo = new THREE.TorusGeometry(LID_R - COIL_R, COIL_R, 10, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rim = makeMesh(rimGeo, strawMat, `lid_rim_${i}`);
    rim.position.y = LID_BOTTOM_Y + COIL_R + i * (LID_H - COIL_R * 2);
    group.add(rim);
  }

  // Concentric woven coils on top of the lid
  const topCoilRadii = [0.122, 0.098, 0.074, 0.050, 0.026];
  for (let i = 0; i < topCoilRadii.length; i++) {
    const r = topCoilRadii[i];
    const topCoilGeo = new THREE.TorusGeometry(r, COIL_R * 0.85, 8, 32);
    topCoilGeo.rotateX(Math.PI / 2);
    const mat = i % 2 === 0 ? strawMat : strawDarkMat;
    const topCoil = makeMesh(topCoilGeo, mat, `lid_top_coil_${i}`);
    topCoil.position.y = LID_TOP_Y - COIL_R * 0.4;
    group.add(topCoil);
  }

  // Teardrop braided loop handle on top of the lid
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.004, LID_TOP_Y - 0.002, 0),
    new THREE.Vector3(-0.017, LID_TOP_Y + HANDLE_H * 0.55, 0),
    new THREE.Vector3(0.0, TOTAL_H - 0.0045, 0),
    new THREE.Vector3(0.017, LID_TOP_Y + HANDLE_H * 0.55, 0),
    new THREE.Vector3(0.004, LID_TOP_Y - 0.002, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0045, 10, false);
  const handleMesh = makeMesh(handleGeo, strawMat, 'lid_handle');
  group.add(handleMesh);

  return group;
}
