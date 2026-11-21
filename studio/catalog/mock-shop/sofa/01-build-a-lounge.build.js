function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const MOD_W = 0.80;
  const MOD_D = 0.85;
  const GAP_X = 0.01;
  const GAP_Z = 0.06;

  const RUNNER_H = 0.055;
  const RUNNER_W = 0.055;
  const RUNNER_INSET_X = 0.06;
  const RUNNER_INSET_Z = 0.08;

  const BASE_H = 0.045;
  const SEAT_H = 0.24;
  const BACK_H = 0.43;
  const BACK_D = 0.21;
  const BACK_TILT = 0.12;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf4a582,
    roughness: 0.88,
    metalness: 0.0,
  });

  const plywoodMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.65,
    metalness: 0.0,
  });

  const runnerMat = new THREE.MeshStandardMaterial({
    color: 0xc9b08e,
    roughness: 0.60,
    metalness: 0.0,
  });

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function makeRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const rad = Math.min(r, hw, hh);
    shape.moveTo(-hw + rad, -hh);
    shape.lineTo(hw - rad, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    shape.lineTo(hw, hh - rad);
    shape.quadraticCurveTo(hw, hh, hw - rad, hh);
    shape.lineTo(-hw + rad, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    shape.lineTo(-hw, -hh + rad);
    shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
    return shape;
  }

  // Helper: backrest front profile shape (bottom at y = 0, top at y = h)
  function makeBackrestShape(w, h, rBottom, rTop) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    shape.moveTo(-hw + rBottom, 0);
    shape.lineTo(hw - rBottom, 0);
    shape.quadraticCurveTo(hw, 0, hw, rBottom);
    shape.lineTo(hw, h - rTop);
    shape.quadraticCurveTo(hw, h, hw - rTop, h);
    shape.lineTo(-hw + rTop, h);
    shape.quadraticCurveTo(-hw, h, -hw, h - rTop);
    shape.lineTo(-hw, rBottom);
    shape.quadraticCurveTo(-hw, 0, -hw + rBottom, 0);
    return shape;
  }

  // Shared geometries
  const runnerLen = MOD_D - RUNNER_INSET_Z * 2;
  const runnerShape = makeRoundedRectShape(runnerLen, RUNNER_H, RUNNER_H * 0.45);
  const runnerGeo = new THREE.ExtrudeGeometry(runnerShape, {
    depth: RUNNER_W,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 12,
  });
  runnerGeo.center();
  runnerGeo.rotateY(Math.PI / 2);

  const baseBevel = 0.005;
  const baseShape = makeRoundedRectShape(MOD_W - baseBevel * 2, MOD_D - baseBevel * 2, 0.05);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - baseBevel * 2,
    bevelEnabled: true,
    bevelThickness: baseBevel,
    bevelSize: baseBevel,
    bevelSegments: 2,
    curveSegments: 16,
  });
  baseGeo.rotateX(-Math.PI / 2);
  baseGeo.computeBoundingBox();
  const baseMinY = baseGeo.boundingBox.min.y;
  baseGeo.translate(0, -baseMinY, 0);

  const seatBevel = 0.045;
  const seatShape = makeRoundedRectShape(MOD_W - seatBevel * 2, MOD_D - seatBevel * 2, 0.08);
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_H - seatBevel * 2,
    bevelEnabled: true,
    bevelThickness: seatBevel,
    bevelSize: seatBevel,
    bevelSegments: 5,
    curveSegments: 16,
  });
  seatGeo.rotateX(-Math.PI / 2);
  seatGeo.computeBoundingBox();
  const seatMinY = seatGeo.boundingBox.min.y;
  seatGeo.translate(0, -seatMinY, 0);

  const backBevel = 0.04;
  const backShape = makeBackrestShape(
    MOD_W - backBevel * 2,
    BACK_H - backBevel * 2,
    0.04,
    0.14
  );
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_D - backBevel * 2,
    bevelEnabled: true,
    bevelThickness: backBevel,
    bevelSize: backBevel,
    bevelSegments: 5,
    curveSegments: 16,
  });
  backGeo.computeBoundingBox();
  const backMinY = backGeo.boundingBox.min.y;
  const backCenterZ = (backGeo.boundingBox.min.z + backGeo.boundingBox.max.z) / 2;
  backGeo.translate(0, -backMinY, -backCenterZ);

  function addModule(namePrefix, x, z, hasBackrest) {
    const modGroup = new THREE.Group();
    modGroup.position.set(x, 0, z);

    // Left and right wood runners
    const runnerXOffset = MOD_W / 2 - RUNNER_INSET_X - RUNNER_W / 2;
    const runnerLeft = new THREE.Mesh(runnerGeo, runnerMat);
    runnerLeft.name = `${namePrefix}_runner_left`;
    runnerLeft.position.set(-runnerXOffset, RUNNER_H / 2, 0);
    runnerLeft.castShadow = true;
    runnerLeft.receiveShadow = true;
    modGroup.add(runnerLeft);

    const runnerRight = new THREE.Mesh(runnerGeo, runnerMat);
    runnerRight.name = `${namePrefix}_runner_right`;
    runnerRight.position.set(runnerXOffset, RUNNER_H / 2, 0);
    runnerRight.castShadow = true;
    runnerRight.receiveShadow = true;
    modGroup.add(runnerRight);

    // Plywood base platform
    const base = new THREE.Mesh(baseGeo, plywoodMat);
    base.name = `${namePrefix}_plywood_base`;
    base.position.set(0, RUNNER_H - 0.002, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    modGroup.add(base);

    // Seat cushion
    const seat = new THREE.Mesh(seatGeo, fabricMat);
    seat.name = `${namePrefix}_seat_cushion`;
    seat.position.set(0, RUNNER_H + BASE_H - 0.005, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    modGroup.add(seat);

    // Optional backrest cushion
    if (hasBackrest) {
      const back = new THREE.Mesh(backGeo, fabricMat);
      back.name = `${namePrefix}_back_cushion`;
      back.position.set(
        0,
        RUNNER_H + BASE_H + SEAT_H - 0.015,
        -MOD_D / 2 + BACK_D / 2 + 0.02
      );
      back.rotation.x = -BACK_TILT;
      back.castShadow = true;
      back.receiveShadow = true;
      modGroup.add(back);
    }

    group.add(modGroup);
  }

  // Position modules so overall bounding box is centered on x = 0, z = 0
  const chairX = MOD_W / 2 + GAP_X / 2;
  const chairZ = -(MOD_D + GAP_Z) / 2;
  const ottomanZ = (MOD_D + GAP_Z) / 2;

  addModule('left_chair', -chairX, chairZ, true);
  addModule('right_chair', chairX, chairZ, true);
  addModule('ottoman', chairX, ottomanZ, false);

  return group;
}
