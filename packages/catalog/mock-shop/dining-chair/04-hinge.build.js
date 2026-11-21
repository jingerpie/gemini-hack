function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.46;
  const H = 0.78;
  const D = 0.48;
  const SEAT_H = 0.45;
  const TUBE_R = 0.011;
  const GLIDE_R = 0.014;
  const FRAME_HALF_W = 0.20;
  const REAR_HALF_W = 0.182;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3b3e40,
    roughness: 0.45,
    metalness: 0.65
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb57845,
    roughness: 0.42,
    metalness: 0.04
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f20,
    roughness: 0.75,
    metalness: 0.1
  });

  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    roughness: 0.25,
    metalness: 0.85
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

  // 1. Main U-frame (front sled base + uprights to backrest)
  const frontZ = 0.21;
  const topZ = -0.19;
  const topY = 0.74;
  const mainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-FRAME_HALF_W, topY, topZ),
    new THREE.Vector3(-FRAME_HALF_W, 0.38, 0.01),
    new THREE.Vector3(-FRAME_HALF_W, 0.06, frontZ - 0.02),
    new THREE.Vector3(-FRAME_HALF_W, GLIDE_R, frontZ),
    new THREE.Vector3(-FRAME_HALF_W + 0.04, GLIDE_R, frontZ),
    new THREE.Vector3(FRAME_HALF_W - 0.04, GLIDE_R, frontZ),
    new THREE.Vector3(FRAME_HALF_W, GLIDE_R, frontZ),
    new THREE.Vector3(FRAME_HALF_W, 0.06, frontZ - 0.02),
    new THREE.Vector3(FRAME_HALF_W, 0.38, 0.01),
    new THREE.Vector3(FRAME_HALF_W, topY, topZ)
  ], false, 'catmullrom', 0.2);

  const mainFrameGeo = new THREE.TubeGeometry(mainCurve, 64, TUBE_R, 16, false);
  addMesh(mainFrameGeo, frameMat, 'main_u_frame');

  // End caps for main frame top
  const capGeo = new THREE.SphereGeometry(TUBE_R, 12, 12);
  addMesh(capGeo, frameMat, 'main_frame_cap_l', [-FRAME_HALF_W, topY, topZ]);
  addMesh(capGeo, frameMat, 'main_frame_cap_r', [FRAME_HALF_W, topY, topZ]);

  // 2. Rear U-frame (rear sled base + rear legs)
  const rearZ = -0.22;
  const hingeY = 0.54;
  const hingeZ = -0.08;
  const rearCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-REAR_HALF_W, hingeY, hingeZ),
    new THREE.Vector3(-REAR_HALF_W, 0.28, -0.15),
    new THREE.Vector3(-REAR_HALF_W, 0.06, rearZ + 0.02),
    new THREE.Vector3(-REAR_HALF_W, GLIDE_R, rearZ),
    new THREE.Vector3(-REAR_HALF_W + 0.04, GLIDE_R, rearZ),
    new THREE.Vector3(REAR_HALF_W - 0.04, GLIDE_R, rearZ),
    new THREE.Vector3(REAR_HALF_W, GLIDE_R, rearZ),
    new THREE.Vector3(REAR_HALF_W, 0.06, rearZ + 0.02),
    new THREE.Vector3(REAR_HALF_W, 0.28, -0.15),
    new THREE.Vector3(REAR_HALF_W, hingeY, hingeZ)
  ], false, 'catmullrom', 0.2);

  const rearFrameGeo = new THREE.TubeGeometry(rearCurve, 64, TUBE_R, 16, false);
  addMesh(rearFrameGeo, frameMat, 'rear_u_frame');

  addMesh(capGeo, frameMat, 'rear_frame_cap_l', [-REAR_HALF_W, hingeY, hingeZ]);
  addMesh(capGeo, frameMat, 'rear_frame_cap_r', [REAR_HALF_W, hingeY, hingeZ]);

  // 3. Floor glides (4 small black sleeves on the bottom runners)
  const glideGeo = new THREE.CylinderGeometry(GLIDE_R, GLIDE_R, 0.028, 16);
  glideGeo.rotateZ(Math.PI / 2);
  addMesh(glideGeo, glideMat, 'glide_front_l', [-FRAME_HALF_W + 0.045, GLIDE_R, frontZ]);
  addMesh(glideGeo, glideMat, 'glide_front_r', [FRAME_HALF_W - 0.045, GLIDE_R, frontZ]);
  addMesh(glideGeo, glideMat, 'glide_rear_l', [-REAR_HALF_W + 0.045, GLIDE_R, rearZ]);
  addMesh(glideGeo, glideMat, 'glide_rear_r', [REAR_HALF_W - 0.045, GLIDE_R, rearZ]);

  // 4. Under-seat support rails & folding links
  const seatRailY = SEAT_H - 0.02;
  const seatRailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-REAR_HALF_W, seatRailY, 0.07),
    new THREE.Vector3(-REAR_HALF_W, seatRailY, -0.15),
    new THREE.Vector3(REAR_HALF_W, seatRailY, -0.15),
    new THREE.Vector3(REAR_HALF_W, seatRailY, 0.07)
  ], false, 'catmullrom', 0.15);
  const seatRailGeo = new THREE.TubeGeometry(seatRailCurve, 32, TUBE_R * 0.85, 12, false);
  addMesh(seatRailGeo, frameMat, 'seat_support_frame');

  // Folding link bars (connecting rear leg to seat rail)
  const linkLen = 0.11;
  const linkGeo = new THREE.BoxGeometry(0.008, 0.016, linkLen);
  addMesh(linkGeo, frameMat, 'folding_link_l', [-FRAME_HALF_W + 0.008, 0.47, -0.07], [0.62, 0, 0]);
  addMesh(linkGeo, frameMat, 'folding_link_r', [FRAME_HALF_W - 0.008, 0.47, -0.07], [0.62, 0, 0]);

  // Lower diagonal brace under seat
  const braceGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.10, 12);
  addMesh(braceGeo, frameMat, 'seat_brace_l', [-REAR_HALF_W, 0.40, -0.02], [0.65, 0, 0]);
  addMesh(braceGeo, frameMat, 'seat_brace_r', [REAR_HALF_W, 0.40, -0.02], [0.65, 0, 0]);

  // 5. Pivot rivets
  const rivetGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.028, 12);
  rivetGeo.rotateZ(Math.PI / 2);
  addMesh(rivetGeo, rivetMat, 'pivot_rivet_hinge_l', [-FRAME_HALF_W + 0.01, hingeY, hingeZ]);
  addMesh(rivetGeo, rivetMat, 'pivot_rivet_hinge_r', [FRAME_HALF_W - 0.01, hingeY, hingeZ]);
  addMesh(rivetGeo, rivetMat, 'pivot_rivet_seat_l', [-FRAME_HALF_W + 0.01, seatRailY, -0.02]);
  addMesh(rivetGeo, rivetMat, 'pivot_rivet_seat_r', [FRAME_HALF_W - 0.01, seatRailY, -0.02]);

  // 6. Bent Plywood Seat
  const seatW = 0.40;
  const seatShape = new THREE.Shape();
  // Side profile of seat (z from -0.17 to +0.20)
  seatShape.moveTo(-0.17, 0.012);
  seatShape.quadraticCurveTo(0.0, -0.006, 0.19, 0.004);
  seatShape.quadraticCurveTo(0.205, 0.002, 0.20, -0.008);
  seatShape.quadraticCurveTo(0.0, -0.018, -0.17, 0.0);
  seatShape.closePath();

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: seatW,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16
  });
  // Rotate so extrusion depth is along X, centered at X=0
  seatGeo.rotateY(-Math.PI / 2);
  seatGeo.translate(seatW / 2, 0, 0);
  addMesh(seatGeo, woodMat, 'plywood_seat', [0, SEAT_H, 0.01]);

  // 7. Bent Plywood Backrest
  const backW = 0.41;
  const backH = 0.165;
  const backShape = new THREE.Shape();
  // Top-down arc profile (concave toward +Z)
  backShape.moveTo(-backW / 2, 0.025);
  backShape.quadraticCurveTo(0, -0.012, backW / 2, 0.025);
  backShape.lineTo(backW / 2, 0.036);
  backShape.quadraticCurveTo(0, -0.001, -backW / 2, 0.036);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: backH,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16
  });
  backGeo.rotateX(Math.PI / 2);
  backGeo.translate(0, backH / 2, 0);

  // Tilt backrest to match upper main frame angle (~0.50 rad)
  addMesh(backGeo, woodMat, 'plywood_backrest', [0, 0.65, -0.145], [-0.49, 0, 0]);

  return group;
}
