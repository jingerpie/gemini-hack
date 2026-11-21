function build(THREE) {
  const group = new THREE.Group();

  const W = 0.40;
  const H = 1.40;
  const D = 0.032;
  const FRAME_T = 0.008;
  const TRIM_T = 0.0025;
  const BACK_T = 0.006;
  const GLASS_T = 0.004;
  const RECESS = 0.005;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x6e675f,
    metalness: 0.65,
    roughness: 0.35,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3b3732,
    metalness: 0.5,
    roughness: 0.5,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x2a2826,
    metalness: 0.1,
    roughness: 0.85,
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x8a857e,
    metalness: 0.8,
    roughness: 0.3,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1,
    roughness: 0.05,
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

  const centerY = H / 2;
  const innerW = W - FRAME_T * 2;
  const innerH = H - FRAME_T * 2;

  // Outer frame (4 sides)
  addMesh(
    new THREE.BoxGeometry(W, FRAME_T, D),
    frameMat,
    'frame_top',
    0,
    H - FRAME_T / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(W, FRAME_T, D),
    frameMat,
    'frame_bottom',
    0,
    FRAME_T / 2,
    0
  );
  addMesh(
    new THREE.BoxGeometry(FRAME_T, innerH, D),
    frameMat,
    'frame_left',
    -W / 2 + FRAME_T / 2,
    centerY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(FRAME_T, innerH, D),
    frameMat,
    'frame_right',
    W / 2 - FRAME_T / 2,
    centerY,
    0
  );

  // Inner shadow-gap trim (4 sides)
  const trimD = D - RECESS;
  const trimZ = -D / 2 + trimD / 2;
  addMesh(
    new THREE.BoxGeometry(innerW, TRIM_T, trimD),
    trimMat,
    'inner_trim_top',
    0,
    H - FRAME_T - TRIM_T / 2,
    trimZ
  );
  addMesh(
    new THREE.BoxGeometry(innerW, TRIM_T, trimD),
    trimMat,
    'inner_trim_bottom',
    0,
    FRAME_T + TRIM_T / 2,
    trimZ
  );
  addMesh(
    new THREE.BoxGeometry(TRIM_T, innerH - TRIM_T * 2, trimD),
    trimMat,
    'inner_trim_left',
    -W / 2 + FRAME_T + TRIM_T / 2,
    centerY,
    trimZ
  );
  addMesh(
    new THREE.BoxGeometry(TRIM_T, innerH - TRIM_T * 2, trimD),
    trimMat,
    'inner_trim_right',
    W / 2 - FRAME_T - TRIM_T / 2,
    centerY,
    trimZ
  );

  // Backing board flush with z = -D / 2
  const backW = innerW - TRIM_T * 2;
  const backH = innerH - TRIM_T * 2;
  addMesh(
    new THREE.BoxGeometry(backW, backH, BACK_T),
    backMat,
    'backing_board',
    0,
    centerY,
    -D / 2 + BACK_T / 2
  );

  // Mirror glass
  const glassZ = D / 2 - RECESS - GLASS_T / 2;
  addMesh(
    new THREE.BoxGeometry(backW, backH, GLASS_T),
    glassMat,
    'mirror_glass',
    0,
    centerY,
    glassZ
  );

  // Rear mounting cleats (flush with back plane z = -D / 2)
  const cleatW = 0.22;
  const cleatH = 0.03;
  const cleatD = 0.004;
  const cleatZ = -D / 2 + cleatD / 2;
  addMesh(
    new THREE.BoxGeometry(cleatW, cleatH, cleatD),
    hardwareMat,
    'mounting_cleat_top',
    0,
    H - 0.16,
    cleatZ
  );
  addMesh(
    new THREE.BoxGeometry(cleatW, cleatH, cleatD),
    hardwareMat,
    'mounting_cleat_bottom',
    0,
    0.16,
    cleatZ
  );

  // Rear corner reinforcement plates
  const plateS = 0.035;
  const plateD = 0.002;
  const plateZ = -D / 2 + plateD / 2;
  const plateX = W / 2 - FRAME_T - plateS / 2;
  const plateYTop = H - FRAME_T - plateS / 2;
  const plateYBot = FRAME_T + plateS / 2;

  addMesh(
    new THREE.BoxGeometry(plateS, plateS, plateD),
    hardwareMat,
    'corner_plate_top_left',
    -plateX,
    plateYTop,
    plateZ
  );
  addMesh(
    new THREE.BoxGeometry(plateS, plateS, plateD),
    hardwareMat,
    'corner_plate_top_right',
    plateX,
    plateYTop,
    plateZ
  );
  addMesh(
    new THREE.BoxGeometry(plateS, plateS, plateD),
    hardwareMat,
    'corner_plate_bottom_left',
    -plateX,
    plateYBot,
    plateZ
  );
  addMesh(
    new THREE.BoxGeometry(plateS, plateS, plateD),
    hardwareMat,
    'corner_plate_bottom_right',
    plateX,
    plateYBot,
    plateZ
  );

  return group;
}
