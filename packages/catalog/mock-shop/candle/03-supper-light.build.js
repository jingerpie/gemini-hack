function build(THREE) {
  const group = new THREE.Group();

  const CANDLE_H = 0.25;
  const BASE_H = 0.022;
  const BASE_R = 0.010;
  const BODY_R_BOT = 0.0112;
  const BODY_R_TOP = 0.0068;
  const SHOULDER_H = 0.012;
  const WICK_H = 0.012;
  const WICK_R = 0.0009;
  const FLAME_H = 0.022;
  const FLAME_R = 0.0042;

  const waxMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2e6c9,
    roughness: 0.45,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xe5dbc3,
    roughness: 0.9,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffdd66,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });

  // Candle wax body with stepped base, gentle taper, and rounded top shoulder
  const waxPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BASE_R - 0.001, 0),
    new THREE.Vector2(BASE_R, 0.0015),
    new THREE.Vector2(BASE_R, BASE_H),
    new THREE.Vector2(BODY_R_BOT, BASE_H + 0.002),
    new THREE.Vector2(BODY_R_TOP, CANDLE_H - SHOULDER_H),
    new THREE.Vector2(BODY_R_TOP * 0.78, CANDLE_H - SHOULDER_H * 0.5),
    new THREE.Vector2(BODY_R_TOP * 0.4, CANDLE_H - SHOULDER_H * 0.15),
    new THREE.Vector2(0, CANDLE_H),
  ];
  const waxGeo = new THREE.LatheGeometry(waxPoints, 24);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = 'candle_body';
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // Slightly curved cotton wick emerging from the top
  const wickCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, CANDLE_H - 0.002, 0),
    new THREE.Vector3(0.0003, CANDLE_H + WICK_H * 0.5, 0.0002),
    new THREE.Vector3(0.0008, CANDLE_H + WICK_H, 0.0004),
  ]);
  const wickGeo = new THREE.TubeGeometry(wickCurve, 8, WICK_R, 8, false);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'candle_wick';
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // Teardrop flame overlapping the top of the wick
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.15),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.72, FLAME_H * 0.62),
    new THREE.Vector2(FLAME_R * 0.32, FLAME_H * 0.85),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.set(0.0008, CANDLE_H + WICK_H - 0.002, 0.0004);
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
