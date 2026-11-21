function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - Children's Rocking Chair
  const W = 0.48;
  const H = 0.62;
  const D = 0.64;
  const SEAT_H = 0.27;
  const FRAME_T = 0.028; // thickness of bentwood side frame
  const FRAME_W = 0.032; // width of bentwood profile
  const SHELL_T = 0.014; // thickness of molded plywood shell
  const SHELL_W = W - FRAME_T * 2 - 0.008;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xcba378,
    roughness: 0.58,
    metalness: 0.02
  });

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xf2a684,
    roughness: 0.52,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.35,
    metalness: 0.8
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

  // 1. Side Frames (Bentwood Rockers + Legs + Armrests)
  // Profile in Y-Z plane (x = Z, y = Y), extruded along X
  function createSideFrameGeometry() {
    const outer = new THREE.Shape();
    // Start at rear rocker tip
    outer.moveTo(-0.31, 0.065);
    // Bottom rocker curve (lowest point at y = 0)
    outer.bezierCurveTo(-0.18, -0.015, 0.08, -0.015, 0.23, 0.025);
    // Front bottom corner up to front leg
    outer.quadraticCurveTo(0.28, 0.04, 0.265, 0.11);
    // Front leg up to armrest
    outer.lineTo(0.215, 0.35);
    // Front armrest corner
    outer.quadraticCurveTo(0.20, 0.415, 0.13, 0.415);
    // Armrest top
    outer.lineTo(-0.11, 0.405);
    // Rear armrest corner
    outer.quadraticCurveTo(-0.175, 0.40, -0.19, 0.335);
    // Rear leg down
    outer.lineTo(-0.235, 0.11);
    // Rear leg to rocker tail
    outer.quadraticCurveTo(-0.24, 0.085, -0.28, 0.08);
    outer.quadraticCurveTo(-0.31, 0.08, -0.31, 0.065);

    const hole = new THREE.Path();
    hole.moveTo(-0.195, 0.115);
    hole.bezierCurveTo(-0.12, 0.04, 0.08, 0.035, 0.205, 0.065);
    hole.quadraticCurveTo(0.235, 0.075, 0.225, 0.12);
    hole.lineTo(0.18, 0.335);
    hole.quadraticCurveTo(0.17, 0.375, 0.125, 0.375);
    hole.lineTo(-0.105, 0.365);
    hole.quadraticCurveTo(-0.145, 0.362, -0.155, 0.32);
    hole.lineTo(-0.195, 0.115);

    outer.holes.push(hole);

    const extrudeSettings = {
      depth: FRAME_T,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      curveSegments: 24
    };

    const geo = new THREE.ExtrudeGeometry(outer, extrudeSettings);
    // Rotate so shape X -> +Z, shape Y -> +Y, extrude Z -> +X
    geo.rotateY(-Math.PI / 2);
    geo.translate(FRAME_T / 2, 0, 0);
    return geo;
  }

  const sideFrameGeo = createSideFrameGeometry();
  const sideX = W / 2 - FRAME_T / 2;

  addMesh(sideFrameGeo, woodMat, 'left_rocker_frame', [-sideX, 0, 0]);
  addMesh(sideFrameGeo, woodMat, 'right_rocker_frame', [sideX, 0, 0]);

  // Small raised armrest grip pads on top of each armrest
  const armPadGeo = new THREE.BoxGeometry(FRAME_T + 0.006, 0.012, 0.14);
  addMesh(armPadGeo, woodMat, 'left_armrest_pad', [-sideX, 0.412, 0.01], [-0.04, 0, 0]);
  addMesh(armPadGeo, woodMat, 'right_armrest_pad', [sideX, 0.412, 0.01], [-0.04, 0, 0]);

  // 2. Under-seat crossbars connecting left and right frames
  const crossbarGeo = new THREE.CylinderGeometry(0.012, 0.012, W - FRAME_T * 2, 16);
  crossbarGeo.rotateZ(Math.PI / 2);
  addMesh(crossbarGeo, woodMat, 'front_crossbar', [0, 0.255, 0.12]);
  addMesh(crossbarGeo, woodMat, 'rear_crossbar', [0, 0.235, -0.11]);

  // 3. Molded Plywood Shell (Seat + Curved Transition + Backrest)
  function createRoundedPanelGeo(width, length, thickness, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hl = length / 2;
    shape.moveTo(-hw + radius, -hl);
    shape.lineTo(hw - radius, -hl);
    shape.quadraticCurveTo(hw, -hl, hw, -hl + radius);
    shape.lineTo(hw, hl - radius);
    shape.quadraticCurveTo(hw, hl, hw - radius, hl);
    shape.lineTo(-hw + radius, hl);
    shape.quadraticCurveTo(-hw, hl, -hw, hl - radius);
    shape.lineTo(-hw, -hl + radius);
    shape.quadraticCurveTo(-hw, -hl, -hw + radius, -hl);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      curveSegments: 12
    });
    geo.center();
    return geo;
  }

  // Seat panel
  const seatGeo = createRoundedPanelGeo(SHELL_W, 0.30, SHELL_T, 0.04);
  seatGeo.rotateX(Math.PI / 2);
  addMesh(seatGeo, shellMat, 'seat_shell', [0, SEAT_H, 0.04], [0.06, 0, 0]);

  // Backrest panel
  const backGeo = createRoundedPanelGeo(SHELL_W, 0.34, SHELL_T, 0.055);
  addMesh(backGeo, shellMat, 'backrest_shell', [0, 0.455, -0.155], [-0.22, 0, 0]);

  // Curved transition between seat and backrest
  const bendGeo = new THREE.CylinderGeometry(
    0.055,
    0.055,
    SHELL_W,
    20,
    1,
    true,
    Math.PI * 0.45,
    Math.PI * 0.55
  );
  bendGeo.rotateZ(Math.PI / 2);
  // Thicken by using a solid curved strip or overlapping cylinder
  const bendSolidGeo = new THREE.CylinderGeometry(0.045, 0.045, SHELL_W - 0.01, 20);
  bendSolidGeo.rotateZ(Math.PI / 2);
  addMesh(bendSolidGeo, shellMat, 'shell_lumbar_curve', [0, 0.295, -0.105]);

  // 4. Mounting brackets & hardware connecting shell to side frames
  const bracketGeo = new THREE.BoxGeometry(0.012, 0.022, 0.045);
  addMesh(bracketGeo, woodMat, 'left_seat_bracket', [-SHELL_W / 2 - 0.002, 0.258, 0.06]);
  addMesh(bracketGeo, woodMat, 'right_seat_bracket', [SHELL_W / 2 + 0.002, 0.258, 0.06]);

  const boltGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12);
  boltGeo.rotateZ(Math.PI / 2);
  addMesh(boltGeo, metalMat, 'left_arm_bolt', [-sideX - FRAME_T / 2 - 0.002, 0.37, -0.12]);
  addMesh(boltGeo, metalMat, 'right_arm_bolt', [sideX + FRAME_T / 2 + 0.002, 0.37, -0.12]);

  // Normalize bounding box so lowest point is y = 0 and centered on x = 0, z = 0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.set(-center.x, -box.min.y, -center.z);

  return group;
}
