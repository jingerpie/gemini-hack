function build(THREE) {
  const group = new THREE.Group();

  const W = 1.40;
  const D = 0.70;
  const H = 0.75;
  const TOP_T = 0.03;
  const LEG_W = 0.04;
  const APRON_H = 0.055;
  const PED_W = 0.42;
  const PED_D = 0.60;
  const PED_BOT_Y = 0.015;
  const PED_GAP_TOP = 0.025;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc4a47c,
    roughness: 0.65,
    metalness: 0.02
  });

  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0x8e8477,
    roughness: 0.58,
    metalness: 0.03
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x4a433b,
    roughness: 0.8,
    metalness: 0.02
  });

  function addMesh(name, geom, mat, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Desktop
  addMesh(
    'desktop',
    new THREE.BoxGeometry(W, TOP_T, D),
    oakMat,
    0,
    H - TOP_T / 2,
    0
  );

  // Leg frames (left and right rectangular loops)
  const legH = H - TOP_T;
  const legInnerD = D - 2 * LEG_W;
  const legSides = [
    { prefix: 'left', x: -W / 2 + LEG_W / 2 },
    { prefix: 'right', x: W / 2 - LEG_W / 2 }
  ];

  legSides.forEach(({ prefix, x }) => {
    addMesh(
      `${prefix}_leg_front`,
      new THREE.BoxGeometry(LEG_W, legH, LEG_W),
      oakMat,
      x,
      legH / 2,
      D / 2 - LEG_W / 2
    );
    addMesh(
      `${prefix}_leg_back`,
      new THREE.BoxGeometry(LEG_W, legH, LEG_W),
      oakMat,
      x,
      legH / 2,
      -D / 2 + LEG_W / 2
    );
    addMesh(
      `${prefix}_leg_bottom`,
      new THREE.BoxGeometry(LEG_W, LEG_W, legInnerD),
      oakMat,
      x,
      LEG_W / 2,
      0
    );
    addMesh(
      `${prefix}_leg_top`,
      new THREE.BoxGeometry(LEG_W, LEG_W, legInnerD),
      oakMat,
      x,
      legH - LEG_W / 2,
      0
    );
  });

  // Upper apron / shallow drawers
  const innerSpan = W - 2 * LEG_W;
  const apronY = H - TOP_T - APRON_H / 2;
  const apronZ = D / 2 - LEG_W / 2 - 0.01;
  const rightApronW = PED_W;
  const leftApronW = innerSpan - rightApronW - 0.004;

  addMesh(
    'left_apron_drawer',
    new THREE.BoxGeometry(leftApronW, APRON_H, 0.025),
    taupeMat,
    -W / 2 + LEG_W + leftApronW / 2,
    apronY,
    apronZ
  );

  addMesh(
    'right_apron_drawer',
    new THREE.BoxGeometry(rightApronW, APRON_H, 0.025),
    taupeMat,
    W / 2 - LEG_W - rightApronW / 2,
    apronY,
    apronZ
  );

  // Back structural rail under desktop
  addMesh(
    'back_rail',
    new THREE.BoxGeometry(innerSpan, APRON_H, 0.025),
    taupeMat,
    0,
    apronY,
    -D / 2 + LEG_W + 0.02
  );

  // Right-side 3-drawer pedestal
  const pedTopY = H - TOP_T - APRON_H - PED_GAP_TOP;
  const pedH = pedTopY - PED_BOT_Y;
  const pedX = W / 2 - LEG_W - PED_W / 2 - 0.005;
  const pedZ = D / 2 - PED_D / 2 - 0.03;

  addMesh(
    'pedestal_body',
    new THREE.BoxGeometry(PED_W, pedH, PED_D),
    taupeMat,
    pedX,
    PED_BOT_Y + pedH / 2,
    pedZ
  );

  // Pedestal 3 drawer fronts
  const drawerFrontW = PED_W - 0.016;
  const drawerFrontT = 0.02;
  const drawerFrontZ = pedZ + PED_D / 2 + drawerFrontT / 2 - 0.002;
  const gap = 0.014;
  const usableH = pedH - 4 * gap;
  const d1H = usableH * 0.27;
  const d2H = usableH * 0.27;
  const d3H = usableH * 0.46;

  const d1Y = pedTopY - gap - d1H / 2;
  const d2Y = pedTopY - 2 * gap - d1H - d2H / 2;
  const d3Y = PED_BOT_Y + gap + d3H / 2;

  addMesh(
    'pedestal_drawer_top',
    new THREE.BoxGeometry(drawerFrontW, d1H, drawerFrontT),
    taupeMat,
    pedX,
    d1Y,
    drawerFrontZ
  );

  addMesh(
    'pedestal_drawer_mid',
    new THREE.BoxGeometry(drawerFrontW, d2H, drawerFrontT),
    taupeMat,
    pedX,
    d2Y,
    drawerFrontZ
  );

  addMesh(
    'pedestal_drawer_bot',
    new THREE.BoxGeometry(drawerFrontW, d3H, drawerFrontT),
    taupeMat,
    pedX,
    d3Y,
    drawerFrontZ
  );

  // Dark shadow-gap finger-pull recesses
  const recessW = drawerFrontW - 0.004;
  const recessZ = drawerFrontZ - 0.004;
  addMesh(
    'pedestal_recess_1',
    new THREE.BoxGeometry(recessW, gap, 0.012),
    recessMat,
    pedX,
    pedTopY - gap / 2,
    recessZ
  );
  addMesh(
    'pedestal_recess_2',
    new THREE.BoxGeometry(recessW, gap, 0.012),
    recessMat,
    pedX,
    pedTopY - gap - d1H - gap / 2,
    recessZ
  );
  addMesh(
    'pedestal_recess_3',
    new THREE.BoxGeometry(recessW, gap, 0.012),
    recessMat,
    pedX,
    PED_BOT_Y + gap + d3H + gap / 2,
    recessZ
  );

  return group;
}
