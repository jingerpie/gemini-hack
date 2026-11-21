function build(THREE) {
  const group = new THREE.Group();

  const W = 1.00;
  const D = 0.56;
  const H = 0.42;

  const LID_H = 0.022;
  const GAP_H = 0.004;
  const APRON_H = 0.084;
  const BOX_BOTTOM_Y = H - LID_H - GAP_H - APRON_H;

  const LEG_W = 0.032;
  const LEG_D = 0.032;
  const FOOT_H = 0.006;
  const LEG_H = BOX_BOTTOM_Y - FOOT_H + 0.005;
  const LEG_INSET_X = 0.012;
  const LEG_INSET_Z = 0.012;

  const BRACKET_W = 0.055;
  const BRACKET_H = 0.022;
  const BRACKET_D = 0.018;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa6784e,
    roughness: 0.62,
    metalness: 0.04,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d40,
    roughness: 0.45,
    metalness: 0.65,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.85,
    metalness: 0.1,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Top lift-top lid
  const lidGeo = new THREE.BoxGeometry(W, LID_H, D);
  const lid = new THREE.Mesh(lidGeo, woodMat);
  lid.name = 'top_lid';
  lid.position.set(0, H - LID_H / 2, 0);
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  // Main apron / storage box
  const apronGeo = new THREE.BoxGeometry(W, APRON_H, D);
  const apron = new THREE.Mesh(apronGeo, woodMat);
  apron.name = 'apron_box';
  apron.position.set(0, BOX_BOTTOM_Y + APRON_H / 2, 0);
  apron.castShadow = true;
  apron.receiveShadow = true;
  group.add(apron);

  // Front center lift-top pull tab
  const pullGeo = new THREE.BoxGeometry(0.065, 0.006, 0.016);
  const pull = new THREE.Mesh(pullGeo, metalMat);
  pull.name = 'front_pull_tab';
  pull.position.set(0, H - LID_H - GAP_H / 2, D / 2 - 0.004);
  pull.castShadow = true;
  pull.receiveShadow = true;
  group.add(pull);

  // Legs, feet, brackets, and screws
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const footGeo = new THREE.CylinderGeometry(LEG_W * 0.42, LEG_W * 0.45, FOOT_H, 16);
  const bracketGeo = new THREE.BoxGeometry(BRACKET_W, BRACKET_H, BRACKET_D);
  const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 12);
  screwGeo.rotateX(Math.PI / 2);

  const legPositions = [
    { name: 'fl', sx: -1, sz: 1 },
    { name: 'fr', sx: 1, sz: 1 },
    { name: 'bl', sx: -1, sz: -1 },
    { name: 'br', sx: 1, sz: -1 },
  ];

  const legXOffset = W / 2 - LEG_INSET_X - LEG_W / 2;
  const legZOffset = D / 2 - LEG_INSET_Z - LEG_D / 2;

  for (const pos of legPositions) {
    const lx = pos.sx * legXOffset;
    const lz = pos.sz * legZOffset;

    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.name = `leg_${pos.name}`;
    leg.position.set(lx, FOOT_H + LEG_H / 2, lz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);

    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = `foot_${pos.name}`;
    foot.position.set(lx, FOOT_H / 2, lz);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);

    const bracket = new THREE.Mesh(bracketGeo, metalMat);
    bracket.name = `bracket_${pos.name}`;
    bracket.position.set(
      lx - pos.sx * (LEG_W / 2 + BRACKET_W / 2 - 0.004),
      BOX_BOTTOM_Y - BRACKET_H / 2 + 0.002,
      lz
    );
    bracket.castShadow = true;
    bracket.receiveShadow = true;
    group.add(bracket);

    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.name = `screw_${pos.name}`;
    screw.position.set(
      bracket.position.x - pos.sx * 0.008,
      bracket.position.y,
      lz + pos.sz * (BRACKET_D / 2 + 0.001)
    );
    screw.castShadow = true;
    screw.receiveShadow = true;
    group.add(screw);
  }

  // Side underframe rails connecting front and back legs
  const railLen = legZOffset * 2 - LEG_D;
  const railGeo = new THREE.BoxGeometry(0.022, 0.018, railLen);

  const railL = new THREE.Mesh(railGeo, metalMat);
  railL.name = 'underframe_rail_l';
  railL.position.set(-legXOffset, BOX_BOTTOM_Y - 0.009, 0);
  railL.castShadow = true;
  railL.receiveShadow = true;
  group.add(railL);

  const railR = new THREE.Mesh(railGeo, metalMat);
  railR.name = 'underframe_rail_r';
  railR.position.set(legXOffset, BOX_BOTTOM_Y - 0.009, 0);
  railR.castShadow = true;
  railR.receiveShadow = true;
  group.add(railR);

  return group;
}
