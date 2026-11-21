function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAM = 0.30;
  const H = 0.62;
  const R_OUT = DIAM / 2;
  const RING_THICK = 0.022;
  const R_IN = R_OUT - RING_THICK;
  const R_MID = (R_OUT + R_IN) / 2;
  const RING_H = 0.032;

  const CANOPY_R = 0.048;
  const CANOPY_H = 0.032;
  const CANOPY_Y = H - CANOPY_H;
  const CANOPY_WIRE_R = 0.034;

  const WIRE_R = 0.0009;
  const CORD_R = 0.0024;

  // Materials
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e2024,
    roughness: 0.42,
    metalness: 0.75
  });

  const steelWireMat = new THREE.MeshStandardMaterial({
    color: 0x8a8f96,
    roughness: 0.3,
    metalness: 0.9
  });

  const blackCordMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.65,
    metalness: 0.1
  });

  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfff8ee,
    emissive: 0xfff3de,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.0
  });

  // 1. Ring housing (LatheGeometry)
  const ringPts = [
    new THREE.Vector2(R_IN, 0.001),
    new THREE.Vector2(R_IN, RING_H),
    new THREE.Vector2(R_OUT, RING_H),
    new THREE.Vector2(R_OUT, 0.001),
    new THREE.Vector2(R_OUT - 0.003, 0.001),
    new THREE.Vector2(R_OUT - 0.003, 0.005),
    new THREE.Vector2(R_IN + 0.003, 0.005),
    new THREE.Vector2(R_IN + 0.003, 0.001),
    new THREE.Vector2(R_IN, 0.001)
  ];
  const ringGeo = new THREE.LatheGeometry(ringPts, 32);
  const ringMesh = new THREE.Mesh(ringGeo, blackMetalMat);
  ringMesh.name = 'ring_housing';
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  group.add(ringMesh);

  // 2. LED diffuser at bottom of ring
  const diffPts = [
    new THREE.Vector2(R_IN + 0.003, 0.0),
    new THREE.Vector2(R_IN + 0.003, 0.005),
    new THREE.Vector2(R_OUT - 0.003, 0.005),
    new THREE.Vector2(R_OUT - 0.003, 0.0),
    new THREE.Vector2(R_IN + 0.003, 0.0)
  ];
  const diffGeo = new THREE.LatheGeometry(diffPts, 32);
  const diffMesh = new THREE.Mesh(diffGeo, diffuserMat);
  diffMesh.name = 'emit_led_diffuser';
  diffMesh.castShadow = true;
  diffMesh.receiveShadow = true;
  group.add(diffMesh);

  // 3. Ceiling canopy
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  const canopyMesh = new THREE.Mesh(canopyGeo, blackMetalMat);
  canopyMesh.name = 'canopy_body';
  canopyMesh.position.y = CANOPY_Y + CANOPY_H / 2;
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  group.add(canopyMesh);

  // Canopy side screws
  const screwGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.004, 12);
  for (let i = 0; i < 2; i++) {
    const sign = i === 0 ? 1 : -1;
    const screw = new THREE.Mesh(screwGeo, steelWireMat);
    screw.name = 'canopy_screw_' + (i + 1);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(sign * (CANOPY_R + 0.001), CANOPY_Y + CANOPY_H * 0.45, 0);
    screw.castShadow = true;
    screw.receiveShadow = true;
    group.add(screw);
  }

  // 4. Three suspension wires + grippers + anchors
  const wireAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  const gripperGeo = new THREE.CylinderGeometry(0.0035, 0.0025, 0.008, 12);
  const anchorGeo = new THREE.CylinderGeometry(0.0025, 0.0035, 0.006, 12);
  const upVec = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < 3; i++) {
    const a = wireAngles[i];
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);

    const topPos = new THREE.Vector3(CANOPY_WIRE_R * cosA, CANOPY_Y, CANOPY_WIRE_R * sinA);
    const botPos = new THREE.Vector3(R_MID * cosA, RING_H, R_MID * sinA);

    // Top gripper
    const gripper = new THREE.Mesh(gripperGeo, blackMetalMat);
    gripper.name = 'wire_gripper_top_' + (i + 1);
    gripper.position.set(topPos.x, CANOPY_Y - 0.003, topPos.z);
    gripper.castShadow = true;
    gripper.receiveShadow = true;
    group.add(gripper);

    // Bottom anchor
    const anchor = new THREE.Mesh(anchorGeo, blackMetalMat);
    anchor.name = 'wire_anchor_bottom_' + (i + 1);
    anchor.position.set(botPos.x, RING_H + 0.002, botPos.z);
    anchor.castShadow = true;
    anchor.receiveShadow = true;
    group.add(anchor);

    // Suspension wire
    const dir = new THREE.Vector3().subVectors(botPos, topPos);
    const len = dir.length();
    const wireGeo = new THREE.CylinderGeometry(WIRE_R, WIRE_R, len, 8);
    const wire = new THREE.Mesh(wireGeo, steelWireMat);
    wire.name = 'suspension_wire_' + (i + 1);
    wire.position.copy(topPos).addScaledVector(dir, 0.5);
    wire.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
    wire.castShadow = true;
    wire.receiveShadow = true;
    group.add(wire);
  }

  // 5. Power cord alongside the front-right wire (angle = Math.PI / 6)
  const cordA = Math.PI / 6;
  const cordTopX = (CANOPY_WIRE_R - 0.01) * Math.cos(cordA);
  const cordTopZ = (CANOPY_WIRE_R - 0.01) * Math.sin(cordA) + 0.006;
  const cordBotX = (R_MID - 0.008) * Math.cos(cordA - 0.08);
  const cordBotZ = (R_MID - 0.008) * Math.sin(cordA - 0.08);

  const cordReliefGeo = new THREE.CylinderGeometry(0.0045, 0.0038, 0.014, 12);
  const cordRelief = new THREE.Mesh(cordReliefGeo, blackMetalMat);
  cordRelief.name = 'cord_strain_relief';
  cordRelief.position.set(cordTopX, CANOPY_Y - 0.006, cordTopZ);
  cordRelief.castShadow = true;
  cordRelief.receiveShadow = true;
  group.add(cordRelief);

  const cordAnchorGeo = new THREE.CylinderGeometry(0.0035, 0.0045, 0.008, 12);
  const cordAnchor = new THREE.Mesh(cordAnchorGeo, blackMetalMat);
  cordAnchor.name = 'cord_anchor_bottom';
  cordAnchor.position.set(cordBotX, RING_H + 0.003, cordBotZ);
  cordAnchor.castShadow = true;
  cordAnchor.receiveShadow = true;
  group.add(cordAnchor);

  const midX = (cordTopX + cordBotX) * 0.5 + 0.006;
  const midZ = (cordTopZ + cordBotZ) * 0.5 + 0.004;
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cordTopX, CANOPY_Y - 0.005, cordTopZ),
    new THREE.Vector3(cordTopX + 0.012, CANOPY_Y - 0.14, cordTopZ + 0.008),
    new THREE.Vector3(midX, (CANOPY_Y + RING_H) * 0.5, midZ),
    new THREE.Vector3(cordBotX, RING_H + 0.003, cordBotZ)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, CORD_R, 10, false);
  const cordMesh = new THREE.Mesh(cordGeo, blackCordMat);
  cordMesh.name = 'power_cord';
  cordMesh.castShadow = true;
  cordMesh.receiveShadow = true;
  group.add(cordMesh);

  // Small cable clip mid-way
  const clipGeo = new THREE.TorusGeometry(0.004, 0.0012, 8, 16);
  const clipMesh = new THREE.Mesh(clipGeo, blackMetalMat);
  clipMesh.name = 'cable_clip';
  clipMesh.position.set(midX, (CANOPY_Y + RING_H) * 0.5, midZ);
  clipMesh.rotation.x = Math.PI / 2;
  clipMesh.castShadow = true;
  clipMesh.receiveShadow = true;
  group.add(clipMesh);

  return group;
}
