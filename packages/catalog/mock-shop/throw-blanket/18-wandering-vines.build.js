function build(THREE) {
  const group = new THREE.Group();

  const W = 0.48;
  const D = 0.36;
  const LAYER_H = 0.03;
  const BEVEL = 0.008;
  const CORNER_R = 0.028;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xede8dc,
    roughness: 0.92,
    metalness: 0.0
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x4a4536,
    roughness: 0.92,
    metalness: 0.0
  });

  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x4b4237,
    roughness: 0.88,
    metalness: 0.0
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x7c8a6e,
    roughness: 0.88,
    metalness: 0.0
  });

  const fringeMat = new THREE.MeshStandardMaterial({
    color: 0xc8bfae,
    roughness: 0.95,
    metalness: 0.0
  });

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

  const innerW = W - 2 * BEVEL;
  const innerD = D - 2 * BEVEL;
  const extrudeDepth = LAYER_H - 2 * BEVEL;
  const layerShape = createRoundedRectShape(innerW, innerD, CORNER_R);
  const layerGeo = new THREE.ExtrudeGeometry(layerShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12
  });
  layerGeo.rotateX(-Math.PI / 2);

  const layerOverlap = 0.003;
  const layerNames = ['blanket_layer_bottom', 'blanket_layer_middle', 'blanket_layer_top'];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(layerGeo, creamMat);
    mesh.name = layerNames[i];
    mesh.position.y = BEVEL + i * (LAYER_H - layerOverlap);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const topSurfaceY = BEVEL + 2 * (LAYER_H - layerOverlap) + extrudeDepth + BEVEL;

  // Folded spines connecting layers on alternating sides (-Z and +Z)
  const spineGeo = new THREE.CapsuleGeometry(LAYER_H * 0.55, W - CORNER_R * 2, 8, 16);
  spineGeo.rotateZ(Math.PI / 2);

  const spine1 = new THREE.Mesh(spineGeo, creamMat);
  spine1.name = 'fold_spine_back';
  spine1.position.set(0, LAYER_H - layerOverlap * 0.5, -D / 2 + BEVEL * 0.6);
  spine1.castShadow = true;
  spine1.receiveShadow = true;
  group.add(spine1);

  const spine2 = new THREE.Mesh(spineGeo, creamMat);
  spine2.name = 'fold_spine_front';
  spine2.position.set(0, 2 * (LAYER_H - layerOverlap) + BEVEL * 0.2, D / 2 - BEVEL * 0.6);
  spine2.castShadow = true;
  spine2.receiveShadow = true;
  group.add(spine2);

  // Subtle dark olive backing trim visible along the right edge of the top layer
  const trimGeo = new THREE.CapsuleGeometry(0.005, D - CORNER_R * 2.5, 6, 12);
  trimGeo.rotateX(Math.PI / 2);
  const trimMesh = new THREE.Mesh(trimGeo, backingMat);
  trimMesh.name = 'backing_edge_trim';
  trimMesh.position.set(W / 2 - BEVEL * 0.5, topSurfaceY - LAYER_H * 0.5, 0);
  trimMesh.castShadow = true;
  trimMesh.receiveShadow = true;
  group.add(trimMesh);

  // Wandering vines on the top surface
  const vinePaths = [
    [
      new THREE.Vector3(-0.18, topSurfaceY - 0.001, -0.12),
      new THREE.Vector3(-0.10, topSurfaceY + 0.001, -0.04),
      new THREE.Vector3(-0.02, topSurfaceY + 0.001, 0.03),
      new THREE.Vector3(0.08, topSurfaceY + 0.001, 0.11)
    ],
    [
      new THREE.Vector3(-0.14, topSurfaceY - 0.001, 0.10),
      new THREE.Vector3(-0.04, topSurfaceY + 0.001, 0.06),
      new THREE.Vector3(0.06, topSurfaceY + 0.001, -0.02),
      new THREE.Vector3(0.17, topSurfaceY - 0.001, -0.09)
    ],
    [
      new THREE.Vector3(0.02, topSurfaceY + 0.001, -0.13),
      new THREE.Vector3(0.09, topSurfaceY + 0.001, -0.05),
      new THREE.Vector3(0.15, topSurfaceY + 0.001, 0.06)
    ]
  ];

  vinePaths.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.0028, 8, false);
    const vineMesh = new THREE.Mesh(tubeGeo, vineMat);
    vineMesh.name = `vine_stem_${idx + 1}`;
    vineMesh.castShadow = true;
    vineMesh.receiveShadow = true;
    group.add(vineMesh);
  });

  // Sage green leaves along the vines
  const leafGeo = new THREE.SphereGeometry(0.014, 12, 8);
  leafGeo.scale(1.5, 0.22, 0.7);

  const leafPlacements = [
    { x: -0.14, z: -0.08, ry: 0.6 },
    { x: -0.08, z: -0.01, ry: -0.5 },
    { x: -0.01, z: 0.06, ry: 0.8 },
    { x: 0.05, z: 0.09, ry: -0.4 },
    { x: -0.10, z: 0.09, ry: -0.7 },
    { x: -0.02, z: 0.02, ry: 0.4 },
    { x: 0.08, z: -0.04, ry: -0.6 },
    { x: 0.14, z: -0.07, ry: 0.5 },
    { x: 0.05, z: -0.10, ry: 0.9 },
    { x: 0.12, z: 0.02, ry: -0.8 }
  ];

  leafPlacements.forEach((p, idx) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.name = `vine_leaf_${idx + 1}`;
    leaf.position.set(p.x, topSurfaceY + 0.0005, p.z);
    leaf.rotation.y = p.ry;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  });

  // Fringe tassels along the right (+X) edge of the top layer
  const fringeCount = 12;
  const fringeGeo = new THREE.CapsuleGeometry(0.0025, 0.022, 4, 8);
  fringeGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < fringeCount; i++) {
    const zPos = -D * 0.38 + (i / (fringeCount - 1)) * (D * 0.76);
    const tassel = new THREE.Mesh(fringeGeo, fringeMat);
    tassel.name = `fringe_tassel_${i + 1}`;
    tassel.position.set(W / 2 + 0.01, topSurfaceY - LAYER_H * 0.45, zPos);
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
