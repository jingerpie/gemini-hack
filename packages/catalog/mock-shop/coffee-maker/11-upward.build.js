function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world 6-cup Moka Pot)
  const BASE_R = 0.050;
  const WAIST_R = 0.037;
  const TOP_R = 0.052;
  const BOILER_H = 0.072;
  const COLLAR_H = 0.016;
  const UPPER_H = 0.078;
  const LID_H = 0.016;
  const H = BOILER_H + COLLAR_H + UPPER_H + LID_H; // ~0.182m

  // Materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8cdd2,
    metalness: 0.78,
    roughness: 0.32,
  });

  const brightMetalMat = new THREE.MeshStandardMaterial({
    color: 0xdde2e6,
    metalness: 0.88,
    roughness: 0.22,
  });

  const valveMat = new THREE.MeshStandardMaterial({
    color: 0xb8b2a6,
    metalness: 0.85,
    roughness: 0.28,
  });

  const addMesh = (geo, mat, name, pos, rot) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Octagonal alignment: flat faces at +/-X and +/-Z
  const OCT_ROT_Y = Math.PI / 8;

  // 1. Boiler Base Rim
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R * 0.96, 0.004, 8),
    aluminumMat,
    "boiler_base_rim",
    [0, 0.002, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 2. Lower Boiler Chamber
  addMesh(
    new THREE.CylinderGeometry(WAIST_R, BASE_R, BOILER_H - 0.004, 8),
    aluminumMat,
    "boiler_body",
    [0, 0.004 + (BOILER_H - 0.004) / 2, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 3. Waist Collar
  const collarY = BOILER_H + COLLAR_H / 2;
  addMesh(
    new THREE.CylinderGeometry(WAIST_R * 1.03, WAIST_R * 1.03, COLLAR_H, 24),
    aluminumMat,
    "waist_collar",
    [0, collarY, 0]
  );

  // 4 & 5. Waist Grooves
  addMesh(
    new THREE.TorusGeometry(WAIST_R * 1.02, 0.0014, 8, 24),
    brightMetalMat,
    "waist_groove_lower",
    [0, BOILER_H + 0.0015, 0],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    new THREE.TorusGeometry(WAIST_R * 1.02, 0.0014, 8, 24),
    brightMetalMat,
    "waist_groove_upper",
    [0, BOILER_H + COLLAR_H - 0.0015, 0],
    [Math.PI / 2, 0, 0]
  );

  // 6. Upper Collector Chamber
  const upperBaseY = BOILER_H + COLLAR_H;
  addMesh(
    new THREE.CylinderGeometry(TOP_R, WAIST_R, UPPER_H, 8),
    aluminumMat,
    "upper_chamber",
    [0, upperBaseY + UPPER_H / 2, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 7. Upper Rim
  const upperTopY = upperBaseY + UPPER_H;
  addMesh(
    new THREE.CylinderGeometry(TOP_R * 1.02, TOP_R * 1.02, 0.003, 8),
    brightMetalMat,
    "upper_rim",
    [0, upperTopY, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 8. Domed Octagonal Lid
  addMesh(
    new THREE.CylinderGeometry(TOP_R * 0.42, TOP_R * 1.01, LID_H, 8),
    aluminumMat,
    "lid_dome",
    [0, upperTopY + LID_H / 2 + 0.001, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 9. Lid Top Cap
  addMesh(
    new THREE.CylinderGeometry(TOP_R * 0.42, TOP_R * 0.42, 0.002, 8),
    aluminumMat,
    "lid_top_cap",
    [0, upperTopY + LID_H + 0.001, 0],
    [0, OCT_ROT_Y, 0]
  );

  // 10. Spout (-X side)
  const spoutShape = new THREE.Shape();
  spoutShape.moveTo(0, 0);
  spoutShape.lineTo(-0.022, 0.028);
  spoutShape.lineTo(-0.004, 0.028);
  spoutShape.lineTo(0.004, 0);
  spoutShape.closePath();

  const spoutGeo = new THREE.ExtrudeGeometry(spoutShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  spoutGeo.translate(0, 0, -0.008);
  addMesh(
    spoutGeo,
    aluminumMat,
    "spout_body",
    [-TOP_R * 0.72, upperTopY - 0.030, 0]
  );

  // 11. Lid Spout Tab
  addMesh(
    new THREE.BoxGeometry(0.018, 0.004, 0.016),
    aluminumMat,
    "lid_spout_tab",
    [-TOP_R * 0.98, upperTopY + 0.002, 0]
  );

  // 12. Handle (+X side)
  const handleShape = new THREE.Shape();
  handleShape.moveTo(0.0, 0.004);
  handleShape.lineTo(0.032, 0.004);
  handleShape.quadraticCurveTo(0.048, 0.004, 0.046, -0.014);
  handleShape.lineTo(0.032, -0.072);
  handleShape.quadraticCurveTo(0.029, -0.082, 0.020, -0.080);
  handleShape.quadraticCurveTo(0.014, -0.078, 0.016, -0.068);
  handleShape.lineTo(0.028, -0.018);
  handleShape.quadraticCurveTo(0.030, -0.010, 0.020, -0.010);
  handleShape.lineTo(0.0, -0.010);
  handleShape.closePath();

  const handleGeo = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 3,
  });
  handleGeo.translate(0, 0, -0.006);
  addMesh(
    handleGeo,
    aluminumMat,
    "handle_main",
    [TOP_R * 0.85, upperTopY + 0.004, 0]
  );

  // 13. Hinge Block
  addMesh(
    new THREE.BoxGeometry(0.014, 0.010, 0.016),
    brightMetalMat,
    "hinge_block",
    [TOP_R * 0.96, upperTopY + 0.004, 0]
  );

  // 14. Hinge Pin
  addMesh(
    new THREE.CylinderGeometry(0.002, 0.002, 0.019, 12),
    brightMetalMat,
    "hinge_pin",
    [TOP_R * 0.98, upperTopY + 0.004, 0],
    [Math.PI / 2, 0, 0]
  );

  // 15 & 16. Safety Valve (front-right facet)
  const valveAngle = Math.PI / 4;
  const valveY = BOILER_H * 0.72;
  const valveR = BASE_R * 0.82;
  const vx = Math.sin(valveAngle) * valveR;
  const vz = Math.cos(valveAngle) * valveR;

  addMesh(
    new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 6),
    valveMat,
    "safety_valve_nut",
    [vx, valveY, vz],
    [Math.PI / 2, 0, -valveAngle]
  );

  addMesh(
    new THREE.CylinderGeometry(0.0022, 0.0022, 0.007, 12),
    brightMetalMat,
    "safety_valve_pin",
    [vx + Math.sin(valveAngle) * 0.002, valveY, vz + Math.cos(valveAngle) * 0.002],
    [Math.PI / 2, 0, -valveAngle]
  );

  return group;
}
