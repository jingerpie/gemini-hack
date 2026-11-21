function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;
  const H = 0.44;
  const D = 0.16;
  const BEVEL_SIZE = 0.045;
  const BEVEL_THICK = D * 0.44;
  const CORE_DEPTH = D - BEVEL_THICK * 2;
  const HALF_W = W * 0.5 - BEVEL_SIZE;
  const HALF_H = H * 0.5 - BEVEL_SIZE;
  const CY = H * 0.5;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8d5bc,
    roughness: 0.92,
    metalness: 0.0,
  });
  const sageMat = new THREE.MeshStandardMaterial({
    color: 0x7d8c75,
    roughness: 0.88,
    metalness: 0.0,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xd68c6e,
    roughness: 0.88,
    metalness: 0.0,
  });
  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xe6b3a3,
    roughness: 0.88,
    metalness: 0.0,
  });
  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x7a543e,
    roughness: 0.9,
    metalness: 0.0,
  });
  const offWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe6,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Pillow body shape with slightly pinched corners
  const shape = new THREE.Shape();
  const cornerFlare = 0.015;
  shape.moveTo(-HALF_W - cornerFlare, -HALF_H - cornerFlare * 0.3);
  shape.quadraticCurveTo(0, -HALF_H + 0.01, HALF_W + cornerFlare, -HALF_H - cornerFlare * 0.3);
  shape.quadraticCurveTo(HALF_W - 0.015, 0, HALF_W + cornerFlare, HALF_H + cornerFlare);
  shape.quadraticCurveTo(0, HALF_H - 0.01, -HALF_W - cornerFlare, HALF_H + cornerFlare);
  shape.quadraticCurveTo(-HALF_W + 0.015, 0, -HALF_W - cornerFlare, -HALF_H - cornerFlare * 0.3);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: CORE_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_THICK,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 10,
    curveSegments: 16,
  });
  bodyGeo.translate(0, CY, -CORE_DEPTH * 0.5);

  const bodyMesh = new THREE.Mesh(bodyGeo, creamMat);
  bodyMesh.name = 'pillow_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Front face Z-offset for illustrated appliques
  const FRONT_Z = D * 0.5 - 0.004;

  // Helper to create a flattened sphere motif
  function addMotifDisc(name, mat, x, y, z, rx, ry, rz) {
    const geo = new THREE.SphereGeometry(1, 20, 12);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.scale.set(rx, ry, rz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Top center terracotta flower
  addMotifDisc('top_flower_outer', terracottaMat, 0, CY + 0.115, FRONT_Z - 0.008, 0.065, 0.048, 0.012);
  addMotifDisc('top_flower_inner', offWhiteMat, 0, CY + 0.115, FRONT_Z - 0.005, 0.045, 0.032, 0.012);
  addMotifDisc('top_flower_core', sageMat, 0, CY + 0.112, FRONT_Z - 0.002, 0.03, 0.02, 0.012);

  // Bottom center terracotta flower
  addMotifDisc('bottom_flower_outer', terracottaMat, -0.01, CY - 0.125, FRONT_Z - 0.01, 0.062, 0.045, 0.012);

  // Center terracotta arch
  const archGeo = new THREE.TorusGeometry(0.085, 0.014, 10, 24, Math.PI * 0.85);
  const archMesh = new THREE.Mesh(archGeo, terracottaMat);
  archMesh.name = 'center_terracotta_arch';
  archMesh.position.set(0, CY - 0.035, FRONT_Z - 0.002);
  archMesh.rotation.z = Math.PI * 0.075;
  archMesh.scale.set(1, 0.9, 0.45);
  archMesh.castShadow = true;
  archMesh.receiveShadow = true;
  group.add(archMesh);

  // Center off-white ribbon swirl
  const swirlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.09, CY - 0.03, FRONT_Z - 0.004),
    new THREE.Vector3(-0.02, CY - 0.02, FRONT_Z + 0.004),
    new THREE.Vector3(0.03, CY + 0.04, FRONT_Z + 0.002),
  ]);
  const swirlGeo = new THREE.TubeGeometry(swirlCurve, 20, 0.013, 8, false);
  const swirlMesh = new THREE.Mesh(swirlGeo, offWhiteMat);
  swirlMesh.name = 'center_ribbon_swirl';
  swirlMesh.scale.set(1, 1, 0.4);
  swirlMesh.castShadow = true;
  swirlMesh.receiveShadow = true;
  group.add(swirlMesh);

  // Left sage green stem
  const leftStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.11, CY - 0.16, FRONT_Z - 0.02),
    new THREE.Vector3(-0.07, CY - 0.06, FRONT_Z - 0.002),
    new THREE.Vector3(-0.02, CY + 0.03, FRONT_Z + 0.002),
    new THREE.Vector3(-0.12, CY + 0.11, FRONT_Z - 0.015),
  ]);
  const leftStemGeo = new THREE.TubeGeometry(leftStemCurve, 24, 0.015, 8, false);
  const leftStemMesh = new THREE.Mesh(leftStemGeo, sageMat);
  leftStemMesh.name = 'left_sage_stem';
  leftStemMesh.scale.set(1, 1, 0.38);
  leftStemMesh.castShadow = true;
  leftStemMesh.receiveShadow = true;
  group.add(leftStemMesh);

  // Right sage green stem
  const rightStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.11, CY - 0.16, FRONT_Z - 0.02),
    new THREE.Vector3(0.07, CY - 0.06, FRONT_Z - 0.002),
    new THREE.Vector3(0.03, CY + 0.04, FRONT_Z + 0.002),
    new THREE.Vector3(0.13, CY + 0.11, FRONT_Z - 0.015),
  ]);
  const rightStemGeo = new THREE.TubeGeometry(rightStemCurve, 24, 0.015, 8, false);
  const rightStemMesh = new THREE.Mesh(rightStemGeo, sageMat);
  rightStemMesh.name = 'right_sage_stem';
  rightStemMesh.scale.set(1, 1, 0.38);
  rightStemMesh.castShadow = true;
  rightStemMesh.receiveShadow = true;
  group.add(rightStemMesh);

  // Side floral accents
  addMotifDisc('right_terracotta_flower', terracottaMat, 0.125, CY - 0.01, FRONT_Z - 0.018, 0.032, 0.042, 0.012);
  addMotifDisc('left_blush_flower', blushMat, -0.1, CY - 0.005, FRONT_Z - 0.015, 0.028, 0.032, 0.012);
  addMotifDisc('right_sage_leaf', sageMat, 0.085, CY + 0.01, FRONT_Z - 0.01, 0.026, 0.028, 0.012);

  // Small brown accent dots
  addMotifDisc('dot_accent_left', brownMat, -0.065, CY - 0.045, FRONT_Z - 0.004, 0.008, 0.008, 0.008);
  addMotifDisc('dot_accent_top', brownMat, -0.03, CY + 0.06, FRONT_Z - 0.004, 0.008, 0.008, 0.008);

  return group;
}
