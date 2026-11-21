function build(THREE) {
  const group = new THREE.Group();

  const W = 1.50;
  const H = 0.75;
  const D = 1.20;

  const TOP_T = 0.032;
  const MAIN_D = 0.65;
  const RET_W = 0.65;
  const RET_D = D - MAIN_D;

  const INSET = 0.045;
  const LEG_S = 0.04;
  const FOOT_H = 0.012;
  const FOOT_R = 0.022;
  const LEG_H = H - TOP_T - FOOT_H;

  const FRAME_H = 0.038;
  const FRAME_T = 0.028;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x9c6f44,
    roughness: 0.42,
    metalness: 0.04,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.58,
    metalness: 0.75,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.75,
    metalness: 0.25,
  });

  function addBox(name, sx, sy, sz, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function addLeg(name, x, z) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(LEG_S, LEG_H, LEG_S),
      metalMat
    );
    leg.name = "leg_" + name;
    leg.position.set(x, FOOT_H + LEG_H / 2, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);

    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16),
      footMat
    );
    foot.name = "foot_" + name;
    foot.position.set(x, FOOT_H / 2, z);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  const topY = H - TOP_T / 2;
  const mainZ = -D / 2 + MAIN_D / 2;
  const retX = -W / 2 + RET_W / 2;
  const retZ = D / 2 - RET_D / 2;

  // Tabletop wings
  addBox("main_tabletop", W, TOP_T, MAIN_D, 0, topY, mainZ, oakMat);
  addBox("return_tabletop", RET_W, TOP_T, RET_D, retX, topY, retZ, oakMat);

  // Leg coordinates (inset from tabletop perimeter)
  const xLeft = -W / 2 + INSET + LEG_S / 2;
  const xInner = -W / 2 + RET_W - INSET - LEG_S / 2;
  const xRight = W / 2 - INSET - LEG_S / 2;

  const zBack = -D / 2 + INSET + LEG_S / 2;
  const zMid = -D / 2 + MAIN_D - INSET - LEG_S / 2;
  const zFront = D / 2 - INSET - LEG_S / 2;

  addLeg("back_left", xLeft, zBack);
  addLeg("back_right", xRight, zBack);
  addLeg("front_right", xRight, zMid);
  addLeg("inner_corner", xInner, zMid);
  addLeg("return_front_left", xLeft, zFront);
  addLeg("return_front_right", xInner, zFront);

  // Apron frame rails directly under the tabletop
  const railY = H - TOP_T - FRAME_H / 2;

  addBox(
    "frame_back_rail",
    xRight - xLeft,
    FRAME_H,
    FRAME_T,
    (xLeft + xRight) / 2,
    railY,
    zBack,
    metalMat
  );

  addBox(
    "frame_left_rail",
    FRAME_T,
    FRAME_H,
    zFront - zBack,
    xLeft,
    railY,
    (zBack + zFront) / 2,
    metalMat
  );

  addBox(
    "frame_right_rail",
    FRAME_T,
    FRAME_H,
    zMid - zBack,
    xRight,
    railY,
    (zBack + zMid) / 2,
    metalMat
  );

  addBox(
    "frame_front_main_rail",
    xRight - xInner,
    FRAME_H,
    FRAME_T,
    (xInner + xRight) / 2,
    railY,
    zMid,
    metalMat
  );

  addBox(
    "frame_inner_return_rail",
    FRAME_T,
    FRAME_H,
    zFront - zMid,
    xInner,
    railY,
    (zMid + zFront) / 2,
    metalMat
  );

  addBox(
    "frame_front_return_rail",
    xInner - xLeft,
    FRAME_H,
    FRAME_T,
    (xLeft + xInner) / 2,
    railY,
    zFront,
    metalMat
  );

  addBox(
    "frame_center_crossbar",
    FRAME_T,
    FRAME_H,
    zMid - zBack,
    xInner,
    railY,
    (zBack + zMid) / 2,
    metalMat
  );

  return group;
}
