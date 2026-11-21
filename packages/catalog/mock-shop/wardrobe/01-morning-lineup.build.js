function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.90;
  const H = 1.48;
  const D = 0.52;
  const FOOT_H = 0.015;
  const BODY_H = H - FOOT_H;
  const R = 0.09;
  const SHELL_T = 0.024;
  const DOOR_T = 0.018;
  const DOOR_GAP = 0.004;
  const BACK_T = 0.016;
  const PLY_EDGE_D = 0.004;

  // Materials
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0xc2d5e0,
    roughness: 0.65,
    metalness: 0.02
  });

  const plywoodMat = new THREE.MeshStandardMaterial({
    color: 0xd6bc96,
    roughness: 0.55,
    metalness: 0.0
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0xb89e78,
    roughness: 0.6,
    metalness: 0.0
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

  // 1. Outer shell (blue body + exposed plywood front rim)
  const shellShape = createRoundedRectShape(W, BODY_H, R);
  const innerR = Math.max(0.01, R - SHELL_T);
  const innerHole = createRoundedRectShape(W - 2 * SHELL_T, BODY_H - 2 * SHELL_T, innerR);
  shellShape.holes.push(innerHole);

  const shellBlueGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: D - PLY_EDGE_D,
    bevelEnabled: false,
    curveSegments: 24
  });
  const bodyCenterY = FOOT_H + BODY_H / 2;
  addMesh(shellBlueGeo, blueMat, 'outer_shell_blue', 0, bodyCenterY, -D / 2);

  const shellRimGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: PLY_EDGE_D,
    bevelEnabled: false,
    curveSegments: 24
  });
  addMesh(shellRimGeo, plywoodMat, 'outer_shell_plywood_rim', 0, bodyCenterY, D / 2 - PLY_EDGE_D);

  // 2. Back panel
  const backShape = createRoundedRectShape(W - 2 * SHELL_T + 0.004, BODY_H - 2 * SHELL_T + 0.004, innerR);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_T,
    bevelEnabled: false,
    curveSegments: 20
  });
  addMesh(backGeo, blueMat, 'back_panel', 0, bodyCenterY, -D / 2 + 0.006);

  // 3. Doors (closed default pose)
  const innerW = W - 2 * SHELL_T;
  const innerH = BODY_H - 2 * SHELL_T;
  const doorW = (innerW - 3 * DOOR_GAP) / 2;
  const doorH = innerH - 2 * DOOR_GAP;
  const doorR = Math.max(0.01, innerR - DOOR_GAP);
  const pullRadius = 0.022;
  const pullY = 0.02; // slightly above center

  function createDoorShape(isLeft) {
    const s = new THREE.Shape();
    const hw = doorW / 2;
    const hh = doorH / 2;
    if (isLeft) {
      // Rounded on left (-hw), square on right (+hw)
      s.moveTo(-hw + doorR, -hh);
      s.lineTo(hw, -hh);
      s.lineTo(hw, hh);
      s.lineTo(-hw + doorR, hh);
      s.quadraticCurveTo(-hw, hh, -hw, hh - doorR);
      s.lineTo(-hw, -hh + doorR);
      s.quadraticCurveTo(-hw, -hh, -hw + doorR, -hh);

      const hole = new THREE.Path();
      hole.absarc(hw - 0.045, pullY, pullRadius, 0, Math.PI * 2, true);
      s.holes.push(hole);
    } else {
      // Square on left (-hw), rounded on right (+hw)
      s.moveTo(-hw, -hh);
      s.lineTo(hw - doorR, -hh);
      s.quadraticCurveTo(hw, -hh, hw, -hh + doorR);
      s.lineTo(hw, hh - doorR);
      s.quadraticCurveTo(hw, hh, hw - doorR, hh);
      s.lineTo(-hw, hh);
      s.lineTo(-hw, -hh);

      const hole = new THREE.Path();
      hole.absarc(-hw + 0.045, pullY, pullRadius, 0, Math.PI * 2, true);
      s.holes.push(hole);
    }
    return s;
  }

  const doorZ = D / 2 - DOOR_T - 0.004;
  const leftDoorX = -(doorW / 2 + DOOR_GAP / 2);
  const rightDoorX = doorW / 2 + DOOR_GAP / 2;

  const leftDoorShape = createDoorShape(true);
  const leftDoorPlyGeo = new THREE.ExtrudeGeometry(leftDoorShape, {
    depth: DOOR_T - 0.002,
    bevelEnabled: false,
    curveSegments: 20
  });
  addMesh(leftDoorPlyGeo, plywoodMat, 'left_door_plywood', leftDoorX, bodyCenterY, doorZ);

  const leftDoorBlueGeo = new THREE.ExtrudeGeometry(leftDoorShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 20
  });
  addMesh(leftDoorBlueGeo, blueMat, 'left_door_face', leftDoorX, bodyCenterY, doorZ + DOOR_T - 0.002);

  const rightDoorShape = createDoorShape(false);
  const rightDoorPlyGeo = new THREE.ExtrudeGeometry(rightDoorShape, {
    depth: DOOR_T - 0.002,
    bevelEnabled: false,
    curveSegments: 20
  });
  addMesh(rightDoorPlyGeo, plywoodMat, 'right_door_plywood', rightDoorX, bodyCenterY, doorZ);

  const rightDoorBlueGeo = new THREE.ExtrudeGeometry(rightDoorShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 20
  });
  addMesh(rightDoorBlueGeo, blueMat, 'right_door_face', rightDoorX, bodyCenterY, doorZ + DOOR_T - 0.002);

  // 4. Interior shelf & hanging rod
  const shelfGeo = new THREE.BoxGeometry(innerW - 0.002, 0.02, D - SHELL_T - BACK_T - 0.02);
  addMesh(shelfGeo, plywoodMat, 'interior_shelf', 0, FOOT_H + BODY_H * 0.28, -0.01);

  const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, innerW - 0.004, 16);
  addMesh(rodGeo, plywoodMat, 'hanging_rod', 0, FOOT_H + BODY_H * 0.84, 0, 0, 0, Math.PI / 2);

  // 5. Low-profile feet
  const footGeo = new THREE.CylinderGeometry(0.022, 0.02, FOOT_H, 16);
  const footX = W / 2 - R - 0.02;
  const footZ = D / 2 - 0.06;
  addMesh(footGeo, footMat, 'foot_front_left', -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_front_right', footX, FOOT_H / 2, footZ);
  addMesh(footGeo, footMat, 'foot_back_left', -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, footMat, 'foot_back_right', footX, FOOT_H / 2, -footZ);

  return group;
}
