function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.05;
  const H = 2.15;
  const D = 0.38;

  const SIDE_T = 0.035;
  const BACK_T = 0.02;
  const STILE_W = 0.085;
  const STILE_T = 0.028;
  const PLINTH_H = 0.06;
  const SHELF_T = 0.035;
  const CORNICE_H = 0.11;

  const INNER_W = W - 2 * SIDE_T;
  const INNER_D = D - BACK_T;
  const TOP_INNER_Y = H - CORNICE_H;
  const COMP_H = (TOP_INNER_Y - (PLINTH_H + SHELF_T)) / 5;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8c6239,
    roughness: 0.78,
    metalness: 0.03,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x6e4b2a,
    roughness: 0.82,
    metalness: 0.03,
  });
  const bookGreenMat = new THREE.MeshStandardMaterial({
    color: 0x4a5943,
    roughness: 0.85,
    metalness: 0.02,
  });
  const bookBrownMat = new THREE.MeshStandardMaterial({
    color: 0x6b422b,
    roughness: 0.8,
    metalness: 0.02,
  });
  const bookTanMat = new THREE.MeshStandardMaterial({
    color: 0x9c8262,
    roughness: 0.85,
    metalness: 0.02,
  });
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xb89b72,
    roughness: 0.65,
    metalness: 0.05,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8a6d3b,
    roughness: 0.45,
    metalness: 0.6,
  });
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x8f715b,
    roughness: 0.75,
    metalness: 0.05,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main Cabinet Frame
  const sideH = H - CORNICE_H;
  const sideGeo = new THREE.BoxGeometry(SIDE_T, sideH, D - STILE_T);
  addMesh(sideGeo, woodMat, "left_side_panel", -W / 2 + SIDE_T / 2, sideH / 2, -STILE_T / 2);
  addMesh(sideGeo, woodMat, "right_side_panel", W / 2 - SIDE_T / 2, sideH / 2, -STILE_T / 2);

  const backGeo = new THREE.BoxGeometry(INNER_W + 0.01, sideH, BACK_T);
  addMesh(backGeo, darkWoodMat, "back_panel", 0, sideH / 2, -D / 2 + BACK_T / 2);

  const stileGeo = new THREE.BoxGeometry(STILE_W, sideH, STILE_T);
  addMesh(stileGeo, woodMat, "left_front_stile", -W / 2 + STILE_W / 2, sideH / 2, D / 2 - STILE_T / 2);
  addMesh(stileGeo, woodMat, "right_front_stile", W / 2 - STILE_W / 2, sideH / 2, D / 2 - STILE_T / 2);

  // Bottom plinth
  const plinthGeo = new THREE.BoxGeometry(W, PLINTH_H, D);
  addMesh(plinthGeo, woodMat, "bottom_plinth", 0, PLINTH_H / 2, 0);

  // Shelves (bottom shelf + 4 intermediate shelves)
  const shelfGeo = new THREE.BoxGeometry(INNER_W, SHELF_T, INNER_D);
  const shelfTopYs = [];
  for (let i = 0; i < 5; i++) {
    const topY = PLINTH_H + SHELF_T + i * COMP_H;
    shelfTopYs.push(topY);
    addMesh(shelfGeo, woodMat, `shelf_${i}`, 0, topY - SHELF_T / 2, BACK_T / 2);
  }

  // Top arched apron between stiles
  const apronW = W - 2 * STILE_W;
  const apronH = 0.065;
  const apronShape = new THREE.Shape();
  apronShape.moveTo(-apronW / 2, 0);
  apronShape.lineTo(apronW / 2, 0);
  apronShape.lineTo(apronW / 2, -apronH);
  apronShape.quadraticCurveTo(0, -0.012, -apronW / 2, -apronH);
  apronShape.closePath();

  const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
    depth: STILE_T,
    bevelEnabled: false,
    curveSegments: 16,
  });
  addMesh(apronGeo, woodMat, "top_apron_arch", 0, TOP_INNER_Y, D / 2 - STILE_T);

  // Stepped Cornice / Crown Molding
  const corniceLowerGeo = new THREE.BoxGeometry(W + 0.03, CORNICE_H * 0.5, D + 0.03);
  addMesh(corniceLowerGeo, woodMat, "cornice_lower", 0, H - CORNICE_H * 0.75, 0.01);

  const corniceUpperGeo = new THREE.BoxGeometry(W + 0.07, CORNICE_H * 0.5, D + 0.06);
  addMesh(corniceUpperGeo, woodMat, "cornice_upper", 0, H - CORNICE_H * 0.25, 0.02);

  // Decorative wooden pegs on front stiles
  const pegGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.008, 12);
  pegGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const py = i < 4 ? shelfTopYs[i + 1] - SHELF_T / 2 : TOP_INNER_Y - 0.03;
    addMesh(pegGeo, darkWoodMat, `left_stile_peg_${i}`, -W / 2 + STILE_W / 2, py, D / 2 + 0.002);
    addMesh(pegGeo, darkWoodMat, `right_stile_peg_${i}`, W / 2 - STILE_W / 2, py, D / 2 + 0.002);
  }

  // 2. Props & Books on Shelves
  // Compartment 4 (Top): Globes on left, horizontal stack in middle, vertical books on right
  const y4 = shelfTopYs[4];
  // Large Globe
  addMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 16), brassMat, "globe_large_stand", -0.32, y4 + 0.04, 0.02);
  addMesh(new THREE.SphereGeometry(0.105, 24, 18), globeMat, "globe_large_sphere", -0.32, y4 + 0.175, 0.02);
  // Small Globe
  addMesh(new THREE.CylinderGeometry(0.03, 0.038, 0.06, 16), brassMat, "globe_small_stand", -0.14, y4 + 0.03, 0.03);
  addMesh(new THREE.SphereGeometry(0.07, 20, 16), globeMat, "globe_small_sphere", -0.14, y4 + 0.12, 0.03);

  // Horizontal book stack (top)
  addMesh(new THREE.BoxGeometry(0.22, 0.09, 0.16), bookBrownMat, "books_top_stack", 0.08, y4 + 0.045, 0.02);
  // Vertical books (top right)
  addMesh(new THREE.BoxGeometry(0.18, 0.21, 0.17), bookGreenMat, "books_top_right", 0.34, y4 + 0.105, 0.02);

  // Compartment 3: Vertical books left, vase center-left, horizontal stack right
  const y3 = shelfTopYs[3];
  addMesh(new THREE.BoxGeometry(0.17, 0.21, 0.17), bookGreenMat, "books_c3_left", -0.34, y3 + 0.105, 0.02);
  const vasePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.0),
    new THREE.Vector2(0.075, 0.07),
    new THREE.Vector2(0.05, 0.13),
    new THREE.Vector2(0.06, 0.15),
    new THREE.Vector2(0.048, 0.15),
    new THREE.Vector2(0.04, 0.12),
    new THREE.Vector2(0.0, 0.12),
  ];
  const vaseGeo = new THREE.LatheGeometry(vasePoints, 20);
  addMesh(vaseGeo, ceramicMat, "vase_c3", -0.11, y3, 0.02);
  addMesh(new THREE.BoxGeometry(0.21, 0.09, 0.16), bookBrownMat, "books_c3_stack", 0.14, y3 + 0.045, 0.02);
  addMesh(new THREE.BoxGeometry(0.15, 0.21, 0.17), bookTanMat, "books_c3_right", 0.36, y3 + 0.105, 0.02);

  // Compartment 2: Books left, stack, small vase, books right
  const y2 = shelfTopYs[2];
  addMesh(new THREE.BoxGeometry(0.16, 0.21, 0.17), bookBrownMat, "books_c2_left", -0.35, y2 + 0.105, 0.02);
  addMesh(new THREE.BoxGeometry(0.20, 0.09, 0.16), bookTanMat, "books_c2_stack", -0.10, y2 + 0.045, 0.02);
  addMesh(vaseGeo, ceramicMat, "vase_c2", 0.13, y2, 0.02, 0, 0, 0);
  addMesh(new THREE.BoxGeometry(0.20, 0.21, 0.17), bookGreenMat, "books_c2_right", 0.33, y2 + 0.105, 0.02);

  // Compartment 1: Books left, small vase, stack, vase right
  const y1 = shelfTopYs[1];
  addMesh(new THREE.BoxGeometry(0.18, 0.21, 0.17), bookGreenMat, "books_c1_left", -0.34, y1 + 0.105, 0.02);
  addMesh(vaseGeo, ceramicMat, "vase_c1_left", -0.15, y1, 0.02);
  addMesh(new THREE.BoxGeometry(0.21, 0.10, 0.16), bookTanMat, "books_c1_stack", 0.10, y1 + 0.05, 0.02);
  addMesh(vaseGeo, ceramicMat, "vase_c1_right", 0.33, y1, 0.02);

  // Compartment 0 (Bottom): Books left, stack, tilted books right
  const y0 = shelfTopYs[0];
  addMesh(new THREE.BoxGeometry(0.16, 0.21, 0.17), bookBrownMat, "books_c0_left", -0.35, y0 + 0.105, 0.02);
  addMesh(new THREE.BoxGeometry(0.20, 0.09, 0.16), bookGreenMat, "books_c0_stack", -0.10, y0 + 0.045, 0.02);
  addMesh(new THREE.BoxGeometry(0.20, 0.21, 0.17), bookTanMat, "books_c0_right", 0.32, y0 + 0.105, 0.02);

  return group;
}
