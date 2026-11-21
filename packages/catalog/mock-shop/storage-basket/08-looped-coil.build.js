function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const RIM_DIAMETER = 0.38;
  const BASE_DIAMETER = 0.26;
  const BODY_H = 0.145;
  const HANDLE_H = 0.065;
  const COIL_COUNT = 13;
  const COIL_TUBE_R = 0.0062;
  const RIM_TUBE_R = 0.0095;
  const HANDLE_TUBE_R = 0.0078;

  const BASE_R = BASE_DIAMETER / 2;
  const RIM_R = RIM_DIAMETER / 2;

  // Materials
  const coilMat = new THREE.MeshStandardMaterial({
    color: 0xb68d56,
    roughness: 0.85,
    metalness: 0.02
  });

  const coilDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa07844,
    roughness: 0.88,
    metalness: 0.02
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc19860,
    roughness: 0.82,
    metalness: 0.02
  });

  // Flat woven base
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R * 0.96, COIL_TUBE_R * 2, 32);
  const baseMesh = new THREE.Mesh(baseGeo, coilDarkMat);
  baseMesh.name = 'basket_base';
  baseMesh.position.y = COIL_TUBE_R;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Stacked horizontal coils forming the flared body
  const startY = COIL_TUBE_R;
  const endY = BODY_H - RIM_TUBE_R;
  for (let i = 0; i < COIL_COUNT; i++) {
    const t = i / (COIL_COUNT - 1);
    // Slight outward curve profile
    const easeT = Math.pow(t, 0.88);
    const radius = BASE_R + (RIM_R - BASE_R) * easeT;
    const y = startY + (endY - startY) * t;

    const coilGeo = new THREE.TorusGeometry(radius, COIL_TUBE_R, 10, 32);
    coilGeo.rotateX(Math.PI / 2);

    const mat = i % 2 === 0 ? coilMat : coilDarkMat;
    const coilMesh = new THREE.Mesh(coilGeo, mat);
    coilMesh.name = `basket_coil_${String(i + 1).padStart(2, '0')}`;
    coilMesh.position.y = y;
    coilMesh.castShadow = true;
    coilMesh.receiveShadow = true;
    group.add(coilMesh);
  }

  // Top wrapped rim
  const rimGeo = new THREE.TorusGeometry(RIM_R, RIM_TUBE_R, 12, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.name = 'basket_rim';
  rimMesh.position.y = BODY_H - RIM_TUBE_R;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Looped handles on -X and +X sides
  const rimY = BODY_H - RIM_TUBE_R;
  const handleSides = [
    { name: 'handle_left', sign: -1 },
    { name: 'handle_right', sign: 1 }
  ];

  for (const side of handleSides) {
    const s = side.sign;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * (RIM_R - 0.002), rimY - 0.004, -0.048),
      new THREE.Vector3(s * (RIM_R + 0.014), rimY + HANDLE_H * 0.55, -0.036),
      new THREE.Vector3(s * (RIM_R + 0.024), rimY + HANDLE_H, 0),
      new THREE.Vector3(s * (RIM_R + 0.014), rimY + HANDLE_H * 0.55, 0.036),
      new THREE.Vector3(s * (RIM_R - 0.002), rimY - 0.004, 0.048)
    ]);

    const handleGeo = new THREE.TubeGeometry(curve, 24, HANDLE_TUBE_R, 10, false);
    const handleMesh = new THREE.Mesh(handleGeo, rimMat);
    handleMesh.name = side.name;
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    group.add(handleMesh);
  }

  return group;
}
