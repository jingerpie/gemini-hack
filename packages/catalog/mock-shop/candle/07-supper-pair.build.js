function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_W = 0.16;
  const BASE_D = 0.075;
  const BASE_H = 0.020;
  const BASE_BEVEL = 0.004;

  const CUP_R = 0.019;
  const CUP_H = 0.028;
  const CUP_OFFSET_X = 0.034;

  const CANDLE_H = 0.235;
  const CANDLE_R_BOT = 0.011;
  const CANDLE_R_TOP = 0.008;
  const WICK_R = 0.0011;
  const WICK_H = 0.012;
  const FLAME_H = 0.018;
  const FLAME_R = 0.0045;

  const LABEL_W = 0.028;
  const LABEL_H = 0.015;
  const LABEL_T = 0.001;

  // Materials
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xeae5dc,
    roughness: 0.72,
    metalness: 0.02
  });

  const waxMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4e3b5,
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c0,
    roughness: 0.9,
    metalness: 0.0
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece4,
    roughness: 0.85,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffdd77,
    emissive: 0xff9922,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function makeMesh(geom, mat, name) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Ceramic Base (stadium / pill shape)
  const r = BASE_D / 2 - BASE_BEVEL;
  const straightHalf = BASE_W / 2 - BASE_D / 2;
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-straightHalf, -r);
  baseShape.lineTo(straightHalf, -r);
  baseShape.absarc(straightHalf, 0, r, -Math.PI / 2, Math.PI / 2, false);
  baseShape.lineTo(-straightHalf, r);
  baseShape.absarc(-straightHalf, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);

  const extrudeDepth = BASE_H - BASE_BEVEL * 2;
  const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: BASE_BEVEL,
    bevelSize: BASE_BEVEL,
    bevelSegments: 4,
    curveSegments: 24
  });
  baseGeom.rotateX(-Math.PI / 2);
  baseGeom.translate(0, BASE_BEVEL, 0);

  const baseMesh = makeMesh(baseGeom, ceramicMat, 'ceramic_base');
  group.add(baseMesh);

  // 2. Paper Label on front-center of base
  const labelGeom = new THREE.BoxGeometry(LABEL_W, LABEL_H, LABEL_T);
  const labelMesh = makeMesh(labelGeom, labelMat, 'brand_label');
  labelMesh.position.set(0, BASE_H / 2, BASE_D / 2 + LABEL_T * 0.2);
  group.add(labelMesh);

  // 3. Candle Cups, Candles, Wicks, and Flames
  const cupPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(CUP_R, 0),
    new THREE.Vector2(CUP_R, CUP_H - 0.002),
    new THREE.Vector2(CUP_R - 0.002, CUP_H),
    new THREE.Vector2(CANDLE_R_BOT + 0.001, CUP_H),
    new THREE.Vector2(CANDLE_R_BOT + 0.001, CUP_H - 0.004),
    new THREE.Vector2(0, CUP_H - 0.004)
  ];
  const cupGeom = new THREE.LatheGeometry(cupPoints, 28);

  const candlePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(CANDLE_R_BOT, 0),
    new THREE.Vector2(CANDLE_R_TOP, CANDLE_H - 0.012),
    new THREE.Vector2(CANDLE_R_TOP * 0.72, CANDLE_H - 0.005),
    new THREE.Vector2(CANDLE_R_TOP * 0.35, CANDLE_H - 0.001),
    new THREE.Vector2(0, CANDLE_H)
  ];
  const candleGeom = new THREE.LatheGeometry(candlePoints, 24);

  const wickGeom = new THREE.CylinderGeometry(WICK_R * 0.8, WICK_R, WICK_H, 8);

  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.7, FLAME_H * 0.15),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.65, FLAME_H * 0.65),
    new THREE.Vector2(FLAME_R * 0.2, FLAME_H * 0.88),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeom = new THREE.LatheGeometry(flamePoints, 16);

  const sides = [
    { name: 'left', x: -CUP_OFFSET_X },
    { name: 'right', x: CUP_OFFSET_X }
  ];

  const cupBaseY = BASE_H - 0.002;
  const candleBaseY = cupBaseY + CUP_H - 0.004;
  const wickBaseY = candleBaseY + CANDLE_H - 0.001;
  const flameBaseY = wickBaseY + WICK_H - 0.002;

  for (const side of sides) {
    const cup = makeMesh(cupGeom, ceramicMat, `candle_cup_${side.name}`);
    cup.position.set(side.x, cupBaseY, 0);
    group.add(cup);

    const candle = makeMesh(candleGeom, waxMat, `taper_candle_${side.name}`);
    candle.position.set(side.x, candleBaseY, 0);
    group.add(candle);

    const wick = makeMesh(wickGeom, wickMat, `candle_wick_${side.name}`);
    wick.position.set(side.x, wickBaseY + WICK_H / 2, 0);
    group.add(wick);

    const flame = makeMesh(flameGeom, flameMat, `emit_flame_${side.name}`);
    flame.position.set(side.x, flameBaseY, 0);
    group.add(flame);
  }

  return group;
}
