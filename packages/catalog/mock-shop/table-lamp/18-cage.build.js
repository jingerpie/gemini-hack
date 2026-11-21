function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.18;
  const D = 0.18;
  const WOOD_H = 0.028;
  const PLATE_H = 0.008;
  const POST_SIZE = 0.011;
  const POST_H = 0.24;
  const DIFFUSER_R = 0.056;
  const COLLAR_H = 0.014;
  const RING_R = 0.032;
  const RING_TUBE = 0.0045;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a54,
    roughness: 0.72,
    metalness: 0.02
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.42,
    metalness: 0.78
  });

  const diffuserMat = new THREE.MeshPhysicalMaterial({
    color: 0xfaf5eb,
    roughness: 0.45,
    metalness: 0.0,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.1
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b5,
    emissive: 0xffcf87,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const addMesh = (geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Wooden base
  addMesh(
    new THREE.BoxGeometry(W, WOOD_H, D),
    woodMat,
    'wood_base',
    0, WOOD_H / 2, 0
  );

  // Bottom black metal plate
  const bottomPlateY = WOOD_H + PLATE_H / 2;
  addMesh(
    new THREE.BoxGeometry(W, PLATE_H, D),
    blackMetalMat,
    'metal_bottom_plate',
    0, bottomPlateY, 0
  );

  // Four corner posts
  const postOffsetX = W / 2 - POST_SIZE / 2;
  const postOffsetZ = D / 2 - POST_SIZE / 2;
  const postY = WOOD_H + PLATE_H + POST_H / 2;
  const postGeo = new THREE.BoxGeometry(POST_SIZE, POST_H, POST_SIZE);

  addMesh(postGeo, blackMetalMat, 'frame_post_fl', -postOffsetX, postY, postOffsetZ);
  addMesh(postGeo, blackMetalMat, 'frame_post_fr', postOffsetX, postY, postOffsetZ);
  addMesh(postGeo, blackMetalMat, 'frame_post_bl', -postOffsetX, postY, -postOffsetZ);
  addMesh(postGeo, blackMetalMat, 'frame_post_br', postOffsetX, postY, -postOffsetZ);

  // Top black metal plate
  const topPlateY = WOOD_H + PLATE_H + POST_H + PLATE_H / 2;
  addMesh(
    new THREE.BoxGeometry(W, PLATE_H, D),
    blackMetalMat,
    'metal_top_plate',
    0, topPlateY, 0
  );

  // Top collar and ring handle
  const topSurfaceY = WOOD_H + PLATE_H * 2 + POST_H;
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.013, COLLAR_H * 0.6, 24),
    blackMetalMat,
    'top_collar_base',
    0, topSurfaceY + COLLAR_H * 0.3, 0
  );

  addMesh(
    new THREE.CylinderGeometry(0.007, 0.009, COLLAR_H * 0.5, 24),
    blackMetalMat,
    'top_collar_neck',
    0, topSurfaceY + COLLAR_H * 0.85, 0
  );

  addMesh(
    new THREE.TorusGeometry(RING_R, RING_TUBE, 16, 32),
    blackMetalMat,
    'top_ring_handle',
    0, topSurfaceY + COLLAR_H + RING_R - RING_TUBE * 0.5, 0
  );

  // Frosted cylindrical diffuser
  const diffuserY = WOOD_H + PLATE_H + POST_H / 2;
  addMesh(
    new THREE.CylinderGeometry(DIFFUSER_R, DIFFUSER_R, POST_H, 32),
    diffuserMat,
    'frosted_diffuser',
    0, diffuserY, 0
  );

  // Internal bulb socket and glowing bulb
  const socketH = 0.022;
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.018, socketH, 20),
    blackMetalMat,
    'bulb_socket',
    0, WOOD_H + PLATE_H + socketH / 2, 0
  );

  addMesh(
    new THREE.CapsuleGeometry(0.024, 0.075, 12, 24),
    emitMat,
    'emit_bulb',
    0, WOOD_H + PLATE_H + socketH + 0.055, 0
  );

  // Rear cord grommet
  addMesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.008, 16),
    blackMetalMat,
    'cord_grommet',
    0, WOOD_H * 0.45, -D / 2 - 0.002,
    Math.PI / 2, 0, 0
  );

  return group;
}
