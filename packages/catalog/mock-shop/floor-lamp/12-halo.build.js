function build(THREE) {
  const group = new THREE.Group();

  const H = 1.75;
  const BASE_R = 0.14;
  const BASE_H = 0.024;
  const STEM_R = 0.013;
  const SLEEVE_Y = 0.92;
  const SLEEVE_H = 0.075;
  const SLEEVE_R = 0.0165;
  const SHADE_R = 0.175;
  const SHADE_H = 0.075;
  const SHADE_BASE_Y = H - SHADE_H;

  const matBlackMetal = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.45,
    metalness: 0.6
  });

  const matBlackRubber = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.85,
    metalness: 0.05
  });

  const matBrushedBrass = new THREE.MeshStandardMaterial({
    color: 0xc5a869,
    roughness: 0.32,
    metalness: 0.85
  });

  const matDiffuser = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffdfaa,
    emissiveIntensity: 0.65,
    roughness: 0.4,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base pad
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.005, BASE_R - 0.005, 0.003, 32),
    matBlackRubber,
    'base_bottom_pad',
    0,
    0.0015,
    0
  );

  // 2. Main weighted base disc (LatheGeometry with subtle beveled edge)
  const basePoints = [
    new THREE.Vector2(0, 0.003),
    new THREE.Vector2(BASE_R, 0.003),
    new THREE.Vector2(BASE_R, BASE_H * 0.6),
    new THREE.Vector2(BASE_R - 0.006, BASE_H),
    new THREE.Vector2(0, BASE_H)
  ];
  addMesh(
    new THREE.LatheGeometry(basePoints, 32),
    matBlackMetal,
    'base_disc'
  );

  // 3. Base collar
  const collarH = 0.012;
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.85, STEM_R * 2.1, collarH, 24),
    matBlackMetal,
    'base_collar',
    0,
    BASE_H + collarH / 2 - 0.001,
    0
  );

  // 4. Cord exit grommet at lower stem
  const grommet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.006, 0.012, 12),
    matBlackRubber
  );
  grommet.name = 'base_cord_grommet';
  grommet.rotation.z = Math.PI / 2;
  grommet.position.set(STEM_R + 0.003, BASE_H + 0.12, 0);
  grommet.castShadow = true;
  grommet.receiveShadow = true;
  group.add(grommet);

  // 5. Lower stem
  const lowerStemStart = BASE_H + collarH - 0.002;
  const lowerStemEnd = SLEEVE_Y - SLEEVE_H / 2;
  const lowerStemH = lowerStemEnd - lowerStemStart;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, lowerStemH, 24),
    matBlackMetal,
    'lower_stem',
    0,
    lowerStemStart + lowerStemH / 2,
    0
  );

  // 6. Mid sleeve lower ring
  addMesh(
    new THREE.CylinderGeometry(SLEEVE_R * 1.05, SLEEVE_R * 1.05, 0.005, 24),
    matBlackMetal,
    'mid_sleeve_lower_ring',
    0,
    SLEEVE_Y - SLEEVE_H / 2 + 0.0025,
    0
  );

  // 7. Mid sleeve (dimmer/joint)
  addMesh(
    new THREE.CylinderGeometry(SLEEVE_R, SLEEVE_R, SLEEVE_H, 24),
    matBlackMetal,
    'mid_sleeve',
    0,
    SLEEVE_Y,
    0
  );

  // 8. Mid sleeve upper ring
  addMesh(
    new THREE.CylinderGeometry(SLEEVE_R * 1.05, SLEEVE_R * 1.05, 0.005, 24),
    matBlackMetal,
    'mid_sleeve_upper_ring',
    0,
    SLEEVE_Y + SLEEVE_H / 2 - 0.0025,
    0
  );

  // 9. Upper stem
  const upperStemStart = SLEEVE_Y + SLEEVE_H / 2;
  const upperStemEnd = SHADE_BASE_Y + 0.005;
  const upperStemH = upperStemEnd - upperStemStart;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, upperStemH, 24),
    matBlackMetal,
    'upper_stem',
    0,
    upperStemStart + upperStemH / 2,
    0
  );

  // 10. Top neck collar under shade
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 2.2, STEM_R * 1.6, 0.012, 24),
    matBlackMetal,
    'top_neck_collar',
    0,
    SHADE_BASE_Y - 0.002,
    0
  );

  // 11. Bottom frosted diffuser dome
  const bottomDiffPoints = [
    new THREE.Vector2(0, SHADE_BASE_Y + 0.001),
    new THREE.Vector2(0.055, SHADE_BASE_Y + 0.003),
    new THREE.Vector2(0.095, SHADE_BASE_Y + 0.011),
    new THREE.Vector2(0.115, SHADE_BASE_Y + 0.022),
    new THREE.Vector2(0, SHADE_BASE_Y + 0.022)
  ];
  addMesh(
    new THREE.LatheGeometry(bottomDiffPoints, 32),
    matDiffuser,
    'bottom_diffuser'
  );

  // 12. Brushed brass bowl shade
  const shadePoints = [
    new THREE.Vector2(0.108, SHADE_BASE_Y + 0.018),
    new THREE.Vector2(0.135, SHADE_BASE_Y + 0.026),
    new THREE.Vector2(0.158, SHADE_BASE_Y + 0.042),
    new THREE.Vector2(0.171, SHADE_BASE_Y + 0.060),
    new THREE.Vector2(SHADE_R, H),
    new THREE.Vector2(SHADE_R - 0.005, H),
    new THREE.Vector2(0.160, SHADE_BASE_Y + 0.058),
    new THREE.Vector2(0.132, SHADE_BASE_Y + 0.036),
    new THREE.Vector2(0.105, SHADE_BASE_Y + 0.022)
  ];
  addMesh(
    new THREE.LatheGeometry(shadePoints, 32),
    matBrushedBrass,
    'brass_bowl_shade'
  );

  // 13. Top inner diffuser disc
  addMesh(
    new THREE.CylinderGeometry(0.125, 0.11, 0.008, 32),
    matDiffuser,
    'top_diffuser_disc',
    0,
    SHADE_BASE_Y + 0.028,
    0
  );

  // 14. Subtle brass rim ring
  const rimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(SHADE_R - 0.0025, 0.0025, 12, 32),
    matBrushedBrass
  );
  rimTorus.name = 'shade_rim_ring';
  rimTorus.rotation.x = Math.PI / 2;
  rimTorus.position.set(0, H, 0);
  rimTorus.castShadow = true;
  rimTorus.receiveShadow = true;
  group.add(rimTorus);

  return group;
}
