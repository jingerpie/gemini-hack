function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.44;
  const H = 0.45;
  const D = 0.36;
  const T = 0.018; // Plywood thickness
  const R = 0.06;  // Outer corner radius at top
  const GAP = 0.006; // Nesting clearance per side
  const STEP_H = 0.042; // Height step between nested stools

  // Materials
  const birchMat = new THREE.MeshStandardMaterial({
    color: 0xd8be98,
    roughness: 0.65,
    metalness: 0.0,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6c86a,
    roughness: 0.55,
    metalness: 0.0,
  });

  // Helper to create a pill-shaped handle hole in YZ plane (drawn in 2D XY for ExtrudeGeometry)
  function createHandleHole(cx, cy, hw, hh) {
    const hole = new THREE.Path();
    const r = hh;
    const straight = hw - r;
    hole.moveTo(cx - straight, cy - r);
    hole.lineTo(cx + straight, cy - r);
    hole.absarc(cx + straight, cy, r, -Math.PI / 2, Math.PI / 2, false);
    hole.lineTo(cx - straight, cy + r);
    hole.absarc(cx - straight, cy, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    return hole;
  }

  // Helper to create a single bent-plywood stool
  function createStool(index, width, height, depth) {
    const stoolGroup = new THREE.Group();
    const halfW = width / 2;
    const halfD = depth / 2;
    const outerR = Math.min(R, halfW * 0.4);
    const innerR = Math.max(0.01, outerR - T);

    // 1. Top arch (yellow painted top + curved shoulders)
    // Drawn in XY plane, extruded along Z
    const archStartY = height - outerR - 0.025;
    const archShape = new THREE.Shape();
    // Start at bottom-left outer edge of arch
    archShape.moveTo(-halfW, archStartY);
    archShape.lineTo(-halfW, height - outerR);
    archShape.absarc(-halfW + outerR, height - outerR, outerR, Math.PI, Math.PI / 2, true);
    archShape.lineTo(halfW - outerR, height);
    archShape.absarc(halfW - outerR, height - outerR, outerR, Math.PI / 2, 0, true);
    archShape.lineTo(halfW, archStartY);
    // Inner edge
    archShape.lineTo(halfW - T, archStartY);
    archShape.lineTo(halfW - T, height - outerR);
    archShape.absarc(halfW - outerR, height - outerR, innerR, 0, Math.PI / 2, false);
    archShape.lineTo(-halfW + outerR, height - T);
    archShape.absarc(-halfW + outerR, height - outerR, innerR, Math.PI / 2, Math.PI, false);
    archShape.lineTo(-halfW + T, archStartY);
    archShape.closePath();

    const archGeo = new THREE.ExtrudeGeometry(archShape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 20,
    });
    archGeo.translate(0, 0, -halfD);

    const archMesh = new THREE.Mesh(archGeo, yellowMat);
    archMesh.name = `stool_${index}_top_arch`;
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    stoolGroup.add(archMesh);

    // 2. Side panels (natural birch wood, with rounded bottom corners and handle cutout)
    // Drawn in 2D (representing Z and Y), extruded along X
    const sideHeight = archStartY + 0.002; // Slight overlap with arch
    const botR = 0.025;
    const sideShape = new THREE.Shape();
    sideShape.moveTo(-halfD + botR, 0);
    sideShape.lineTo(halfD - botR, 0);
    sideShape.absarc(halfD - botR, botR, botR, -Math.PI / 2, 0, false);
    sideShape.lineTo(halfD, sideHeight);
    sideShape.lineTo(-halfD, sideHeight);
    sideShape.lineTo(-halfD, botR);
    sideShape.absarc(-halfD + botR, botR, botR, Math.PI, (3 * Math.PI) / 2, false);

    // Handle cutout
    const handleY = sideHeight - 0.045;
    const handleHole = createHandleHole(0, handleY, 0.048, 0.016);
    sideShape.holes.push(handleHole);

    const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
      depth: T,
      bevelEnabled: false,
      curveSegments: 16,
    });
    // Rotate so 2D X becomes Z, 2D Y stays Y, extrusion depth becomes X
    sideGeo.rotateY(Math.PI / 2);

    const leftSide = new THREE.Mesh(sideGeo, birchMat);
    leftSide.name = `stool_${index}_left_side`;
    leftSide.position.x = -halfW;
    leftSide.castShadow = true;
    leftSide.receiveShadow = true;
    stoolGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, birchMat);
    rightSide.name = `stool_${index}_right_side`;
    rightSide.position.x = halfW - T;
    rightSide.castShadow = true;
    rightSide.receiveShadow = true;
    stoolGroup.add(rightSide);

    return stoolGroup;
  }

  // Create the 3 nested stools
  for (let i = 0; i < 3; i++) {
    const w = W - i * 2 * (T + GAP);
    const h = H - i * STEP_H;
    const d = D;
    const stool = createStool(i + 1, w, h, d);
    group.add(stool);
  }

  return group;
}
