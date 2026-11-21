function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.86;
  const ARM_RADIUS = 0.36;
  const GLOBE_R = 0.088;
  const CANOPY_R = 0.065;
  const CANOPY_H = 0.028;
  const ROD_R = 0.009;
  const HUB_R = 0.032;
  const HUB_H = 0.036;
  const FINIAL_R = 0.012;
  const FINIAL_H = 0.026;
  const ARM_R = 0.0085;
  const POST_R = 0.012;
  const POST_H = 0.085;
  const CUP_R_TOP = 0.038;
  const CUP_R_BOT = 0.016;
  const CUP_H = 0.022;

  // Vertical layout (lowest point at y = 0)
  const Y_FINIAL_BOT = 0;
  const Y_HUB_BOT = Y_FINIAL_BOT + FINIAL_H;
  const Y_HUB_CENTER = Y_HUB_BOT + HUB_H * 0.5;
  const Y_HUB_TOP = Y_HUB_BOT + HUB_H;
  const Y_CANOPY_TOP = H;
  const Y_CANOPY_BOT = Y_CANOPY_TOP - CANOPY_H;
  const ROD_H = Y_CANOPY_BOT - Y_HUB_TOP;

  // Center bounding box on Z = 0
  // 3 arms at angles: -PI/2 (back, -Z), +PI/6 (front-right), +5*PI/6 (front-left)
  // Z extents of globes: minZ = -ARM_RADIUS - GLOBE_R, maxZ = ARM_RADIUS * 0.5 + GLOBE_R
  const Z_OFFSET = ARM_RADIUS * 0.25;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc2c4c6,
    roughness: 0.48,
    metalness: 0.25,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6f6f4,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
    transmission: 0.15,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffe8c2,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Ceiling canopy
  addMesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 28),
    metalMat,
    'canopy',
    0,
    Y_CANOPY_BOT + CANOPY_H * 0.5,
    Z_OFFSET
  );

  // Canopy collar
  addMesh(
    new THREE.CylinderGeometry(ROD_R * 1.6, ROD_R * 1.4, 0.012, 20),
    metalMat,
    'canopy_collar',
    0,
    Y_CANOPY_BOT - 0.006,
    Z_OFFSET
  );

  // Downrod
  addMesh(
    new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_H, 16),
    metalMat,
    'downrod',
    0,
    Y_HUB_TOP + ROD_H * 0.5,
    Z_OFFSET
  );

  // Central hub
  addMesh(
    new THREE.CylinderGeometry(HUB_R, HUB_R, HUB_H, 28),
    metalMat,
    'center_hub',
    0,
    Y_HUB_CENTER,
    Z_OFFSET
  );

  // Bottom finial
  addMesh(
    new THREE.CylinderGeometry(FINIAL_R, FINIAL_R * 0.9, FINIAL_H, 20),
    metalMat,
    'center_finial',
    0,
    Y_FINIAL_BOT + FINIAL_H * 0.5,
    Z_OFFSET
  );

  // 3 Branch arms
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  const armGeo = new THREE.CylinderGeometry(ARM_R, ARM_R, ARM_RADIUS, 16);
  const postGeo = new THREE.CylinderGeometry(POST_R, POST_R, POST_H, 20);
  const postCapGeo = new THREE.CylinderGeometry(POST_R, POST_R * 0.9, 0.006, 20);
  const cupGeo = new THREE.CylinderGeometry(CUP_R_TOP, CUP_R_BOT, CUP_H, 24);
  const globeGeo = new THREE.SphereGeometry(GLOBE_R, 28, 20);
  const bulbGeo = new THREE.SphereGeometry(GLOBE_R * 0.36, 16, 12);

  angles.forEach((angle, idx) => {
    const n = idx + 1;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Arm midpoint
    const armMidX = (ARM_RADIUS * 0.5) * cosA;
    const armMidZ = Z_OFFSET + (ARM_RADIUS * 0.5) * sinA;

    const armMesh = new THREE.Mesh(armGeo, metalMat);
    armMesh.name = `arm_${n}`;
    armMesh.position.set(armMidX, Y_HUB_CENTER, armMidZ);
    armMesh.rotation.order = 'YXZ';
    armMesh.rotation.y = -angle + Math.PI / 2;
    armMesh.rotation.x = Math.PI / 2;
    armMesh.castShadow = true;
    armMesh.receiveShadow = true;
    group.add(armMesh);

    // End of arm coordinates
    const endX = ARM_RADIUS * cosA;
    const endZ = Z_OFFSET + ARM_RADIUS * sinA;

    // Vertical post (extends slightly below arm and up to cup)
    const postCenterY = Y_HUB_CENTER + 0.015;
    addMesh(postGeo, metalMat, `post_${n}`, endX, postCenterY, endZ);

    const postBotY = postCenterY - POST_H * 0.5;
    addMesh(postCapGeo, metalMat, `post_cap_${n}`, endX, postBotY - 0.003, endZ);

    // Socket cup
    const postTopY = postCenterY + POST_H * 0.5;
    const cupCenterY = postTopY + CUP_H * 0.5;
    addMesh(cupGeo, metalMat, `socket_cup_${n}`, endX, cupCenterY, endZ);

    // Frosted glass globe
    const globeCenterY = postTopY + CUP_H + GLOBE_R * 0.88;
    addMesh(globeGeo, glassMat, `globe_${n}`, endX, globeCenterY, endZ);

    // Emissive bulb inside globe
    addMesh(bulbGeo, bulbMat, `emit_bulb_${n}`, endX, globeCenterY, endZ);
  });

  return group;
}
