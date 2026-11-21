function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.00;         // Overall width (X)
  const D = 0.70;         // Overall depth (Z)
  const H = 0.48;         // Overall height (Y)
  const FOOT_H = 0.012;   // Low-profile floor glides
  const BASE_H = 0.105;   // Lower front/side plinth height
  const ARM_W = 0.135;    // Armrest width
  const ARM_H = 0.31;     // Armrest height from floor
  const BACK_D = 0.14;    // Backrest thickness
  const CUSHION_H = 0.095;// Seat cushion thickness
  const SEAT_W = W - ARM_W * 2;
  const SEAT_D = D - BACK_D;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8b8d8f,
    roughness: 0.88,
    metalness: 0.02,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x7e8082,
    roughness: 0.9,
    metalness: 0.02,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.6,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  // 1. Floor glides (4 corners)
  const footGeo = new THREE.CylinderGeometry(0.022, 0.02, FOOT_H, 16);
  const fx = W / 2 - 0.06;
  const fz = D / 2 - 0.06;
  addMesh(footGeo, footMat, "foot_front_left", -fx, FOOT_H / 2, fz);
  addMesh(footGeo, footMat, "foot_front_right", fx, FOOT_H / 2, fz);
  addMesh(footGeo, footMat, "foot_back_left", -fx, FOOT_H / 2, -fz);
  addMesh(footGeo, footMat, "foot_back_right", fx, FOOT_H / 2, -fz);

  // 2. Base deck (underneath seat cushion, between arms)
  const baseGeo = new THREE.BoxGeometry(SEAT_W + 0.02, BASE_H, SEAT_D + 0.02);
  addMesh(
    baseGeo,
    fabricMat,
    "base_deck",
    0,
    FOOT_H + BASE_H / 2,
    (D - SEAT_D) / 2
  );

  // 3. Armrests (Left and Right, full depth D)
  const armBevel = 0.014;
  const armBodyH = ARM_H - FOOT_H - armBevel * 2;
  const armBodyD = D - armBevel * 2;
  const armShape = createRoundedRectShape(armBodyD, armBodyH, 0.025);
  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_W - armBevel * 2,
    bevelEnabled: true,
    bevelThickness: armBevel,
    bevelSize: armBevel,
    bevelSegments: 4,
    curveSegments: 12,
  });
  armGeo.center();

  const armY = FOOT_H + (ARM_H - FOOT_H) / 2;
  const armX = W / 2 - ARM_W / 2;
  addMesh(armGeo, fabricMat, "armrest_left", -armX, armY, 0, 0, Math.PI / 2, 0);
  addMesh(armGeo, fabricMat, "armrest_right", armX, armY, 0, 0, Math.PI / 2, 0);

  // Armrest front piping (subtle vertical & top edge detail)
  const pipeRadius = 0.005;
  const pipeH = ARM_H - FOOT_H - 0.03;
  const armPipeVGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeH, 8);
  const armPipeZ = D / 2 - 0.004;
  addMesh(armPipeVGeo, pipingMat, "arm_left_piping_outer", -W / 2 + 0.015, armY, armPipeZ);
  addMesh(armPipeVGeo, pipingMat, "arm_left_piping_inner", -W / 2 + ARM_W - 0.015, armY, armPipeZ);
  addMesh(armPipeVGeo, pipingMat, "arm_right_piping_inner", W / 2 - ARM_W + 0.015, armY, armPipeZ);
  addMesh(armPipeVGeo, pipingMat, "arm_right_piping_outer", W / 2 - 0.015, armY, armPipeZ);

  // 4. Backrest (full width W, sits behind seat and rises to H)
  const backBevel = 0.018;
  const backTotalH = H - FOOT_H;
  const backShape = createRoundedRectShape(W - backBevel * 2, backTotalH - backBevel * 2, 0.03);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_D - backBevel * 2,
    bevelEnabled: true,
    bevelThickness: backBevel,
    bevelSize: backBevel,
    bevelSegments: 4,
    curveSegments: 12,
  });
  backGeo.center();

  const backY = FOOT_H + backTotalH / 2;
  const backZ = -D / 2 + BACK_D / 2;
  addMesh(backGeo, fabricMat, "backrest_main", 0, backY, backZ);

  // Horizontal seam/piping across backrest at armrest height
  const backSeamGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, W - 0.03, 8);
  addMesh(
    backSeamGeo,
    pipingMat,
    "backrest_horizontal_seam",
    0,
    ARM_H - 0.005,
    -D / 2 + BACK_D - 0.003,
    0,
    0,
    Math.PI / 2
  );

  // 5. Seat Cushion
  const cushBevel = 0.016;
  const cushW = SEAT_W - 0.006;
  const cushD = SEAT_D - 0.006;
  const cushShape = createRoundedRectShape(cushW - cushBevel * 2, cushD - cushBevel * 2, 0.025);
  const cushGeo = new THREE.ExtrudeGeometry(cushShape, {
    depth: CUSHION_H - cushBevel * 2,
    bevelEnabled: true,
    bevelThickness: cushBevel,
    bevelSize: cushBevel,
    bevelSegments: 4,
    curveSegments: 12,
  });
  cushGeo.center();

  const cushY = FOOT_H + BASE_H + CUSHION_H / 2 - 0.004;
  const cushZ = (D - SEAT_D) / 2;
  addMesh(cushGeo, fabricMat, "seat_cushion", 0, cushY, cushZ, Math.PI / 2, 0, 0);

  // Seat cushion piping (front top & bottom)
  const cushPipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, cushW - 0.03, 8);
  const cushFrontZ = cushZ + cushD / 2 - 0.005;
  addMesh(
    cushPipeGeo,
    pipingMat,
    "cushion_piping_top",
    0,
    cushY + CUSHION_H / 2 - 0.012,
    cushFrontZ,
    0,
    0,
    Math.PI / 2
  );
  addMesh(
    cushPipeGeo,
    pipingMat,
    "cushion_piping_bottom",
    0,
    cushY - CUSHION_H / 2 + 0.012,
    cushFrontZ,
    0,
    0,
    Math.PI / 2
  );

  return group;
}
