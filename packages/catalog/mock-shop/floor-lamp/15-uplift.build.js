function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const HEIGHT = 1.40;
  const BASE_W = 0.30;
  const BASE_D = 0.26;
  const BASE_H = 0.022;
  const FOOT_H = 0.004;
  const COL_W = 0.105;
  const COL_D = 0.095;
  const CAP_H = 0.012;
  const TRIM_T = 0.008;
  const DIFFUSER_W = COL_W - TRIM_T * 2;
  const DIFFUSER_H = HEIGHT - BASE_H - CAP_H - TRIM_T * 2;
  const DIFFUSER_D = 0.014;

  // Materials
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.42,
    metalness: 0.65,
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x0e0e10,
    roughness: 0.88,
    metalness: 0.05,
  });

  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xff9e3d,
    emissiveIntensity: 1.8,
    roughness: 0.35,
    metalness: 0.0,
  });

  const switchMat = new THREE.MeshStandardMaterial({
    color: 0x222225,
    roughness: 0.55,
    metalness: 0.2,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper: rounded triangle shape in XY plane
  function createRoundedTriangleShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w * 0.5;
    const zFront = d * 0.42;
    const zBack = -d * 0.58;

    shape.moveTo(-hw + r, zFront);
    shape.lineTo(hw - r, zFront);
    shape.quadraticCurveTo(hw, zFront, hw - r * 0.45, zFront - r * 0.9);
    shape.lineTo(r * 0.45, zBack + r * 0.9);
    shape.quadraticCurveTo(0, zBack, -r * 0.45, zBack + r * 0.9);
    shape.lineTo(-hw + r * 0.45, zFront - r * 0.9);
    shape.quadraticCurveTo(-hw, zFront, -hw + r, zFront);
    return shape;
  }

  // 1. Triangular open-frame base
  const baseShape = createRoundedTriangleShape(BASE_W, BASE_D, 0.022);
  const holeShape = createRoundedTriangleShape(BASE_W * 0.62, BASE_D * 0.60, 0.012);
  baseShape.holes.push(holeShape);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - FOOT_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 12,
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, blackMetalMat, "triangular_base", 0, BASE_H, 0);

  // 2-4. Three rubber feet under the base corners (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.012, 0.014, FOOT_H, 16);
  const footPositions = [
    [-BASE_W * 0.40, FOOT_H * 0.5, BASE_D * 0.34],
    [BASE_W * 0.40, FOOT_H * 0.5, BASE_D * 0.34],
    [0, FOOT_H * 0.5, -BASE_D * 0.46],
  ];
  footPositions.forEach((pos, idx) => {
    addMesh(footGeo, darkRubberMat, "base_rubber_foot_" + (idx + 1), pos[0], pos[1], pos[2]);
  });

  // 5. Column housing (triangular/chamfered prism)
  const colShape = new THREE.Shape();
  const cw = COL_W * 0.5;
  const cdFront = COL_D * 0.45;
  const cdBack = -COL_D * 0.55;
  const bevel = 0.012;

  colShape.moveTo(-cw, cdFront);
  colShape.lineTo(cw, cdFront);
  colShape.lineTo(cw, cdFront - bevel);
  colShape.lineTo(bevel * 0.8, cdBack);
  colShape.lineTo(-bevel * 0.8, cdBack);
  colShape.lineTo(-cw, cdFront - bevel);
  colShape.closePath();

  const colH = HEIGHT - BASE_H - CAP_H;
  const colGeo = new THREE.ExtrudeGeometry(colShape, {
    depth: colH,
    bevelEnabled: false,
    curveSegments: 8,
  });
  colGeo.rotateX(-Math.PI / 2);
  addMesh(colGeo, blackMetalMat, "column_housing", 0, BASE_H, 0);

  // 6. Bottom collar connecting column to base
  const collarGeo = new THREE.BoxGeometry(COL_W + 0.01, 0.016, COL_D * 0.7);
  addMesh(collarGeo, blackMetalMat, "bottom_collar", 0, BASE_H + 0.008, 0.005);

  // 7. Glowing diffuser panel on +Z front face
  const diffuserY = BASE_H + TRIM_T + DIFFUSER_H * 0.5;
  const diffuserZ = cdFront + DIFFUSER_D * 0.35;
  const diffuserGeo = new THREE.BoxGeometry(DIFFUSER_W, DIFFUSER_H, DIFFUSER_D);
  addMesh(diffuserGeo, diffuserMat, "diffuser_panel", 0, diffuserY, diffuserZ);

  // 8-11. Black frame trim around the diffuser
  const sideTrimGeo = new THREE.BoxGeometry(TRIM_T, DIFFUSER_H + TRIM_T * 2, DIFFUSER_D + 0.004);
  addMesh(sideTrimGeo, blackMetalMat, "trim_left", -DIFFUSER_W * 0.5 - TRIM_T * 0.5, diffuserY, diffuserZ);
  addMesh(sideTrimGeo, blackMetalMat, "trim_right", DIFFUSER_W * 0.5 + TRIM_T * 0.5, diffuserY, diffuserZ);

  const horizTrimGeo = new THREE.BoxGeometry(COL_W, TRIM_T, DIFFUSER_D + 0.004);
  addMesh(horizTrimGeo, blackMetalMat, "trim_top", 0, BASE_H + TRIM_T * 1.5 + DIFFUSER_H, diffuserZ);
  addMesh(horizTrimGeo, blackMetalMat, "trim_bottom", 0, BASE_H + TRIM_T * 0.5, diffuserZ);

  // 12. Top cap (reaches exact HEIGHT = 1.40)
  const capGeo = new THREE.ExtrudeGeometry(colShape, {
    depth: CAP_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  capGeo.rotateX(-Math.PI / 2);
  addMesh(capGeo, blackMetalMat, "top_cap", 0, HEIGHT - CAP_H, 0);

  // 13. Power cord exiting back of base
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.010, -BASE_D * 0.45),
    new THREE.Vector3(0.04, 0.005, -BASE_D * 0.65),
    new THREE.Vector3(0.11, 0.003, -BASE_D * 0.72),
    new THREE.Vector3(0.17, 0.003, -BASE_D * 0.65),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 16, 0.003, 8, false);
  addMesh(cordGeo, darkRubberMat, "power_cord", 0, 0, 0);

  // 14-15. Inline foot switch on the floor
  const switchGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.014, 20);
  switchGeo.scale(1.2, 1, 0.85);
  addMesh(switchGeo, switchMat, "foot_switch_body", 0.17, 0.007, -BASE_D * 0.65);

  const buttonGeo = new THREE.CylinderGeometry(0.009, 0.010, 0.006, 16);
  addMesh(buttonGeo, blackMetalMat, "foot_switch_button", 0.17, 0.015, -BASE_D * 0.65);

  return group;
}
