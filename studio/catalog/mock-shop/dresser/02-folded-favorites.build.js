function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a children's 3-drawer dresser
  const W = 0.80;
  const H = 0.78;
  const D = 0.45;

  const SHELL_T = 0.022;      // Outer shell thickness
  const OUTER_R = 0.055;      // Top corner outer radius
  const INNER_R = OUTER_R - SHELL_T;
  const PLY_EDGE_D = 0.004;   // Exposed plywood front edge depth

  const INNER_W = W - SHELL_T * 2;
  const PLINTH_H = 0.055;     // Bottom kickplate height
  const PLINTH_SETBACK = 0.02;

  const DRAWER_GAP = 0.004;
  const DRAWER_AREA_H = H - SHELL_T - PLINTH_H - DRAWER_GAP * 3;
  const DRAWER_H = DRAWER_AREA_H / 3;
  const DRAWER_W = INNER_W - DRAWER_GAP * 2;
  const DRAWER_T = 0.018;
  const DRAWER_Z_SETBACK = 0.006;

  const HANDLE_W = 0.14;
  const HANDLE_H = 0.018;
  const HANDLE_R = 0.008;

  // Materials
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0xa7c1d0,
    roughness: 0.65,
    metalness: 0.02
  });

  const plyMat = new THREE.MeshStandardMaterial({
    color: 0xd9c2a3,
    roughness: 0.75,
    metalness: 0.0
  });

  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x8ea6b5,
    roughness: 0.8,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create the U-shaped wrap-around shell profile (in XY plane)
  function createShellShape() {
    const hw = W / 2;
    const ihw = INNER_W / 2;
    const innerTop = H - SHELL_T;

    const s = new THREE.Shape();
    // Start at bottom-left outer
    s.moveTo(-hw, 0);
    // Up left outer edge to curve start
    s.lineTo(-hw, H - OUTER_R);
    // Top-left outer rounded corner
    s.absarc(-hw + OUTER_R, H - OUTER_R, OUTER_R, Math.PI, Math.PI / 2, true);
    // Top outer edge
    s.lineTo(hw - OUTER_R, H);
    // Top-right outer rounded corner
    s.absarc(hw - OUTER_R, H - OUTER_R, OUTER_R, Math.PI / 2, 0, true);
    // Down right outer edge
    s.lineTo(hw, 0);
    // Across bottom of right leg
    s.lineTo(ihw, 0);
    // Up right inner edge
    s.lineTo(ihw, innerTop - INNER_R);
    // Top-right inner rounded corner
    s.absarc(ihw - INNER_R, innerTop - INNER_R, INNER_R, 0, Math.PI / 2, false);
    // Across inner top
    s.lineTo(-ihw + INNER_R, innerTop);
    // Top-left inner rounded corner
    s.absarc(-ihw + INNER_R, innerTop - INNER_R, INNER_R, Math.PI / 2, Math.PI, false);
    // Down left inner edge
    s.lineTo(-ihw, 0);
    s.closePath();
    return s;
  }

  const shellShape = createShellShape();

  // Main powder-blue shell body
  const shellBodyGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: D - PLY_EDGE_D,
    bevelEnabled: false,
    curveSegments: 24
  });
  addMesh(shellBodyGeo, blueMat, 'outer_shell_body', 0, 0, -D / 2);

  // Exposed birch plywood front edge of the shell
  const shellEdgeGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: PLY_EDGE_D,
    bevelEnabled: false,
    curveSegments: 24
  });
  addMesh(shellEdgeGeo, plyMat, 'outer_shell_ply_edge', 0, 0, D / 2 - PLY_EDGE_D);

  // Back panel
  const backT = 0.014;
  const backGeo = new THREE.BoxGeometry(INNER_W, H - SHELL_T - PLINTH_H, backT);
  addMesh(
    backGeo,
    blueMat,
    'back_panel',
    0,
    PLINTH_H + (H - SHELL_T - PLINTH_H) / 2,
    -D / 2 + backT / 2 + 0.002
  );

  // Inner carcass box behind drawers (prevents any see-through gaps)
  const innerBoxD = D - DRAWER_T - DRAWER_Z_SETBACK - 0.015;
  const innerBoxGeo = new THREE.BoxGeometry(INNER_W - 0.002, H - SHELL_T - PLINTH_H - 0.004, innerBoxD);
  addMesh(
    innerBoxGeo,
    darkRecessMat,
    'inner_carcass_box',
    0,
    PLINTH_H + (H - SHELL_T - PLINTH_H) / 2,
    -D / 2 + innerBoxD / 2 + 0.01
  );

  // Bottom recessed plinth / kickplate
  const plinthD = D - PLINTH_SETBACK - 0.01;
  const plinthGeo = new THREE.BoxGeometry(INNER_W, PLINTH_H, plinthD);
  addMesh(
    plinthGeo,
    blueMat,
    'bottom_plinth',
    0,
    PLINTH_H / 2,
    -D / 2 + plinthD / 2 + 0.005
  );

  // Helper to create a drawer front shape with top-center finger-pull cutout
  function createDrawerFrontShape(isTopDrawer) {
    const hw = DRAWER_W / 2;
    const hh = DRAWER_H / 2;
    const hhw = HANDLE_W / 2;
    const r = isTopDrawer ? Math.max(0.004, INNER_R - DRAWER_GAP) : 0.002;

    const s = new THREE.Shape();
    // Start bottom-left
    s.moveTo(-hw, -hh);
    s.lineTo(hw, -hh);
    // Up right edge
    s.lineTo(hw, hh - r);
    // Top-right corner
    s.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    // Top edge to right side of handle cutout
    s.lineTo(hhw, hh);
    // Handle cutout (U-shaped with rounded bottom corners)
    s.lineTo(hhw, hh - HANDLE_H + HANDLE_R);
    s.absarc(hhw - HANDLE_R, hh - HANDLE_H + HANDLE_R, HANDLE_R, 0, -Math.PI / 2, true);
    s.lineTo(-hhw + HANDLE_R, hh - HANDLE_H);
    s.absarc(-hhw + HANDLE_R, hh - HANDLE_H + HANDLE_R, HANDLE_R, -Math.PI / 2, -Math.PI, true);
    s.lineTo(-hhw, hh);
    // Top edge to top-left corner
    s.lineTo(-hw + r, hh);
    s.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    // Down left edge
    s.lineTo(-hw, -hh);
    s.closePath();
    return s;
  }

  // Build 3 drawers from bottom (0) to top (2)
  const drawerNames = ['bottom_drawer', 'middle_drawer', 'top_drawer'];
  const drawerFrontZ = D / 2 - DRAWER_Z_SETBACK - DRAWER_T;

  for (let i = 0; i < 3; i++) {
    const isTop = i === 2;
    const centerY = PLINTH_H + DRAWER_GAP + DRAWER_H / 2 + i * (DRAWER_H + DRAWER_GAP);

    // Drawer front panel
    const dShape = createDrawerFrontShape(isTop);
    const dGeo = new THREE.ExtrudeGeometry(dShape, {
      depth: DRAWER_T,
      bevelEnabled: false,
      curveSegments: 16
    });
    addMesh(dGeo, blueMat, `${drawerNames[i]}_front`, 0, centerY, drawerFrontZ);

    // Plywood backing strip visible inside the finger-pull cutout
    const handleBackGeo = new THREE.BoxGeometry(HANDLE_W + 0.01, HANDLE_H + 0.008, 0.006);
    addMesh(
      handleBackGeo,
      plyMat,
      `${drawerNames[i]}_handle_recess`,
      0,
      centerY + DRAWER_H / 2 - HANDLE_H / 2 - 0.002,
      drawerFrontZ - 0.003
    );
  }

  return group;
}
