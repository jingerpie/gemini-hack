function build(THREE) {
  const group = new THREE.Group();

  const W = 0.92;
  const H = 1.96;
  const D = 0.42;
  const FOOT_H = 0.07;
  const PLINTH_H = 0.05;
  const BASE_TOP = FOOT_H + PLINTH_H;
  const ARCH_R = W / 2;
  const SPRING_Y = H - ARCH_R;
  const POST_W = 0.055;
  const SHELF_1_Y = 0.64;
  const SHELF_2_Y = 1.16;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1d,
    roughness: 0.46,
    metalness: 0.05
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x9c8d76,
    roughness: 0.85,
    metalness: 0.0
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    metalness: 0.05,
    clearcoat: 1.0
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8c7344,
    roughness: 0.35,
    metalness: 0.8
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    if (rx || ry || rz) m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Corner bracket feet (y = 0 to FOOT_H)
  const footGeo = new THREE.BoxGeometry(0.09, FOOT_H, 0.09);
  const fx = W / 2 - 0.04;
  const fz = D / 2 - 0.04;
  addMesh(footGeo, woodMat, 'foot_front_left', -fx, FOOT_H / 2, fz);
  addMesh(footGeo, woodMat, 'foot_front_right', fx, FOOT_H / 2, fz);
  addMesh(footGeo, woodMat, 'foot_back_left', -fx, FOOT_H / 2, -fz);
  addMesh(footGeo, woodMat, 'foot_back_right', fx, FOOT_H / 2, -fz);

  // Plinth base & moulding
  const plinthGeo = new THREE.BoxGeometry(W + 0.02, PLINTH_H, D + 0.02);
  addMesh(plinthGeo, woodMat, 'plinth_base', 0, FOOT_H + PLINTH_H / 2, 0);

  const plinthMouldGeo = new THREE.BoxGeometry(W + 0.036, 0.02, D + 0.036);
  addMesh(plinthMouldGeo, woodMat, 'plinth_moulding', 0, BASE_TOP + 0.01, 0);

  // Corner posts
  const postH = SPRING_Y - BASE_TOP;
  const postGeo = new THREE.BoxGeometry(POST_W, postH, POST_W);
  const px = W / 2 - POST_W / 2;
  const pz = D / 2 - POST_W / 2;
  addMesh(postGeo, woodMat, 'post_front_left', -px, BASE_TOP + postH / 2, pz);
  addMesh(postGeo, woodMat, 'post_front_right', px, BASE_TOP + postH / 2, pz);
  addMesh(postGeo, woodMat, 'post_back_left', -px, BASE_TOP + postH / 2, -pz);
  addMesh(postGeo, woodMat, 'post_back_right', px, BASE_TOP + postH / 2, -pz);

  // Arched roof shell
  const archShellShape = new THREE.Shape();
  archShellShape.absarc(0, 0, ARCH_R, 0, Math.PI, false);
  archShellShape.lineTo(-ARCH_R + POST_W, 0);
  archShellShape.absarc(0, 0, ARCH_R - POST_W, Math.PI, 0, true);
  archShellShape.closePath();

  const archShellGeo = new THREE.ExtrudeGeometry(archShellShape, {
    depth: D,
    bevelEnabled: false,
    curveSegments: 32
  });
  archShellGeo.translate(0, 0, -D / 2);
  addMesh(archShellGeo, woodMat, 'arch_roof', 0, SPRING_Y, 0);

  // Front arch cornice moulding & imposts
  const corniceShape = new THREE.Shape();
  corniceShape.absarc(0, 0, ARCH_R + 0.018, 0, Math.PI, false);
  corniceShape.lineTo(-ARCH_R + 0.02, 0);
  corniceShape.absarc(0, 0, ARCH_R - 0.02, Math.PI, 0, true);
  corniceShape.closePath();

  const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 32
  });
  addMesh(corniceGeo, woodMat, 'arch_cornice_front', 0, SPRING_Y, D / 2 - 0.01);

  const impostGeo = new THREE.BoxGeometry(0.075, 0.024, D + 0.03);
  addMesh(impostGeo, woodMat, 'impost_left', -W / 2 + 0.02, SPRING_Y, 0);
  addMesh(impostGeo, woodMat, 'impost_right', W / 2 - 0.02, SPRING_Y, 0);

  // Back panel & battens
  const backW = W - 0.04;
  const backR = backW / 2;
  const backShape = new THREE.Shape();
  backShape.moveTo(-backR, BASE_TOP);
  backShape.lineTo(backR, BASE_TOP);
  backShape.lineTo(backR, SPRING_Y);
  backShape.absarc(0, SPRING_Y, backR, 0, Math.PI, false);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.018,
    bevelEnabled: false,
    curveSegments: 24
  });
  addMesh(backGeo, backMat, 'back_panel', 0, 0, -D / 2 + 0.01);

  const backStileGeo = new THREE.BoxGeometry(0.04, H - BASE_TOP - 0.08, 0.012);
  addMesh(backStileGeo, woodMat, 'back_stile_center', 0, BASE_TOP + (H - BASE_TOP - 0.08) / 2, -D / 2 + 0.032);

  const backRailGeo = new THREE.BoxGeometry(backW - 0.04, 0.04, 0.012);
  addMesh(backRailGeo, woodMat, 'back_rail_upper', 0, SPRING_Y - 0.02, -D / 2 + 0.032);

  // Side glass & muntins
  const sideGlassH = SPRING_Y - BASE_TOP - 0.02;
  const sideGlassD = D - POST_W * 2 + 0.01;
  const sideGlassGeo = new THREE.BoxGeometry(0.006, sideGlassH, sideGlassD);
  addMesh(sideGlassGeo, glassMat, 'side_glass_left', -W / 2 + POST_W / 2, BASE_TOP + 0.01 + sideGlassH / 2, 0);
  addMesh(sideGlassGeo, glassMat, 'side_glass_right', W / 2 - POST_W / 2, BASE_TOP + 0.01 + sideGlassH / 2, 0);

  const muntinGeo = new THREE.BoxGeometry(0.022, 0.022, sideGlassD);
  addMesh(muntinGeo, woodMat, 'side_muntin_left_1', -W / 2 + POST_W / 2, SHELF_1_Y, 0);
  addMesh(muntinGeo, woodMat, 'side_muntin_left_2', -W / 2 + POST_W / 2, SHELF_2_Y, 0);
  addMesh(muntinGeo, woodMat, 'side_muntin_right_1', W / 2 - POST_W / 2, SHELF_1_Y, 0);
  addMesh(muntinGeo, woodMat, 'side_muntin_right_2', W / 2 - POST_W / 2, SHELF_2_Y, 0);

  // Interior floor & shelves
  const shelfW = W - POST_W * 2 + 0.02;
  const shelfD = D - POST_W * 2 + 0.01;
  const floorGeo = new THREE.BoxGeometry(shelfW, 0.024, shelfD);
  addMesh(floorGeo, woodMat, 'interior_floor', 0, BASE_TOP + 0.012, 0);

  const shelfGeo = new THREE.BoxGeometry(shelfW, 0.022, shelfD);
  addMesh(shelfGeo, woodMat, 'shelf_lower', 0, SHELF_1_Y, 0);
  addMesh(shelfGeo, woodMat, 'shelf_upper', 0, SHELF_2_Y, 0);

  // Front arched glass door
  const doorOuterR = ARCH_R - POST_W;
  const doorFrameW = 0.055;
  const doorInnerR = doorOuterR - doorFrameW;

  const doorFrameShape = new THREE.Shape();
  doorFrameShape.moveTo(-doorOuterR, BASE_TOP + 0.01);
  doorFrameShape.lineTo(doorOuterR, BASE_TOP + 0.01);
  doorFrameShape.lineTo(doorOuterR, SPRING_Y);
  doorFrameShape.absarc(0, SPRING_Y, doorOuterR, 0, Math.PI, false);
  doorFrameShape.closePath();

  const doorHole = new THREE.Path();
  doorHole.moveTo(-doorInnerR, BASE_TOP + 0.01 + doorFrameW);
  doorHole.lineTo(doorInnerR, BASE_TOP + 0.01 + doorFrameW);
  doorHole.lineTo(doorInnerR, SPRING_Y);
  doorHole.absarc(0, SPRING_Y, doorInnerR, 0, Math.PI, false);
  doorHole.closePath();
  doorFrameShape.holes.push(doorHole);

  const doorFrameGeo = new THREE.ExtrudeGeometry(doorFrameShape, {
    depth: 0.026,
    bevelEnabled: false,
    curveSegments: 32
  });
  addMesh(doorFrameGeo, woodMat, 'door_frame', 0, 0, D / 2 - 0.03);

  const doorGlassShape = new THREE.Shape();
  doorGlassShape.moveTo(-doorInnerR - 0.005, BASE_TOP + 0.01 + doorFrameW - 0.005);
  doorGlassShape.lineTo(doorInnerR + 0.005, BASE_TOP + 0.01 + doorFrameW - 0.005);
  doorGlassShape.lineTo(doorInnerR + 0.005, SPRING_Y);
  doorGlassShape.absarc(0, SPRING_Y, doorInnerR + 0.005, 0, Math.PI, false);
  doorGlassShape.closePath();

  const doorGlassGeo = new THREE.ExtrudeGeometry(doorGlassShape, {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 32
  });
  addMesh(doorGlassGeo, glassMat, 'door_glass', 0, 0, D / 2 - 0.02);

  // Door hardware (knob & hinges)
  const knobGeo = new THREE.SphereGeometry(0.012, 12, 12);
  addMesh(knobGeo, brassMat, 'door_knob', -doorOuterR + doorFrameW / 2, 0.96, D / 2 + 0.004);

  const hingeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.045, 10);
  addMesh(hingeGeo, brassMat, 'hinge_bottom', doorOuterR, 0.35, D / 2 - 0.01);
  addMesh(hingeGeo, brassMat, 'hinge_middle', doorOuterR, 0.92, D / 2 - 0.01);
  addMesh(hingeGeo, brassMat, 'hinge_top', doorOuterR, 1.42, D / 2 - 0.01);

  return group;
}
