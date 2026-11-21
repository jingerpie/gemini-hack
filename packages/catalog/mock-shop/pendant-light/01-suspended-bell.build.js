function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const TOTAL_H = 0.85;
  const SHADE_H = 0.30;
  const SHADE_R = 0.12;
  const CLEAR_BAND_H = 0.055;
  const GLASS_THICKNESS = 0.003;

  const CANOPY_R = 0.06;
  const CANOPY_H = 0.032;
  const COLLAR_R = 0.011;
  const COLLAR_H = 0.016;

  const CORD_R = 0.0045;

  const SOCKET_FLANGE_R = 0.032;
  const SOCKET_FLANGE_H = 0.004;
  const SOCKET_CAP_R = 0.022;
  const SOCKET_CAP_H = 0.034;
  const SOCKET_BARREL_R = 0.018;
  const SOCKET_BARREL_H = 0.028;

  const BULB_R = 0.024;
  const BULB_H = 0.045;

  // Derived vertical positions (bottom-center at y = 0)
  const SHADE_TOP_Y = SHADE_H;
  const CLEAR_TOP_Y = CLEAR_BAND_H;
  const CANOPY_TOP_Y = TOTAL_H;
  const CANOPY_BOT_Y = CANOPY_TOP_Y - CANOPY_H;
  const COLLAR_BOT_Y = CANOPY_BOT_Y - COLLAR_H;
  const SOCKET_TOP_Y = SHADE_TOP_Y + SOCKET_FLANGE_H + SOCKET_CAP_H;
  const CORD_H = COLLAR_BOT_Y - SOCKET_TOP_Y + 0.01;
  const CORD_MID_Y = SOCKET_TOP_Y - 0.005 + CORD_H * 0.5;

  // Materials
  const brushedNickelMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    roughness: 0.28,
    metalness: 0.88,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x8a8d90,
    roughness: 0.85,
    metalness: 0.05,
  });

  const smokedGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a4d50,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.62,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const clearGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef2f5,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const emitBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xffdfaa,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Ceiling Canopy
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  addMesh(canopyGeo, brushedNickelMat, "canopy_plate", 0, CANOPY_BOT_Y + CANOPY_H * 0.5, 0);

  const canopyBevelGeo = new THREE.TorusGeometry(CANOPY_R - 0.002, 0.002, 8, 32);
  addMesh(canopyBevelGeo, brushedNickelMat, "canopy_bottom_bevel", 0, CANOPY_BOT_Y + 0.002, 0, Math.PI / 2, 0, 0);

  const collarGeo = new THREE.CylinderGeometry(COLLAR_R, COLLAR_R * 0.85, COLLAR_H, 24);
  addMesh(collarGeo, brushedNickelMat, "canopy_collar", 0, COLLAR_BOT_Y + COLLAR_H * 0.5, 0);

  const setScrewGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.004, 12);
  addMesh(setScrewGeo, brushedNickelMat, "canopy_set_screw", 0, COLLAR_BOT_Y + COLLAR_H * 0.5, COLLAR_R * 0.9, Math.PI / 2, 0, 0);

  // 2. Suspension Cord
  const cordGeo = new THREE.CylinderGeometry(CORD_R, CORD_R, CORD_H, 16);
  addMesh(cordGeo, cordMat, "suspension_cord", 0, CORD_MID_Y, 0);

  // 3. Socket Cap & Hardware
  const strainReliefGeo = new THREE.CylinderGeometry(CORD_R * 1.4, CORD_R * 1.8, 0.014, 16);
  addMesh(strainReliefGeo, brushedNickelMat, "socket_strain_relief", 0, SOCKET_TOP_Y + 0.004, 0);

  const capPoints = [
    new THREE.Vector2(0.008, 0.034),
    new THREE.Vector2(0.011, 0.030),
    new THREE.Vector2(0.015, 0.022),
    new THREE.Vector2(0.020, 0.012),
    new THREE.Vector2(SOCKET_CAP_R, 0.002),
    new THREE.Vector2(SOCKET_CAP_R, 0.0),
  ];
  const socketCapGeo = new THREE.LatheGeometry(capPoints, 32);
  addMesh(socketCapGeo, brushedNickelMat, "socket_cap", 0, SHADE_TOP_Y + SOCKET_FLANGE_H, 0);

  const flangeGeo = new THREE.CylinderGeometry(SOCKET_FLANGE_R, SOCKET_FLANGE_R, SOCKET_FLANGE_H, 32);
  addMesh(flangeGeo, brushedNickelMat, "socket_flange", 0, SHADE_TOP_Y + SOCKET_FLANGE_H * 0.5, 0);

  const barrelGeo = new THREE.CylinderGeometry(SOCKET_BARREL_R, SOCKET_BARREL_R, SOCKET_BARREL_H, 24);
  addMesh(barrelGeo, brushedNickelMat, "socket_threaded_barrel", 0, SHADE_TOP_Y - SOCKET_BARREL_H * 0.5, 0);

  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(SOCKET_BARREL_R + 0.001, 0.0015, 8, 24);
    const ringY = SHADE_TOP_Y - 0.008 - i * 0.0065;
    addMesh(ringGeo, brushedNickelMat, `socket_thread_ring_${i + 1}`, 0, ringY, 0, Math.PI / 2, 0, 0);
  }

  // 4. Emissive Bulb inside the shade
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 16);
  bulbGeo.scale(1, BULB_H / (BULB_R * 2), 1);
  addMesh(bulbGeo, emitBulbMat, "emit_bulb", 0, SHADE_TOP_Y - SOCKET_BARREL_H - BULB_H * 0.35, 0);

  // 5. Bell Glass Shade (Smoked upper body + Clear bottom band)
  const smokedPoints = [
    new THREE.Vector2(0.022, SHADE_TOP_Y),
    new THREE.Vector2(0.055, SHADE_TOP_Y - 0.003),
    new THREE.Vector2(0.085, SHADE_TOP_Y - 0.012),
    new THREE.Vector2(0.105, SHADE_TOP_Y - 0.028),
    new THREE.Vector2(0.116, SHADE_TOP_Y - 0.052),
    new THREE.Vector2(SHADE_R, SHADE_TOP_Y - 0.085),
    new THREE.Vector2(SHADE_R - 0.001, SHADE_TOP_Y - 0.145),
    new THREE.Vector2(SHADE_R - 0.004, CLEAR_TOP_Y),
  ];
  const smokedGlassGeo = new THREE.LatheGeometry(smokedPoints, 32);
  addMesh(smokedGlassGeo, smokedGlassMat, "shade_smoked_glass", 0, 0, 0);

  const clearPoints = [
    new THREE.Vector2(SHADE_R - 0.004, CLEAR_TOP_Y),
    new THREE.Vector2(SHADE_R - 0.006, CLEAR_TOP_Y * 0.5),
    new THREE.Vector2(SHADE_R - 0.008, GLASS_THICKNESS),
  ];
  const clearGlassGeo = new THREE.LatheGeometry(clearPoints, 32);
  addMesh(clearGlassGeo, clearGlassMat, "shade_clear_glass", 0, 0, 0);

  const rimGeo = new THREE.TorusGeometry(SHADE_R - 0.008, GLASS_THICKNESS * 0.6, 8, 32);
  addMesh(rimGeo, clearGlassMat, "shade_bottom_rim", 0, GLASS_THICKNESS * 0.6, 0, Math.PI / 2, 0, 0);

  return group;
}
