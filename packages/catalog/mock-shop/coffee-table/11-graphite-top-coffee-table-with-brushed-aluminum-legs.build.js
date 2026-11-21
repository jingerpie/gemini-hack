function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters
  const W = 1.2;
  const D = 0.6;
  const H = 0.42;

  const TOP_THICK = 0.055;
  const LEG_W = 0.095;
  const LEG_D = 0.095;
  const LEG_INSET_X = 0.025;
  const LEG_INSET_Z = 0.025;
  const FOOT_H = 0.006;

  const SHELF_Y = 0.165;
  const RAIL_W = 0.02;
  const RAIL_H = 0.015;
  const SLAT_COUNT = 7;
  const SLAT_D = 0.032;
  const SLAT_H = 0.01;

  // Materials
  const graphiteMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3f,
    roughness: 0.78,
    metalness: 0.06,
  });

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc9cdd1,
    roughness: 0.28,
    metalness: 0.85,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.05,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Graphite top slab
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, graphiteMat, "graphite_top_slab", 0, H - TOP_THICK / 2, 0);

  // Four brushed aluminum legs + foot pads
  const legH = H - TOP_THICK - FOOT_H;
  const legY = FOOT_H + legH / 2;
  const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_D);
  const footGeo = new THREE.BoxGeometry(LEG_W * 0.96, FOOT_H, LEG_D * 0.96);

  const legOffsetX = W / 2 - LEG_INSET_X - LEG_W / 2;
  const legOffsetZ = D / 2 - LEG_INSET_Z - LEG_D / 2;

  const legPositions = [
    ["front_left", -legOffsetX, legOffsetZ],
    ["front_right", legOffsetX, legOffsetZ],
    ["back_left", -legOffsetX, -legOffsetZ],
    ["back_right", legOffsetX, -legOffsetZ],
  ];

  for (const [label, lx, lz] of legPositions) {
    addMesh(legGeo, aluminumMat, `leg_${label}`, lx, legY, lz);
    addMesh(footGeo, footMat, `foot_pad_${label}`, lx, FOOT_H / 2, lz);
  }

  // Lower slatted shelf: two end rails along Z
  const railLength = legOffsetZ * 2;
  const railGeo = new THREE.BoxGeometry(RAIL_W, RAIL_H, railLength);
  const railOffsetX = legOffsetX - LEG_W / 2 + RAIL_W / 2;

  addMesh(railGeo, aluminumMat, "shelf_rail_left", -railOffsetX, SHELF_Y, 0);
  addMesh(railGeo, aluminumMat, "shelf_rail_right", railOffsetX, SHELF_Y, 0);

  // Lower slatted shelf: 7 lengthwise slats along X
  const slatLength = legOffsetX * 2 - LEG_W + RAIL_W * 2;
  const slatGeo = new THREE.BoxGeometry(slatLength, SLAT_H, SLAT_D);
  const shelfSpanZ = railLength - LEG_D * 0.6;
  const slatY = SHELF_Y + RAIL_H / 2 - SLAT_H / 2;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const t = SLAT_COUNT === 1 ? 0 : i / (SLAT_COUNT - 1) - 0.5;
    const sz = t * (shelfSpanZ - SLAT_D);
    addMesh(slatGeo, aluminumMat, `shelf_slat_${i + 1}`, 0, slatY, sz);
  }

  return group;
}
