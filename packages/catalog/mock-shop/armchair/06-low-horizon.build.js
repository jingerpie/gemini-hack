function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.78;
  const H = 0.78;
  const D = 0.82;
  const SEAT_H = 0.44;
  const FRAME_R = 0.017;
  const FOOT_H = 0.012;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x36383a,
    roughness: 0.45,
    metalness: 0.65
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f20,
    roughness: 0.75,
    metalness: 0.1
  });
  const slingMat = new THREE.MeshStandardMaterial({
    color: 0x2a2c2e,
    roughness: 0.85,
    metalness: 0.1
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x6f826a,
    roughness: 0.88,
    metalness: 0.0
  });

  // Helper to create a cylinder between two 3D points
  function makeTube(p1, p2, radius, mat, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 16);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p1).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function makeJoint(pos, radius, mat, name) {
    const geo = new THREE.SphereGeometry(radius, 16, 12);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function makeRoundedBox(w, h, d, r, bevel) {
    const hw = w / 2 - bevel;
    const hh = h / 2 - bevel;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8
    });
    geo.center();
    return geo;
  }

  const sides = [
    { sign: -1, label: "left" },
    { sign: 1, label: "right" }
  ];

  const legBotX = 0.37;
  const armX = 0.35;
  const frontBotZ = 0.36;
  const frontTopZ = 0.34;
  const rearBotZ = -0.38;
  const rearTopZ = -0.34;
  const armFrontY = 0.57;
  const armRearY = 0.63;
  const railY = 0.28;

  sides.forEach(({ sign, label }) => {
    const flBot = new THREE.Vector3(sign * legBotX, FOOT_H, frontBotZ);
    const flTop = new THREE.Vector3(sign * armX, armFrontY, frontTopZ);
    const rlBot = new THREE.Vector3(sign * legBotX, FOOT_H, rearBotZ);
    const rlTop = new THREE.Vector3(sign * armX, armRearY, rearTopZ);

    // Legs
    group.add(makeTube(flBot, flTop, FRAME_R, frameMat, `front_${label}_leg`));
    group.add(makeTube(rlBot, rlTop, FRAME_R, frameMat, `rear_${label}_leg`));

    // Foot caps touching y = 0
    const flFoot = new THREE.Mesh(
      new THREE.CylinderGeometry(FRAME_R * 0.95, FRAME_R * 0.9, FOOT_H, 16),
      footMat
    );
    flFoot.position.set(sign * legBotX, FOOT_H / 2, frontBotZ);
    flFoot.name = `front_${label}_foot`;
    flFoot.castShadow = true;
    flFoot.receiveShadow = true;
    group.add(flFoot);

    const rlFoot = new THREE.Mesh(
      new THREE.CylinderGeometry(FRAME_R * 0.95, FRAME_R * 0.9, FOOT_H, 16),
      footMat
    );
    rlFoot.position.set(sign * legBotX, FOOT_H / 2, rearBotZ);
    rlFoot.name = `rear_${label}_foot`;
    rlFoot.castShadow = true;
    rlFoot.receiveShadow = true;
    group.add(rlFoot);

    // Armrest
    group.add(makeTube(flTop, rlTop, FRAME_R, frameMat, `${label}_armrest`));

    // Armrest corner joints
    group.add(makeJoint(flTop, FRAME_R, frameMat, `front_${label}_arm_joint`));
    group.add(makeJoint(rlTop, FRAME_R, frameMat, `rear_${label}_arm_joint`));

    // Side seat rail
    const sFront = new THREE.Vector3(sign * 0.355, railY, 0.345);
    const sRear = new THREE.Vector3(sign * 0.355, railY, -0.355);
    group.add(makeTube(sFront, sRear, FRAME_R * 0.9, frameMat, `${label}_seat_rail`));
  });

  // Cross rails
  group.add(
    makeTube(
      new THREE.Vector3(-0.355, railY, 0.345),
      new THREE.Vector3(0.355, railY, 0.345),
      FRAME_R * 0.9,
      frameMat,
      "front_seat_rail"
    )
  );
  group.add(
    makeTube(
      new THREE.Vector3(-0.355, railY, -0.355),
      new THREE.Vector3(0.355, railY, -0.355),
      FRAME_R * 0.9,
      frameMat,
      "rear_seat_rail"
    )
  );
  group.add(
    makeTube(
      new THREE.Vector3(-armX, armRearY, rearTopZ),
      new THREE.Vector3(armX, armRearY, rearTopZ),
      FRAME_R,
      frameMat,
      "rear_backrest_rail"
    )
  );

  // Seat sling / webbing deck
  const slingGeo = new THREE.BoxGeometry(0.68, 0.014, 0.67);
  const sling = new THREE.Mesh(slingGeo, slingMat);
  sling.position.set(0, railY + 0.005, -0.005);
  sling.name = "seat_sling_deck";
  sling.castShadow = true;
  sling.receiveShadow = true;
  group.add(sling);

  // Seat cushion
  const seatCushionGeo = makeRoundedBox(0.66, 0.68, 0.15, 0.04, 0.025);
  seatCushionGeo.rotateX(Math.PI / 2);
  const seatCushion = new THREE.Mesh(seatCushionGeo, cushionMat);
  seatCushion.position.set(0, SEAT_H - 0.075, 0.01);
  seatCushion.name = "seat_cushion";
  seatCushion.castShadow = true;
  seatCushion.receiveShadow = true;
  group.add(seatCushion);

  // Back cushion
  const backCushionGeo = makeRoundedBox(0.65, 0.44, 0.15, 0.04, 0.025);
  const backCushion = new THREE.Mesh(backCushionGeo, cushionMat);
  backCushion.position.set(0, SEAT_H + 0.17, -0.22);
  backCushion.rotation.x = -0.21;
  backCushion.name = "back_cushion";
  backCushion.castShadow = true;
  backCushion.receiveShadow = true;
  group.add(backCushion);

  return group;
}
