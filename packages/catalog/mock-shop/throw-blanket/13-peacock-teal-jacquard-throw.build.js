function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.34;
  const LAYER_H = 0.032;
  const GAP = 0.004;
  const BEVEL = 0.012;
  const CORNER_R = 0.025;

  // Materials
  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x0f7a82,
    roughness: 0.88,
    metalness: 0.0
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8dec8,
    roughness: 0.86,
    metalness: 0.0
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc8962e,
    roughness: 0.82,
    metalness: 0.04
  });
  const plumMat = new THREE.MeshStandardMaterial({
    color: 0x8c3b6b,
    roughness: 0.85,
    metalness: 0.0
  });
  const lavenderMat = new THREE.MeshStandardMaterial({
    color: 0x7a5c8e,
    roughness: 0.86,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded rectangle shape
  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2 - r;
    const hd = d / 2 - r;
    shape.moveTo(-hw, -d / 2);
    shape.lineTo(hw, -d / 2);
    shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -hd);
    shape.lineTo(w / 2, hd);
    shape.quadraticCurveTo(w / 2, d / 2, hw, d / 2);
    shape.lineTo(-hw, d / 2);
    shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, hd);
    shape.lineTo(-w / 2, -hd);
    shape.quadraticCurveTo(-w / 2, -d / 2, -hw, -d / 2);
    return shape;
  }

  const slabW = W - BEVEL * 2;
  const slabD = D - BEVEL * 2;
  const slabShape = makeRoundedRectShape(slabW, slabD, CORNER_R);
  const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: LAYER_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8
  });
  slabGeo.rotateX(Math.PI / 2);

  // Bottom folded layer: bottom at y = 0, top at y = LAYER_H
  addMesh(slabGeo, tealMat, 'bottom_fold_layer', 0, LAYER_H - BEVEL, 0);

  // Top folded layer: bottom at y = LAYER_H + GAP, top at y = 2 * LAYER_H + GAP
  const topLayerY = LAYER_H + GAP;
  addMesh(slabGeo, tealMat, 'top_fold_layer', 0, topLayerY + LAYER_H - BEVEL, 0);

  // Rounded fold spine at -Z connecting bottom and top layers
  const spineR = (LAYER_H * 2 + GAP) / 2;
  const spineGeo = new THREE.CylinderGeometry(spineR, spineR, W - CORNER_R * 2, 16);
  spineGeo.rotateZ(Math.PI / 2);
  addMesh(spineGeo, tealMat, 'fold_spine_back', 0, spineR, -D / 2 + spineR * 0.55);

  // Soft hem piping along the +Z front edge of the top layer
  const hemR = 0.005;
  const hemGeo = new THREE.CylinderGeometry(hemR, hemR, W - CORNER_R * 2, 12);
  hemGeo.rotateZ(Math.PI / 2);
  addMesh(hemGeo, tealMat, 'front_hem_piping', 0, topLayerY + LAYER_H * 0.5, D / 2 - hemR * 0.5);

  // Jacquard medallion pattern on top surface
  const topY = topLayerY + LAYER_H;

  // Center medallion
  const petalGeo = new THREE.SphereGeometry(0.032, 12, 8);
  petalGeo.scale(1.0, 0.12, 0.55);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const px = Math.cos(angle) * 0.032;
    const pz = Math.sin(angle) * 0.032;
    addMesh(petalGeo, creamMat, 'center_medallion_petal_' + i, px, topY, pz, 0, -angle, 0);
  }

  const goldRingGeo = new THREE.TorusGeometry(0.028, 0.004, 8, 24);
  goldRingGeo.rotateX(Math.PI / 2);
  addMesh(goldRingGeo, goldMat, 'center_medallion_gold_ring', 0, topY + 0.001, 0);

  const plumCoreGeo = new THREE.SphereGeometry(0.016, 12, 8);
  plumCoreGeo.scale(1.0, 0.18, 1.0);
  addMesh(plumCoreGeo, plumMat, 'center_medallion_plum_core', 0, topY + 0.001, 0);

  // Four diagonal lavender scroll accents around center medallion
  const scrollGeo = new THREE.SphereGeometry(0.022, 10, 8);
  scrollGeo.scale(1.2, 0.12, 0.45);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const sx = Math.cos(angle) * 0.062;
    const sz = Math.sin(angle) * 0.052;
    addMesh(scrollGeo, lavenderMat, 'center_scroll_accent_' + i, sx, topY, sz, 0, -angle, 0);
  }

  // Side medallions (left and right)
  const sidePositions = [
    { x: -0.145, z: 0, prefix: 'left' },
    { x: 0.145, z: 0, prefix: 'right' }
  ];
  const sideCreamGeo = new THREE.SphereGeometry(0.026, 12, 8);
  sideCreamGeo.scale(1.0, 0.12, 0.75);
  const sideGoldGeo = new THREE.TorusGeometry(0.018, 0.0035, 8, 20);
  sideGoldGeo.rotateX(Math.PI / 2);
  const sidePlumGeo = new THREE.SphereGeometry(0.011, 10, 8);
  sidePlumGeo.scale(1.0, 0.18, 1.0);

  for (let s = 0; s < sidePositions.length; s++) {
    const sp = sidePositions[s];
    addMesh(sideCreamGeo, creamMat, sp.prefix + '_medallion_base', sp.x, topY, sp.z);
    addMesh(sideGoldGeo, goldMat, sp.prefix + '_medallion_gold', sp.x, topY + 0.001, sp.z);
    addMesh(sidePlumGeo, plumMat, sp.prefix + '_medallion_plum', sp.x, topY + 0.0015, sp.z);
  }

  // Front and back border diamond motifs
  const diamondGeo = new THREE.SphereGeometry(0.015, 10, 8);
  diamondGeo.scale(1.2, 0.14, 0.6);
  const borderZ = [-0.105, 0.105];
  for (let b = 0; b < borderZ.length; b++) {
    addMesh(diamondGeo, goldMat, 'border_diamond_center_' + b, 0, topY, borderZ[b]);
    addMesh(diamondGeo, creamMat, 'border_diamond_left_' + b, -0.11, topY, borderZ[b]);
    addMesh(diamondGeo, creamMat, 'border_diamond_right_' + b, 0.11, topY, borderZ[b]);
  }

  return group;
}
