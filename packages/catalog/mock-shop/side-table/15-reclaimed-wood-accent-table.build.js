function build(THREE) {
  const group = new THREE.Group();

  const W = 0.65;
  const D = 0.65;
  const H = 0.45;
  const TOP_T = 0.036;
  const OVERHANG = 0.032;
  const LEG_W = 0.076;
  const APRON_H = 0.085;
  const APRON_T = 0.026;
  const BREADBOARD_D = 0.068;

  const woodLight = new THREE.MeshStandardMaterial({
    color: 0xc0a78b,
    roughness: 0.84,
    metalness: 0.0,
  });
  const woodMid = new THREE.MeshStandardMaterial({
    color: 0xb3987b,
    roughness: 0.86,
    metalness: 0.0,
  });
  const woodDark = new THREE.MeshStandardMaterial({
    color: 0xa4896c,
    roughness: 0.88,
    metalness: 0.0,
  });
  const woodMaterials = [woodLight, woodMid, woodDark];

  function addPart(geometry, material, name, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tabletop: front and back breadboard planks + 8 center planks
  const topY = H - TOP_T / 2;
  const breadboardGeo = new THREE.BoxGeometry(W, TOP_T, BREADBOARD_D);
  const breadboardZ = D / 2 - BREADBOARD_D / 2;

  addPart(breadboardGeo, woodMid, "top_front_breadboard", 0, topY, breadboardZ);
  addPart(breadboardGeo, woodMid, "top_back_breadboard", 0, topY, -breadboardZ);

  const plankCount = 8;
  const plankGap = 0.0015;
  const centerD = D - 2 * BREADBOARD_D;
  const plankW = (W - (plankCount - 1) * plankGap) / plankCount;
  const plankGeo = new THREE.BoxGeometry(plankW, TOP_T, centerD);

  for (let i = 0; i < plankCount; i++) {
    const px = -W / 2 + plankW / 2 + i * (plankW + plankGap);
    const mat = woodMaterials[i % woodMaterials.length];
    addPart(plankGeo, mat, `top_plank_${i + 1}`, px, topY, 0);
  }

  // 4 chunky square legs
  const legH = H - TOP_T;
  const legY = legH / 2;
  const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
  const legOffsetX = W / 2 - OVERHANG - LEG_W / 2;
  const legOffsetZ = D / 2 - OVERHANG - LEG_W / 2;

  const legPositions = [
    ["leg_front_left", -legOffsetX, legOffsetZ],
    ["leg_front_right", legOffsetX, legOffsetZ],
    ["leg_back_left", -legOffsetX, -legOffsetZ],
    ["leg_back_right", legOffsetX, -legOffsetZ],
  ];

  for (const [name, lx, lz] of legPositions) {
    addPart(legGeo, woodMid, name, lx, legY, lz);
  }

  // 4 apron rails connecting the legs
  const apronY = H - TOP_T - APRON_H / 2;
  const apronSpanX = (legOffsetX - LEG_W / 2) * 2;
  const apronSpanZ = (legOffsetZ - LEG_W / 2) * 2;
  const apronFBGeo = new THREE.BoxGeometry(apronSpanX, APRON_H, APRON_T);
  const apronLRGeo = new THREE.BoxGeometry(APRON_T, APRON_H, apronSpanZ);

  const apronOffsetZ = legOffsetZ - LEG_W / 2 + APRON_T / 2 + 0.008;
  const apronOffsetX = legOffsetX - LEG_W / 2 + APRON_T / 2 + 0.008;

  addPart(apronFBGeo, woodDark, "apron_front", 0, apronY, apronOffsetZ);
  addPart(apronFBGeo, woodDark, "apron_back", 0, apronY, -apronOffsetZ);
  addPart(apronLRGeo, woodDark, "apron_left", -apronOffsetX, apronY, 0);
  addPart(apronLRGeo, woodDark, "apron_right", apronOffsetX, apronY, 0);

  return group;
}
