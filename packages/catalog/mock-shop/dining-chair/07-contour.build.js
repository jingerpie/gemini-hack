function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.52;
  const D = 0.52;
  const H = 0.78;
  const SEAT_H = 0.45;
  const SEAT_THICK = 0.042;
  const RAIL_H = 0.036;
  const RAIL_THICK = 0.026;
  const LEG_R_TOP = 0.017;
  const LEG_R_BOT = 0.012;
  const BACK_H = 0.16;
  const BACK_THICK = 0.022;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8b294,
    roughness: 0.55,
    metalness: 0.0
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xcfc6b8,
    roughness: 0.88,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create a tapered leg between two 3D points
  function createLegBetween(p1, p2, rBot, rTop, name) {
    const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const dir = new THREE.Vector3().subVectors(v2, v1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20);
    const mesh = new THREE.Mesh(geo, woodMat);
    mesh.name = name;
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Coordinates for leg tops (at rail level) and bottoms (at y = 0)
  const railY = SEAT_H - SEAT_THICK * 0.5 - RAIL_H * 0.5;
  const frontTopZ = D * 0.5 - 0.045;
  const frontBotZ = D * 0.5 - 0.015;
  const frontTopX = W * 0.5 - 0.05;
  const frontBotX = W * 0.5 - 0.03;

  const rearTopZ = -D * 0.5 + 0.075;
  const rearBotZ = -D * 0.5 + 0.015;
  const rearTopX = W * 0.5 - 0.055;
  const rearBotX = W * 0.5 - 0.035;

  // 1. Front Legs
  createLegBetween([-frontBotX, 0, frontBotZ], [-frontTopX, railY + RAIL_H * 0.4, frontTopZ], LEG_R_BOT, LEG_R_TOP, "front_left_leg");
  createLegBetween([frontBotX, 0, frontBotZ], [frontTopX, railY + RAIL_H * 0.4, frontTopZ], LEG_R_BOT, LEG_R_TOP, "front_right_leg");

  // 2. Rear Legs (lower section up to seat rail)
  createLegBetween([-rearBotX, 0, rearBotZ], [-rearTopX, railY + RAIL_H * 0.3, rearTopZ], LEG_R_BOT, LEG_R_TOP, "rear_left_leg");
  createLegBetween([rearBotX, 0, rearBotZ], [rearTopX, railY + RAIL_H * 0.3, rearTopZ], LEG_R_BOT, LEG_R_TOP, "rear_right_leg");

  // 3. Rear Backrest Posts (continuing from seat rail up into the backrest)
  const postTopY = H - BACK_H * 0.45;
  const postTopZ = rearTopZ - 0.045;
  const postTopX = rearTopX + 0.01;
  createLegBetween([-rearTopX, railY, rearTopZ], [-postTopX, postTopY, postTopZ], LEG_R_TOP, LEG_R_TOP * 0.92, "left_backrest_post");
  createLegBetween([rearTopX, railY, rearTopZ], [postTopX, postTopY, postTopZ], LEG_R_TOP, LEG_R_TOP * 0.92, "right_backrest_post");

  // 4. Seat Frame Rails
  const frontRailLen = frontTopX * 2;
  const rearRailLen = rearTopX * 2;
  const sideRailLen = frontTopZ - rearTopZ;
  const sideRailMidZ = (frontTopZ + rearTopZ) * 0.5;

  addMesh(
    new THREE.BoxGeometry(frontRailLen, RAIL_H, RAIL_THICK),
    woodMat,
    "front_seat_rail",
    [0, railY, frontTopZ]
  );
  addMesh(
    new THREE.BoxGeometry(rearRailLen, RAIL_H, RAIL_THICK),
    woodMat,
    "rear_seat_rail",
    [0, railY, rearTopZ]
  );
  addMesh(
    new THREE.BoxGeometry(RAIL_THICK, RAIL_H, sideRailLen),
    woodMat,
    "left_seat_rail",
    [-(frontTopX + rearTopX) * 0.5, railY, sideRailMidZ],
    [0, -0.015, 0]
  );
  addMesh(
    new THREE.BoxGeometry(RAIL_THICK, RAIL_H, sideRailLen),
    woodMat,
    "right_seat_rail",
    [(frontTopX + rearTopX) * 0.5, railY, sideRailMidZ],
    [0, 0.015, 0]
  );

  // 5. Upholstered Seat Cushion (rounded rectangle extruded with bevel)
  const seatW = W - 0.06;
  const seatD = D - 0.08;
  const seatR = 0.06;
  const seatShape = new THREE.Shape();
  const hw = seatW * 0.5;
  const hd = seatD * 0.5;
  seatShape.moveTo(-hw + seatR, -hd);
  seatShape.lineTo(hw - seatR, -hd);
  seatShape.quadraticCurveTo(hw, -hd, hw, -hd + seatR);
  seatShape.lineTo(hw, hd - seatR);
  seatShape.quadraticCurveTo(hw, hd, hw - seatR, hd);
  seatShape.lineTo(-hw + seatR, hd);
  seatShape.quadraticCurveTo(-hw, hd, -hw, hd - seatR);
  seatShape.lineTo(-hw, -hd + seatR);
  seatShape.quadraticCurveTo(-hw, -hd, -hw + seatR, -hd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK * 0.45,
    bevelEnabled: true,
    bevelThickness: SEAT_THICK * 0.28,
    bevelSize: 0.018,
    bevelSegments: 4,
    curveSegments: 12
  });
  seatGeo.rotateX(Math.PI / 2);
  addMesh(
    seatGeo,
    fabricMat,
    "seat_cushion",
    [0, SEAT_H - SEAT_THICK * 0.15, 0.015]
  );

  // 6. Curved Bentwood Backrest (C-shaped arc extruded vertically)
  const backOuterR = W * 0.46;
  const backInnerR = backOuterR - BACK_THICK;
  const arcSpan = Math.PI * 0.88; // wraps around the back
  const startAngle = -arcSpan * 0.5;
  const endAngle = arcSpan * 0.5;

  const backShape = new THREE.Shape();
  // Outer arc (facing -Z)
  backShape.absarc(0, 0, backOuterR, Math.PI * 0.5 + startAngle, Math.PI * 0.5 + endAngle, false);
  // Inner arc (facing +Z)
  backShape.absarc(0, 0, backInnerR, Math.PI * 0.5 + endAngle, Math.PI * 0.5 + startAngle, true);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_H,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 28
  });
  // Rotate so extrusion depth is along +Y and arc opens toward +Z
  backGeo.rotateX(-Math.PI / 2);
  addMesh(
    backGeo,
    woodMat,
    "curved_backrest",
    [0, H - BACK_H, 0.005],
    [-0.08, 0, 0]
  );

  // 7. Subtle wooden joint caps where backrest posts meet the backrest
  addMesh(
    new THREE.SphereGeometry(LEG_R_TOP * 0.95, 16, 12),
    woodMat,
    "left_backrest_joint",
    [-postTopX, postTopY, postTopZ]
  );
  addMesh(
    new THREE.SphereGeometry(LEG_R_TOP * 0.95, 16, 12),
    woodMat,
    "right_backrest_joint",
    [postTopX, postTopY, postTopZ]
  );

  return group;
}
