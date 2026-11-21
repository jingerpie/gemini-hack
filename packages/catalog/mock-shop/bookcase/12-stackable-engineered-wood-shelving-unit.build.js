function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.80;
  const D = 0.36;
  const BOX_H = 0.32;
  const SPACER_H = 0.024;
  const H = BOX_H * 2 + SPACER_H;

  const PANEL_T = 0.022;
  const OUTER_SIDE_T = 0.024;
  const INNER_SIDE_T = 0.022;
  const EDGE_T = 0.008;

  const INNER_W = W - OUTER_SIDE_T * 2;
  const CAVITY_H = BOX_H - PANEL_T * 2;

  // Materials
  const lightWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc69c72,
    roughness: 0.65,
    metalness: 0.02
  });

  const sageGreenMat = new THREE.MeshStandardMaterial({
    color: 0x8e9969,
    roughness: 0.55,
    metalness: 0.02
  });

  const darkCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x3e3932,
    roughness: 0.62,
    metalness: 0.04
  });

  const warmBrownMat = new THREE.MeshStandardMaterial({
    color: 0x6f5340,
    roughness: 0.60,
    metalness: 0.03
  });

  function addMesh(geo, mat, x, y, z, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function buildBox(baseY, outerMat, prefix) {
    // Outer side panels
    const outerSideGeo = new THREE.BoxGeometry(OUTER_SIDE_T, BOX_H, D);
    addMesh(outerSideGeo, outerMat, -W / 2 + OUTER_SIDE_T / 2, baseY + BOX_H / 2, 0, `${prefix}_outer_left_side`);
    addMesh(outerSideGeo, outerMat, W / 2 - OUTER_SIDE_T / 2, baseY + BOX_H / 2, 0, `${prefix}_outer_right_side`);

    // Top and bottom main boards
    const horizBoardGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, D - EDGE_T);
    addMesh(horizBoardGeo, lightWoodMat, 0, baseY + BOX_H - PANEL_T / 2, -EDGE_T / 2, `${prefix}_top_board`);
    addMesh(horizBoardGeo, lightWoodMat, 0, baseY + PANEL_T / 2, -EDGE_T / 2, `${prefix}_bottom_board`);

    // Front sage-green edge strips on top and bottom boards
    const edgeGeo = new THREE.BoxGeometry(INNER_W, PANEL_T, EDGE_T);
    addMesh(edgeGeo, sageGreenMat, 0, baseY + BOX_H - PANEL_T / 2, D / 2 - EDGE_T / 2, `${prefix}_top_front_edge`);
    addMesh(edgeGeo, sageGreenMat, 0, baseY + PANEL_T / 2, D / 2 - EDGE_T / 2, `${prefix}_bottom_front_edge`);

    // Inner side panels
    const innerSideGeo = new THREE.BoxGeometry(INNER_SIDE_T, CAVITY_H, D - PANEL_T);
    const innerSideX = W / 2 - OUTER_SIDE_T - INNER_SIDE_T / 2;
    addMesh(innerSideGeo, lightWoodMat, -innerSideX, baseY + BOX_H / 2, PANEL_T / 2, `${prefix}_inner_left_side`);
    addMesh(innerSideGeo, lightWoodMat, innerSideX, baseY + BOX_H / 2, PANEL_T / 2, `${prefix}_inner_right_side`);

    // Back panel
    const backGeo = new THREE.BoxGeometry(INNER_W, CAVITY_H, PANEL_T);
    addMesh(backGeo, lightWoodMat, 0, baseY + BOX_H / 2, -D / 2 + PANEL_T / 2, `${prefix}_back_panel`);
  }

  // Bottom box
  buildBox(0, darkCharcoalMat, 'bottom_box');

  // Recessed spacer plinth between boxes
  const spacerGeo = new THREE.BoxGeometry(INNER_W, SPACER_H, D - 0.02);
  addMesh(spacerGeo, darkCharcoalMat, 0, BOX_H + SPACER_H / 2, 0, 'center_spacer_plinth');

  // Top box
  buildBox(BOX_H + SPACER_H, warmBrownMat, 'top_box');

  return group;
}
