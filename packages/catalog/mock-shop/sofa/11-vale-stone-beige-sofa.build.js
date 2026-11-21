function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.96;
  const H = 0.88;
  const D = 0.94;
  const LEG_H = 0.04;
  const LEG_R = 0.025;
  const ARM_W = 0.16;
  const ARM_H = 0.54;
  const BASE_H = 0.20;
  const BACK_THICK = 0.16;
  const BACK_H = 0.68;
  const SEAT_H = 0.19;
  const SEAT_D = D - BACK_THICK + 0.02;
  const INNER_W = W - 2 * ARM_W;
  const CUSHION_GAP = 0.015;
  const CUSHION_W = (INNER_W - CUSHION_GAP) / 2;
  const BACK_CUSHION_H = 0.46;
  const BACK_CUSHION_D = 0.20;
  const PILLOW_SIZE = 0.40;
  const PILLOW_THICK = 0.12;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc4b8aa,
    roughness: 0.92,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xb5a899,
    roughness: 0.9,
    metalness: 0.0
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.5,
    metalness: 0.1
  });

  function addMesh(geometry, material, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  // Legs (4 short cylindrical feet)
  const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R * 0.85, LEG_H, 16);
  const legX = W / 2 - 0.07;
  const legZ = D / 2 - 0.07;
  const legPositions = [
    [-legX, LEG_H / 2, legZ, 'leg_front_left'],
    [legX, LEG_H / 2, legZ, 'leg_front_right'],
    [-legX, LEG_H / 2, -legZ, 'leg_back_left'],
    [legX, LEG_H / 2, -legZ, 'leg_back_right']
  ];
  for (let i = 0; i < legPositions.length; i++) {
    const [lx, ly, lz, lname] = legPositions[i];
    const leg = addMesh(legGeo, legMat, lname);
    leg.position.set(lx, ly, lz);
  }

  // Base frame
  const baseGeo = new THREE.BoxGeometry(INNER_W + 0.02, BASE_H, D - 0.02);
  const baseMesh = addMesh(baseGeo, fabricMat, 'base_frame');
  baseMesh.position.set(0, LEG_H + BASE_H / 2, 0);

  // Backrest frame
  const backFrameGeo = new THREE.BoxGeometry(INNER_W + 0.02, BACK_H, BACK_THICK);
  const backFrameMesh = addMesh(backFrameGeo, fabricMat, 'backrest_frame');
  backFrameMesh.position.set(0, LEG_H + BACK_H / 2, -D / 2 + BACK_THICK / 2);

  // Armrests (beveled extrude for soft upholstered edges)
  const armShape = createRoundedRectShape(D - 0.03, ARM_H - 0.03, 0.03);
  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  });
  armGeo.center();
  armGeo.rotateY(Math.PI / 2);

  const armLeft = addMesh(armGeo, fabricMat, 'armrest_left');
  armLeft.position.set(-W / 2 + ARM_W / 2, LEG_H + ARM_H / 2, 0);

  const armRight = addMesh(armGeo, fabricMat, 'armrest_right');
  armRight.position.set(W / 2 - ARM_W / 2, LEG_H + ARM_H / 2, 0);

  // Seat cushions (2 plush cushions with top piping)
  const seatBevel = 0.035;
  const seatShape = createRoundedRectShape(
    CUSHION_W - seatBevel * 2,
    SEAT_D - seatBevel * 2,
    0.04
  );
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_H - seatBevel * 2,
    bevelEnabled: true,
    bevelThickness: seatBevel,
    bevelSize: seatBevel,
    bevelSegments: 4
  });
  seatGeo.center();
  seatGeo.rotateX(Math.PI / 2);

  const seatY = LEG_H + BASE_H + SEAT_H / 2 - 0.01;
  const seatZ = (D - SEAT_D) / 2;
  const seatXOffset = CUSHION_W / 2 + CUSHION_GAP / 2;

  const seatLeft = addMesh(seatGeo, fabricMat, 'seat_cushion_left');
  seatLeft.position.set(-seatXOffset, seatY, seatZ);

  const seatRight = addMesh(seatGeo, fabricMat, 'seat_cushion_right');
  seatRight.position.set(seatXOffset, seatY, seatZ);

  // Seat cushion piping
  const pipeW = CUSHION_W - 0.04;
  const pipeD = SEAT_D - 0.04;
  const pipeR = 0.03;
  const pipePoints = [
    new THREE.Vector3(-pipeW / 2 + pipeR, 0, -pipeD / 2),
    new THREE.Vector3(pipeW / 2 - pipeR, 0, -pipeD / 2),
    new THREE.Vector3(pipeW / 2, 0, -pipeD / 2 + pipeR),
    new THREE.Vector3(pipeW / 2, 0, pipeD / 2 - pipeR),
    new THREE.Vector3(pipeW / 2 - pipeR, 0, pipeD / 2),
    new THREE.Vector3(-pipeW / 2 + pipeR, 0, pipeD / 2),
    new THREE.Vector3(-pipeW / 2, 0, pipeD / 2 - pipeR),
    new THREE.Vector3(-pipeW / 2, 0, -pipeD / 2 + pipeR)
  ];
  const pipeCurve = new THREE.CatmullRomCurve3(pipePoints, true);
  const pipeGeo = new THREE.TubeGeometry(pipeCurve, 32, 0.006, 6, true);

  const pipeLeft = addMesh(pipeGeo, pipingMat, 'seat_piping_left');
  pipeLeft.position.set(-seatXOffset, seatY + SEAT_H / 2 - 0.025, seatZ);

  const pipeRight = addMesh(pipeGeo, pipingMat, 'seat_piping_right');
  pipeRight.position.set(seatXOffset, seatY + SEAT_H / 2 - 0.025, seatZ);

  // Back cushions (2 large plush cushions)
  const backBevel = 0.045;
  const backShape = createRoundedRectShape(
    CUSHION_W - backBevel * 2,
    BACK_CUSHION_H - backBevel * 2,
    0.05
  );
  const backCushionGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_CUSHION_D - backBevel * 2,
    bevelEnabled: true,
    bevelThickness: backBevel,
    bevelSize: backBevel,
    bevelSegments: 4
  });
  backCushionGeo.center();

  const backCushionY = LEG_H + BASE_H + SEAT_H + BACK_CUSHION_H / 2 - 0.03;
  const backCushionZ = -D / 2 + BACK_THICK + BACK_CUSHION_D / 2 - 0.02;

  const backLeft = addMesh(backCushionGeo, fabricMat, 'back_cushion_left');
  backLeft.position.set(-seatXOffset, backCushionY, backCushionZ);
  backLeft.rotation.x = -0.12;

  const backRight = addMesh(backCushionGeo, fabricMat, 'back_cushion_right');
  backRight.position.set(seatXOffset, backCushionY, backCushionZ);
  backRight.rotation.x = -0.12;

  // Throw pillows (2 square pillows leaning against arms & back)
  const pillowBevel = 0.04;
  const pillowShape = createRoundedRectShape(
    PILLOW_SIZE - pillowBevel * 2,
    PILLOW_SIZE - pillowBevel * 2,
    0.04
  );
  const pillowGeo = new THREE.ExtrudeGeometry(pillowShape, {
    depth: PILLOW_THICK - pillowBevel * 2,
    bevelEnabled: true,
    bevelThickness: pillowBevel,
    bevelSize: pillowBevel,
    bevelSegments: 4
  });
  pillowGeo.center();

  const pillowY = LEG_H + BASE_H + SEAT_H + PILLOW_SIZE / 2 - 0.04;
  const pillowZ = -0.06;
  const pillowX = INNER_W / 2 - 0.16;

  const pillowLeft = addMesh(pillowGeo, fabricMat, 'throw_pillow_left');
  pillowLeft.position.set(-pillowX, pillowY, pillowZ);
  pillowLeft.rotation.set(-0.2, 0.45, 0.12);

  const pillowRight = addMesh(pillowGeo, fabricMat, 'throw_pillow_right');
  pillowRight.position.set(pillowX, pillowY, pillowZ);
  pillowRight.rotation.set(-0.2, -0.45, -0.12);

  return group;
}
