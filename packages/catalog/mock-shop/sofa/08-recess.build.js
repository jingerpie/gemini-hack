function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.20;
  const D = 0.96;
  const H = 0.78;
  const PLINTH_H = 0.06;
  const PLINTH_RECESS = 0.035;
  const ARM_W = 0.16;
  const ARM_H = 0.60;
  const DECK_H = 0.19;
  const BACK_FRAME_H = 0.58;
  const BACK_FRAME_D = 0.16;
  const SEAT_CUSHION_H = 0.15;
  const SEAT_CUSHION_D = D - BACK_FRAME_D - 0.02;
  const INNER_W = W - 2 * ARM_W;
  const CUSHION_GAP = 0.008;
  const CUSHION_W = (INNER_W - 2 * CUSHION_GAP) / 3;
  const BACK_CUSHION_H = 0.40;
  const BACK_CUSHION_D = 0.16;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x89948b,
    roughness: 0.88,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb08458,
    roughness: 0.55,
    metalness: 0.04,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for plump rounded cushions
  function createCushionGeo(w, h, d, bevel = 0.032) {
    const hw = w / 2 - bevel;
    const hh = h / 2 - bevel;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }

  // 1. Floor glides (4 small pads at y = 0..0.006)
  const glideGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12);
  const gx = (W - 2 * PLINTH_RECESS) / 2 - 0.08;
  const gz = (D - 2 * PLINTH_RECESS) / 2 - 0.08;
  addMesh(glideGeo, glideMat, 'glide_front_left', -gx, 0.003, gz);
  addMesh(glideGeo, glideMat, 'glide_front_right', gx, 0.003, gz);
  addMesh(glideGeo, glideMat, 'glide_back_left', -gx, 0.003, -gz);
  addMesh(glideGeo, glideMat, 'glide_back_right', gx, 0.003, -gz);

  // 2. Recessed oak plinth
  const plinthGeo = new THREE.BoxGeometry(
    W - 2 * PLINTH_RECESS,
    PLINTH_H,
    D - 2 * PLINTH_RECESS
  );
  addMesh(plinthGeo, woodMat, 'wood_plinth', 0, PLINTH_H / 2 + 0.004, 0);

  // 3. Lower upholstered deck
  const deckGeo = new THREE.BoxGeometry(INNER_W, DECK_H, D - 0.02);
  addMesh(
    deckGeo,
    fabricMat,
    'lower_deck',
    0,
    PLINTH_H + DECK_H / 2,
    0
  );

  // 4. Backrest frame
  const backFrameGeo = new THREE.BoxGeometry(
    INNER_W,
    BACK_FRAME_H,
    BACK_FRAME_D
  );
  addMesh(
    backFrameGeo,
    fabricMat,
    'back_frame',
    0,
    PLINTH_H + BACK_FRAME_H / 2,
    -D / 2 + BACK_FRAME_D / 2
  );

  // 5. Armrests (extruded side profile with rounded top-front corner)
  const armShape = new THREE.Shape();
  const rFront = 0.09;
  const rBack = 0.04;
  armShape.moveTo(-D / 2, 0);
  armShape.lineTo(D / 2, 0);
  armShape.lineTo(D / 2, ARM_H - rFront);
  armShape.quadraticCurveTo(D / 2, ARM_H, D / 2 - rFront, ARM_H);
  armShape.lineTo(-D / 2 + rBack, ARM_H);
  armShape.quadraticCurveTo(-D / 2, ARM_H, -D / 2, ARM_H - rBack);
  armShape.closePath();

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 10,
  });
  armGeo.rotateY(Math.PI / 2);
  armGeo.center();

  addMesh(
    armGeo,
    fabricMat,
    'armrest_left',
    -W / 2 + ARM_W / 2,
    PLINTH_H + ARM_H / 2,
    0
  );
  addMesh(
    armGeo,
    fabricMat,
    'armrest_right',
    W / 2 - ARM_W / 2,
    PLINTH_H + ARM_H / 2,
    0
  );

  // 6. Three seat cushions
  const seatGeo = createCushionGeo(CUSHION_W, SEAT_CUSHION_H, SEAT_CUSHION_D, 0.032);
  const seatY = PLINTH_H + DECK_H + SEAT_CUSHION_H / 2 - 0.01;
  const seatZ = D / 2 - SEAT_CUSHION_D / 2 - 0.01;

  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * (CUSHION_W + CUSHION_GAP);
    addMesh(seatGeo, fabricMat, `seat_cushion_${i}`, cx, seatY, seatZ);
  }

  // 7. Three back cushions
  const backCushionGeo = createCushionGeo(
    CUSHION_W,
    BACK_CUSHION_H,
    BACK_CUSHION_D,
    0.035
  );
  const backY = PLINTH_H + DECK_H + SEAT_CUSHION_H + BACK_CUSHION_H / 2 - 0.04;
  const backZ = -D / 2 + BACK_FRAME_D + BACK_CUSHION_D / 2 - 0.02;

  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * (CUSHION_W + CUSHION_GAP);
    addMesh(
      backCushionGeo,
      fabricMat,
      `back_cushion_${i}`,
      cx,
      backY,
      backZ,
      -0.16,
      0,
      0
    );
  }

  return group;
}
