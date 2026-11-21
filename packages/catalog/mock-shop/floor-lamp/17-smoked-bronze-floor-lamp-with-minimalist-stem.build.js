function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.60;
  const BASE_R = 0.14;
  const BASE_H = 0.016;
  const PAD_H = 0.004;
  const STEM_R = 0.011;
  const SHADE_R = 0.115;
  const SHADE_H = 0.056;
  const SHADE_WALL = 0.004;

  // Materials
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x4a423b,
    metalness: 0.78,
    roughness: 0.34,
  });

  const darkPadMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a18,
    metalness: 0.05,
    roughness: 0.9,
  });

  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffebd0,
    emissiveIntensity: 0.85,
    roughness: 0.4,
    metalness: 0.0,
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x36302b,
    metalness: 0.6,
    roughness: 0.45,
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

  // Base pad (touches y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32),
    darkPadMat,
    'base_pad',
    0,
    PAD_H * 0.5,
    0
  );

  // Base disc
  const baseY = PAD_H;
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H * 0.65, 32),
    bronzeMat,
    'base_disc',
    0,
    baseY + BASE_H * 0.325,
    0
  );

  // Base upper bevel
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.008, BASE_R, BASE_H * 0.35, 32),
    bronzeMat,
    'base_bevel',
    0,
    baseY + BASE_H * 0.825,
    0
  );

  // Subtle power cord grommet at back (-Z) of base
  const grommet = addMesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12),
    darkPadMat,
    'power_cord_grommet',
    0,
    baseY + BASE_H * 0.35,
    -BASE_R + 0.002
  );
  grommet.rotation.x = Math.PI * 0.5;

  // Bottom stem collar
  const stemStartY = baseY + BASE_H;
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.6, 0.008, 24),
    bronzeMat,
    'stem_collar_bottom',
    0,
    stemStartY + 0.003,
    0
  );

  // Main vertical stem
  const shadeBottomY = H - SHADE_H;
  const stemHeight = shadeBottomY - stemStartY + 0.015;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, stemHeight, 24),
    bronzeMat,
    'stem_main',
    0,
    stemStartY + stemHeight * 0.5,
    0
  );

  // Top stem collar inside shade
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.4, STEM_R * 1.25, 0.012, 24),
    bronzeMat,
    'stem_collar_top',
    0,
    shadeBottomY + 0.006,
    0
  );

  // Shade outer wall (open-ended cylinder)
  addMesh(
    new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true),
    bronzeMat,
    'shade_outer_wall',
    0,
    shadeBottomY + SHADE_H * 0.5,
    0
  );

  // Shade top cap
  addMesh(
    new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_WALL, 32),
    bronzeMat,
    'shade_top_cap',
    0,
    H - SHADE_WALL * 0.5,
    0
  );

  // Shade top rim
  const topRim = addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.001, 0.002, 12, 32),
    bronzeMat,
    'shade_top_rim',
    0,
    H - 0.001,
    0
  );
  topRim.rotation.x = Math.PI * 0.5;

  // Shade bottom rim
  const bottomRim = addMesh(
    new THREE.TorusGeometry(SHADE_R - SHADE_WALL * 0.5, SHADE_WALL * 0.5, 12, 32),
    bronzeMat,
    'shade_bottom_rim',
    0,
    shadeBottomY + SHADE_WALL * 0.5,
    0
  );
  bottomRim.rotation.x = Math.PI * 0.5;

  // Inner shade reflector wall
  addMesh(
    new THREE.CylinderGeometry(SHADE_R - SHADE_WALL, SHADE_R - SHADE_WALL, SHADE_H - SHADE_WALL, 32, 1, true),
    innerMat,
    'inner_reflector',
    0,
    shadeBottomY + (SHADE_H - SHADE_WALL) * 0.5,
    0
  );

  // Warm glowing diffuser disc recessed slightly inside bottom of shade
  addMesh(
    new THREE.CylinderGeometry(SHADE_R - SHADE_WALL, SHADE_R - SHADE_WALL, 0.006, 32),
    diffuserMat,
    'diffuser_disc',
    0,
    shadeBottomY + 0.008,
    0
  );

  return group;
}
