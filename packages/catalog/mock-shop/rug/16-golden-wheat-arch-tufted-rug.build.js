function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.61;
  const D = 0.91;
  const H = 0.015;
  const BASE_H = 0.004;
  const PILE_H = H - BASE_H;
  const MOTIF_H = PILE_H + 0.001;

  const HW = W / 2;
  const HD = D / 2;
  const CY = HD - HW;
  const BY = -HD;
  const BOTTOM_BORDER = 0.025;
  const INNER_BY = BY + BOTTOM_BORDER;

  // Materials (tufted wool/cotton)
  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x9c8e78,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xb98527,
    roughness: 0.92,
    metalness: 0.0,
  });
  const beigeMat = new THREE.MeshStandardMaterial({
    color: 0xd8ceb8,
    roughness: 0.92,
    metalness: 0.0,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xede8df,
    roughness: 0.92,
    metalness: 0.0,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xd19884,
    roughness: 0.92,
    metalness: 0.0,
  });
  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0xc5bda6,
    roughness: 0.92,
    metalness: 0.0,
  });

  function createArchShape(r, bottomY, cy) {
    const s = new THREE.Shape();
    s.moveTo(-r, bottomY);
    s.lineTo(r, bottomY);
    s.lineTo(r, cy);
    s.absarc(0, cy, r, 0, Math.PI, false);
    s.lineTo(-r, bottomY);
    return s;
  }

  function addExtrudedMesh(shape, depth, yOffset, mat, name) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 24,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = yOffset;
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Rug backing
  const backingShape = createArchShape(HW, BY, CY);
  addExtrudedMesh(backingShape, BASE_H, 0, backingMat, 'rug_backing');

  // 2. Concentric arch bands
  const bands = [
    { width: 0.025, mat: ochreMat, name: 'outer_ochre_band', outerBottom: BY },
    { width: 0.022, mat: beigeMat, name: 'beige_band', outerBottom: INNER_BY },
    { width: 0.020, mat: ochreMat, name: 'inner_ochre_band', outerBottom: INNER_BY },
    { width: 0.022, mat: creamMat, name: 'cream_band', outerBottom: INNER_BY },
    { width: 0.022, mat: terracottaMat, name: 'terracotta_band', outerBottom: INNER_BY },
    { width: 0.022, mat: taupeMat, name: 'taupe_band', outerBottom: INNER_BY },
  ];

  let currentR = HW;
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const nextR = currentR - b.width;
    const bandShape = createArchShape(currentR, b.outerBottom, CY);
    const holeShape = createArchShape(nextR, INNER_BY, CY);
    bandShape.holes.push(holeShape);
    addExtrudedMesh(bandShape, PILE_H, BASE_H, b.mat, b.name);
    currentR = nextR;
  }

  // 3. Central cream arch field
  const centerFieldShape = createArchShape(currentR, INNER_BY, CY);
  addExtrudedMesh(centerFieldShape, PILE_H, BASE_H, creamMat, 'center_cream_field');

  // 4. Wheat stem
  const stemHalfW = 0.0075;
  const stemTopY = CY + 0.05;
  const stemShape = new THREE.Shape();
  stemShape.moveTo(-stemHalfW, INNER_BY);
  stemShape.lineTo(stemHalfW, INNER_BY);
  stemShape.lineTo(stemHalfW, stemTopY);
  stemShape.lineTo(-stemHalfW, stemTopY);
  stemShape.closePath();
  addExtrudedMesh(stemShape, MOTIF_H, BASE_H, ochreMat, 'wheat_stem');

  // 5. Wheat leaves (7 pairs + 1 top leaf)
  function createLeafShape(length, width) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(width, length * 0.45, 0, length);
    s.quadraticCurveTo(-width, length * 0.45, 0, 0);
    return s;
  }

  const leafGeo = new THREE.ExtrudeGeometry(createLeafShape(0.092, 0.032), {
    depth: MOTIF_H,
    bevelEnabled: false,
    curveSegments: 16,
  });

  const pairCount = 7;
  const startY = -0.36;
  const stepY = 0.08;
  const leafAngle = 0.84;

  for (let i = 0; i < pairCount; i++) {
    const ly = startY + i * stepY;

    const leftLeaf = new THREE.Mesh(leafGeo, ochreMat);
    leftLeaf.rotation.x = -Math.PI / 2;
    leftLeaf.rotation.z = leafAngle;
    leftLeaf.position.set(-0.005, BASE_H, -ly);
    leftLeaf.name = `wheat_leaf_left_${i + 1}`;
    leftLeaf.castShadow = true;
    leftLeaf.receiveShadow = true;
    group.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(leafGeo, ochreMat);
    rightLeaf.rotation.x = -Math.PI / 2;
    rightLeaf.rotation.z = -leafAngle;
    rightLeaf.position.set(0.005, BASE_H, -ly);
    rightLeaf.name = `wheat_leaf_right_${i + 1}`;
    rightLeaf.castShadow = true;
    rightLeaf.receiveShadow = true;
    group.add(rightLeaf);
  }

  const topLeaf = new THREE.Mesh(leafGeo, ochreMat);
  topLeaf.rotation.x = -Math.PI / 2;
  topLeaf.position.set(0, BASE_H, -stemTopY);
  topLeaf.name = 'wheat_leaf_top';
  topLeaf.castShadow = true;
  topLeaf.receiveShadow = true;
  group.add(topLeaf);

  return group;
}
