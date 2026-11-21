function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.60;        // total width (X)
  const D = 0.90;        // total depth/length (Z)
  const H = 0.016;       // total thickness (Y)
  const BEVEL = 0.002;   // bevel thickness for braided ridge effect
  const BEVEL_SIZE = 0.0015;
  const EXTRUDE_D = H - BEVEL * 2;
  const CURVE_SEGS = 28;

  // Materials
  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x612d16,
    roughness: 0.9,
    metalness: 0.0,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xebe3d3,
    roughness: 0.88,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x2c1c12,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Helper to create a stadium (capsule-like oval) Path/Shape centered at (0, 0)
  function createStadiumShape(width, depth, isHole) {
    const r = width / 2;
    const straightHalf = Math.max(0, (depth - width) / 2);
    const path = isHole ? new THREE.Path() : new THREE.Shape();

    if (!isHole) {
      // Counter-clockwise
      path.absarc(0, straightHalf, r, 0, Math.PI, false);
      path.lineTo(-r, -straightHalf);
      path.absarc(0, -straightHalf, r, Math.PI, Math.PI * 2, false);
      path.lineTo(r, straightHalf);
    } else {
      // Clockwise for hole
      path.absarc(0, straightHalf, r, Math.PI, 0, true);
      path.lineTo(r, -straightHalf);
      path.absarc(0, -straightHalf, r, Math.PI * 2, Math.PI, true);
      path.lineTo(-r, straightHalf);
    }
    return path;
  }

  function createBandMesh(name, wOut, dOut, wIn, dIn, mat, yOffset, thickness) {
    // Compensate for bevel expansion/contraction so adjacent bands do not overlap
    const adjWOut = wOut - BEVEL_SIZE * 2.05;
    const adjDOut = dOut - BEVEL_SIZE * 2.05;
    const shape = createStadiumShape(adjWOut, adjDOut, false);

    if (wIn > 0 && dIn > 0) {
      const adjWIn = wIn + BEVEL_SIZE * 2.05;
      const adjDIn = dIn + BEVEL_SIZE * 2.05;
      if (adjWIn < adjWOut && adjDIn < adjDOut) {
        const hole = createStadiumShape(adjWIn, adjDIn, true);
        shape.holes.push(hole);
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL_SIZE,
      bevelSegments: 2,
      curveSegments: CURVE_SEGS,
    });

    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.y = yOffset;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Thin backing pad at y = 0
  const padShape = createStadiumShape(W - 0.02, D - 0.02, false);
  const padGeo = new THREE.ExtrudeGeometry(padShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: CURVE_SEGS,
  });
  padGeo.rotateX(-Math.PI / 2);
  const padMesh = new THREE.Mesh(padGeo, backingMat);
  padMesh.name = 'rug_backing_pad';
  padMesh.position.y = 0;
  padMesh.castShadow = true;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Concentric braided bands from center outward
  // Each ring has [name, innerRatio, outerRatio, material]
  const bands = [
    ['center_brown_core',       0.00, 0.14, brownMat],
    ['center_brown_ring',       0.14, 0.25, brownMat],
    ['inner_cream_ring_1',      0.25, 0.33, creamMat],
    ['inner_cream_ring_2',      0.33, 0.41, creamMat],
    ['inner_brown_stripe',      0.41, 0.48, brownMat],
    ['middle_cream_ring_1',     0.48, 0.56, creamMat],
    ['middle_cream_ring_2',     0.56, 0.64, creamMat],
    ['outer_brown_stripe',      0.64, 0.72, brownMat],
    ['outer_cream_ring_1',      0.72, 0.81, creamMat],
    ['outer_cream_ring_2',      0.81, 0.90, creamMat],
    ['outer_brown_border_1',    0.90, 0.95, brownMat],
    ['outer_brown_border_2',    0.95, 1.00, brownMat],
  ];

  const baseY = BEVEL;
  const maxOffset = W / 2;

  for (let i = 0; i < bands.length; i++) {
    const [name, rIn, rOut, mat] = bands[i];
    const insetOut = (1.0 - rOut) * maxOffset * 2;
    const insetIn = (1.0 - rIn) * maxOffset * 2;

    const wOut = W - insetOut;
    const dOut = D - insetOut;
    const wIn = rIn === 0 ? 0 : W - insetIn;
    const dIn = rIn === 0 ? 0 : D - insetIn;

    const mesh = createBandMesh(name, wOut, dOut, wIn, dIn, mat, baseY, EXTRUDE_D);
    group.add(mesh);
  }

  return group;
}
