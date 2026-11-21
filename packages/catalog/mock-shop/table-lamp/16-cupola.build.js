function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.42;
  const BASE_R = 0.09;
  const BASE_H = 0.008;
  const PAD_H = 0.0015;
  const STEM_R = 0.007;
  const SOCKET_R = 0.017;
  const SOCKET_H = 0.036;
  const SHADE_R = 0.16;
  const SHADE_H = 0.142;
  const SHADE_Y = 0.272;
  const FINIAL_R = 0.008;
  const FINIAL_H = 0.008;
  const CORD_R = 0.0028;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb59b62,
    metalness: 0.85,
    roughness: 0.28,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc2c5c8,
    metalness: 0.78,
    roughness: 0.32,
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    metalness: 0.05,
    roughness: 0.75,
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.05,
    roughness: 0.75,
  });

  const bulbEmitMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  const addMesh = (geo, mat, name, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Base pad (bottom at y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.96, PAD_H, 32),
    darkRubberMat,
    "base_pad",
    [0, PAD_H * 0.5, 0]
  );

  // Base plate
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    baseMat,
    "base_plate",
    [0, PAD_H + BASE_H * 0.5, 0]
  );

  const baseTopY = PAD_H + BASE_H;

  // Stem bottom collar
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.5, 0.005, 24),
    brassMat,
    "stem_collar_bottom",
    [0, baseTopY + 0.0025, 0]
  );

  // Main vertical stem
  const socketBottomY = SHADE_Y - 0.024;
  const stemH = socketBottomY - baseTopY;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, stemH, 24),
    brassMat,
    "stem_tube",
    [0, baseTopY + stemH * 0.5, 0]
  );

  // Socket collar under shade
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R, SOCKET_R, SOCKET_H, 28),
    brassMat,
    "socket_collar",
    [0, socketBottomY + SOCKET_H * 0.5, 0]
  );

  // Socket top step ring
  addMesh(
    new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R, 0.006, 28),
    brassMat,
    "socket_ring",
    [0, socketBottomY + SOCKET_H + 0.003, 0]
  );

  // Dome shade outer profile (LatheGeometry)
  const outerPts = [];
  const segs = 20;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * (Math.PI * 0.5);
    const r = Math.cos(t) * SHADE_R;
    const y = Math.sin(t) * SHADE_H;
    outerPts.push(new THREE.Vector2(r, y));
  }
  addMesh(
    new THREE.LatheGeometry(outerPts, 32),
    brassMat,
    "shade_outer",
    [0, SHADE_Y, 0]
  );

  // Dome shade inner reflective surface
  const innerPts = [];
  const wallT = 0.0025;
  for (let i = segs; i >= 0; i--) {
    const t = (i / segs) * (Math.PI * 0.5);
    const r = Math.max(0, Math.cos(t) * (SHADE_R - wallT));
    const y = Math.sin(t) * (SHADE_H - wallT);
    innerPts.push(new THREE.Vector2(r, y));
  }
  addMesh(
    new THREE.LatheGeometry(innerPts, 32),
    shadeInnerMat,
    "shade_inner",
    [0, SHADE_Y, 0]
  );

  // Shade bottom rim
  addMesh(
    new THREE.TorusGeometry(SHADE_R - wallT * 0.5, wallT * 0.65, 10, 32),
    brassMat,
    "shade_rim",
    [0, SHADE_Y, 0],
    [Math.PI * 0.5, 0, 0]
  );

  // Top finial
  const finialY = SHADE_Y + SHADE_H;
  addMesh(
    new THREE.CylinderGeometry(FINIAL_R, FINIAL_R, FINIAL_H, 24),
    brassMat,
    "top_finial",
    [0, finialY + FINIAL_H * 0.5 - 0.001, 0]
  );

  // Bulb neck
  const bulbBaseY = socketBottomY + SOCKET_H + 0.006;
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.013, 0.018, 20),
    baseMat,
    "bulb_neck",
    [0, bulbBaseY + 0.009, 0]
  );

  // Emissive bulb inside dome
  addMesh(
    new THREE.SphereGeometry(0.026, 24, 18),
    bulbEmitMat,
    "emit_bulb",
    [0, bulbBaseY + 0.034, 0]
  );

  // Power cord exiting lower stem and resting on y = CORD_R
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(STEM_R * 0.8, baseTopY + 0.018, 0),
    new THREE.Vector3(0.028, baseTopY + 0.006, 0.005),
    new THREE.Vector3(0.075, CORD_R, 0.012),
    new THREE.Vector3(0.14, CORD_R, 0.015),
    new THREE.Vector3(0.22, CORD_R, 0.01),
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 24, CORD_R, 10, false),
    darkRubberMat,
    "power_cord"
  );

  // Inline rocker switch
  const switchX = 0.165;
  const switchZ = 0.014;
  const switchH = 0.012;
  addMesh(
    new THREE.BoxGeometry(0.044, switchH, 0.018),
    darkRubberMat,
    "cord_switch_body",
    [switchX, switchH * 0.5, switchZ]
  );

  addMesh(
    new THREE.BoxGeometry(0.016, 0.006, 0.01),
    darkRubberMat,
    "cord_switch_rocker",
    [switchX, switchH + 0.0015, switchZ],
    [0, 0, 0.18]
  );

  return group;
}
