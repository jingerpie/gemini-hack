function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.50;
  const D = 0.52;
  const H = 0.80;
  const SEAT_H = 0.46;

  const APRON_Y = 0.39;
  const APRON_H = 0.045;
  const APRON_THICK = 0.024;

  const LEG_X = 0.205;
  const FRONT_Z = 0.19;
  const BACK_Z = -0.19;
  const LEG_TOP_Y = APRON_Y + APRON_H * 0.5;

  const CUSHION_W = 0.44;
  const CUSHION_D = 0.43;
  const CUSHION_THICK = 0.042;
  const CUSHION_Z = 0.01;

  const BACK_TOP_Y = H - 0.02;
  const BACK_UPRIGHT_TOP_Z = -0.245;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6b4428,
    roughness: 0.48,
    metalness: 0.04,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe6e2d8,
    roughness: 0.88,
    metalness: 0.0,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.9,
    metalness: 0.05,
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

  // Helper to create a tapered leg between two 3D points
  const createLimb = (p1, p2, rTop, rBot, name, mat) => {
    const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const dir = new THREE.Vector3().subVectors(v2, v1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 16);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. Four tapered legs (touching y = 0.004 glides)
  const GLIDE_H = 0.004;
  createLimb(
    [-LEG_X, GLIDE_H, FRONT_Z + 0.015],
    [-LEG_X, LEG_TOP_Y, FRONT_Z],
    0.019,
    0.012,
    "front_left_leg",
    woodMat
  );
  createLimb(
    [LEG_X, GLIDE_H, FRONT_Z + 0.015],
    [LEG_X, LEG_TOP_Y, FRONT_Z],
    0.019,
    0.012,
    "front_right_leg",
    woodMat
  );
  createLimb(
    [-LEG_X, GLIDE_H, BACK_Z - 0.03],
    [-LEG_X, LEG_TOP_Y, BACK_Z],
    0.019,
    0.012,
    "back_left_leg",
    woodMat
  );
  createLimb(
    [LEG_X, GLIDE_H, BACK_Z - 0.03],
    [LEG_X, LEG_TOP_Y, BACK_Z],
    0.019,
    0.012,
    "back_right_leg",
    woodMat
  );

  // Floor glides at y = 0
  const glideGeo = new THREE.CylinderGeometry(0.012, 0.012, GLIDE_H, 12);
  addMesh(glideGeo, glideMat, "glide_front_left", [-LEG_X, GLIDE_H * 0.5, FRONT_Z + 0.015]);
  addMesh(glideGeo, glideMat, "glide_front_right", [LEG_X, GLIDE_H * 0.5, FRONT_Z + 0.015]);
  addMesh(glideGeo, glideMat, "glide_back_left", [-LEG_X, GLIDE_H * 0.5, BACK_Z - 0.03]);
  addMesh(glideGeo, glideMat, "glide_back_right", [LEG_X, GLIDE_H * 0.5, BACK_Z - 0.03]);

  // 2. Backrest uprights (continuing from back legs)
  createLimb(
    [-LEG_X, APRON_Y, BACK_Z],
    [-LEG_X + 0.005, BACK_TOP_Y, BACK_UPRIGHT_TOP_Z],
    0.015,
    0.019,
    "back_left_upright",
    woodMat
  );
  createLimb(
    [LEG_X, APRON_Y, BACK_Z],
    [LEG_X - 0.005, BACK_TOP_Y, BACK_UPRIGHT_TOP_Z],
    0.015,
    0.019,
    "back_right_upright",
    woodMat
  );

  // 3. Seat apron rails
  const frontRailGeo = new THREE.BoxGeometry(LEG_X * 2, APRON_H, APRON_THICK);
  addMesh(frontRailGeo, woodMat, "front_apron_rail", [0, APRON_Y, FRONT_Z]);

  const backRailGeo = new THREE.BoxGeometry(LEG_X * 2, APRON_H, APRON_THICK);
  addMesh(backRailGeo, woodMat, "back_apron_rail", [0, APRON_Y, BACK_Z]);

  const sideRailLen = FRONT_Z - BACK_Z;
  const sideRailGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideRailLen);
  addMesh(sideRailGeo, woodMat, "left_apron_rail", [-LEG_X, APRON_Y, (FRONT_Z + BACK_Z) * 0.5]);
  addMesh(sideRailGeo, woodMat, "right_apron_rail", [LEG_X, APRON_Y, (FRONT_Z + BACK_Z) * 0.5]);

  // 4. Upholstered seat cushion (rounded rectangle extruded with bevel)
  const cw = CUSHION_W * 0.5 - 0.03;
  const cd = CUSHION_D * 0.5 - 0.03;
  const cr = 0.03;
  const cushionShape = new THREE.Shape();
  cushionShape.moveTo(-cw, -cd - cr);
  cushionShape.lineTo(cw, -cd - cr);
  cushionShape.quadraticCurveTo(cw + cr, -cd - cr, cw + cr, -cd);
  cushionShape.lineTo(cw + cr, cd);
  cushionShape.quadraticCurveTo(cw + cr, cd + cr, cw, cd + cr);
  cushionShape.lineTo(-cw, cd + cr);
  cushionShape.quadraticCurveTo(-cw - cr, cd + cr, -cw - cr, cd);
  cushionShape.lineTo(-cw - cr, -cd);
  cushionShape.quadraticCurveTo(-cw - cr, -cd - cr, -cw, -cd - cr);

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_THICK - 0.024,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.014,
    bevelSegments: 5,
    curveSegments: 12,
  });
  cushionGeo.rotateX(Math.PI * 0.5);
  // Top of cushion sits at SEAT_H
  addMesh(
    cushionGeo,
    fabricMat,
    "seat_cushion",
    [0, SEAT_H - 0.012, CUSHION_Z]
  );

  // 5. Curved wooden backrest
  // Arc in XZ plane, concave toward +Z
  const backRadius = 0.42;
  const backThick = 0.018;
  const backArcAngle = 1.08; // radians
  const backHeight = 0.165;

  const arcShape = new THREE.Shape();
  const rOuter = backRadius + backThick * 0.5;
  const rInner = backRadius - backThick * 0.5;
  const startA = Math.PI * 0.5 - backArcAngle * 0.5;
  const endA = Math.PI * 0.5 + backArcAngle * 0.5;

  arcShape.absarc(0, 0, rOuter, startA, endA, false);
  arcShape.absarc(0, 0, rInner, endA, startA, true);
  arcShape.closePath();

  const backrestGeo = new THREE.ExtrudeGeometry(arcShape, {
    depth: backHeight,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 24,
  });
  // Rotate so extrusion depth (Z) becomes Y, and arc faces +Z
  backrestGeo.rotateX(-Math.PI * 0.5);

  // Position backrest so it wraps the uprights near the top
  const backrestCenterY = BACK_TOP_Y - backHeight - 0.005;
  const backrestArcCenterZ = BACK_UPRIGHT_TOP_Z + backRadius - 0.012;
  addMesh(
    backrestGeo,
    woodMat,
    "backrest_panel",
    [0, backrestCenterY, backrestArcCenterZ],
    [-0.13, 0, 0]
  );

  return group;
}
