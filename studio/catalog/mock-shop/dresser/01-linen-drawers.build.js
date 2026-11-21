function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.40;
  const H = 0.90;
  const D = 0.48;

  const TOP_H = 0.036;
  const TOP_OVERHANG = 0.024;

  const PLINTH_H = 0.082;
  const PLINTH_OVERHANG = 0.012;
  const MOLDING_H = 0.014;

  const BODY_W = W - TOP_OVERHANG * 2;
  const BODY_D = D - TOP_OVERHANG * 2;
  const BODY_H = H - TOP_H - PLINTH_H;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7a5436,
    roughness: 0.65,
    metalness: 0.03,
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: 0x6b482d,
    roughness: 0.70,
    metalness: 0.03,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x845c3c,
    roughness: 0.55,
    metalness: 0.04,
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

  // 1. Plinth base
  const plinthW = BODY_W + PLINTH_OVERHANG * 2;
  const plinthD = BODY_D + PLINTH_OVERHANG * 2;
  const plinthGeo = new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD);
  addMesh(plinthGeo, woodMat, 'plinth_base', 0, PLINTH_H / 2, 0);

  // Plinth top molding
  const moldingGeo = new THREE.BoxGeometry(plinthW - 0.008, MOLDING_H, plinthD - 0.008);
  addMesh(moldingGeo, woodDarkMat, 'plinth_molding', 0, PLINTH_H + MOLDING_H / 2, 0);

  // 2. Main carcass
  const carcassGeo = new THREE.BoxGeometry(BODY_W, BODY_H, BODY_D);
  addMesh(carcassGeo, woodMat, 'carcass_body', 0, PLINTH_H + BODY_H / 2, 0);

  // 3. Top board
  const topGeo = new THREE.BoxGeometry(W, TOP_H, D);
  addMesh(topGeo, woodMat, 'top_board', 0, H - TOP_H / 2, 0);

  // 4. Drawers (2 columns x 3 rows)
  const COLS = 2;
  const ROWS = 3;
  const STILE_W = 0.042;
  const RAIL_H = 0.032;
  const DRAWER_GAP = 0.004;

  const availW = BODY_W - STILE_W * (COLS + 1);
  const availH = BODY_H - RAIL_H * (ROWS + 1);
  const drawerW = availW / COLS;
  const drawerH = availH / ROWS;

  const FRAME_BORDER = 0.032;
  const FRAME_DEPTH = 0.018;
  const PANEL_DEPTH = 0.010;

  // Drawer frame shape with rectangular cutout
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-drawerW / 2, -drawerH / 2);
  frameShape.lineTo(drawerW / 2, -drawerH / 2);
  frameShape.lineTo(drawerW / 2, drawerH / 2);
  frameShape.lineTo(-drawerW / 2, drawerH / 2);
  frameShape.closePath();

  const holePath = new THREE.Path();
  const hw = drawerW / 2 - FRAME_BORDER;
  const hh = drawerH / 2 - FRAME_BORDER;
  holePath.moveTo(-hw, -hh);
  holePath.lineTo(-hw, hh);
  holePath.lineTo(hw, hh);
  holePath.lineTo(hw, -hh);
  holePath.closePath();
  frameShape.holes.push(holePath);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });

  const panelGeo = new THREE.BoxGeometry(
    drawerW - FRAME_BORDER * 2 + 0.004,
    drawerH - FRAME_BORDER * 2 + 0.004,
    PANEL_DEPTH
  );

  // Turned wooden knob profile
  const knobPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.008, 0.0),
    new THREE.Vector2(0.007, 0.008),
    new THREE.Vector2(0.014, 0.012),
    new THREE.Vector2(0.017, 0.019),
    new THREE.Vector2(0.015, 0.026),
    new THREE.Vector2(0.008, 0.030),
    new THREE.Vector2(0.0, 0.031),
  ];
  const knobGeo = new THREE.LatheGeometry(knobPoints, 20);
  knobGeo.rotateX(Math.PI / 2);

  const frontZ = BODY_D / 2;

  for (let r = 0; r < ROWS; r++) {
    const cy =
      PLINTH_H +
      RAIL_H +
      drawerH / 2 +
      r * (drawerH + RAIL_H);

    for (let c = 0; c < COLS; c++) {
      const cx =
        -BODY_W / 2 +
        STILE_W +
        drawerW / 2 +
        c * (drawerW + STILE_W);

      const suffix = `r${r + 1}_c${c + 1}`;

      addMesh(
        panelGeo,
        woodDarkMat,
        `drawer_panel_${suffix}`,
        cx,
        cy,
        frontZ + PANEL_DEPTH / 2 - DRAWER_GAP
      );

      addMesh(
        frameGeo,
        woodMat,
        `drawer_frame_${suffix}`,
        cx,
        cy,
        frontZ
      );

      addMesh(
        knobGeo,
        knobMat,
        `drawer_knob_${suffix}`,
        cx,
        cy,
        frontZ + PANEL_DEPTH - DRAWER_GAP
      );
    }
  }

  return group;
}
