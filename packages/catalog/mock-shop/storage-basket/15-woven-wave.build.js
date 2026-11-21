function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.30;
  const RADIUS = DIAMETER / 2;
  const BODY_H = 0.28;
  const WALL_T = 0.014;
  const HANDLE_H = 0.095;
  const HANDLE_SPREAD = 0.075;
  const CORD_R = 0.0045;
  const WAVE_COUNT = 10;
  const WAVE_CYCLES = 6;
  const WAVE_AMP = 0.012;
  const WAVE_START_Y = 0.065;
  const WAVE_STEP_Y = 0.0135;

  // Materials
  const creamRopeMat = new THREE.MeshStandardMaterial({
    color: 0xe8dec8,
    roughness: 0.92,
    metalness: 0.0,
  });

  const tanRopeMat = new THREE.MeshStandardMaterial({
    color: 0xd4c2a5,
    roughness: 0.94,
    metalness: 0.0,
  });

  const handleRopeMat = new THREE.MeshStandardMaterial({
    color: 0xebe2cf,
    roughness: 0.9,
    metalness: 0.0,
  });

  // 1. Main Basket Body (LatheGeometry)
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(RADIUS * 0.84, 0),
    new THREE.Vector2(RADIUS * 0.93, 0.008),
    new THREE.Vector2(RADIUS * 0.97, 0.028),
    new THREE.Vector2(RADIUS * 0.99, BODY_H * 0.5),
    new THREE.Vector2(RADIUS, BODY_H - 0.012),
    new THREE.Vector2(RADIUS, BODY_H),
    new THREE.Vector2(RADIUS - WALL_T * 0.5, BODY_H + 0.004),
    new THREE.Vector2(RADIUS - WALL_T, BODY_H),
    new THREE.Vector2(RADIUS - WALL_T - 0.004, BODY_H * 0.5),
    new THREE.Vector2(RADIUS - WALL_T - 0.008, 0.025),
    new THREE.Vector2(0, 0.016),
  ];

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, creamRopeMat);
  bodyMesh.name = 'basket_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Top Rim & Base Coiled Cords
  const rimGeo = new THREE.TorusGeometry(RADIUS - WALL_T * 0.5, WALL_T * 0.52, 10, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, creamRopeMat);
  rimMesh.position.y = BODY_H;
  rimMesh.name = 'basket_rim_cord';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  const baseCordGeo = new THREE.TorusGeometry(RADIUS * 0.955, CORD_R, 8, 32);
  baseCordGeo.rotateX(Math.PI / 2);
  const baseCordMesh = new THREE.Mesh(baseCordGeo, creamRopeMat);
  baseCordMesh.position.y = 0.022;
  baseCordMesh.name = 'basket_base_cord';
  baseCordMesh.castShadow = true;
  baseCordMesh.receiveShadow = true;
  group.add(baseCordMesh);

  // 3. Woven Wave Cords around the middle band
  const waveSegments = 48;
  for (let i = 0; i < WAVE_COUNT; i++) {
    const baseY = WAVE_START_Y + i * WAVE_STEP_Y;
    const t = baseY / BODY_H;
    const r = RADIUS * (0.975 + 0.025 * t) + 0.0025;
    const points = [];

    for (let j = 0; j < waveSegments; j++) {
      const theta = (j / waveSegments) * Math.PI * 2;
      const y = baseY + WAVE_AMP * Math.sin(WAVE_CYCLES * theta);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points, true);
    const waveGeo = new THREE.TubeGeometry(curve, 64, CORD_R, 8, true);
    const mat = i % 2 === 0 ? tanRopeMat : creamRopeMat;
    const waveMesh = new THREE.Mesh(waveGeo, mat);
    waveMesh.name = `wave_cord_${String(i + 1).padStart(2, '0')}`;
    waveMesh.castShadow = true;
    waveMesh.receiveShadow = true;
    group.add(waveMesh);
  }

  // 4. Two Arched Rope Handles (left -X and right +X)
  const handleSides = [
    { name: 'left', sign: -1 },
    { name: 'right', sign: 1 },
  ];

  const handleR = 0.0085;
  const attachY = BODY_H - 0.032;
  const rimR = RADIUS - WALL_T * 0.25;

  handleSides.forEach((side) => {
    const xBase = side.sign * (RADIUS + 0.003);
    const xRim = side.sign * rimR;

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xBase, attachY, -HANDLE_SPREAD),
      new THREE.Vector3(xRim, BODY_H + 0.015, -HANDLE_SPREAD * 0.88),
      new THREE.Vector3(xRim * 0.94, BODY_H + HANDLE_H, 0),
      new THREE.Vector3(xRim, BODY_H + 0.015, HANDLE_SPREAD * 0.88),
      new THREE.Vector3(xBase, attachY, HANDLE_SPREAD),
    ]);

    const handleGeo = new THREE.TubeGeometry(handleCurve, 28, handleR, 10, false);
    const handleMesh = new THREE.Mesh(handleGeo, handleRopeMat);
    handleMesh.name = `handle_${side.name}`;
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    group.add(handleMesh);

    // Handle attachment tabs
    const tabGeo = new THREE.BoxGeometry(0.012, 0.026, 0.02);
    const zOffsets = [-HANDLE_SPREAD, HANDLE_SPREAD];
    const zLabels = ['back', 'front'];

    zOffsets.forEach((zOff, idx) => {
      const tabMesh = new THREE.Mesh(tabGeo, handleRopeMat);
      tabMesh.position.set(xBase, attachY + 0.008, zOff);
      tabMesh.name = `handle_tab_${side.name}_${zLabels[idx]}`;
      tabMesh.castShadow = true;
      tabMesh.receiveShadow = true;
      group.add(tabMesh);
    });
  });

  return group;
}
