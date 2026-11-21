function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.62;
  const H = 0.92;
  const D = 0.58;
  const SEAT_H = 0.46;
  const SEAT_W = 0.48;
  const SEAT_D = 0.46;
  const SEAT_THICK = 0.075;
  const BASE_R = 0.30;
  const CASTER_R = 0.025;

  // Materials
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x222326,
    roughness: 0.6,
    metalness: 0.05,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x35373b,
    roughness: 0.9,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1b1d,
    roughness: 0.35,
    metalness: 0.8,
  });

  function makeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Five-star base + casters
  const hubY = 0.11;
  const hubGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.055, 20);
  const hub = makeMesh(hubGeo, plasticMat, 'base_hub');
  hub.position.set(0, hubY, 0);
  group.add(hub);

  const casterGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.038, 16);
  casterGeo.rotateZ(Math.PI / 2);

  const legGeo = new THREE.BoxGeometry(0.036, 0.028, BASE_R);

  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Caster wheel touching y = 0
    const cx = sinA * BASE_R;
    const cz = cosA * BASE_R;
    const caster = makeMesh(casterGeo, plasticMat, `caster_${i + 1}`);
    caster.position.set(cx, CASTER_R, cz);
    caster.rotation.y = angle;
    group.add(caster);

    // Base leg sloping from hub down to caster
    const leg = makeMesh(legGeo, plasticMat, `base_leg_${i + 1}`);
    leg.position.set(sinA * (BASE_R * 0.52), 0.075, cosA * (BASE_R * 0.52));
    leg.rotation.y = angle;
    leg.rotation.x = 0.16;
    group.add(leg);
  }

  // 2. Gas lift cylinder
  const gasOuterGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.14, 16);
  const gasOuter = makeMesh(gasOuterGeo, metalMat, 'gas_lift_outer');
  gasOuter.position.set(0, hubY + 0.07, 0);
  group.add(gasOuter);

  const gasInnerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.15, 16);
  const gasInner = makeMesh(gasInnerGeo, metalMat, 'gas_lift_piston');
  gasInner.position.set(0, hubY + 0.18, 0);
  group.add(gasInner);

  // 3. Under-seat mechanism, lever, and tension knob
  const mechY = SEAT_H - SEAT_THICK - 0.03;
  const mechGeo = new THREE.BoxGeometry(0.16, 0.05, 0.18);
  const mech = makeMesh(mechGeo, metalMat, 'tilt_mechanism');
  mech.position.set(0, mechY, -0.01);
  group.add(mech);

  const leverGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 10);
  leverGeo.rotateZ(Math.PI / 2);
  const lever = makeMesh(leverGeo, plasticMat, 'height_lever');
  lever.position.set(-0.12, mechY - 0.01, 0.02);
  lever.rotation.y = -0.15;
  group.add(lever);

  const knobGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.045, 14);
  const knob = makeMesh(knobGeo, plasticMat, 'tension_knob');
  knob.position.set(0.04, mechY - 0.04, 0.05);
  knob.rotation.x = 0.25;
  group.add(knob);

  // 4. Seat pan & upholstered seat cushion
  const seatPanGeo = new THREE.BoxGeometry(SEAT_W - 0.02, 0.02, SEAT_D - 0.02);
  const seatPan = makeMesh(seatPanGeo, plasticMat, 'seat_pan');
  seatPan.position.set(0, SEAT_H - SEAT_THICK + 0.005, 0.01);
  group.add(seatPan);

  const seatShape = new THREE.Shape();
  const sw = SEAT_W / 2 - 0.02;
  const sd = SEAT_D / 2 - 0.02;
  const sr = 0.05;
  seatShape.moveTo(-sw + sr, -sd);
  seatShape.lineTo(sw - sr, -sd);
  seatShape.quadraticCurveTo(sw, -sd, sw, -sd + sr);
  seatShape.lineTo(sw, sd - sr);
  seatShape.quadraticCurveTo(sw, sd, sw - sr, sd);
  seatShape.lineTo(-sw + sr, sd);
  seatShape.quadraticCurveTo(-sw, sd, -sw, sd - sr);
  seatShape.lineTo(-sw, -sd + sr);
  seatShape.quadraticCurveTo(-sw, -sd, -sw + sr, -sd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
  });
  seatGeo.rotateX(Math.PI / 2);
  const seatCushion = makeMesh(seatGeo, fabricMat, 'seat_cushion');
  seatCushion.position.set(0, SEAT_H - 0.015, 0.01);
  group.add(seatCushion);

  // 5. Backrest uprights & perforated-style backrest shell
  const backZ = -SEAT_D / 2 + 0.01;
  const uprightGeo = new THREE.BoxGeometry(0.035, 0.22, 0.045);

  const uprightL = makeMesh(uprightGeo, plasticMat, 'back_upright_left');
  uprightL.position.set(SEAT_W / 2 - 0.03, SEAT_H + 0.04, backZ);
  uprightL.rotation.x = -0.14;
  group.add(uprightL);

  const uprightR = makeMesh(uprightGeo, plasticMat, 'back_upright_right');
  uprightR.position.set(-SEAT_W / 2 + 0.03, SEAT_H + 0.04, backZ);
  uprightR.rotation.x = -0.14;
  group.add(uprightR);

  const backShape = new THREE.Shape();
  const bw = 0.21;
  const bh = 0.38;
  const br = 0.045;
  backShape.moveTo(-bw + br, 0);
  backShape.lineTo(bw - br, 0);
  backShape.quadraticCurveTo(bw, 0, bw, br);
  backShape.lineTo(bw, bh - br);
  backShape.quadraticCurveTo(bw, bh, bw - br, bh);
  backShape.lineTo(-bw + br, bh);
  backShape.quadraticCurveTo(-bw, bh, -bw, bh - br);
  backShape.lineTo(-bw, br);
  backShape.quadraticCurveTo(-bw, 0, -bw + br, 0);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
  });
  const backrest = makeMesh(backGeo, plasticMat, 'backrest_shell');
  backrest.position.set(0, SEAT_H + 0.08, backZ - 0.02);
  backrest.rotation.x = -0.14;
  group.add(backrest);

  // 6. Flip-up armrests (resting/down pose)
  const armX = W / 2 - 0.035;
  const armPivotY = SEAT_H + 0.07;
  const pivotGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.035, 16);
  pivotGeo.rotateZ(Math.PI / 2);

  const bracketGeo = new THREE.BoxGeometry(0.026, 0.14, 0.04);
  const padGeo = new THREE.CapsuleGeometry(0.024, 0.20, 6, 12);
  padGeo.rotateX(Math.PI / 2);

  [-1, 1].forEach((side) => {
    const label = side === 1 ? 'left' : 'right';

    const pivot = makeMesh(pivotGeo, plasticMat, `arm_pivot_${label}`);
    pivot.position.set(side * (armX - 0.015), armPivotY, backZ + 0.02);
    group.add(pivot);

    const bracket = makeMesh(bracketGeo, plasticMat, `arm_bracket_${label}`);
    bracket.position.set(side * armX, armPivotY + 0.06, backZ + 0.06);
    bracket.rotation.x = 0.45;
    group.add(bracket);

    const pad = makeMesh(padGeo, fabricMat, `arm_pad_${label}`);
    pad.position.set(side * armX, armPivotY + 0.13, backZ + 0.16);
    group.add(pad);
  });

  return group;
}
