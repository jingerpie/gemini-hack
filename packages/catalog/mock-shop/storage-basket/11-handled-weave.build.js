function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.52;
  const D = 0.36;
  const BODY_H = 0.28;
  const HANDLE_H = 0.10;
  const WALL_T = 0.018;
  const BOTTOM_R_X = 0.195;
  const TOP_R_X = W * 0.5;
  const Z_SCALE = D / W;

  // Materials
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xc59b68,
    roughness: 0.85,
    metalness: 0.02,
  });

  const strawAltMat = new THREE.MeshStandardMaterial({
    color: 0xb68a57,
    roughness: 0.88,
    metalness: 0.02,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xd0a875,
    roughness: 0.80,
    metalness: 0.02,
  });

  // 1. Hollow basket body shell (LatheGeometry scaled to oval)
  const shellPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BOTTOM_R_X - 0.01, 0.0),
    new THREE.Vector2(BOTTOM_R_X, 0.015),
    new THREE.Vector2(TOP_R_X - 0.008, BODY_H - 0.015),
    new THREE.Vector2(TOP_R_X, BODY_H),
    new THREE.Vector2(TOP_R_X - WALL_T, BODY_H),
    new THREE.Vector2(BOTTOM_R_X - WALL_T, 0.022),
    new THREE.Vector2(0.0, 0.022),
  ];
  const shellGeo = new THREE.LatheGeometry(shellPts, 32);
  const shellMesh = new THREE.Mesh(shellGeo, strawAltMat);
  shellMesh.scale.set(1, 1, Z_SCALE);
  shellMesh.name = 'basket_body_shell';
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  group.add(shellMesh);

  // 2. Horizontal woven rows along the exterior
  const ROW_COUNT = 14;
  const ROW_START_Y = 0.022;
  const ROW_END_Y = BODY_H - 0.024;
  for (let i = 0; i < ROW_COUNT; i++) {
    const t = i / (ROW_COUNT - 1);
    const y = ROW_START_Y + t * (ROW_END_Y - ROW_START_Y);
    const rX = BOTTOM_R_X + t * (TOP_R_X - BOTTOM_R_X - 0.006);
    const tubeR = 0.0095;

    const rowGeo = new THREE.TorusGeometry(rX, tubeR, 8, 32);
    rowGeo.rotateX(Math.PI / 2);
    const rowMesh = new THREE.Mesh(rowGeo, i % 2 === 0 ? strawMat : strawAltMat);
    rowMesh.position.y = y;
    rowMesh.scale.set(1, 1, Z_SCALE);
    rowMesh.name = `woven_row_${String(i + 1).padStart(2, '0')}`;
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    group.add(rowMesh);
  }

  // 3. Bottom base ring
  const baseGeo = new THREE.TorusGeometry(BOTTOM_R_X - 0.005, 0.008, 8, 32);
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, strawMat);
  baseMesh.position.y = 0.008;
  baseMesh.scale.set(1, 1, Z_SCALE);
  baseMesh.name = 'basket_base_ring';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 4. Thick braided top rim
  const rimGeo = new THREE.TorusGeometry(TOP_R_X - 0.006, 0.015, 10, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, strawMat);
  rimMesh.position.y = BODY_H - 0.004;
  rimMesh.scale.set(1, 1, Z_SCALE);
  rimMesh.name = 'basket_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 5. Arched handles on -X and +X sides
  const HANDLE_SPAN_Z = 0.095;
  const HANDLE_X = TOP_R_X - 0.012;
  const HANDLE_BASE_Y = BODY_H - 0.01;
  const HANDLE_PEAK_Y = BODY_H + HANDLE_H;

  const sides = [
    { sign: -1, label: 'left' },
    { sign: 1, label: 'right' },
  ];

  for (const side of sides) {
    const xPos = side.sign * HANDLE_X;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xPos, HANDLE_BASE_Y, -HANDLE_SPAN_Z),
      new THREE.Vector3(xPos + side.sign * 0.012, HANDLE_PEAK_Y * 0.92, -HANDLE_SPAN_Z * 0.65),
      new THREE.Vector3(xPos + side.sign * 0.016, HANDLE_PEAK_Y, 0),
      new THREE.Vector3(xPos + side.sign * 0.012, HANDLE_PEAK_Y * 0.92, HANDLE_SPAN_Z * 0.65),
      new THREE.Vector3(xPos, HANDLE_BASE_Y, HANDLE_SPAN_Z),
    ]);

    const handleGeo = new THREE.TubeGeometry(curve, 24, 0.011, 10, false);
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.name = `handle_${side.label}`;
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    group.add(handleMesh);

    // Handle binding wraps at the rim
    for (const zSign of [-1, 1]) {
      const bindGeo = new THREE.TorusGeometry(0.015, 0.005, 8, 16);
      const bindMesh = new THREE.Mesh(bindGeo, strawAltMat);
      bindMesh.position.set(xPos, HANDLE_BASE_Y + 0.008, zSign * HANDLE_SPAN_Z);
      bindMesh.rotation.y = Math.PI / 2;
      bindMesh.name = `handle_bind_${side.label}_${zSign < 0 ? 'back' : 'front'}`;
      bindMesh.castShadow = true;
      bindMesh.receiveShadow = true;
      group.add(bindMesh);
    }
  }

  return group;
}
