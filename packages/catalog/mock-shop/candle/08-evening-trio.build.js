function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const CANDLE_H = 0.068;
  const R_BOTTOM = 0.025;
  const R_TOP = 0.031;
  const WALL_T = 0.003;
  const BASE_T = 0.005;
  const WAX_H = 0.052;
  const WICK_R = 0.0012;
  const WICK_H = 0.011;
  const FLAME_H = 0.014;
  const FLAME_R = 0.0038;

  // Triangle arrangement (side = 0.085m)
  const SPACING = 0.085;
  const TRI_H = SPACING * Math.sqrt(3) / 2;
  const Z_OFFSET = TRI_H / 2;
  const X_OFFSET = SPACING / 2;

  const positions = [
    { x: 0, z: Z_OFFSET },
    { x: -X_OFFSET, z: -Z_OFFSET },
    { x: X_OFFSET, z: -Z_OFFSET }
  ];

  // Materials
  const holderMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0e6d2,
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebd6,
    roughness: 0.6,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd6c8b0,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff8c1a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // Holder profile (LatheGeometry)
  const holderPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_BOTTOM - 0.002, 0),
    new THREE.Vector2(R_BOTTOM, 0.002),
    new THREE.Vector2(R_TOP, CANDLE_H - 0.002),
    new THREE.Vector2(R_TOP - WALL_T * 0.5, CANDLE_H),
    new THREE.Vector2(R_TOP - WALL_T, CANDLE_H - 0.002),
    new THREE.Vector2(R_BOTTOM - WALL_T, BASE_T),
    new THREE.Vector2(0, BASE_T)
  ];
  const holderGeo = new THREE.LatheGeometry(holderPoints, 28);

  // Wax geometry (tapered cylinder fitting inside holder)
  const waxBottomR = R_BOTTOM - WALL_T + 0.0005;
  const waxTopR = waxBottomR + (R_TOP - R_BOTTOM) * (WAX_H / CANDLE_H);
  const waxGeo = new THREE.CylinderGeometry(waxTopR, waxBottomR, WAX_H, 24);

  // Wick geometry
  const wickGeo = new THREE.CylinderGeometry(WICK_R * 0.85, WICK_R, WICK_H, 10);

  // Flame teardrop geometry
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.85, FLAME_H * 0.22),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.42),
    new THREE.Vector2(FLAME_R * 0.55, FLAME_H * 0.72),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);

  positions.forEach((pos, idx) => {
    const num = idx + 1;

    const holder = new THREE.Mesh(holderGeo, holderMat);
    holder.name = `candle_holder_${num}`;
    holder.position.set(pos.x, 0, pos.z);
    holder.castShadow = true;
    holder.receiveShadow = true;
    group.add(holder);

    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.name = `candle_wax_${num}`;
    wax.position.set(pos.x, BASE_T + WAX_H / 2, pos.z);
    wax.castShadow = true;
    wax.receiveShadow = true;
    group.add(wax);

    const wickY = BASE_T + WAX_H + WICK_H / 2 - 0.002;
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.name = `candle_wick_${num}`;
    wick.position.set(pos.x, wickY, pos.z);
    wick.castShadow = true;
    wick.receiveShadow = true;
    group.add(wick);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.name = `emit_flame_${num}`;
    flame.position.set(pos.x, BASE_T + WAX_H + WICK_H - 0.003, pos.z);
    flame.castShadow = true;
    flame.receiveShadow = true;
    group.add(flame);
  });

  return group;
}
