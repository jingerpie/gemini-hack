function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.96;          // Overall width
  const D = 0.96;          // Overall depth
  const H = 0.80;          // Overall height (top of back cushion)
  const FOOT_H = 0.02;     // Low recessed feet height
  const ARM_W = 0.145;     // Width of each track arm
  const ARM_H = 0.60;      // Height of arms from bottom of body
  const BODY_Y = FOOT_H;   // Bottom of upholstered body
  const INNER_W = W - 2 * ARM_W; // Width between arms (0.67m)
  const BACK_FRAME_T = 0.12;     // Thickness of rear frame
  const BACK_FRAME_H = 0.66;     // Height of rear frame from BODY_Y
  const APRON_H = 0.25;    // Height of front apron below seat cushion
  const SEAT_CUSHION_H = 0.16;   // Thickness of seat cushion
  const SEAT_H = BODY_Y + APRON_H + SEAT_CUSHION_H; // ~0.43m seat height

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc9beb0,
    roughness: 0.88,
    metalness: 0.0,
  });

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0xb5aa9c,
    roughness: 0.92,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Helper: creates a centered rounded-edge box using ExtrudeGeometry
  function makeUpholsteredBox(w, h, d, r, bevel, bevelSegs) {
    const bw = Math.max(0.01, w - 2 * bevel);
    const bh = Math.max(0.01, h - 2 * bevel);
    const bd = Math.max(0.01, d - 2 * bevel);
    const rad = Math.min(r, bw * 0.45, bh * 0.45);

    const shape = new THREE.Shape();
    const hw = bw / 2;
    const hh = bh / 2;
    shape.moveTo(-hw + rad, -hh);
    shape.lineTo(hw - rad, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    shape.lineTo(hw, hh - rad);
    shape.quadraticCurveTo(hw, hh, hw - rad, hh);
    shape.lineTo(-hw + rad, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    shape.lineTo(-hw, -hh + rad);
    shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: bd,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: bevelSegs || 4,
      curveSegments: 8,
    });
    geom.center();
    return geom;
  }

  function addMesh(geom, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed feet (4)
  const footGeom = new THREE.CylinderGeometry(0.025, 0.022, FOOT_H + 0.005, 16);
  const footX = W / 2 - 0.10;
  const footZ = D / 2 - 0.10;
  const footY = (FOOT_H + 0.005) / 2;
  addMesh(footGeom, footMat, "foot_front_left", -footX, footY, footZ);
  addMesh(footGeom, footMat, "foot_front_right", footX, footY, footZ);
  addMesh(footGeom, footMat, "foot_back_left", -footX, footY, -footZ);
  addMesh(footGeom, footMat, "foot_back_right", footX, footY, -footZ);

  // 2. Left & Right Track Arms
  const armGeom = makeUpholsteredBox(ARM_W, ARM_H, D, 0.018, 0.014, 4);
  const armX = W / 2 - ARM_W / 2;
  const armY = BODY_Y + ARM_H / 2;
  addMesh(armGeom, fabricMat, "arm_left", -armX, armY, 0);
  addMesh(armGeom, fabricMat, "arm_right", armX, armY, 0);

  // 3. Back Frame
  const backFrameGeom = makeUpholsteredBox(INNER_W + 0.02, BACK_FRAME_H, BACK_FRAME_T, 0.015, 0.012, 3);
  const backFrameY = BODY_Y + BACK_FRAME_H / 2;
  const backFrameZ = -D / 2 + BACK_FRAME_T / 2;
  addMesh(backFrameGeom, fabricMat, "back_frame", 0, backFrameY, backFrameZ);

  // 4. Base Platform (structural box under seat)
  const baseDepth = D - BACK_FRAME_T;
  const baseGeom = new THREE.BoxGeometry(INNER_W + 0.01, APRON_H - 0.01, baseDepth - 0.02);
  const baseY = BODY_Y + (APRON_H - 0.01) / 2;
  const baseZ = (D / 2 - baseDepth / 2) - 0.01;
  addMesh(baseGeom, deckMat, "base_platform", 0, baseY, baseZ);

  // 5. Front Apron (flush with front of arms)
  const apronD = 0.08;
  const apronGeom = makeUpholsteredBox(INNER_W - 0.004, APRON_H, apronD, 0.012, 0.010, 3);
  const apronY = BODY_Y + APRON_H / 2;
  const apronZ = D / 2 - apronD / 2;
  addMesh(apronGeom, fabricMat, "front_apron", 0, apronY, apronZ);

  // 6. Seat Deck (thin upholstered deck under seat cushion)
  const deckGeom = new THREE.BoxGeometry(INNER_W, 0.02, baseDepth);
  addMesh(deckGeom, deckMat, "seat_deck", 0, BODY_Y + APRON_H - 0.005, D / 2 - baseDepth / 2);

  // 7. Seat Cushion
  const seatCushionD = D - BACK_FRAME_T + 0.01;
  const seatCushionGeom = makeUpholsteredBox(INNER_W - 0.006, SEAT_CUSHION_H, seatCushionD, 0.032, 0.024, 5);
  const seatCushionY = BODY_Y + APRON_H + SEAT_CUSHION_H / 2 - 0.005;
  const seatCushionZ = D / 2 - seatCushionD / 2;
  addMesh(seatCushionGeom, fabricMat, "seat_cushion", 0, seatCushionY, seatCushionZ);

  // 8. Back Cushion (slightly reclined, rising above back frame)
  const backCushionH = H - SEAT_H + 0.05;
  const backCushionD = 0.17;
  const backCushionGeom = makeUpholsteredBox(INNER_W - 0.008, backCushionH, backCushionD, 0.035, 0.026, 5);
  const backCushionY = SEAT_H + backCushionH / 2 - 0.045;
  const backCushionZ = -D / 2 + BACK_FRAME_T + backCushionD / 2 - 0.02;
  addMesh(backCushionGeom, fabricMat, "back_cushion", 0, backCushionY, backCushionZ, -0.14, 0, 0);

  return group;
}
