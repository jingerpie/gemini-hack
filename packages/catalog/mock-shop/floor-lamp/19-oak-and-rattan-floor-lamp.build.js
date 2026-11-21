function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.56;
  const BASE_R = 0.17;
  const BASE_H = 0.035;
  const POLE_R = 0.016;
  const WRAP_R = 0.020;
  const WRAP_START_Y = 0.36;
  const WRAP_END_Y = 1.04;
  const SOCKET_Y = 1.28;
  const SHADE_BOTTOM_Y = 1.22;
  const SHADE_TOP_Y = H;
  const SHADE_BOTTOM_R = 0.25;
  const SHADE_TOP_R = 0.20;
  const REED_COUNT = 24;
  const REED_R = 0.0035;
  const RING_TUBE_R = 0.0055;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xa67346,
    roughness: 0.55,
    metalness: 0.05,
  });

  const rattanMat = new THREE.MeshStandardMaterial({
    color: 0xcfa46a,
    roughness: 0.72,
    metalness: 0.02,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89758,
    roughness: 0.35,
    metalness: 0.75,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    emissive: 0xffdf9e,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.0,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x8f6b48,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Wooden Base (LatheGeometry with rounded edge)
  const basePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BASE_R - 0.012, 0),
    new THREE.Vector2(BASE_R - 0.003, 0.005),
    new THREE.Vector2(BASE_R, BASE_H * 0.45),
    new THREE.Vector2(BASE_R - 0.004, BASE_H * 0.82),
    new THREE.Vector2(BASE_R - 0.016, BASE_H),
    new THREE.Vector2(0, BASE_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  addMesh(new THREE.Mesh(baseGeo, oakMat), "oak_base");

  // 2. Lower Oak Pole
  const lowerPoleH = WRAP_START_Y - BASE_H + 0.01;
  const lowerPoleGeo = new THREE.CylinderGeometry(POLE_R, POLE_R, lowerPoleH, 20);
  const lowerPole = new THREE.Mesh(lowerPoleGeo, oakMat);
  lowerPole.position.y = BASE_H + lowerPoleH / 2 - 0.005;
  addMesh(lowerPole, "oak_pole_lower");

  // 3. Rattan-Wrapped Middle Section (ribbed LatheGeometry)
  const wrapPoints = [];
  const wrapSteps = 44;
  const wrapH = WRAP_END_Y - WRAP_START_Y;
  wrapPoints.push(new THREE.Vector2(POLE_R, WRAP_START_Y));
  for (let i = 0; i <= wrapSteps; i++) {
    const t = i / wrapSteps;
    const y = WRAP_START_Y + t * wrapH;
    const rib = Math.sin(t * Math.PI * 36) * 0.0012;
    wrapPoints.push(new THREE.Vector2(WRAP_R + rib, y));
  }
  wrapPoints.push(new THREE.Vector2(POLE_R, WRAP_END_Y));
  const wrapGeo = new THREE.LatheGeometry(wrapPoints, 24);
  addMesh(new THREE.Mesh(wrapGeo, rattanMat), "rattan_pole_wrap");

  // 4. Upper Oak Pole
  const upperPoleH = SOCKET_Y - WRAP_END_Y + 0.01;
  const upperPoleGeo = new THREE.CylinderGeometry(POLE_R, POLE_R, upperPoleH, 20);
  const upperPole = new THREE.Mesh(upperPoleGeo, oakMat);
  upperPole.position.y = WRAP_END_Y + upperPoleH / 2 - 0.005;
  addMesh(upperPole, "oak_pole_upper");

  // 5. Lamp Socket & Bulb
  const socketH = 0.055;
  const socketGeo = new THREE.CylinderGeometry(0.022, 0.020, socketH, 20);
  const socket = new THREE.Mesh(socketGeo, brassMat);
  socket.position.y = SOCKET_Y + socketH / 2 - 0.005;
  addMesh(socket, "lamp_socket");

  const bulbGeo = new THREE.SphereGeometry(0.036, 20, 16);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = SOCKET_Y + socketH + 0.022;
  addMesh(bulb, "lamp_bulb");

  // 6. Shade Horizontal Rings (Bottom, Middle, Top)
  const shadeMidY = (SHADE_BOTTOM_Y + SHADE_TOP_Y) / 2;
  const shadeMidR = (SHADE_BOTTOM_R + SHADE_TOP_R) / 2;

  const ringSpecs = [
    { name: "shade_ring_bottom", r: SHADE_BOTTOM_R, y: SHADE_BOTTOM_Y },
    { name: "shade_ring_middle", r: shadeMidR, y: shadeMidY },
    { name: "shade_ring_top", r: SHADE_TOP_R, y: SHADE_TOP_Y },
  ];

  for (const spec of ringSpecs) {
    const ringGeo = new THREE.TorusGeometry(spec.r, RING_TUBE_R, 10, 32);
    const ring = new THREE.Mesh(ringGeo, rattanMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = spec.y;
    addMesh(ring, spec.name);
  }

  // 7. Shade Support Spokes (connecting socket to middle ring)
  const spokeCount = 3;
  const spokeLen = shadeMidR - 0.018;
  const spokeGeo = new THREE.CylinderGeometry(0.003, 0.003, spokeLen, 8);
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeo, brassMat);
    const midDist = 0.018 + spokeLen / 2;
    const dy = shadeMidY - (SOCKET_Y + 0.02);
    const tilt = Math.atan2(dy, spokeLen);
    spoke.position.set(
      Math.cos(angle) * midDist,
      SOCKET_Y + 0.02 + dy / 2,
      Math.sin(angle) * midDist
    );
    spoke.rotation.order = "YXZ";
    spoke.rotation.y = -angle;
    spoke.rotation.z = Math.PI / 2 - tilt;
    addMesh(spoke, `shade_spoke_${i + 1}`);
  }

  // 8. Shade Vertical Rattan Reeds
  const shadeH = SHADE_TOP_Y - SHADE_BOTTOM_Y;
  const radialDiff = SHADE_BOTTOM_R - SHADE_TOP_R;
  const reedLen = Math.sqrt(shadeH * shadeH + radialDiff * radialDiff);
  const reedTilt = Math.atan2(radialDiff, shadeH);
  const reedGeo = new THREE.CylinderGeometry(REED_R, REED_R, reedLen, 6);

  for (let i = 0; i < REED_COUNT; i++) {
    const angle = (i / REED_COUNT) * Math.PI * 2;
    const reed = new THREE.Mesh(reedGeo, rattanMat);
    reed.position.set(
      Math.cos(angle) * shadeMidR,
      shadeMidY,
      Math.sin(angle) * shadeMidR
    );
    reed.rotation.order = "YXZ";
    reed.rotation.y = -angle;
    reed.rotation.z = reedTilt;
    addMesh(reed, `shade_reed_${i + 1}`);
  }

  // 9. Power Cord on Floor
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.012, -0.02),
    new THREE.Vector3(BASE_R - 0.01, 0.010, -0.04),
    new THREE.Vector3(BASE_R + 0.08, 0.005, -0.06),
    new THREE.Vector3(BASE_R + 0.25, 0.004, -0.03),
    new THREE.Vector3(BASE_R + 0.45, 0.004, -0.05),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, 0.004, 8, false);
  addMesh(new THREE.Mesh(cordGeo, cordMat), "power_cord");

  return group;
}
