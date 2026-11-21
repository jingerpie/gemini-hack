function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.20;          // Table width/length (X - long side)
  const D = 1.05;          // Table depth (Z - short side)
  const H = 0.76;          // Total height (Y)
  const TOP_T = 0.045;     // Tabletop thickness
  const PLANK_COUNT = 4;   // Number of longitudinal planks
  const PLANK_GAP = 0.002; // Subtle seam between planks
  const GLIDE_H = 0.005;   // Floor glide height
  const LEG_H = H - TOP_T - GLIDE_H;
  const LEG_W = 0.22;      // Leg cross-section width (X)
  const LEG_D = 0.16;      // Leg cross-section depth (Z)
  const LEG_CHAMFER = 0.04;
  const INSET_X = 0.28;    // Leg center inset from X edge
  const INSET_Z = 0.16;    // Leg center inset from Z edge
  const APRON_H = 0.055;   // Under-table apron height
  const APRON_T = 0.035;   // Under-table apron thickness

  // Materials
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xb68148,
    roughness: 0.52,
    metalness: 0.02,
  });

  const teakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b39,
    roughness: 0.58,
    metalness: 0.02,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2520,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Helper to configure shadows
  function addMesh(geometry, material, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geometry, material);
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

  // 1. Tabletop planks running along X
  const plankD = (D - PLANK_GAP * (PLANK_COUNT - 1)) / PLANK_COUNT;
  const plankGeo = new THREE.BoxGeometry(W, TOP_T, plankD);
  const topY = H - TOP_T / 2;

  for (let i = 0; i < PLANK_COUNT; i++) {
    const pz = -D / 2 + plankD / 2 + i * (plankD + PLANK_GAP);
    addMesh(plankGeo, teakMat, `tabletop_plank_${i + 1}`, 0, topY, pz);
  }

  // 2. Chamfered/angled leg geometry via ExtrudeGeometry
  const hw = LEG_W / 2;
  const hd = LEG_D / 2;
  const c = LEG_CHAMFER;
  const legShape = new THREE.Shape();
  legShape.moveTo(-hw + c, -hd);
  legShape.lineTo(hw - c, -hd);
  legShape.lineTo(hw, -hd + c);
  legShape.lineTo(hw, hd - c);
  legShape.lineTo(hw - c, hd);
  legShape.lineTo(-hw + c, hd);
  legShape.lineTo(-hw, hd - c);
  legShape.lineTo(-hw, -hd + c);
  legShape.closePath();

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_H,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  // Rotate so extrusion goes along +Y, starting at y = 0
  legGeo.rotateX(-Math.PI / 2);

  const glideGeo = new THREE.CylinderGeometry(
    Math.min(LEG_W, LEG_D) * 0.35,
    Math.min(LEG_W, LEG_D) * 0.38,
    GLIDE_H,
    16
  );

  const mountGeo = new THREE.BoxGeometry(LEG_W + 0.02, 0.02, LEG_D + 0.02);

  const legPositions = [
    { name: 'front_left',  x: -W / 2 + INSET_X, z:  D / 2 - INSET_Z, ry:  0.22 },
    { name: 'front_right', x:  W / 2 - INSET_X, z:  D / 2 - INSET_Z, ry: -0.22 },
    { name: 'back_left',   x: -W / 2 + INSET_X, z: -D / 2 + INSET_Z, ry: -0.22 },
    { name: 'back_right',  x:  W / 2 - INSET_X, z: -D / 2 + INSET_Z, ry:  0.22 },
  ];

  for (const lp of legPositions) {
    // Floor glide touching y = 0
    addMesh(glideGeo, glideMat, `glide_${lp.name}`, lp.x, GLIDE_H / 2, lp.z);

    // Main leg column
    addMesh(legGeo, teakMat, `leg_${lp.name}`, lp.x, GLIDE_H, lp.z, 0, lp.ry, 0);

    // Top mounting block connecting leg to tabletop underside
    addMesh(
      mountGeo,
      teakDarkMat,
      `leg_mount_${lp.name}`,
      lp.x,
      H - TOP_T - 0.01,
      lp.z,
      0,
      lp.ry,
      0
    );
  }

  // 3. Under-table apron frame
  const apronY = H - TOP_T - APRON_H / 2;
  const spanX = W - 2 * INSET_X;
  const spanZ = D - 2 * INSET_Z;

  const endApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, spanZ);
  const longApronGeo = new THREE.BoxGeometry(spanX, APRON_H, APRON_T);
  const centerBeamGeo = new THREE.BoxGeometry(spanX, APRON_H * 0.85, APRON_T * 1.2);

  addMesh(endApronGeo,   teakDarkMat, 'apron_left',  -W / 2 + INSET_X, apronY, 0);
  addMesh(endApronGeo,   teakDarkMat, 'apron_right',  W / 2 - INSET_X, apronY, 0);
  addMesh(longApronGeo,  teakDarkMat, 'apron_front',  0, apronY,  D / 2 - INSET_Z);
  addMesh(longApronGeo,  teakDarkMat, 'apron_back',   0, apronY, -D / 2 + INSET_Z);
  addMesh(centerBeamGeo, teakDarkMat, 'center_support_beam', 0, apronY, 0);

  return group;
}
