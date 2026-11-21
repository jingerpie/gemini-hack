function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;
  const H = 0.44;
  const D = 0.16;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd8cbb8,
    roughness: 0.95,
    metalness: 0.0,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb85d3b,
    roughness: 0.96,
    metalness: 0.0,
  });
  const mustardMat = new THREE.MeshStandardMaterial({
    color: 0xc99318,
    roughness: 0.96,
    metalness: 0.0,
  });
  const sageMat = new THREE.MeshStandardMaterial({
    color: 0x849982,
    roughness: 0.96,
    metalness: 0.0,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe8decb,
    roughness: 0.96,
    metalness: 0.0,
  });
  const tanMat = new THREE.MeshStandardMaterial({
    color: 0xbfa06a,
    roughness: 0.96,
    metalness: 0.0,
  });

  // 1. Pillow Body (single soft deformed sphere for plump, karate-chop silhouette)
  const bodyGeo = new THREE.SphereGeometry(1, 32, 24);
  const pos = bodyGeo.attributes.position;
  let minY = Infinity;

  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i);
    const ny = pos.getY(i);
    const nz = pos.getZ(i);

    const x = nx * (W / 2) * (1 + 0.16 * ny * ny);
    let y = ny * (H / 2) * (1 + 0.10 * nx * nx);

    // Subtle karate-chop dip at top center
    if (ny > 0.2) {
      const dip = 0.042 * Math.pow(ny - 0.2, 1.4) * Math.exp(-nx * nx * 6.5);
      y -= dip;
    }

    // Plump center, thinner edges
    const r2 = nx * nx + ny * ny;
    const z = nz * (D / 2) * Math.max(0.25, 1 - 0.22 * r2);

    pos.setXYZ(i, x, y, z);
    if (y < minY) minY = y;
  }

  // Shift so lowest point sits at y = 0
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) - minY);
  }
  bodyGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeo, baseMat);
  bodyMesh.name = 'pillow_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  const centerY = -minY;

  // Helper to approximate front (+Z) surface z for placing tufts flush
  function getFrontZ(x, y) {
    const nx = Math.min(1, Math.max(-1, x / (W / 2)));
    const ny = Math.min(1, Math.max(-1, (y - centerY) / (H / 2)));
    const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx * 0.7 - ny * ny * 0.7));
    const r2 = nx * nx + ny * ny;
    return nz * (D / 2) * Math.max(0.25, 1 - 0.22 * r2);
  }

  // Helper to add a thin raised tufted shape on the front face
  function addTuft(name, x, y, rotZ, len, rad, mat) {
    const geo = new THREE.CapsuleGeometry(rad, len, 6, 12);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    const z = getFrontZ(x, y) - rad * 0.25;
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotZ;
    mesh.rotation.x = -(y - centerY) * 0.45;
    mesh.rotation.y = x * 0.45;
    mesh.scale.set(1.15, 1.0, 0.45);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 2. Tufted Moroccan Diamond Pattern on Front (+Z)
  const diag = Math.PI / 4;

  // Central diamond edges
  addTuft('tuft_diamond_tl_cream', -0.065, centerY + 0.065, -diag, 0.045, 0.018, creamMat);
  addTuft('tuft_diamond_tr_mustard', 0.065, centerY + 0.065, diag, 0.045, 0.018, mustardMat);
  addTuft('tuft_diamond_bl_mustard', -0.065, centerY - 0.065, diag, 0.045, 0.018, mustardMat);
  addTuft('tuft_diamond_br_tan', 0.065, centerY - 0.065, -diag, 0.045, 0.018, tanMat);

  // Diamond corners
  addTuft('tuft_diamond_top_terracotta', 0.0, centerY + 0.12, diag, 0.015, 0.018, terracottaMat);
  addTuft('tuft_diamond_bottom_mustard', 0.0, centerY - 0.12, diag, 0.015, 0.018, mustardMat);
  addTuft('tuft_diamond_left_terracotta', -0.12, centerY, diag, 0.015, 0.018, terracottaMat);
  addTuft('tuft_diamond_right_terracotta', 0.12, centerY, diag, 0.015, 0.018, terracottaMat);

  // Outer radiating accents
  addTuft('tuft_outer_tl_terracotta', -0.155, centerY + 0.055, -diag, 0.03, 0.016, terracottaMat);
  addTuft('tuft_outer_tr_terracotta', 0.155, centerY + 0.055, diag, 0.03, 0.016, terracottaMat);
  addTuft('tuft_outer_bl_sage', -0.155, centerY - 0.055, diag, 0.03, 0.016, sageMat);
  addTuft('tuft_outer_br_sage', 0.155, centerY - 0.055, -diag, 0.03, 0.016, sageMat);

  // Bottom accent diamonds
  addTuft('tuft_bottom_left_sage', -0.055, centerY - 0.15, diag, 0.012, 0.016, sageMat);
  addTuft('tuft_bottom_right_terracotta', 0.055, centerY - 0.15, diag, 0.012, 0.016, terracottaMat);

  // 3. Corner Tassels (4 corners, attached directly to the deformed sphere corners)
  const cornerX = 0.7071 * (W / 2) * 1.08;
  const cornerYOffset = 0.7071 * (H / 2) * 1.05;

  const corners = [
    { name: 'tassel_top_left', x: -cornerX - 0.008, y: centerY + cornerYOffset + 0.008, rz: -Math.PI * 0.75, mat: mustardMat },
    { name: 'tassel_top_right', x: cornerX + 0.008, y: centerY + cornerYOffset + 0.008, rz: Math.PI * 0.75, mat: terracottaMat },
    { name: 'tassel_bottom_left', x: -cornerX - 0.008, y: centerY - cornerYOffset - 0.008, rz: -Math.PI * 0.25, mat: mustardMat },
    { name: 'tassel_bottom_right', x: cornerX + 0.008, y: centerY - cornerYOffset - 0.008, rz: Math.PI * 0.25, mat: terracottaMat },
  ];

  const tasselGeo = new THREE.ConeGeometry(0.016, 0.042, 10);
  for (const c of corners) {
    const tassel = new THREE.Mesh(tasselGeo, c.mat);
    tassel.name = c.name;
    tassel.position.set(c.x, c.y, 0);
    tassel.rotation.z = c.rz;
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
