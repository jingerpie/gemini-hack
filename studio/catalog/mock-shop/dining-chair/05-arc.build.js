function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.52;
  const D = 0.54;
  const H = 0.78;
  const SEAT_H = 0.46;
  const CUSHION_THICK = 0.038;
  const RAIL_Y = SEAT_H - CUSHION_THICK - 0.014;
  const LEG_TOP_R = 0.019;
  const LEG_BOT_R = 0.013;
  const GLIDE_H = 0.005;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a477,
    roughness: 0.62,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.9,
    metalness: 0.0
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2a241e,
    roughness: 0.8,
    metalness: 0.05
  });

  // Helper to create a tapered leg between two 3D points
  function createLeg(name, topPos, botPos) {
    const dir = new THREE.Vector3().subVectors(topPos, botPos);
    const len = dir.length();
    const geom = new THREE.CylinderGeometry(LEG_TOP_R, LEG_BOT_R, len, 20);
    const mesh = new THREE.Mesh(geom, oakMat);
    mesh.name = name;
    mesh.position.copy(botPos).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Small floor glide
    const glideGeom = new THREE.CylinderGeometry(LEG_BOT_R * 0.95, LEG_BOT_R * 0.95, GLIDE_H, 16);
    const glide = new THREE.Mesh(glideGeom, glideMat);
    glide.name = name.replace('_leg', '_glide');
    glide.position.set(botPos.x, GLIDE_H * 0.5, botPos.z);
    glide.castShadow = true;
    glide.receiveShadow = true;
    group.add(glide);
  }

  // Leg positions (attached under the seat frame)
  const legTopY = SEAT_H - CUSHION_THICK;
  const flTop = new THREE.Vector3(-0.205, legTopY, 0.195);
  const flBot = new THREE.Vector3(-0.225, GLIDE_H, 0.215);

  const frTop = new THREE.Vector3(0.205, legTopY, 0.195);
  const frBot = new THREE.Vector3(0.225, GLIDE_H, 0.215);

  const blTop = new THREE.Vector3(-0.195, legTopY, -0.175);
  const blBot = new THREE.Vector3(-0.225, GLIDE_H, -0.235);

  const brTop = new THREE.Vector3(0.195, legTopY, -0.175);
  const brBot = new THREE.Vector3(0.225, GLIDE_H, -0.235);

  createLeg('front_left_leg', flTop, flBot);
  createLeg('front_right_leg', frTop, frBot);
  createLeg('back_left_leg', blTop, blBot);
  createLeg('back_right_leg', brTop, brBot);

  // Seat rails (apron) built at y = 0 and positioned at RAIL_Y
  function createRail(name, p1, p2, radius) {
    const a = new THREE.Vector3(p1.x, 0, p1.z);
    const b = new THREE.Vector3(p2.x, 0, p2.z);
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y += 0.004;
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    const geom = new THREE.TubeGeometry(curve, 12, radius, 12, false);
    const mesh = new THREE.Mesh(geom, oakMat);
    mesh.name = name;
    mesh.scale.set(1, 1.3, 1);
    mesh.position.y = RAIL_Y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const railR = 0.015;
  createRail('front_seat_rail', flTop, frTop, railR);
  createRail('back_seat_rail', blTop, brTop, railR);
  createRail('left_seat_rail', flTop, blTop, railR);
  createRail('right_seat_rail', frTop, brTop, railR);

  // Continuous arched backrest flowing smoothly from left rear leg to right rear leg
  const backCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(blTop.x, RAIL_Y, blTop.z),
    new THREE.Vector3(-0.205, SEAT_H + 0.08, -0.175),
    new THREE.Vector3(-0.215, SEAT_H + 0.21, -0.175),
    new THREE.Vector3(-0.145, H - 0.035, -0.215),
    new THREE.Vector3(0, H - 0.022, -0.24),
    new THREE.Vector3(0.145, H - 0.035, -0.215),
    new THREE.Vector3(0.215, SEAT_H + 0.21, -0.175),
    new THREE.Vector3(0.205, SEAT_H + 0.08, -0.175),
    new THREE.Vector3(brTop.x, RAIL_Y, brTop.z)
  ]);

  const backGeom = new THREE.TubeGeometry(backCurve, 32, 0.022, 16, false);
  const backMesh = new THREE.Mesh(backGeom, oakMat);
  backMesh.name = 'backrest_arch';
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  group.add(backMesh);

  // Slim upholstered seat cushion sitting on top of the seat frame
  const seatShape = new THREE.Shape();
  const fw = 0.215; // front half-width
  const bw = 0.185; // back half-width
  const fz = 0.21;  // front z
  const bz = -0.175; // back z
  const r = 0.045;  // corner radius

  seatShape.moveTo(-fw + r, fz);
  seatShape.lineTo(fw - r, fz);
  seatShape.quadraticCurveTo(fw, fz, fw, fz - r);
  seatShape.lineTo(bw, bz + r);
  seatShape.quadraticCurveTo(bw, bz, bw - r, bz);
  seatShape.lineTo(-bw + r, bz);
  seatShape.quadraticCurveTo(-bw, bz, -bw, bz + r);
  seatShape.lineTo(-fw, fz - r);
  seatShape.quadraticCurveTo(-fw, fz, -fw + r, fz);

  const bevelThickness = 0.011;
  const extrudeSettings = {
    depth: CUSHION_THICK - bevelThickness * 2,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: bevelThickness,
    curveSegments: 16
  };

  const seatGeom = new THREE.ExtrudeGeometry(seatShape, extrudeSettings);
  seatGeom.rotateX(Math.PI / 2);
  const seatMesh = new THREE.Mesh(seatGeom, fabricMat);
  seatMesh.name = 'seat_cushion';
  seatMesh.position.y = SEAT_H - bevelThickness;
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  group.add(seatMesh);

  return group;
}
