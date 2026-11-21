function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.40; // Total width
  const D = 0.96; // Total depth
  const H = 0.33; // Total height

  const PLINTH_H = 0.012;
  const PLINTH_INSET = 0.015;
  const BASE_GAP = 0.012;
  const BASE_BLOCK_W = (W - BASE_GAP) / 2;
  const BASE_BLOCK_H = 0.228;

  const SPACER_H = 0.012;
  const TOP_W = 0.90;
  const TOP_D = 0.72;
  const TOP_H = H - PLINTH_H - BASE_BLOCK_H - SPACER_H;
  const TOP_SEAM = 0.005;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a97e,
    roughness: 0.72,
    metalness: 0.02,
  });

  const shadowOakMat = new THREE.MeshStandardMaterial({
    color: 0x8f724d,
    roughness: 0.85,
    metalness: 0.02,
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

  // Bottom recessed plinths (left and right)
  const plinthGeo = new THREE.BoxGeometry(
    BASE_BLOCK_W - PLINTH_INSET * 2,
    PLINTH_H,
    D - PLINTH_INSET * 2
  );
  const leftX = -(BASE_BLOCK_W + BASE_GAP) / 2;
  const rightX = (BASE_BLOCK_W + BASE_GAP) / 2;

  addMesh(plinthGeo, shadowOakMat, 'base_plinth_left', leftX, PLINTH_H / 2, 0);
  addMesh(plinthGeo, shadowOakMat, 'base_plinth_right', rightX, PLINTH_H / 2, 0);

  // Bottom main oak blocks (left and right)
  const baseBlockGeo = new THREE.BoxGeometry(BASE_BLOCK_W, BASE_BLOCK_H, D);
  const baseBlockY = PLINTH_H + BASE_BLOCK_H / 2;

  addMesh(baseBlockGeo, oakMat, 'base_block_left', leftX, baseBlockY, 0);
  addMesh(baseBlockGeo, oakMat, 'base_block_right', rightX, baseBlockY, 0);

  // Center connector core between bottom blocks (prevents see-through gap)
  const baseConnectorGeo = new THREE.BoxGeometry(
    BASE_GAP + 0.02,
    BASE_BLOCK_H - 0.01,
    D - 0.02
  );
  addMesh(baseConnectorGeo, shadowOakMat, 'base_center_connector', 0, baseBlockY, 0);

  // Recessed spacer plinth under top tier
  const spacerGeo = new THREE.BoxGeometry(
    TOP_W - 0.03,
    SPACER_H,
    TOP_D - 0.03
  );
  const spacerY = PLINTH_H + BASE_BLOCK_H + SPACER_H / 2;
  addMesh(spacerGeo, shadowOakMat, 'top_tier_spacer', 0, spacerY, 0);

  // Top tier inner core (creates dark shadow lines in the modular seams)
  const topCoreGeo = new THREE.BoxGeometry(
    TOP_W - 0.012,
    TOP_H - 0.004,
    TOP_D - 0.012
  );
  const topY = PLINTH_H + BASE_BLOCK_H + SPACER_H + TOP_H / 2;
  addMesh(topCoreGeo, shadowOakMat, 'top_tier_core', 0, topY - 0.002, 0);

  // Top tier modular oak slabs (4 quadrants with crisp shadow seams)
  const slabW = (TOP_W - TOP_SEAM) / 2;
  const slabD = (TOP_D - TOP_SEAM) / 2;
  const slabGeo = new THREE.BoxGeometry(slabW, TOP_H, slabD);

  const slabLeftX = -(slabW + TOP_SEAM) / 2;
  const slabRightX = (slabW + TOP_SEAM) / 2;
  const slabFrontZ = (slabD + TOP_SEAM) / 2;
  const slabBackZ = -(slabD + TOP_SEAM) / 2;

  addMesh(slabGeo, oakMat, 'top_slab_front_left', slabLeftX, topY, slabFrontZ);
  addMesh(slabGeo, oakMat, 'top_slab_back_left', slabLeftX, topY, slabBackZ);
  addMesh(slabGeo, oakMat, 'top_slab_front_right', slabRightX, topY, slabFrontZ);
  addMesh(slabGeo, oakMat, 'top_slab_back_right', slabRightX, topY, slabBackZ);

  return group;
}
