function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.45;
  const H = 0.45;
  const D = 0.14;

  const BEVEL_SIZE = 0.045;
  const BEVEL_THICKNESS = 0.06;
  const BODY_DEPTH = D - 2 * BEVEL_THICKNESS;
  const CORNER_R = 0.03;

  const GRID_N = 4;
  const PATCH_AREA = 0.36;
  const PATCH_STEP = PATCH_AREA / GRID_N;
  const PATCH_SIZE = PATCH_STEP * 0.94;
  const PATCH_BEVEL = 0.003;
  const PATCH_DEPTH = 0.002;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.9,
    metalness: 0.0,
  });

  const ginghamMat = new THREE.MeshStandardMaterial({
    color: 0xd6cab4,
    roughness: 0.92,
    metalness: 0.0,
  });

  const pearMat = new THREE.MeshStandardMaterial({
    color: 0xe8dfc8,
    roughness: 0.88,
    metalness: 0.0,
  });

  // Helper to create a rounded-rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(radius, hw, hh);
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  // Main pillow body
  const bodyShape = createRoundedRectShape(
    W - 2 * BEVEL_SIZE,
    H - 2 * BEVEL_SIZE,
    CORNER_R
  );
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_THICKNESS,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 10,
    curveSegments: 12,
  });
  bodyGeo.translate(0, 0, -BODY_DEPTH / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, creamMat);
  bodyMesh.name = 'pillow_body';
  bodyMesh.position.set(0, H / 2, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 4x4 patchwork grid on the front (+Z) face
  // 0 = cream, 1 = gingham, 2 = pear print
  const pattern = [
    [2, 1, 0, 2],
    [1, 0, 1, 0],
    [0, 1, 2, 2],
    [2, 0, 1, 1],
  ];
  const matMap = [creamMat, ginghamMat, pearMat];
  const nameMap = ['cream', 'gingham', 'pear'];

  const patchShape = createRoundedRectShape(
    PATCH_SIZE - 2 * PATCH_BEVEL,
    PATCH_SIZE - 2 * PATCH_BEVEL,
    0.005
  );
  const patchGeo = new THREE.ExtrudeGeometry(patchShape, {
    depth: PATCH_DEPTH,
    bevelEnabled: true,
    bevelThickness: PATCH_BEVEL,
    bevelSize: PATCH_BEVEL,
    bevelSegments: 3,
    curveSegments: 4,
  });

  const startOffset = -PATCH_AREA / 2 + PATCH_STEP / 2;
  const frontZ = D / 2 - PATCH_DEPTH - PATCH_BEVEL * 0.5;

  for (let row = 0; row < GRID_N; row++) {
    for (let col = 0; col < GRID_N; col++) {
      const typeIdx = pattern[row][col];
      const patch = new THREE.Mesh(patchGeo, matMap[typeIdx]);
      patch.name = `patch_${row}_${col}_${nameMap[typeIdx]}`;
      const px = startOffset + col * PATCH_STEP;
      const py = H / 2 + (PATCH_AREA / 2 - PATCH_STEP / 2) - row * PATCH_STEP;
      patch.position.set(px, py, frontZ);
      patch.castShadow = true;
      patch.receiveShadow = true;
      group.add(patch);
    }
  }

  return group;
}
