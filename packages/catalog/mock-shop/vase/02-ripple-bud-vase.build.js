function build(THREE) {
  const group = new THREE.Group();

  const VASE_H = 0.24;
  const BASE_R = 0.036;
  const WAIST_R = 0.026;
  const BULGE_R = 0.045;
  const NECK_R = 0.025;
  const WALL_T = 0.0045;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x7087b2,
    roughness: 0.72,
    metalness: 0.02,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x221b1a,
    roughness: 0.85,
    metalness: 0.0,
  });

  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0x1a1414,
    roughness: 0.88,
    metalness: 0.0,
  });

  // Vase profile via LatheGeometry
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R - 0.002, 0.0),
    new THREE.Vector2(BASE_R, 0.003),
    new THREE.Vector2(0.028, 0.088),
    new THREE.Vector2(0.031, 0.095),
    new THREE.Vector2(0.041, 0.103),
    new THREE.Vector2(BULGE_R, 0.112),
    new THREE.Vector2(0.041, 0.122),
    new THREE.Vector2(0.030, 0.129),
    new THREE.Vector2(WAIST_R, 0.135),
    new THREE.Vector2(WAIST_R, 0.148),
    new THREE.Vector2(0.031, 0.155),
    new THREE.Vector2(0.041, 0.162),
    new THREE.Vector2(BULGE_R, 0.171),
    new THREE.Vector2(0.041, 0.181),
    new THREE.Vector2(0.029, 0.188),
    new THREE.Vector2(NECK_R, 0.194),
    new THREE.Vector2(NECK_R, VASE_H - 0.003),
    new THREE.Vector2(NECK_R - 0.0015, VASE_H),
    new THREE.Vector2(NECK_R - WALL_T, VASE_H),
    new THREE.Vector2(NECK_R - WALL_T, 0.16),
    new THREE.Vector2(0.0, 0.16),
  ];

  const vaseGeo = new THREE.LatheGeometry(pts, 32);
  const vaseMesh = new THREE.Mesh(vaseGeo, ceramicMat);
  vaseMesh.name = 'vase_body';
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Main dried stem
  const mainStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.003, 0.18, 0.0),
    new THREE.Vector3(0.005, 0.24, 0.002),
    new THREE.Vector3(0.022, 0.275, -0.003),
    new THREE.Vector3(0.048, 0.305, 0.002),
    new THREE.Vector3(0.068, 0.332, -0.002),
  ]);
  const mainStemGeo = new THREE.TubeGeometry(mainStemCurve, 20, 0.0016, 6, false);
  const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
  mainStem.name = 'main_stem';
  mainStem.castShadow = true;
  mainStem.receiveShadow = true;
  group.add(mainStem);

  // Secondary branch 1 (left-leaning)
  const branch1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.015, 0.262, 0.0),
    new THREE.Vector3(0.016, 0.292, 0.004),
    new THREE.Vector3(0.012, 0.322, 0.006),
  ]);
  const branch1Geo = new THREE.TubeGeometry(branch1Curve, 12, 0.0011, 6, false);
  const branch1 = new THREE.Mesh(branch1Geo, stemMat);
  branch1.name = 'branch_stem_left';
  branch1.castShadow = true;
  branch1.receiveShadow = true;
  group.add(branch1);

  // Secondary branch 2 (right-leaning)
  const branch2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.022, 0.275, -0.003),
    new THREE.Vector3(0.044, 0.285, -0.006),
    new THREE.Vector3(0.072, 0.292, -0.005),
  ]);
  const branch2Geo = new THREE.TubeGeometry(branch2Curve, 12, 0.0011, 6, false);
  const branch2 = new THREE.Mesh(branch2Geo, stemMat);
  branch2.name = 'branch_stem_right';
  branch2.castShadow = true;
  branch2.receiveShadow = true;
  group.add(branch2);

  // Helper to add a small dried flower head
  function addFlower(x, y, z, scale, name) {
    const fGeo = new THREE.DodecahedronGeometry(0.009 * scale, 0);
    fGeo.scale(1.2, 0.55, 1.2);
    const flower = new THREE.Mesh(fGeo, flowerMat);
    flower.name = name;
    flower.position.set(x, y, z);
    flower.rotation.set(0.2, 0.4, -0.2);
    flower.castShadow = true;
    flower.receiveShadow = true;
    group.add(flower);
  }

  addFlower(0.068, 0.334, -0.002, 1.15, 'flower_top_right');
  addFlower(0.012, 0.324, 0.006, 0.95, 'flower_top_left');
  addFlower(0.073, 0.293, -0.005, 1.0, 'flower_mid_right');
  addFlower(0.032, 0.308, 0.003, 0.65, 'flower_bud_mid');

  // Small dried leaves along stem
  function addLeaf(x, y, z, rz, ry, name) {
    const lGeo = new THREE.ConeGeometry(0.0035, 0.016, 5);
    lGeo.scale(1.0, 1.0, 0.3);
    const leaf = new THREE.Mesh(lGeo, stemMat);
    leaf.name = name;
    leaf.position.set(x, y, z);
    leaf.rotation.set(0.2, ry, rz);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  addLeaf(0.012, 0.268, 0.002, 0.9, 0.2, 'leaf_1');
  addLeaf(0.028, 0.264, -0.002, -0.8, -0.3, 'leaf_2');
  addLeaf(0.056, 0.320, 0.0, 0.7, 0.4, 'leaf_3');

  return group;
}
