function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.095;
  const R = 0.042;
  const WALL = 0.004;
  const BASE_THICK = 0.006;

  // Materials
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0e7d5,
    roughness: 0.35,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });

  const coralMat = new THREE.MeshStandardMaterial({
    color: 0xd95843,
    roughness: 0.45,
    metalness: 0.0,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6b82e,
    roughness: 0.45,
    metalness: 0.0,
  });

  const purpleMat = new THREE.MeshStandardMaterial({
    color: 0x4a345e,
    roughness: 0.5,
    metalness: 0.0,
  });

  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x4eb39c,
    roughness: 0.45,
    metalness: 0.0,
  });

  // Mug body via LatheGeometry (bottom-center at y = 0)
  const innerR = R - WALL;
  const rimR = R - WALL * 0.5;
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.003, 0),
    new THREE.Vector2(R, 0.003),
    new THREE.Vector2(R, H - 0.003),
    new THREE.Vector2(rimR, H),
    new THREE.Vector2(innerR, H - 0.002),
    new THREE.Vector2(innerR, BASE_THICK + 0.003),
    new THREE.Vector2(innerR - 0.003, BASE_THICK),
    new THREE.Vector2(0, BASE_THICK),
  ];

  const bodyGeo = new THREE.LatheGeometry(pts, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Helper to place a small decorative element on the front (+Z) cylinder surface
  const CY = H * 0.5;
  const surfR = R + 0.0003;

  function addDecal(geo, mat, name, angleX, dy, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(
      Math.sin(angleX) * surfR,
      CY + dy,
      Math.cos(angleX) * surfR
    );
    mesh.rotation.y = angleX;
    if (sx !== undefined) mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const discGeo = new THREE.CylinderGeometry(1, 1, 0.001, 16);
  discGeo.rotateX(Math.PI / 2);

  const ringGeo = new THREE.TorusGeometry(1, 0.12, 8, 24);

  // Central mandala on front (+Z)
  addDecal(ringGeo, purpleMat, 'mandala_purple_ring', 0, 0, 0.017, 0.017, 0.004);
  addDecal(ringGeo, yellowMat, 'mandala_yellow_ring', 0, 0, 0.011, 0.011, 0.004);
  addDecal(discGeo, coralMat, 'mandala_center_flower', 0, 0, 0.0055, 0.0055, 1);
  addDecal(discGeo, yellowMat, 'mandala_center_dot', 0, 0, 0.0022, 0.0022, 1.2);

  // Surrounding coral flowers (top, bottom, left, right)
  const flowerOffsets = [
    { name: 'flower_top', ax: 0, dy: 0.028 },
    { name: 'flower_bottom', ax: 0, dy: -0.028 },
    { name: 'flower_left', ax: -0.55, dy: 0 },
    { name: 'flower_right', ax: 0.55, dy: 0 },
    { name: 'flower_top_left', ax: -0.45, dy: 0.022 },
    { name: 'flower_top_right', ax: 0.45, dy: 0.022 },
    { name: 'flower_bottom_left', ax: -0.45, dy: -0.022 },
    { name: 'flower_bottom_right', ax: 0.45, dy: -0.022 },
  ];

  for (let i = 0; i < flowerOffsets.length; i++) {
    const f = flowerOffsets[i];
    addDecal(discGeo, coralMat, f.name, f.ax, f.dy, 0.006, 0.006, 1);
  }

  // Teal leaf accents
  const leafOffsets = [
    { name: 'teal_leaf_top_left', ax: -0.25, dy: 0.024 },
    { name: 'teal_leaf_top_right', ax: 0.25, dy: 0.024 },
    { name: 'teal_leaf_bottom_left', ax: -0.25, dy: -0.024 },
    { name: 'teal_leaf_bottom_right', ax: 0.25, dy: -0.024 },
  ];

  for (let i = 0; i < leafOffsets.length; i++) {
    const l = leafOffsets[i];
    addDecal(discGeo, tealMat, l.name, l.ax, l.dy, 0.0035, 0.0055, 1);
  }

  return group;
}
