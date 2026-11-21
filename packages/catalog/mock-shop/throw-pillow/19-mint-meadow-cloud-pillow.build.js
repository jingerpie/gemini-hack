function build(THREE) {
  const W = 0.50;
  const H = 0.28;
  const D = 0.14;

  const group = new THREE.Group();

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb5dfd3,
    roughness: 0.88,
    metalness: 0.0,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6c265,
    roughness: 0.85,
    metalness: 0.0,
  });

  const coralMat = new THREE.MeshStandardMaterial({
    color: 0xd9887a,
    roughness: 0.85,
    metalness: 0.0,
  });

  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xeab2ba,
    roughness: 0.85,
    metalness: 0.0,
  });

  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x6ba7cf,
    roughness: 0.85,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x80a894,
    roughness: 0.88,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Cloud body lobes (overlapping squashed spheres)
  const sphereGeo = new THREE.SphereGeometry(1, 28, 20);

  // Center base
  addMesh(sphereGeo, fabricMat, 'cloud_center_base', 0.0, 0.095, 0.0, 0.16, 0.095, D * 0.5);

  // Left outer lobe
  addMesh(sphereGeo, fabricMat, 'cloud_left_lobe', -W * 0.31, 0.078, 0.0, 0.095, 0.078, D * 0.44);

  // Right outer lobe
  addMesh(sphereGeo, fabricMat, 'cloud_right_lobe', W * 0.32, 0.074, 0.0, 0.09, 0.074, D * 0.44);

  // Left-center top lobe (tallest)
  addMesh(sphereGeo, fabricMat, 'cloud_left_top_lobe', -0.055, H - 0.115, 0.0, 0.12, 0.115, D * 0.46);

  // Right-center top lobe
  addMesh(sphereGeo, fabricMat, 'cloud_right_top_lobe', 0.085, H - 0.138, 0.0, 0.105, 0.098, D * 0.45);

  // Embroidered flowers on the +Z front face
  const flowerGeo = new THREE.SphereGeometry(0.014, 16, 12);
  const stemGeo = new THREE.CapsuleGeometry(0.0025, 0.022, 4, 8);

  // 1. Left-top yellow flower
  addMesh(flowerGeo, yellowMat, 'flower_left_top', -0.105, 0.215, 0.052, 1.0, 1.0, 0.35);
  addMesh(stemGeo, stemMat, 'stem_left_top', -0.105, 0.193, 0.055, 1.0, 1.0, 0.5);

  // 2. Left-bottom yellow flower
  addMesh(flowerGeo, yellowMat, 'flower_left_bottom', -0.175, 0.095, 0.054, 1.0, 1.0, 0.35);
  addMesh(stemGeo, stemMat, 'stem_left_bottom', -0.175, 0.073, 0.054, 1.0, 1.0, 0.5);

  // 3. Center-left coral flower
  addMesh(flowerGeo, coralMat, 'flower_center_left', -0.045, 0.11, 0.068, 1.15, 1.15, 0.35);
  addMesh(stemGeo, stemMat, 'stem_center_left', -0.045, 0.085, 0.068, 1.0, 1.0, 0.5);

  // 4. Right-top pink flower
  addMesh(flowerGeo, pinkMat, 'flower_right_top', 0.09, 0.18, 0.056, 0.95, 0.95, 0.35);
  addMesh(stemGeo, stemMat, 'stem_right_top', 0.09, 0.16, 0.056, 1.0, 1.0, 0.5);

  // 5. Center-right blue flower
  addMesh(flowerGeo, blueMat, 'flower_center_right', 0.08, 0.11, 0.065, 0.85, 0.85, 0.35);

  // 6. Right-bottom coral flower
  addMesh(flowerGeo, coralMat, 'flower_right_bottom', 0.19, 0.098, 0.048, 0.95, 0.95, 0.35);
  addMesh(stemGeo, stemMat, 'stem_right_bottom', 0.19, 0.078, 0.048, 1.0, 1.0, 0.5);

  // 7. Bottom-center-right pink flower
  addMesh(flowerGeo, pinkMat, 'flower_bottom_right', 0.06, 0.042, 0.058, 0.85, 0.85, 0.35);

  // 8. Bottom-left tiny blue flower
  addMesh(flowerGeo, blueMat, 'flower_bottom_left', -0.095, 0.032, 0.052, 0.7, 0.7, 0.35);

  return group;
}
