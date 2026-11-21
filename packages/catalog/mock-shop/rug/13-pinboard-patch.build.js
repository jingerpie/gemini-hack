function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90; // short side along X
  const D = 1.50; // long side along Z
  const H = 0.014; // total rug thickness
  const BASE_H = 0.012;
  const PILE_TOP = BASE_H + 0.002;
  const BORDER_T = 0.012;

  // Materials (tufted wool look)
  const matMustard = new THREE.MeshStandardMaterial({
    color: 0xc89238,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd1,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matTerracotta = new THREE.MeshStandardMaterial({
    color: 0x9e3f23,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matSage = new THREE.MeshStandardMaterial({
    color: 0x87997b,
    roughness: 0.94,
    metalness: 0.0,
  });
  const matPink = new THREE.MeshStandardMaterial({
    color: 0xc28a86,
    roughness: 0.94,
    metalness: 0.0,
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base rug
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  const baseMesh = new THREE.Mesh(baseGeo, matMustard);
  baseMesh.position.set(0, BASE_H / 2, 0);
  addMesh(baseMesh, "rug_base");

  // 2. Bound edges around perimeter
  const borderFBGeo = new THREE.BoxGeometry(W, H, BORDER_T);
  const borderFront = new THREE.Mesh(borderFBGeo, matMustard);
  borderFront.position.set(0, H / 2, D / 2 - BORDER_T / 2);
  addMesh(borderFront, "rug_border_front");

  const borderBack = new THREE.Mesh(borderFBGeo, matMustard);
  borderBack.position.set(0, H / 2, -D / 2 + BORDER_T / 2);
  addMesh(borderBack, "rug_border_back");

  const borderLRGeo = new THREE.BoxGeometry(BORDER_T, H, D - BORDER_T * 2);
  const borderLeft = new THREE.Mesh(borderLRGeo, matMustard);
  borderLeft.position.set(-W / 2 + BORDER_T / 2, H / 2, 0);
  addMesh(borderLeft, "rug_border_left");

  const borderRight = new THREE.Mesh(borderLRGeo, matMustard);
  borderRight.position.set(W / 2 - BORDER_T / 2, H / 2, 0);
  addMesh(borderRight, "rug_border_right");

  // Helper for flat tufted blocks
  function addBlock(w, d, x, z, mat, name, yTop = PILE_TOP - 0.0005) {
    const h = 0.004;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, yTop - h / 2, z);
    return addMesh(mesh, name);
  }

  // 3. Cream rectangular blocks
  addBlock(0.38, 0.48, 0.19, -0.22, matCream, "cream_block_right", PILE_TOP - 0.0008);
  addBlock(0.40, 0.48, -0.20, 0.08, matCream, "cream_block_left", PILE_TOP - 0.0008);

  // 4. Terracotta horizontal bars
  addBlock(0.44, 0.055, 0.20, -0.47, matTerracotta, "terracotta_bar_top");
  addBlock(0.32, 0.055, -0.24, -0.17, matTerracotta, "terracotta_bar_mid");
  addBlock(0.54, 0.060, -0.10, 0.49, matTerracotta, "terracotta_bar_bottom");

  // Helper for flat tufted discs
  function addDisc(r, x, z, mat, name, yTop = PILE_TOP, scaleX = 1, scaleZ = 1, rotY = 0) {
    const h = 0.004;
    const geo = new THREE.CylinderGeometry(r, r, h, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(scaleX, 1, scaleZ);
    mesh.rotation.y = rotY;
    mesh.position.set(x, yTop - h / 2, z);
    return addMesh(mesh, name);
  }

  // 5. Top-right sage circle + pink wave band
  addDisc(0.135, 0.20, -0.23, matSage, "circle_top_right_green");
  addDisc(0.125, 0.20, -0.25, matPink, "circle_top_right_pink_band", PILE_TOP + 0.0004, 1.0, 0.24, -0.15);

  // 6. Mid-left sage circle + pink crescent & band
  addDisc(0.135, -0.21, 0.09, matSage, "circle_mid_left_green");
  addDisc(0.125, -0.27, 0.09, matPink, "circle_mid_left_pink_crescent", PILE_TOP + 0.0004, 0.42, 0.92, 0.2);
  addDisc(0.095, -0.15, 0.13, matPink, "circle_mid_left_pink_band", PILE_TOP + 0.0004, 0.35, 0.85, -0.6);

  // 7. Bottom-center/right sage circle + pink crescent
  addDisc(0.145, 0.08, 0.28, matSage, "circle_bottom_green");
  addDisc(0.135, 0.02, 0.32, matPink, "circle_bottom_pink_crescent", PILE_TOP + 0.0004, 0.55, 0.90, 0.7);

  // 8. Small dusty pink accents
  addDisc(0.062, -0.19, -0.56, matPink, "pink_dot_top_left", PILE_TOP, 1.05, 0.85, 0);
  addDisc(0.085, 0.18, -0.02, matPink, "pink_oval_mid_right", PILE_TOP, 1.15, 0.55, 0.15);

  // 9. Sage botanical leaf branch (top-left mustard area)
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.24, PILE_TOP - 0.001, -0.22),
    new THREE.Vector3(-0.18, PILE_TOP - 0.001, -0.31),
    new THREE.Vector3(-0.12, PILE_TOP - 0.001, -0.40),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.006, 8, false);
  const stemMesh = new THREE.Mesh(stemGeo, matSage);
  addMesh(stemMesh, "leaf_stem");

  // Leaves along the stem
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.028, 0.025, 0, 0.065);
  leafShape.quadraticCurveTo(-0.028, 0.025, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 10,
  });
  leafGeo.rotateX(Math.PI / 2);

  const leaves = [
    { x: -0.21, z: -0.26, rotY: 0.9, s: 0.95, name: "leaf_1" },
    { x: -0.21, z: -0.27, rotY: -0.3, s: 0.90, name: "leaf_2" },
    { x: -0.17, z: -0.32, rotY: 0.85, s: 1.05, name: "leaf_3" },
    { x: -0.17, z: -0.33, rotY: -0.25, s: 1.0, name: "leaf_4" },
    { x: -0.13, z: -0.38, rotY: 0.75, s: 0.90, name: "leaf_5" },
    { x: -0.12, z: -0.40, rotY: 0.35, s: 0.95, name: "leaf_6" },
  ];

  leaves.forEach((l) => {
    const mesh = new THREE.Mesh(leafGeo, matSage);
    mesh.position.set(l.x, PILE_TOP + 0.001, l.z);
    mesh.rotation.y = l.rotY;
    mesh.scale.set(l.s, 1, l.s);
    addMesh(mesh, l.name);
  });

  return group;
}
