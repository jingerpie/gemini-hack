function build(THREE) {
  const DIAMETER = 0.91;
  const RADIUS = DIAMETER / 2;
  const H = 0.022;
  const BASE_H = 0.005;
  const PILE_H = H - BASE_H * 0.4;

  const group = new THREE.Group();

  const matBacking = new THREE.MeshStandardMaterial({
    color: 0xd6cbbd,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0x9e5034,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matRust = new THREE.MeshStandardMaterial({
    color: 0xb86b43,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matOchre = new THREE.MeshStandardMaterial({
    color: 0xc4925e,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matOlive = new THREE.MeshStandardMaterial({
    color: 0x6e7342,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matBlush = new THREE.MeshStandardMaterial({
    color: 0xcfa89e,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Thin neutral backing tucked inside the outer tuft ring
  const baseGeo = new THREE.CylinderGeometry(RADIUS * 0.96, RADIUS * 0.96, BASE_H, 32);
  const baseMesh = new THREE.Mesh(baseGeo, matBacking);
  baseMesh.position.set(0, BASE_H / 2, 0);
  baseMesh.name = 'rug_backing';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const pebbleGeo6 = new THREE.CylinderGeometry(0.9, 1.0, PILE_H, 6);
  const pebbleGeo7 = new THREE.CylinderGeometry(0.9, 1.0, PILE_H, 7);
  const pileY = BASE_H * 0.4 + PILE_H / 2;

  const palette = [
    matBlush,
    matTerracotta,
    matOlive,
    matCream,
    matRust,
    matOchre,
  ];

  let tuftIndex = 1;

  function addTuft(x, z, rx, rz, rotY, mat, sides) {
    const geo = sides === 6 ? pebbleGeo6 : pebbleGeo7;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(rx, 1, rz);
    mesh.rotation.y = rotY;
    mesh.position.set(x, pileY, z);
    mesh.name = `pebble_tuft_${tuftIndex++}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Center tuft
  addTuft(0, 0, 0.105, 0.105, 0.25, matBlush, 7);

  // Inner ring (6 tufts)
  const r1 = 0.165;
  const ring1Mats = [matTerracotta, matOlive, matCream, matRust, matOchre, matOlive];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.15;
    addTuft(
      Math.cos(a) * r1,
      Math.sin(a) * r1,
      0.1,
      0.095,
      a + 0.4,
      ring1Mats[i],
      i % 2 === 0 ? 6 : 7
    );
  }

  // Middle ring (12 tufts)
  const r2 = 0.295;
  const ring2Mats = [
    matOchre, matBlush, matTerracotta, matCream,
    matOlive, matRust, matBlush, matOchre,
    matTerracotta, matOlive, matCream, matRust,
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.08;
    addTuft(
      Math.cos(a) * r2,
      Math.sin(a) * r2,
      0.095,
      0.09,
      a + 0.7,
      ring2Mats[i],
      i % 2 === 0 ? 7 : 6
    );
  }

  // Outer ring (16 tufts) reaching the round border
  const r3 = 0.395;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const mat = palette[(i * 5 + 2) % palette.length];
    addTuft(
      Math.cos(a) * r3,
      Math.sin(a) * r3,
      0.075,
      0.085,
      a,
      mat,
      i % 2 === 0 ? 6 : 7
    );
  }

  return group;
}
