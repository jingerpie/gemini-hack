function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.32;
  const D = 1.14;
  const H = 0.78;
  const MOD_W = W / 2;
  const GAP = 0.012;

  const LEG_H = 0.045;
  const LEG_W = 0.11;
  const LEG_D = 0.09;

  const BASE_H = 0.19;
  const SEAT_CUSHION_H = 0.185;
  const SEAT_H = LEG_H + BASE_H + SEAT_CUSHION_H; // 0.42

  const ARM_W = 0.21;
  const ARM_H = 0.52;
  const ARM_D = 0.80;

  const BACK_FRAME_H = 0.64;
  const BACK_FRAME_D = 0.16;
  const BACK_CUSHION_H = 0.40;
  const BACK_CUSHION_D = 0.22;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8d978c,
    roughness: 0.88,
    metalness: 0.02,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b613b,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Helper: rounded box via ExtrudeGeometry
  function makeRoundedBox(w, h, d, r) {
    const bw = Math.max(0.01, w - 2 * r);
    const bh = Math.max(0.01, h - 2 * r);
    const bd = Math.max(0.01, d - 2 * r);

    const shape = new THREE.Shape();
    const hw = bw / 2;
    const hh = bh / 2;
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: bd,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }

  function addMesh(geo, mat, name, x, y, z, rx = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D);
  const baseGeo = makeRoundedBox(MOD_W - GAP, BASE_H, D, 0.015);
  const armGeo = makeRoundedBox(ARM_W, ARM_H, ARM_D, 0.025);
  const backFrameGeo = makeRoundedBox(MOD_W - GAP - ARM_W, BACK_FRAME_H - LEG_H, BACK_FRAME_D, 0.02);
  const seatGeo = makeRoundedBox(MOD_W - GAP - ARM_W - 0.01, SEAT_CUSHION_H, D - BACK_FRAME_D + 0.02, 0.035);
  const backCushionGeo = makeRoundedBox(MOD_W - GAP - ARM_W - 0.02, BACK_CUSHION_H, BACK_CUSHION_D, 0.04);

  const sides = [
    { label: 'left', dir: -1 },
    { label: 'right', dir: 1 },
  ];

  sides.forEach(({ label, dir }) => {
    const modCenterX = dir * (MOD_W / 2);

    // 4 Wooden block legs per module
    const legOuterX = modCenterX + dir * (MOD_W / 2 - LEG_W / 2 - 0.03);
    const legInnerX = modCenterX - dir * (MOD_W / 2 - LEG_W / 2 - 0.03);
    const legFrontZ = D / 2 - LEG_D / 2 - 0.03;
    const legBackZ = -D / 2 + LEG_D / 2 + 0.03;

    addMesh(legGeo, woodMat, `${label}_leg_front_outer`, legOuterX, LEG_H / 2, legFrontZ);
    addMesh(legGeo, woodMat, `${label}_leg_front_inner`, legInnerX, LEG_H / 2, legFrontZ);
    addMesh(legGeo, woodMat, `${label}_leg_back_outer`, legOuterX, LEG_H / 2, legBackZ);
    addMesh(legGeo, woodMat, `${label}_leg_back_inner`, legInnerX, LEG_H / 2, legBackZ);

    // Upholstered base
    addMesh(baseGeo, fabricMat, `${label}_base`, modCenterX, LEG_H + BASE_H / 2, 0);

    // Armrest (outer side, set back from front edge)
    const armX = modCenterX + dir * (MOD_W / 2 - ARM_W / 2 - GAP / 2);
    const armZ = -D / 2 + ARM_D / 2;
    addMesh(armGeo, fabricMat, `${label}_armrest`, armX, LEG_H + ARM_H / 2, armZ);

    // Backrest frame
    const seatCenterX = modCenterX - dir * (ARM_W / 2);
    const backFrameZ = -D / 2 + BACK_FRAME_D / 2;
    addMesh(
      backFrameGeo,
      fabricMat,
      `${label}_back_frame`,
      seatCenterX,
      LEG_H + (BACK_FRAME_H - LEG_H) / 2,
      backFrameZ
    );

    // Seat cushion
    const seatZ = BACK_FRAME_D / 2 - 0.01;
    addMesh(
      seatGeo,
      fabricMat,
      `${label}_seat_cushion`,
      seatCenterX,
      LEG_H + BASE_H + SEAT_CUSHION_H / 2 - 0.005,
      seatZ
    );

    // Back cushion (slightly reclined)
    const backCushionZ = -D / 2 + BACK_FRAME_D + BACK_CUSHION_D / 2 - 0.03;
    const backCushionY = SEAT_H + BACK_CUSHION_H / 2 - 0.03;
    addMesh(
      backCushionGeo,
      fabricMat,
      `${label}_back_cushion`,
      seatCenterX,
      backCushionY,
      backCushionZ,
      -0.14
    );
  });

  return group;
}
