function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.58;
  const BASE_R = 0.15;
  const BASE_H = 0.022;
  const FELT_H = 0.003;
  const COL_BOT_R = 0.074;
  const COL_TOP_R = 0.017;
  const SHADE_H = 0.32;
  const SHADE_TOP_R = 0.185;
  const SHADE_BOT_R = 0.23;
  const SHADE_BOT_Y = H - SHADE_H;
  const SHADE_TOP_Y = H;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x5c3824,
    roughness: 0.42,
    metalness: 0.05,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.95,
    metalness: 0.0,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89758,
    roughness: 0.3,
    metalness: 0.85,
  });

  const shadeOuterMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.FrontSide,
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf7efe2,
    roughness: 0.75,
    metalness: 0.0,
    emissive: 0xffdca8,
    emissiveIntensity: 0.25,
    side: THREE.BackSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.2,
  });

  function addMesh(name, geometry, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Felt pad under base (y = 0 to FELT_H)
  const feltGeo = new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, FELT_H, 32);
  addMesh('base_felt_pad', feltGeo, feltMat, 0, FELT_H / 2, 0);

  // 2. Walnut circular base with beveled profile
  const basePts = [
    new THREE.Vector2(0, FELT_H),
    new THREE.Vector2(BASE_R - 0.005, FELT_H),
    new THREE.Vector2(BASE_R, FELT_H + 0.006),
    new THREE.Vector2(BASE_R, FELT_H + BASE_H - 0.006),
    new THREE.Vector2(BASE_R - 0.008, FELT_H + BASE_H),
    new THREE.Vector2(0, FELT_H + BASE_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePts, 32);
  addMesh('base_disc', baseGeo, walnutMat, 0, 0, 0);

  // 3. Tapered walnut column
  const colStartY = FELT_H + BASE_H - 0.002;
  const colEndY = SHADE_BOT_Y + 0.03;
  const colPts = [];
  const colSteps = 16;
  for (let i = 0; i <= colSteps; i++) {
    const t = i / colSteps;
    const y = colStartY + t * (colEndY - colStartY);
    // Subtle convex-to-straight taper matching the photo
    const r = COL_BOT_R * Math.pow(1 - t, 0.92) + COL_TOP_R * (1 - Math.pow(1 - t, 0.92));
    colPts.push(new THREE.Vector2(r, y));
  }
  const colGeo = new THREE.LatheGeometry(colPts, 32);
  addMesh('walnut_column', colGeo, walnutMat, 0, 0, 0);

  // 4. Brass neck collar
  const collarH = 0.018;
  const collarGeo = new THREE.CylinderGeometry(COL_TOP_R + 0.002, COL_TOP_R + 0.003, collarH, 24);
  addMesh('neck_collar', collarGeo, brassMat, 0, colEndY + collarH / 2 - 0.002, 0);

  // 5. Socket body
  const socketY = colEndY + collarH - 0.002;
  const socketH = 0.055;
  const socketGeo = new THREE.CylinderGeometry(0.019, 0.018, socketH, 24);
  addMesh('socket_body', socketGeo, brassMat, 0, socketY + socketH / 2, 0);

  // 6. Socket ring
  const ringGeo = new THREE.TorusGeometry(0.022, 0.003, 12, 24);
  ringGeo.rotateX(Math.PI / 2);
  addMesh('socket_ring', ringGeo, brassMat, 0, socketY + socketH * 0.72, 0);

  // 7. Bulb screw base
  const bulbBaseY = socketY + socketH;
  const bulbBaseGeo = new THREE.CylinderGeometry(0.013, 0.014, 0.018, 20);
  addMesh('bulb_base', bulbBaseGeo, brassMat, 0, bulbBaseY + 0.008, 0);

  // 8. Bulb glass
  const bulbGeo = new THREE.SphereGeometry(0.032, 24, 20);
  bulbGeo.scale(1, 1.25, 1);
  addMesh('bulb_glass', bulbGeo, bulbMat, 0, bulbBaseY + 0.048, 0);

  // 9. Lampshade outer fabric
  const shadeCenterY = SHADE_BOT_Y + SHADE_H / 2;
  const shadeOuterGeo = new THREE.CylinderGeometry(SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 32, 1, true);
  addMesh('shade_outer', shadeOuterGeo, shadeOuterMat, 0, shadeCenterY, 0);

  // 10. Lampshade inner lining
  const shadeInnerGeo = new THREE.CylinderGeometry(SHADE_TOP_R - 0.002, SHADE_BOT_R - 0.002, SHADE_H, 32, 1, true);
  addMesh('shade_inner', shadeInnerGeo, shadeInnerMat, 0, shadeCenterY, 0);

  // 11. Lampshade top rim
  const topRimGeo = new THREE.TorusGeometry(SHADE_TOP_R - 0.001, 0.003, 12, 32);
  topRimGeo.rotateX(Math.PI / 2);
  addMesh('shade_top_rim', topRimGeo, shadeOuterMat, 0, SHADE_TOP_Y, 0);

  // 12. Lampshade bottom rim
  const botRimGeo = new THREE.TorusGeometry(SHADE_BOT_R - 0.001, 0.003, 12, 32);
  botRimGeo.rotateX(Math.PI / 2);
  addMesh('shade_bot_rim', botRimGeo, shadeOuterMat, 0, SHADE_BOT_Y, 0);

  // 13-15. Spider spokes supporting the shade from the socket ring
  const spokeY = socketY + socketH * 0.72;
  const spokeStartR = 0.022;
  const spokeEndR = SHADE_BOT_R - 0.01;
  const dy = (SHADE_BOT_Y + 0.015) - spokeY;
  const dx = spokeEndR - spokeStartR;
  const spokeLen = Math.hypot(dx, dy);
  const spokeAngle = Math.atan2(dy, dx);

  for (let i = 0; i < 3; i++) {
    const theta = (i * Math.PI * 2) / 3;
    const spokeGeo = new THREE.CylinderGeometry(0.002, 0.002, spokeLen, 8);
    spokeGeo.rotateZ(Math.PI / 2 - spokeAngle);
    const midR = (spokeStartR + spokeEndR) / 2;
    const midY = spokeY + dy / 2;
    const mesh = addMesh(
      `spider_spoke_${i + 1}`,
      spokeGeo,
      brassMat,
      Math.cos(theta) * midR,
      midY,
      Math.sin(theta) * midR
    );
    mesh.rotation.y = -theta;
  }

  return group;
}
