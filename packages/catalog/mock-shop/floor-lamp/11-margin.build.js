function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.40;
  const BASE_R = 0.135;
  const BASE_H = 0.012;
  const PAD_H = 0.002;
  const STEM_R = 0.010;
  const STEM_Z = -0.065;
  const ARM_Y = H - 0.085;
  const HEAD_R = 0.042;
  const HEAD_LEN = 0.20;
  const HEAD_TILT = 0.56; // ~32 degrees forward/down

  // Materials
  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.45,
    metalness: 0.65,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a869,
    roughness: 0.28,
    metalness: 0.88,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.05,
  });

  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.4,
    metalness: 0.1,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base pad (touches y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32),
    rubberMat,
    'base_bottom_pad',
    [0, PAD_H / 2, 0]
  );

  // 2. Base disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    matteBlackMat,
    'base_disc',
    [0, PAD_H + BASE_H / 2, 0]
  );

  // 3. Stem bottom collar
  const stemBaseY = PAD_H + BASE_H;
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.45, STEM_R * 1.55, 0.012, 24),
    matteBlackMat,
    'stem_bottom_collar',
    [0, stemBaseY + 0.006, STEM_Z]
  );

  // 4. Main vertical stem pole
  const stemLen = H - stemBaseY;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, stemLen, 24),
    matteBlackMat,
    'stem_pole',
    [0, stemBaseY + stemLen / 2, STEM_Z]
  );

  // 5. Stem top cap
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, 0.004, 24),
    matteBlackMat,
    'stem_top_cap',
    [0, H + 0.002, STEM_Z]
  );

  // 6. Cord exit grommet near base of stem
  addMesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.014, 16),
    rubberMat,
    'cord_grommet',
    [0, stemBaseY + 0.032, STEM_Z - STEM_R - 0.004],
    [Math.PI / 2, 0, 0]
  );

  // 7. Upper stem collar for arm
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.25, STEM_R * 1.25, 0.024, 24),
    matteBlackMat,
    'arm_stem_collar',
    [0, ARM_Y, STEM_Z]
  );

  // 8. Horizontal black arm segment
  const blackArmLen = 0.045;
  addMesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, blackArmLen, 16),
    matteBlackMat,
    'arm_horizontal_black',
    [0, ARM_Y, STEM_Z + blackArmLen / 2],
    [Math.PI / 2, 0, 0]
  );

  // 9. Horizontal brass sleeve
  const brassArmLen = 0.042;
  const jointZ = STEM_Z + blackArmLen + brassArmLen;
  addMesh(
    new THREE.CylinderGeometry(0.007, 0.007, brassArmLen, 16),
    brassMat,
    'arm_horizontal_brass',
    [0, ARM_Y, STEM_Z + blackArmLen + brassArmLen / 2],
    [Math.PI / 2, 0, 0]
  );

  // 10. Swivel knuckle joint
  addMesh(
    new THREE.CylinderGeometry(0.0085, 0.0085, 0.022, 16),
    brassMat,
    'swivel_joint',
    [0, ARM_Y, jointZ],
    [0, 0, Math.PI / 2]
  );

  // Lamp head sub-group tilted around the swivel joint
  const headGroup = new THREE.Group();
  headGroup.position.set(0, ARM_Y, jointZ + HEAD_R + 0.006);
  headGroup.rotation.x = HEAD_TILT;
  group.add(headGroup);

  function addHeadMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    headGroup.add(mesh);
    return mesh;
  }

  // 11. Hollow cylindrical brass shade via LatheGeometry
  const wallT = 0.003;
  const halfLen = HEAD_LEN / 2;
  const shadePoints = [
    new THREE.Vector2(0, halfLen),
    new THREE.Vector2(HEAD_R, halfLen),
    new THREE.Vector2(HEAD_R, -halfLen),
    new THREE.Vector2(HEAD_R - wallT, -halfLen),
    new THREE.Vector2(HEAD_R - wallT, halfLen - wallT),
    new THREE.Vector2(0, halfLen - wallT),
  ];
  addHeadMesh(
    new THREE.LatheGeometry(shadePoints, 32),
    brassMat,
    'shade_body',
    [0, 0, 0]
  );

  // 12. Inner white reflector cylinder
  addHeadMesh(
    new THREE.CylinderGeometry(HEAD_R - wallT - 0.0005, HEAD_R - wallT - 0.0005, 0.06, 28, 1, true),
    reflectorMat,
    'shade_inner_reflector',
    [0, -halfLen + 0.032, 0]
  );

  // 13. Warm emissive LED bulb/diffuser recessed inside
  addHeadMesh(
    new THREE.CylinderGeometry(HEAD_R - wallT - 0.004, HEAD_R - wallT - 0.004, 0.008, 28),
    bulbMat,
    'bulb_diffuser',
    [0, -halfLen + 0.025, 0]
  );

  // 14. Brass mounting bracket between swivel joint and shade
  addHeadMesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.016, 16),
    brassMat,
    'shade_mount_stem',
    [0, 0, -HEAD_R - 0.004],
    [Math.PI / 2, 0, 0]
  );

  return group;
}
