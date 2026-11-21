function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.90; // Total height from lowest shade bottom (y=0) to canopy top (y=H)
  const CANOPY_R = 0.15;
  const CANOPY_H = 0.032;
  const PENDANT_OFFSET_R = 0.095;

  const CORD_R = 0.004;
  const COLLAR_R = 0.011;
  const COLLAR_H = 0.014;
  const CAP_R = 0.030;
  const CAP_H = 0.022;
  const SOCKET_R = 0.018;
  const SOCKET_H = 0.042;
  const BULB_R = 0.017;

  const SHADE_H = 0.21;
  const SHADE_MAX_R = 0.078;
  const SHADE_TOP_R = 0.029;
  const SHADE_BOT_R = 0.046;

  // Staggered heights (y of the bottom of each glass shade)
  // Lowest touches y = 0
  const SHADE_BOTTOM_YS = [0.0, 0.13, 0.21];
  const PENDANT_ANGLES = [
    Math.PI * 0.5,        // front (+Z) - lowest
    Math.PI * 0.5 + (2 * Math.PI) / 3, // back-left - medium
    Math.PI * 0.5 + (4 * Math.PI) / 3  // back-right - highest
  ];

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.32,
    metalness: 0.85
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xb89f6d,
    roughness: 0.78,
    metalness: 0.1
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f6f8,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.36,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide
  });

  const emitBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
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

  // Canopy plate at top (top at y = H)
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  addMesh(canopyGeo, brassMat, 'canopy_plate', 0, H - CANOPY_H / 2, 0);

  // Small center finial nut on underside of canopy
  const nutGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16);
  addMesh(nutGeo, brassMat, 'canopy_center_nut', 0, H - CANOPY_H - 0.006, 0);

  // Teardrop glass shade profile via LatheGeometry
  const shadePoints = [
    new THREE.Vector2(SHADE_BOT_R, 0.0),
    new THREE.Vector2(SHADE_BOT_R + 0.008, 0.012),
    new THREE.Vector2(SHADE_MAX_R * 0.90, 0.045),
    new THREE.Vector2(SHADE_MAX_R, 0.075),
    new THREE.Vector2(SHADE_MAX_R * 0.92, 0.115),
    new THREE.Vector2(SHADE_MAX_R * 0.72, 0.155),
    new THREE.Vector2(SHADE_TOP_R + 0.008, 0.190),
    new THREE.Vector2(SHADE_TOP_R, SHADE_H)
  ];
  const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);

  // Shared geometries for pendants
  const gripGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.012, 16);
  const collarGeo = new THREE.CylinderGeometry(COLLAR_R * 0.75, COLLAR_R, COLLAR_H, 16);
  const capGeo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_H, 24);
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R, SOCKET_R * 0.92, SOCKET_H, 20);
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 16, 16);
  const rimGeo = new THREE.TorusGeometry(SHADE_BOT_R, 0.0025, 8, 32);

  for (let i = 0; i < 3; i++) {
    const idx = i + 1;
    const angle = PENDANT_ANGLES[i];
    const px = Math.cos(angle) * PENDANT_OFFSET_R;
    const pz = Math.sin(angle) * PENDANT_OFFSET_R;

    const shadeBottomY = SHADE_BOTTOM_YS[i];
    const shadeTopY = shadeBottomY + SHADE_H;
    const capBottomY = shadeTopY;
    const capTopY = capBottomY + CAP_H;
    const collarTopY = capTopY + COLLAR_H;
    const canopyBottomY = H - CANOPY_H;

    // Cord grip at canopy
    addMesh(gripGeo, brassMat, `cord_grip_${idx}`, px, canopyBottomY - 0.006, pz);

    // Cord from canopy grip down to pendant collar
    const cordLen = canopyBottomY - collarTopY + 0.004;
    const cordGeo = new THREE.CylinderGeometry(CORD_R, CORD_R, cordLen, 12);
    addMesh(cordGeo, cordMat, `cord_${idx}`, px, collarTopY + cordLen / 2 - 0.002, pz);

    // Pendant collar
    addMesh(collarGeo, brassMat, `pendant_collar_${idx}`, px, capTopY + COLLAR_H / 2, pz);

    // Pendant brass cap
    addMesh(capGeo, brassMat, `pendant_cap_${idx}`, px, capBottomY + CAP_H / 2, pz);

    // Inner brass socket
    const socketCenterY = capBottomY - SOCKET_H / 2 + 0.004;
    addMesh(socketGeo, brassMat, `pendant_socket_${idx}`, px, socketCenterY, pz);

    // Emissive bulb inside shade
    const bulbCenterY = capBottomY - SOCKET_H - BULB_R * 0.55;
    addMesh(bulbGeo, emitBulbMat, `emit_bulb_${idx}`, px, bulbCenterY, pz);

    // Glass shade
    addMesh(shadeGeo, glassMat, `glass_shade_${idx}`, px, shadeBottomY, pz);

    // Bottom glass rim ring
    const rimMesh = addMesh(rimGeo, glassMat, `glass_rim_${idx}`, px, shadeBottomY + 0.0025, pz);
    rimMesh.rotation.x = Math.PI / 2;
  }

  return group;
}
