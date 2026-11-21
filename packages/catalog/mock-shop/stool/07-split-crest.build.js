function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SEAT_H = 0.48;
  const SEAT_W = 0.40;
  const SEAT_D = 0.34;
  const BASE_R = 0.27;
  const WHEEL_R = 0.025;
  const WHEEL_W = 0.032;
  const HUB_Y = 0.105;
  const FOOT_RING_R = 0.175;
  const FOOT_RING_Y = 0.19;
  const PISTON_TOP_Y = 0.39;

  // Materials
  const matFabric = new THREE.MeshStandardMaterial({
    color: 0x3b3f44,
    roughness: 0.88,
    metalness: 0.04,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    roughness: 0.18,
    metalness: 0.92,
  });
  const matDarkMetal = new THREE.MeshStandardMaterial({
    color: 0x2b2f33,
    roughness: 0.55,
    metalness: 0.35,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.75,
    metalness: 0.05,
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. 5-Star Base Hub
  const hubGeo = new THREE.CylinderGeometry(0.036, 0.04, 0.05, 24);
  addMesh(hubGeo, matChrome, 'base_hub', [0, HUB_Y, 0]);

  // 2. 5-Star Base Legs & Casters
  const legGeo = new THREE.CylinderGeometry(0.012, 0.018, 1, 12);
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 20);
  const hoodGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.025, 12);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Caster wheel (bottom at y = 0)
    const tipX = cos * BASE_R;
    const tipZ = sin * BASE_R;
    addMesh(
      wheelGeo,
      matRubber,
      `caster_wheel_${i + 1}`,
      [tipX, WHEEL_R, tipZ],
      [0, -angle, Math.PI / 2]
    );

    // Caster stem / hood
    const hoodY = WHEEL_R * 2 + 0.008;
    addMesh(
      hoodGeo,
      matDarkMetal,
      `caster_hood_${i + 1}`,
      [tipX, hoodY, tipZ]
    );

    // Angled base leg from hub to caster hood
    const startX = cos * 0.03;
    const startZ = sin * 0.03;
    const startY = HUB_Y + 0.005;
    const endY = hoodY + 0.008;

    const dx = tipX - startX;
    const dy = endY - startY;
    const dz = tipZ - startZ;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const legMesh = new THREE.Mesh(legGeo, matChrome);
    legMesh.name = `base_leg_${i + 1}`;
    legMesh.position.set(
      (startX + tipX) / 2,
      (startY + endY) / 2,
      (startZ + tipZ) / 2
    );
    legMesh.scale.set(1, len, 0.7);
    legMesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize()
    );
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);
  }

  // 3. Lower Gas Lift Cylinder
  const lowerCylH = 0.19;
  const lowerCylGeo = new THREE.CylinderGeometry(0.025, 0.025, lowerCylH, 24);
  addMesh(
    lowerCylGeo,
    matDarkMetal,
    'gas_lift_lower',
    [0, HUB_Y + lowerCylH / 2 - 0.02, 0]
  );

  // 4. Foot Ring Assembly
  const ringGeo = new THREE.TorusGeometry(FOOT_RING_R, 0.012, 16, 32);
  addMesh(
    ringGeo,
    matDarkMetal,
    'foot_ring',
    [0, FOOT_RING_Y, 0],
    [Math.PI / 2, 0, 0]
  );

  const collarGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.028, 20);
  addMesh(collarGeo, matDarkMetal, 'foot_ring_collar', [0, FOOT_RING_Y, 0]);

  const spokeGeo = new THREE.CylinderGeometry(0.008, 0.01, FOOT_RING_R - 0.025, 10);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const rMid = (FOOT_RING_R + 0.025) / 2;
    addMesh(
      spokeGeo,
      matDarkMetal,
      `foot_ring_spoke_${i + 1}`,
      [Math.cos(a) * rMid, FOOT_RING_Y, Math.sin(a) * rMid],
      [0, -a, Math.PI / 2]
    );
  }

  // 5. Upper Chrome Piston
  const pistonH = PISTON_TOP_Y - (HUB_Y + lowerCylH - 0.02);
  const pistonGeo = new THREE.CylinderGeometry(0.014, 0.014, pistonH + 0.02, 20);
  addMesh(
    pistonGeo,
    matChrome,
    'gas_lift_piston',
    [0, PISTON_TOP_Y - pistonH / 2, 0]
  );

  // 6. Under-Seat Mechanism & Lever
  const mechGeo = new THREE.CylinderGeometry(0.055, 0.032, 0.042, 20);
  addMesh(mechGeo, matDarkMetal, 'seat_mechanism', [0, PISTON_TOP_Y + 0.015, 0]);

  const leverGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.11, 8);
  addMesh(
    leverGeo,
    matDarkMetal,
    'height_lever',
    [-0.08, PISTON_TOP_Y + 0.01, 0.02],
    [0, 0, Math.PI / 2 - 0.2]
  );

  // 7. Split Saddle Seat Cushions (top surface at SEAT_H = 0.48)
  const cushionRadiusY = 0.062;
  const cushionCenterY = SEAT_H - cushionRadiusY;
  const cushionGeo = new THREE.SphereGeometry(1, 24, 18);

  // Left half
  addMesh(
    cushionGeo,
    matFabric,
    'saddle_cushion_left',
    [-SEAT_W * 0.255, cushionCenterY, 0],
    [0.12, -0.18, 0.28],
    [0.095, cushionRadiusY, SEAT_D * 0.48]
  );

  // Right half
  addMesh(
    cushionGeo,
    matFabric,
    'saddle_cushion_right',
    [SEAT_W * 0.255, cushionCenterY, 0],
    [0.12, 0.18, -0.28],
    [0.095, cushionRadiusY, SEAT_D * 0.48]
  );

  return group;
}
