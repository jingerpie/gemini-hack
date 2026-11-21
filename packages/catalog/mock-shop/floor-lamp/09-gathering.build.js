function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BASE_R = 0.16;
  const BASE_H = 0.032;
  const PAD_H = 0.004;
  const STEM_R = 0.011;
  const TOTAL_H = 1.50;
  const BEND_R = 0.055;
  const ARM_REACH = 0.24;
  const SHADE_R = 0.145;
  const SHADE_H = 0.145;
  const FINIAL_R = 0.014;
  const FINIAL_H = 0.036;

  // Center assembly along Z so bounding box is centered on x=0, z=0
  const STEM_Z = -0.10;
  const SHADE_Z = STEM_Z + ARM_REACH;
  const ARM_Y = TOTAL_H - FINIAL_H * 0.5;
  const SHADE_TOP_Y = ARM_Y - FINIAL_H * 0.5;
  const SHADE_RIM_Y = SHADE_TOP_Y - SHADE_H;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3c3e,
    roughness: 0.55,
    metalness: 0.45
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.85,
    metalness: 0.05
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf4ead5,
    roughness: 0.6,
    metalness: 0.05,
    emissive: 0xffd28a,
    emissiveIntensity: 0.35
  });

  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xffd89b,
    emissiveIntensity: 1.2
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base rubber pad (touches y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.96, BASE_R * 0.96, PAD_H, 32),
    darkRubberMat,
    'base_pad',
    0,
    PAD_H * 0.5,
    STEM_Z + 0.02
  );

  // 2. Main circular base disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H - PAD_H, 32),
    metalMat,
    'base_disc',
    0,
    PAD_H + (BASE_H - PAD_H) * 0.5,
    STEM_Z + 0.02
  );

  // 3. Base top bevel ring
  const bevelMesh = addMesh(
    new THREE.TorusGeometry(BASE_R - 0.004, 0.004, 12, 32),
    metalMat,
    'base_bevel',
    0,
    BASE_H - 0.002,
    STEM_Z + 0.02
  );
  bevelMesh.rotation.x = Math.PI * 0.5;

  // 4. Stem base collar
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.45, STEM_R * 1.6, 0.012, 24),
    metalMat,
    'stem_collar',
    0,
    BASE_H + 0.006,
    STEM_Z
  );

  // 5. Vertical stem
  const stemStartY = BASE_H;
  const stemEndY = ARM_Y - BEND_R;
  const stemLen = stemEndY - stemStartY;
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, stemLen, 20),
    metalMat,
    'stem_vertical',
    0,
    stemStartY + stemLen * 0.5,
    STEM_Z
  );

  // 6. 90-degree curved bend
  const bendCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, stemEndY, STEM_Z),
    new THREE.Vector3(0, stemEndY + BEND_R * 0.55, STEM_Z + BEND_R * 0.08),
    new THREE.Vector3(0, ARM_Y - BEND_R * 0.08, STEM_Z + BEND_R * 0.45),
    new THREE.Vector3(0, ARM_Y, STEM_Z + BEND_R)
  ]);
  addMesh(
    new THREE.TubeGeometry(bendCurve, 16, STEM_R, 16, false),
    metalMat,
    'stem_bend'
  );

  // 7. Horizontal arm
  const armStartZ = STEM_Z + BEND_R;
  const armLen = SHADE_Z - armStartZ;
  const armMesh = addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, armLen, 20),
    metalMat,
    'arm_horizontal',
    0,
    ARM_Y,
    armStartZ + armLen * 0.5
  );
  armMesh.rotation.x = Math.PI * 0.5;

  // 8. Shade top finial
  addMesh(
    new THREE.CylinderGeometry(FINIAL_R, FINIAL_R, FINIAL_H, 24),
    metalMat,
    'shade_finial',
    0,
    SHADE_TOP_Y + FINIAL_H * 0.5,
    SHADE_Z
  );

  // 9. Outer dome shade
  addMesh(
    new THREE.SphereGeometry(SHADE_R, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
    metalMat,
    'shade_outer',
    0,
    SHADE_RIM_Y,
    SHADE_Z
  );

  // 10. Inner warm shade lining
  addMesh(
    new THREE.SphereGeometry(SHADE_R - 0.004, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.49),
    shadeInnerMat,
    'shade_inner',
    0,
    SHADE_RIM_Y + 0.002,
    SHADE_Z
  );

  // 11. Shade bottom rim
  const rimMesh = addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.002, 0.003, 12, 32),
    metalMat,
    'shade_rim',
    0,
    SHADE_RIM_Y,
    SHADE_Z
  );
  rimMesh.rotation.x = Math.PI * 0.5;

  // 12. Warm diffuser disc inside shade
  addMesh(
    new THREE.CylinderGeometry(SHADE_R * 0.72, SHADE_R * 0.72, 0.008, 28),
    diffuserMat,
    'diffuser_disc',
    0,
    SHADE_RIM_Y + 0.035,
    SHADE_Z
  );

  // 13. Cord grommet near base of stem
  const grommetMesh = addMesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.014, 12),
    darkRubberMat,
    'cord_grommet',
    0,
    BASE_H + 0.024,
    STEM_Z - STEM_R
  );
  grommetMesh.rotation.x = Math.PI * 0.5;

  // 14. Power cord trailing along the floor
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BASE_H + 0.024, STEM_Z - STEM_R - 0.005),
    new THREE.Vector3(0, 0.012, STEM_Z - 0.06),
    new THREE.Vector3(0.06, 0.004, STEM_Z - 0.14),
    new THREE.Vector3(0.18, 0.004, STEM_Z - 0.22),
    new THREE.Vector3(0.32, 0.004, STEM_Z - 0.26)
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 24, 0.0035, 8, false),
    darkRubberMat,
    'power_cord'
  );

  return group;
}
