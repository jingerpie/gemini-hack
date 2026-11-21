function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.85;
  const SHADE_R = 0.15;
  const SHADE_H = 0.22;
  const SHADE_THICK = 0.003;
  const SOCKET_R = 0.036;
  const SOCKET_H = 0.055;
  const GRIP_R_BOT = 0.012;
  const GRIP_R_TOP = 0.006;
  const GRIP_H = 0.022;
  const CORD_R = 0.004;
  const CANOPY_R = 0.055;
  const CANOPY_H = 0.022;
  const BULB_R = 0.032;

  // Materials
  const brushedBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8c735b,
    metalness: 0.78,
    roughness: 0.34,
  });

  const innerLinerMat = new THREE.MeshStandardMaterial({
    color: 0xe8d8c0,
    metalness: 0.2,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29b,
    metalness: 0.0,
    roughness: 0.88,
  });

  const socketInnerMat = new THREE.MeshStandardMaterial({
    color: 0x2b2623,
    metalness: 0.3,
    roughness: 0.6,
  });

  const emitBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d4,
    emissive: 0xffcf87,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geometry, material, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main Drum Shade (outer wall + top cap via LatheGeometry)
  const shadePoints = [
    new THREE.Vector2(SHADE_R, 0.002),
    new THREE.Vector2(SHADE_R, SHADE_H - 0.003),
    new THREE.Vector2(SHADE_R - 0.003, SHADE_H),
    new THREE.Vector2(0, SHADE_H),
  ];
  const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);
  addMesh(shadeGeo, brushedBronzeMat, "shade_body");

  // 2. Shade Bottom Rim
  const rimGeo = new THREE.TorusGeometry(SHADE_R - 0.002, 0.0022, 12, 32);
  addMesh(rimGeo, brushedBronzeMat, "shade_bottom_rim", 0, 0.0022, 0, Math.PI / 2, 0, 0);

  // 3. Shade Inner Liner Wall
  const linerH = SHADE_H - SHADE_THICK - 0.002;
  const linerGeo = new THREE.CylinderGeometry(
    SHADE_R - SHADE_THICK,
    SHADE_R - SHADE_THICK,
    linerH,
    32,
    1,
    true
  );
  addMesh(linerGeo, innerLinerMat, "shade_inner_liner", 0, 0.002 + linerH / 2, 0);

  // 4. Shade Inner Ceiling
  const innerCeilingGeo = new THREE.CylinderGeometry(
    SHADE_R - SHADE_THICK,
    SHADE_R - SHADE_THICK,
    0.003,
    32
  );
  addMesh(innerCeilingGeo, innerLinerMat, "shade_inner_ceiling", 0, SHADE_H - SHADE_THICK - 0.0015, 0);

  // 5. Inner Bulb Socket
  const innerSocketH = 0.045;
  const innerSocketY = SHADE_H - SHADE_THICK - innerSocketH / 2;
  const innerSocketGeo = new THREE.CylinderGeometry(0.018, 0.018, innerSocketH, 20);
  addMesh(innerSocketGeo, socketInnerMat, "inner_bulb_socket", 0, innerSocketY, 0);

  // 6. Emissive Bulb Neck
  const bulbNeckH = 0.02;
  const bulbNeckY = SHADE_H - SHADE_THICK - innerSocketH - bulbNeckH / 2 + 0.002;
  const bulbNeckGeo = new THREE.CylinderGeometry(0.014, 0.022, bulbNeckH, 20);
  addMesh(bulbNeckGeo, emitBulbMat, "emit_bulb_neck", 0, bulbNeckY, 0);

  // 7. Emissive Bulb Globe
  const bulbY = bulbNeckY - bulbNeckH / 2 - BULB_R * 0.55;
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 18);
  addMesh(bulbGeo, emitBulbMat, "emit_bulb_globe", 0, bulbY, 0);

  // 8. Upper Socket Housing
  const socketHousingY = SHADE_H + SOCKET_H / 2 - 0.002;
  const socketHousingGeo = new THREE.CylinderGeometry(SOCKET_R, SOCKET_R, SOCKET_H, 28);
  addMesh(socketHousingGeo, brushedBronzeMat, "socket_housing", 0, socketHousingY, 0);

  // 9. Socket Housing Top Bevel
  const bevelH = 0.004;
  const bevelY = SHADE_H + SOCKET_H - 0.002 + bevelH / 2;
  const bevelGeo = new THREE.CylinderGeometry(SOCKET_R - 0.003, SOCKET_R, bevelH, 28);
  addMesh(bevelGeo, brushedBronzeMat, "socket_top_bevel", 0, bevelY, 0);

  // 10. Strain Relief Cone
  const gripY = SHADE_H + SOCKET_H + GRIP_H / 2;
  const gripGeo = new THREE.CylinderGeometry(GRIP_R_TOP, GRIP_R_BOT, GRIP_H, 20);
  addMesh(gripGeo, brushedBronzeMat, "strain_relief_cone", 0, gripY, 0);

  // 11. Ceiling Canopy Plate
  const canopyY = TOTAL_H - CANOPY_H / 2;
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R * 0.96, CANOPY_H, 28);
  addMesh(canopyGeo, brushedBronzeMat, "canopy_plate", 0, canopyY, 0);

  // 12. Canopy Strain Relief Collar
  const canopyCollarH = 0.012;
  const canopyCollarY = TOTAL_H - CANOPY_H - canopyCollarH / 2 + 0.002;
  const canopyCollarGeo = new THREE.CylinderGeometry(0.01, 0.006, canopyCollarH, 16);
  addMesh(canopyCollarGeo, brushedBronzeMat, "canopy_strain_relief", 0, canopyCollarY, 0);

  // 13. Woven Fabric Cord
  const cordBottom = SHADE_H + SOCKET_H + GRIP_H - 0.002;
  const cordTop = TOTAL_H - CANOPY_H - canopyCollarH + 0.004;
  const cordH = cordTop - cordBottom;
  const cordGeo = new THREE.CylinderGeometry(CORD_R, CORD_R, cordH, 12);
  addMesh(cordGeo, cordMat, "fabric_cord", 0, cordBottom + cordH / 2, 0);

  return group;
}
