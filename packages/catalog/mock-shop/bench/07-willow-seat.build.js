function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.88;
  const D = 0.60;
  const SEAT_H = 0.43;
  const ARM_H = 0.62;
  const BAR_W = 0.032;
  const BAR_T = 0.014;
  const RAIL_R = 0.012;
  const BRANCH_R = 0.009;

  const HALF_W = W / 2;
  const FRAME_X = HALF_W - BAR_T / 2;
  const FRONT_Z = D / 2 - 0.04;
  const BACK_BOT_Z = -D / 2 + 0.06;
  const BACK_TOP_Z = -D / 2 - 0.02;

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x7b472f,
    roughness: 0.45,
    metalness: 0.55
  });

  const gussetMat = new THREE.MeshStandardMaterial({
    color: 0x8a553c,
    roughness: 0.42,
    metalness: 0.50
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

  // Helper to create side front-leg + armrest flat-bar profile extruded along X
  function createSideArmLegGeo() {
    const shape = new THREE.Shape();
    // Profile in (Z, Y) plane, mapped to (x, y) in Shape, then rotated
    // Start at front foot bottom
    shape.moveTo(FRONT_Z - 0.025, 0);
    shape.lineTo(FRONT_Z + 0.016, 0);
    shape.lineTo(FRONT_Z + 0.016, 0.014);
    shape.lineTo(FRONT_Z + 0.004, 0.014);
    // Front leg outer edge up to armrest curve
    shape.lineTo(FRONT_Z + 0.012, ARM_H - 0.06);
    shape.quadraticCurveTo(FRONT_Z + 0.012, ARM_H, FRONT_Z - 0.06, ARM_H);
    // Armrest top edge back to backrest upright
    const armBackZ = BACK_BOT_Z + (BACK_TOP_Z - BACK_BOT_Z) * ((ARM_H - 0.02) / H);
    shape.lineTo(armBackZ + 0.01, ARM_H - 0.02);
    shape.lineTo(armBackZ + 0.01, ARM_H - 0.02 - BAR_W);
    // Armrest bottom edge
    shape.lineTo(FRONT_Z - 0.06, ARM_H - BAR_W);
    shape.quadraticCurveTo(FRONT_Z - 0.018, ARM_H - BAR_W, FRONT_Z - 0.018, ARM_H - 0.06);
    // Front leg inner edge down to foot
    shape.lineTo(FRONT_Z - 0.025, 0.014);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BAR_T,
      bevelEnabled: false,
      curveSegments: 12
    });
    // Rotate so Shape X -> +Z, Shape Y -> +Y, Extrude Z -> +X
    geo.rotateY(-Math.PI / 2);
    geo.translate(BAR_T / 2, 0, 0);
    return geo;
  }

  const sideArmLegGeo = createSideArmLegGeo();
  addMesh(sideArmLegGeo, ironMat, "left_front_leg_armrest", [-FRAME_X, 0, 0]);
  addMesh(sideArmLegGeo, ironMat, "right_front_leg_armrest", [FRAME_X, 0, 0]);

  // Helper to create back leg + backrest upright
  function createBackUprightGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(BACK_BOT_Z - 0.016, 0);
    shape.lineTo(BACK_BOT_Z + 0.025, 0);
    shape.lineTo(BACK_BOT_Z + 0.025, 0.014);
    shape.lineTo(BACK_BOT_Z + 0.016, 0.014);
    shape.lineTo(BACK_TOP_Z + 0.016, H);
    shape.lineTo(BACK_TOP_Z - 0.016, H);
    shape.lineTo(BACK_BOT_Z - 0.016, 0.014);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BAR_T,
      bevelEnabled: false
    });
    geo.rotateY(-Math.PI / 2);
    geo.translate(BAR_T / 2, 0, 0);
    return geo;
  }

  const backUprightGeo = createBackUprightGeo();
  addMesh(backUprightGeo, ironMat, "left_back_leg_upright", [-FRAME_X, 0, 0]);
  addMesh(backUprightGeo, ironMat, "right_back_leg_upright", [FRAME_X, 0, 0]);

  // Horizontal rails (round tubes along X)
  const railSpan = W - BAR_T;
  const railGeo = new THREE.CylinderGeometry(RAIL_R, RAIL_R, railSpan, 16);
  railGeo.rotateZ(Math.PI / 2);

  addMesh(railGeo, ironMat, "front_seat_rail", [0, SEAT_H - 0.045, FRONT_Z - 0.005]);

  const backSeatZ = BACK_BOT_Z + (BACK_TOP_Z - BACK_BOT_Z) * ((SEAT_H - 0.02) / H);
  addMesh(railGeo, ironMat, "back_seat_rail", [0, SEAT_H - 0.02, backSeatZ]);

  const backLowY = SEAT_H + 0.09;
  const backLowZ = BACK_BOT_Z + (BACK_TOP_Z - BACK_BOT_Z) * (backLowY / H);
  addMesh(railGeo, ironMat, "backrest_lower_rail", [0, backLowY, backLowZ]);

  const backTopY = H - 0.02;
  const backTopZ = BACK_BOT_Z + (BACK_TOP_Z - BACK_BOT_Z) * (backTopY / H);
  addMesh(railGeo, ironMat, "backrest_top_rail", [0, backTopY, backTopZ]);

  // Curved seat slats (8 slats running along X)
  const slatCount = 8;
  const slatWidth = 0.036;
  const slatThick = 0.008;
  const slatSpan = W - BAR_T * 2;
  const slatGeo = new THREE.BoxGeometry(slatSpan, slatThick, slatWidth);

  for (let i = 0; i < slatCount; i++) {
    const t = i / (slatCount - 1); // 0 = front, 1 = back
    const z = (FRONT_Z - 0.015) * (1 - t) + (backSeatZ + 0.02) * t;
    // Ergonomic wave: dip in middle, slight lip at front, rise at back
    const y = SEAT_H - 0.018 * Math.sin(t * Math.PI) + 0.012 * t - (t < 0.15 ? 0.012 * (1 - t / 0.15) : 0);
    const tiltX = -0.18 * Math.cos(t * Math.PI);
    addMesh(slatGeo, ironMat, `seat_slat_${i + 1}`, [0, y, z], [tiltX, 0, 0]);
  }

  // Backrest center vertical stem
  const stemLen = Math.hypot(backTopY - backLowY + 0.06, backTopZ - backLowZ);
  const stemGeo = new THREE.CylinderGeometry(BRANCH_R, BRANCH_R, stemLen, 12);
  const stemMidY = (backTopY + backLowY - 0.06) / 2;
  const stemMidZ = (backTopZ + backLowZ) / 2;
  const stemTilt = Math.atan2(backTopZ - backLowZ, backTopY - backLowY);
  addMesh(stemGeo, ironMat, "backrest_center_stem", [0, stemMidY, stemMidZ], [stemTilt, 0, 0]);

  // Helper to get Z on the backrest plane for a given Y
  function backZ(y) {
    return BACK_BOT_Z + (BACK_TOP_Z - BACK_BOT_Z) * (y / H);
  }

  // Helper to create a curved branch tube
  function addBranch(name, pts) {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, y]) => new THREE.Vector3(x, y, backZ(y)))
    );
    const geo = new THREE.TubeGeometry(curve, 16, BRANCH_R, 10, false);
    addMesh(geo, ironMat, name);
  }

  // Left & Right symmetric willow branches
  [-1, 1].forEach((side) => {
    const sName = side < 0 ? "left" : "right";

    // Upper inner branch from center stem to top rail
    addBranch(`${sName}_branch_upper_inner`, [
      [0, backLowY + 0.21],
      [side * 0.10, backLowY + 0.27],
      [side * 0.19, backTopY]
    ]);

    // Lower main branch from center stem to gusset junction
    const gussetX = side * 0.16;
    const gussetY = backLowY + 0.15;
    addBranch(`${sName}_branch_main_lower`, [
      [0, backLowY + 0.09],
      [side * 0.08, backLowY + 0.13],
      [gussetX, gussetY]
    ]);

    // 3 radiating branches from gusset junction
    addBranch(`${sName}_branch_radiate_top`, [
      [gussetX, gussetY],
      [side * 0.28, backLowY + 0.26],
      [side * 0.40, backTopY]
    ]);

    addBranch(`${sName}_branch_radiate_mid`, [
      [gussetX, gussetY],
      [side * 0.35, gussetY + 0.05],
      [side * (HALF_W - BAR_T), gussetY + 0.11]
    ]);

    addBranch(`${sName}_branch_radiate_low`, [
      [gussetX, gussetY],
      [side * 0.35, gussetY - 0.02],
      [side * (HALF_W - BAR_T), gussetY - 0.04]
    ]);

    // Gusset plate at branch junction
    const gussetGeo = new THREE.BoxGeometry(0.055, 0.042, 0.022);
    addMesh(
      gussetGeo,
      gussetMat,
      `${sName}_branch_gusset`,
      [gussetX, gussetY, backZ(gussetY)],
      [stemTilt, 0, side * 0.25]
    );
  });

  return group;
}
