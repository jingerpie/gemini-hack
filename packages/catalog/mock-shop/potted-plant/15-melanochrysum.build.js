function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const POT_H = 0.16;
  const POT_TOP_R = 0.092;
  const POT_BOT_R = 0.068;
  const POT_RIM_H = 0.024;
  const POT_RIM_R = 0.098;
  const SOIL_Y = POT_H - 0.015;

  const POLE_R = 0.023;
  const POLE_H = 0.37;
  const POLE_BASE_Y = SOIL_Y + 0.025;
  const POLE_Z = -0.012;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xa15436,
    roughness: 0.55,
    metalness: 0.05,
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x362417,
    roughness: 0.95,
    metalness: 0.0,
  });
  const stakeMat = new THREE.MeshStandardMaterial({
    color: 0xc29b61,
    roughness: 0.85,
  });
  const coirMat = new THREE.MeshStandardMaterial({
    color: 0x875629,
    roughness: 0.95,
    metalness: 0.0,
  });
  const twineMat = new THREE.MeshStandardMaterial({
    color: 0xd6bc91,
    roughness: 0.85,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0x3b6e38,
    roughness: 0.7,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4b7332,
    roughness: 0.65,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x263d1f,
    roughness: 0.85,
    metalness: 0.02,
  });
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x89a665,
    roughness: 0.75,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Pot (LatheGeometry)
  const potPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(POT_BOT_R, 0),
    new THREE.Vector2(POT_TOP_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H - POT_RIM_H),
    new THREE.Vector2(POT_RIM_R, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.004, POT_H),
    new THREE.Vector2(POT_TOP_R - 0.008, SOIL_Y - 0.01),
    new THREE.Vector2(0, SOIL_Y - 0.01),
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  addMesh(potGeo, potMat, 'nursery_pot');

  // 2. Soil
  const soilGeo = new THREE.CylinderGeometry(POT_TOP_R - 0.006, POT_BOT_R, 0.03, 24);
  addMesh(soilGeo, soilMat, 'potting_soil', [0, SOIL_Y - 0.012, 0]);

  // 3. Moss Pole (inner wooden stake + coir cylinder + twine spiral)
  const stakeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 12);
  addMesh(stakeGeo, stakeMat, 'pole_wooden_stake', [0, SOIL_Y + 0.02, POLE_Z]);

  const coirGeo = new THREE.CylinderGeometry(POLE_R, POLE_R, POLE_H, 24);
  addMesh(coirGeo, coirMat, 'moss_pole_coir', [0, POLE_BASE_Y + POLE_H / 2, POLE_Z]);

  // Twine spiral around moss pole
  const twinePts = [];
  const turns = 6.5;
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns;
    const y = POLE_BASE_Y + 0.015 + t * (POLE_H - 0.03);
    const r = POLE_R + 0.0012;
    twinePts.push(new THREE.Vector3(Math.cos(angle) * r, y, POLE_Z + Math.sin(angle) * r));
  }
  const twineCurve = new THREE.CatmullRomCurve3(twinePts);
  const twineGeo = new THREE.TubeGeometry(twineCurve, 64, 0.0015, 6, false);
  addMesh(twineGeo, twineMat, 'moss_pole_twine');

  // Green plant tie strap
  const tieGeo = new THREE.TorusGeometry(POLE_R + 0.004, 0.0035, 8, 24);
  addMesh(tieGeo, tieMat, 'plant_tie_strap', [0, SOIL_Y + 0.075, POLE_Z + 0.004], [Math.PI / 2, 0, 0]);

  // 4. Main climbing stem
  const stemPts = [
    new THREE.Vector3(0.006, SOIL_Y - 0.005, POLE_Z + 0.022),
    new THREE.Vector3(0.004, SOIL_Y + 0.075, POLE_Z + 0.026),
    new THREE.Vector3(-0.002, SOIL_Y + 0.16, POLE_Z + 0.025),
    new THREE.Vector3(0.0, SOIL_Y + 0.25, POLE_Z + 0.022),
    new THREE.Vector3(0.008, SOIL_Y + 0.31, POLE_Z + 0.02),
  ];
  const stemCurve = new THREE.CatmullRomCurve3(stemPts);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 24, 0.007, 10, false);
  addMesh(stemGeo, stemMat, 'main_stem');

  // New unfurling shoot at top of stem
  const shootGeo = new THREE.ConeGeometry(0.005, 0.075, 10);
  addMesh(shootGeo, veinMat, 'new_growth_shoot', [0.014, SOIL_Y + 0.34, POLE_Z + 0.02], [0.05, 0, -0.22]);

  // Helper to create a cordate (heart-shaped) philodendron leaf
  function createLeafGroup(name, scaleX, scaleY, pos, rot, petioleStart, petioleEnd) {
    // Petiole
    const pMid = new THREE.Vector3(
      (petioleStart.x + petioleEnd.x) * 0.5,
      (petioleStart.y + petioleEnd.y) * 0.5 + 0.015,
      (petioleStart.z + petioleEnd.z) * 0.5 + 0.01
    );
    const pCurve = new THREE.CatmullRomCurve3([petioleStart, pMid, petioleEnd]);
    const pGeo = new THREE.TubeGeometry(pCurve, 12, 0.0038, 8, false);
    addMesh(pGeo, stemMat, `${name}_petiole`);

    // Leaf blade shape (origin at petiole attachment, pointing -Y when flat, then rotated)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Right lobe
    shape.bezierCurveTo(0.035 * scaleX, 0.03 * scaleY, 0.068 * scaleX, -0.01 * scaleY, 0.058 * scaleX, -0.075 * scaleY);
    shape.bezierCurveTo(0.048 * scaleX, -0.13 * scaleY, 0.015 * scaleX, -0.165 * scaleY, 0, -0.19 * scaleY);
    // Left lobe
    shape.bezierCurveTo(-0.015 * scaleX, -0.165 * scaleY, -0.048 * scaleX, -0.13 * scaleY, -0.058 * scaleX, -0.075 * scaleY);
    shape.bezierCurveTo(-0.068 * scaleX, -0.01 * scaleY, -0.035 * scaleX, 0.03 * scaleY, 0, 0);

    const bladeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.002,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2,
      curveSegments: 16,
    });

    const leafSubGroup = new THREE.Group();
    leafSubGroup.name = `${name}_group`;
    leafSubGroup.position.copy(petioleEnd);
    leafSubGroup.rotation.set(rot[0], rot[1], rot[2]);

    const bladeMesh = new THREE.Mesh(bladeGeo, leafMat);
    bladeMesh.name = `${name}_blade`;
    bladeMesh.castShadow = true;
    bladeMesh.receiveShadow = true;
    leafSubGroup.add(bladeMesh);

    // Central midrib vein
    const midribGeo = new THREE.ConeGeometry(0.0022 * scaleX, 0.165 * scaleY, 6);
    const midribMesh = new THREE.Mesh(midribGeo, veinMat);
    midribMesh.name = `${name}_midrib`;
    midribMesh.position.set(0, -0.085 * scaleY, 0.0025);
    midribMesh.rotation.z = Math.PI;
    midribMesh.castShadow = true;
    midribMesh.receiveShadow = true;
    leafSubGroup.add(midribMesh);

    group.add(leafSubGroup);
  }

  // 5. Leaves (matching the 4 prominent leaves in the photo)
  // Top-left large leaf
  createLeafGroup(
    'leaf_top_left',
    1.15,
    1.2,
    null,
    [0.25, -0.45, -0.18],
    new THREE.Vector3(0.0, SOIL_Y + 0.24, POLE_Z + 0.022),
    new THREE.Vector3(-0.055, SOIL_Y + 0.285, POLE_Z + 0.055)
  );

  // Mid-right large leaf
  createLeafGroup(
    'leaf_mid_right',
    1.05,
    1.1,
    null,
    [0.22, 0.42, 0.22],
    new THREE.Vector3(0.002, SOIL_Y + 0.17, POLE_Z + 0.024),
    new THREE.Vector3(0.06, SOIL_Y + 0.21, POLE_Z + 0.05)
  );

  // Lower-left medium leaf
  createLeafGroup(
    'leaf_lower_left',
    0.85,
    0.85,
    null,
    [0.35, -0.35, -0.35],
    new THREE.Vector3(0.002, SOIL_Y + 0.09, POLE_Z + 0.025),
    new THREE.Vector3(-0.045, SOIL_Y + 0.12, POLE_Z + 0.055)
  );

  // Lower-right small leaf
  createLeafGroup(
    'leaf_lower_right',
    0.65,
    0.65,
    null,
    [0.38, 0.35, 0.38],
    new THREE.Vector3(0.005, SOIL_Y + 0.055, POLE_Z + 0.024),
    new THREE.Vector3(0.045, SOIL_Y + 0.075, POLE_Z + 0.045)
  );

  return group;
}
