function build(THREE) {
  const group = new THREE.Group();

  const TOTAL_H = 0.85;
  const SHADE_R = 0.18;
  const SHADE_H = 0.165;
  const RIM_R = 0.006;
  const NECK_R = 0.028;
  const SOCKET_H = 0.055;
  const SOCKET_R = 0.021;
  const CANOPY_R = 0.055;
  const CANOPY_H = 0.024;
  const CORD_R = 0.004;

  const SEGMENTS = 32;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.55,
    metalness: 0.05
  });

  const innerShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.BackSide
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c24,
    roughness: 0.85,
    metalness: 0.0
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a876,
    roughness: 0.35,
    metalness: 0.7
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffdfaa,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
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

  // 1. Ceiling canopy plate
  const canopyY = TOTAL_H - CANOPY_H / 2;
  addMesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, SEGMENTS),
    creamMat,
    'canopy_plate',
    0, canopyY, 0
  );

  // 2. Canopy bottom edge ring
  addMesh(
    new THREE.TorusGeometry(CANOPY_R - 0.002, 0.0025, 12, SEGMENTS),
    creamMat,
    'canopy_bevel',
    0, TOTAL_H - CANOPY_H, 0,
    Math.PI / 2, 0, 0
  );

  // 3. Canopy strain relief
  const canopyReliefH = 0.016;
  const canopyReliefY = TOTAL_H - CANOPY_H - canopyReliefH / 2 + 0.002;
  addMesh(
    new THREE.CylinderGeometry(0.009, 0.0055, canopyReliefH, 24),
    creamMat,
    'canopy_strain_relief',
    0, canopyReliefY, 0
  );

  // Key vertical landmarks for shade and socket
  const shadeBottomY = RIM_R;
  const shadeTopY = shadeBottomY + SHADE_H;
  const socketBottomY = shadeTopY - 0.005;
  const socketTopY = socketBottomY + SOCKET_H;

  // 4. Braided fabric cord
  const cordTopY = canopyReliefY - canopyReliefH / 2 + 0.002;
  const cordBottomY = socketTopY - 0.004;
  const cordLen = cordTopY - cordBottomY;
  addMesh(
    new THREE.CylinderGeometry(CORD_R, CORD_R, cordLen, 16),
    cordMat,
    'cord',
    0, cordBottomY + cordLen / 2, 0
  );

  // 5. Socket top strain relief
  const sockReliefH = 0.018;
  addMesh(
    new THREE.CylinderGeometry(0.006, 0.011, sockReliefH, 24),
    creamMat,
    'socket_strain_relief',
    0, socketTopY - sockReliefH / 2, 0
  );

  // 6. Socket upper collar
  const upperCollarH = 0.014;
  const upperCollarY = socketTopY - sockReliefH - upperCollarH / 2 + 0.002;
  addMesh(
    new THREE.CylinderGeometry(0.014, 0.016, upperCollarH, 24),
    creamMat,
    'socket_upper_collar',
    0, upperCollarY, 0
  );

  // 7. Socket main body
  const mainBodyH = SOCKET_H - sockReliefH - upperCollarH + 0.006;
  const mainBodyY = socketBottomY + mainBodyH / 2;
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R, SOCKET_R, mainBodyH, SEGMENTS),
    creamMat,
    'socket_main_body',
    0, mainBodyY, 0
  );

  // 8. Socket stepped seam ring
  addMesh(
    new THREE.TorusGeometry(SOCKET_R, 0.002, 12, SEGMENTS),
    creamMat,
    'socket_ring',
    0, socketBottomY + mainBodyH - 0.002, 0,
    Math.PI / 2, 0, 0
  );

  // 9. Barn shade outer profile (LatheGeometry)
  const shadePoints = [
    new THREE.Vector2(NECK_R, shadeTopY),
    new THREE.Vector2(NECK_R + 0.004, shadeTopY - 0.022),
    new THREE.Vector2(NECK_R + 0.014, shadeTopY - 0.036),
    new THREE.Vector2(0.075, shadeTopY - 0.052),
    new THREE.Vector2(0.125, shadeTopY - 0.075),
    new THREE.Vector2(0.158, shadeTopY - 0.105),
    new THREE.Vector2(0.174, shadeTopY - 0.138),
    new THREE.Vector2(SHADE_R, shadeBottomY)
  ];
  addMesh(
    new THREE.LatheGeometry(shadePoints, SEGMENTS),
    creamMat,
    'shade_outer'
  );

  // 10. Barn shade inner surface
  const innerPoints = shadePoints.map(
    (p) => new THREE.Vector2(Math.max(0.005, p.x - 0.0025), p.y)
  );
  addMesh(
    new THREE.LatheGeometry(innerPoints, SEGMENTS),
    innerShadeMat,
    'shade_inner'
  );

  // 11. Rolled bottom rim of the shade
  addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.001, RIM_R, 14, SEGMENTS),
    creamMat,
    'shade_rim',
    0, RIM_R, 0,
    Math.PI / 2, 0, 0
  );

  // 12. Inner socket cup
  const innerCupH = 0.028;
  const innerCupY = shadeTopY - 0.022;
  addMesh(
    new THREE.CylinderGeometry(0.016, 0.018, innerCupH, 24),
    brassMat,
    'inner_socket_cup',
    0, innerCupY, 0
  );

  // 13. Emissive light bulb inside the shade
  const bulbR = 0.03;
  const bulbY = innerCupY - innerCupH / 2 - bulbR + 0.008;
  addMesh(
    new THREE.SphereGeometry(bulbR, 24, 18),
    bulbMat,
    'emit_bulb',
    0, bulbY, 0
  );

  return group;
}
