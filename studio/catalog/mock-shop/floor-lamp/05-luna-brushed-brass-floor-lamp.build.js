function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 1.65;
  const BASE_R = 0.14;
  const BASE_H = 0.022;
  const PAD_H = 0.002;
  const STEM_R = 0.011;
  const RING_R = 0.175;
  const RING_TUBE = 0.0055;
  const GLOBE_R = 0.155;
  const GLOBE_Y = H - RING_R - RING_TUBE;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.28,
    metalness: 0.88,
  });

  const darkBrassMat = new THREE.MeshStandardMaterial({
    color: 0x9c7c3e,
    roughness: 0.35,
    metalness: 0.85,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const globeMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8ee,
    emissive: 0xffeed6,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 0.15,
  });

  function addMesh(name, geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base felt pad (touches y = 0)
  addMesh(
    'base_pad',
    new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32),
    feltMat,
    0,
    PAD_H * 0.5,
    0
  );

  // 2. Main brushed brass base disc
  const baseBodyH = BASE_H - PAD_H;
  addMesh(
    'base_disc',
    new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R, baseBodyH, 32),
    brassMat,
    0,
    PAD_H + baseBodyH * 0.5,
    0
  );

  // 3. Base top bevel ring
  addMesh(
    'base_bevel',
    new THREE.TorusGeometry(BASE_R - 0.004, 0.003, 12, 32),
    brassMat,
    0,
    BASE_H - 0.001,
    0,
    Math.PI * 0.5,
    0,
    0
  );

  // 4. Base-to-stem collar
  const collarH = 0.014;
  addMesh(
    'base_collar',
    new THREE.CylinderGeometry(STEM_R * 1.45, STEM_R * 1.8, collarH, 24),
    brassMat,
    0,
    BASE_H + collarH * 0.5 - 0.001,
    0
  );

  // 5-9. Slender vertical brass stem (3 segments with 2 subtle seam rings)
  const stemStartY = BASE_H + collarH - 0.002;
  const ringBottomY = GLOBE_Y - RING_R;
  const stemTotalH = ringBottomY - stemStartY;
  const segH = stemTotalH / 3;

  addMesh(
    'stem_lower',
    new THREE.CylinderGeometry(STEM_R, STEM_R, segH + 0.002, 24),
    brassMat,
    0,
    stemStartY + segH * 0.5,
    0
  );

  addMesh(
    'stem_joint_1',
    new THREE.CylinderGeometry(STEM_R + 0.0012, STEM_R + 0.0012, 0.004, 24),
    darkBrassMat,
    0,
    stemStartY + segH,
    0
  );

  addMesh(
    'stem_mid',
    new THREE.CylinderGeometry(STEM_R, STEM_R, segH + 0.002, 24),
    brassMat,
    0,
    stemStartY + segH * 1.5,
    0
  );

  addMesh(
    'stem_joint_2',
    new THREE.CylinderGeometry(STEM_R + 0.0012, STEM_R + 0.0012, 0.004, 24),
    darkBrassMat,
    0,
    stemStartY + segH * 2,
    0
  );

  addMesh(
    'stem_upper',
    new THREE.CylinderGeometry(STEM_R, STEM_R, segH + 0.004, 24),
    brassMat,
    0,
    stemStartY + segH * 2.5,
    0
  );

  // 10. Collar where stem meets the outer ring
  addMesh(
    'ring_collar',
    new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.2, 0.012, 24),
    brassMat,
    0,
    ringBottomY - 0.006,
    0
  );

  // 11. Outer brushed brass halo ring (facing +Z)
  addMesh(
    'outer_ring',
    new THREE.TorusGeometry(RING_R, RING_TUBE, 16, 32),
    brassMat,
    0,
    GLOBE_Y,
    0
  );

  // 12. Short brass neck connecting outer ring bottom to globe bottom
  const globeBottomY = GLOBE_Y - GLOBE_R;
  const neckH = globeBottomY - ringBottomY + 0.006;
  addMesh(
    'globe_neck',
    new THREE.CylinderGeometry(STEM_R * 0.75, STEM_R * 0.85, neckH, 20),
    brassMat,
    0,
    ringBottomY + neckH * 0.5 - 0.002,
    0
  );

  // 13. Small flared brass cup cradling the bottom of the globe
  addMesh(
    'globe_cup',
    new THREE.CylinderGeometry(0.022, 0.01, 0.008, 24),
    brassMat,
    0,
    globeBottomY + 0.002,
    0
  );

  // 14. Frosted opal glass globe
  addMesh(
    'opal_globe',
    new THREE.SphereGeometry(GLOBE_R, 32, 24),
    globeMat,
    0,
    GLOBE_Y,
    0
  );

  return group;
}
