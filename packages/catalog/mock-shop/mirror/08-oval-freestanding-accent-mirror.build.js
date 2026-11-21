function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.21;
  const BASE_H = 0.042;
  const PAD_H = 0.004;
  const FRAME_RX = 0.32;
  const FRAME_RY = 0.78;
  const FRAME_TUBE = 0.024;
  const FRAME_DEPTH_SCALE = 1.25;
  const OVERLAP = 0.012;
  const MIRROR_CENTER_Y = BASE_H + FRAME_RY + FRAME_TUBE - OVERLAP;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x9e9188,
    roughness: 0.62,
    metalness: 0.05
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x7d726a,
    roughness: 0.75,
    metalness: 0.05
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x3b3633,
    roughness: 0.9,
    metalness: 0.0
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x55504c,
    roughness: 0.4,
    metalness: 0.7
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base bottom felt pad
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.008, BASE_R - 0.008, PAD_H, 32),
    padMat,
    "base_bottom_pad",
    [0, PAD_H / 2, 0]
  );

  // 2. Base main disc
  const mainBaseH = BASE_H - PAD_H - 0.006;
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, mainBaseH, 32),
    frameMat,
    "base_disc",
    [0, PAD_H + mainBaseH / 2, 0]
  );

  // 3. Base top beveled cap
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.012, BASE_R, 0.006, 32),
    frameMat,
    "base_top_bevel",
    [0, BASE_H - 0.003, 0]
  );

  // 4. Base mounting collar where frame meets base
  addMesh(
    new THREE.CylinderGeometry(0.036, 0.044, 0.014, 24),
    frameMat,
    "base_collar",
    [0, BASE_H + 0.004, 0]
  );

  // 5. Oval outer frame
  addMesh(
    new THREE.TorusGeometry(1, FRAME_TUBE / FRAME_RX, 20, 32),
    frameMat,
    "oval_frame",
    [0, MIRROR_CENTER_Y, 0],
    [0, 0, 0],
    [FRAME_RX, FRAME_RY, FRAME_RX * FRAME_DEPTH_SCALE]
  );

  // 6. Inner frame lip
  const innerRx = FRAME_RX - FRAME_TUBE * 0.82;
  const innerRy = FRAME_RY - FRAME_TUBE * 0.82;
  addMesh(
    new THREE.TorusGeometry(1, 0.006 / innerRx, 12, 32),
    backingMat,
    "inner_frame_lip",
    [0, MIRROR_CENTER_Y, 0.006],
    [0, 0, 0],
    [innerRx, innerRy, innerRx * 0.6]
  );

  // 7. Mirror glass
  addMesh(
    new THREE.CylinderGeometry(1, 1, 0.008, 32),
    mirrorMat,
    "mirror_glass",
    [0, MIRROR_CENTER_Y, 0.002],
    [Math.PI / 2, 0, 0],
    [innerRx + 0.004, 1, innerRy + 0.004]
  );

  // 8. Backing board
  addMesh(
    new THREE.CylinderGeometry(1, 1, 0.014, 32),
    backingMat,
    "backing_board",
    [0, MIRROR_CENTER_Y, -0.009],
    [Math.PI / 2, 0, 0],
    [innerRx + 0.012, 1, innerRy + 0.012]
  );

  // 9. Rear support post
  addMesh(
    new THREE.CylinderGeometry(0.014, 0.018, 0.16, 16),
    metalMat,
    "rear_support_post",
    [0, BASE_H + 0.075, -0.028]
  );

  // 10. Rear support bracket (bottom)
  addMesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.018),
    metalMat,
    "rear_support_bracket_bottom",
    [0, BASE_H + 0.012, -0.028]
  );

  // 11. Rear support bracket (top)
  addMesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.018),
    metalMat,
    "rear_support_bracket_top",
    [0, BASE_H + 0.145, -0.024]
  );

  // 12. Rear stiffening cleat (left)
  addMesh(
    new THREE.BoxGeometry(0.018, 0.22, 0.008),
    metalMat,
    "rear_cleat_left",
    [-0.12, MIRROR_CENTER_Y - 0.18, -0.018]
  );

  // 13. Rear stiffening cleat (right)
  addMesh(
    new THREE.BoxGeometry(0.018, 0.22, 0.008),
    metalMat,
    "rear_cleat_right",
    [0.12, MIRROR_CENTER_Y - 0.18, -0.018]
  );

  return group;
}
