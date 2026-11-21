function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const D = 0.42;
  const H = 0.58;

  const FOOT_H = 0.004;
  const FOOT_R = 0.012;
  const BASE_W = 0.36;
  const BASE_D = 0.36;
  const BASE_H = 0.018;

  const TOP_THICK = 0.022;
  const COL_W = 0.042;
  const COL_D = 0.042;
  const COL_Z = -BASE_D / 2 + COL_D / 2 + 0.016;

  const BRACKET_THICK = 0.005;
  const LOWER_BRACKET_H = 0.075;
  const UPPER_BRACKET_H = 0.075;

  const ARM_W = 0.034;
  const ARM_H = 0.026;
  const ARM_LEN = 0.28;

  // Materials
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0xd2cec2,
    roughness: 0.45,
    metalness: 0.2,
  });

  const matStone = new THREE.MeshStandardMaterial({
    color: 0xd8ccb8,
    roughness: 0.65,
    metalness: 0.05,
  });

  const matBolt = new THREE.MeshStandardMaterial({
    color: 0xa8adb0,
    roughness: 0.3,
    metalness: 0.85,
  });

  const matDark = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.8,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Rubber feet under base
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footOffsetX = BASE_W / 2 - 0.028;
  const footOffsetZ = BASE_D / 2 - 0.028;
  addMesh(footGeo, matDark, "foot_fl", -footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, matDark, "foot_fr", footOffsetX, FOOT_H / 2, footOffsetZ);
  addMesh(footGeo, matDark, "foot_bl", -footOffsetX, FOOT_H / 2, -footOffsetZ);
  addMesh(footGeo, matDark, "foot_br", footOffsetX, FOOT_H / 2, -footOffsetZ);

  // Base plate
  const baseY = FOOT_H + BASE_H / 2;
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
  addMesh(baseGeo, matMetal, "base_plate", 0, baseY, 0);

  // Vertical column
  const colBottomY = FOOT_H + BASE_H;
  const colTopY = H - TOP_THICK;
  const colH = colTopY - colBottomY;
  const colGeo = new THREE.BoxGeometry(COL_W, colH, COL_D);
  addMesh(colGeo, matMetal, "vertical_column", 0, colBottomY + colH / 2, COL_Z);

  // Lower mounting bracket sleeve
  const lowerBracketGeo = new THREE.BoxGeometry(
    COL_W + BRACKET_THICK * 2,
    LOWER_BRACKET_H,
    COL_D + BRACKET_THICK * 2
  );
  addMesh(
    lowerBracketGeo,
    matMetal,
    "lower_bracket",
    0,
    colBottomY + LOWER_BRACKET_H / 2,
    COL_Z
  );

  // Lower bracket bolts (visible on -Z and +X/-X faces, placed on -Z face)
  const boltGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 12);
  const boltZLower = COL_Z - COL_D / 2 - BRACKET_THICK - 0.002;
  addMesh(
    boltGeo,
    matBolt,
    "lower_bolt_1",
    0,
    colBottomY + 0.022,
    boltZLower,
    Math.PI / 2
  );
  addMesh(
    boltGeo,
    matBolt,
    "lower_bolt_2",
    0,
    colBottomY + 0.052,
    boltZLower,
    Math.PI / 2
  );

  // Upper mounting bracket vertical flange
  const upperFlangeGeo = new THREE.BoxGeometry(
    COL_W + BRACKET_THICK * 2,
    UPPER_BRACKET_H,
    COL_D + BRACKET_THICK * 2
  );
  addMesh(
    upperFlangeGeo,
    matMetal,
    "upper_bracket_flange",
    0,
    colTopY - UPPER_BRACKET_H / 2,
    COL_Z
  );

  // Upper bracket bolts
  addMesh(
    boltGeo,
    matBolt,
    "upper_bolt_1",
    0,
    colTopY - 0.022,
    boltZLower,
    Math.PI / 2
  );
  addMesh(
    boltGeo,
    matBolt,
    "upper_bolt_2",
    0,
    colTopY - 0.052,
    boltZLower,
    Math.PI / 2
  );

  // Horizontal support arm under tabletop
  const armY = colTopY - ARM_H / 2;
  const armStartZ = COL_Z + COL_D / 2;
  const armCenterZ = armStartZ + ARM_LEN / 2;
  const armGeo = new THREE.BoxGeometry(ARM_W, ARM_H, ARM_LEN);
  addMesh(armGeo, matMetal, "support_arm", 0, armY, armCenterZ);

  // Support arm front end cap
  const capThick = 0.006;
  const capGeo = new THREE.BoxGeometry(ARM_W - 0.002, ARM_H - 0.002, capThick);
  addMesh(
    capGeo,
    matDark,
    "arm_end_cap",
    0,
    armY,
    armStartZ + ARM_LEN + capThick / 2 - 0.001
  );

  // Tabletop mounting bolts underneath the arm
  const underBoltGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12);
  addMesh(
    underBoltGeo,
    matBolt,
    "top_bolt_front",
    0,
    armY - ARM_H / 2 - 0.002,
    armStartZ + ARM_LEN - 0.025
  );
  addMesh(
    underBoltGeo,
    matBolt,
    "top_bolt_back",
    0,
    armY - ARM_H / 2 - 0.002,
    armStartZ + 0.03
  );

  // Tabletop slab (travertine/limestone)
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, matStone, "tabletop", 0, H - TOP_THICK / 2, 0);

  return group;
}
