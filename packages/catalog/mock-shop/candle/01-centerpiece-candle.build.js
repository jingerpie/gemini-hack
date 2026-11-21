function build(THREE) {
  const group = new THREE.Group();

  const TOTAL_H = 0.14;
  const BOWL_R = 0.13;
  const BASE_H = 0.048;
  const BASE_R_BOTTOM = 0.064;
  const BASE_R_TOP = 0.056;
  const WALL_T = 0.011;
  const WAX_Y = TOTAL_H - 0.014;
  const WAX_H = 0.045;
  const WAX_R = BOWL_R - WALL_T + 0.001;
  const WICK_RING_R = 0.058;
  const WICK_H = 0.012;
  const WICK_R = 0.0016;
  const FLAME_H = 0.016;
  const FLAME_R = 0.0042;
  const WICK_COUNT = 6;
  const RADIAL_SEGMENTS = 32;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x7a93a6,
    roughness: 0.65,
    metalness: 0.05,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf3ebd8,
    roughness: 0.45,
    metalness: 0.0,
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xcab898,
    roughness: 0.9,
    metalness: 0.0,
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffd27d,
    emissive: 0xff9d2e,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Ceramic pedestal bowl profile (LatheGeometry)
  const vesselPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BASE_R_BOTTOM, 0),
    new THREE.Vector2(BASE_R_TOP, BASE_H),
    new THREE.Vector2(BOWL_R * 0.72, BASE_H + 0.006),
    new THREE.Vector2(BOWL_R * 0.92, BASE_H + 0.018),
    new THREE.Vector2(BOWL_R, BASE_H + 0.036),
    new THREE.Vector2(BOWL_R, TOTAL_H - 0.005),
    new THREE.Vector2(BOWL_R - 0.0025, TOTAL_H),
    new THREE.Vector2(BOWL_R - WALL_T + 0.0025, TOTAL_H),
    new THREE.Vector2(BOWL_R - WALL_T, TOTAL_H - 0.005),
    new THREE.Vector2(BOWL_R - WALL_T, WAX_Y - 0.01),
    new THREE.Vector2(0, WAX_Y - 0.01),
  ];

  const vesselGeo = new THREE.LatheGeometry(vesselPoints, RADIAL_SEGMENTS);
  const vesselMesh = new THREE.Mesh(vesselGeo, ceramicMat);
  vesselMesh.name = "ceramic_pedestal_bowl";
  vesselMesh.castShadow = true;
  vesselMesh.receiveShadow = true;
  group.add(vesselMesh);

  // Wax fill
  const waxGeo = new THREE.CylinderGeometry(WAX_R, WAX_R * 0.92, WAX_H, RADIAL_SEGMENTS);
  const waxMesh = new THREE.Mesh(waxGeo, waxMat);
  waxMesh.name = "candle_wax";
  waxMesh.position.y = WAX_Y - WAX_H * 0.5;
  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  group.add(waxMesh);

  // Teardrop flame profile (LatheGeometry)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.18),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.38),
    new THREE.Vector2(FLAME_R * 0.72, FLAME_H * 0.65),
    new THREE.Vector2(FLAME_R * 0.25, FLAME_H * 0.88),
    new THREE.Vector2(0, FLAME_H),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const wickGeo = new THREE.CylinderGeometry(WICK_R * 0.85, WICK_R, WICK_H, 8);

  for (let i = 0; i < WICK_COUNT; i++) {
    const angle = (i / WICK_COUNT) * Math.PI * 2;
    const wx = Math.cos(angle) * WICK_RING_R;
    const wz = Math.sin(angle) * WICK_RING_R;

    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.name = `wick_${i + 1}`;
    wick.position.set(wx, WAX_Y + WICK_H * 0.5 - 0.002, wz);
    wick.castShadow = true;
    wick.receiveShadow = true;
    group.add(wick);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.name = `emit_flame_${i + 1}`;
    flame.position.set(wx, WAX_Y + WICK_H - 0.003, wz);
    flame.castShadow = true;
    flame.receiveShadow = true;
    group.add(flame);
  }

  return group;
}
