function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const MIRROR_W = 0.60;
  const MIRROR_H = 1.65;
  const FRAME_W = 0.022;
  const FRAME_D = 0.032;
  const CORNER_R = 0.055;
  const TILT_ANGLE = (10 * Math.PI) / 180;

  const TUBE_T = 0.018;
  const STAND_SPREAD_Z = 0.36;
  const HINGE_RATIO = 0.66;
  const STRUT_RATIO = 0.32;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe6e3dc,
    roughness: 0.42,
    metalness: 0.15,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0xd8d5ce,
    roughness: 0.7,
    metalness: 0.05,
  });

  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0xc8c4bc,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Helper to create a rectangle with rounded top corners
  function createRoundedTopShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, h - r);
    shape.absarc(hw - r, h - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, h);
    shape.absarc(-hw + r, h - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, 0);
    return shape;
  }

  // Helper to create a tube/bar between two 3D points
  function createBarBetween(p1, p2, thickness, material, name) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.BoxGeometry(thickness, len, thickness);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const assembly = new THREE.Group();

  // 1. Tilted Mirror Assembly
  const mirrorGroup = new THREE.Group();
  mirrorGroup.rotation.x = -TILT_ANGLE;

  // Frame (extruded with inner hole)
  const outerShape = createRoundedTopShape(MIRROR_W, MIRROR_H, CORNER_R);
  const innerW = MIRROR_W - 2 * FRAME_W;
  const innerH = MIRROR_H - 2 * FRAME_W;
  const innerR = Math.max(0.01, CORNER_R - FRAME_W * 0.6);

  const holePath = new THREE.Path();
  const ihw = innerW / 2;
  const bottomY = FRAME_W;
  const topY = FRAME_W + innerH;
  holePath.moveTo(-ihw, bottomY);
  holePath.lineTo(ihw, bottomY);
  holePath.lineTo(ihw, topY - innerR);
  holePath.absarc(ihw - innerR, topY - innerR, innerR, 0, Math.PI / 2, false);
  holePath.lineTo(-ihw + innerR, topY);
  holePath.absarc(-ihw + innerR, topY - innerR, innerR, Math.PI / 2, Math.PI, false);
  holePath.lineTo(-ihw, bottomY);
  outerShape.holes.push(holePath);

  const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_D,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 24,
  });
  frameGeo.translate(0, 0, -FRAME_D / 2);
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.name = 'mirror_frame';
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  mirrorGroup.add(frameMesh);

  // Mirror glass
  const glassShape = createRoundedTopShape(innerW + 0.004, innerH + 0.004, innerR);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 24,
  });
  glassGeo.translate(0, FRAME_W - 0.002, FRAME_D / 2 - 0.008);
  const glassMesh = new THREE.Mesh(glassGeo, mirrorMat);
  glassMesh.name = 'mirror_glass';
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  mirrorGroup.add(glassMesh);

  // Back panel
  const backGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.012,
    bevelEnabled: false,
    curveSegments: 24,
  });
  backGeo.translate(0, FRAME_W - 0.002, -FRAME_D / 2 + 0.002);
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.name = 'mirror_back_panel';
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  mirrorGroup.add(backMesh);

  assembly.add(mirrorGroup);

  // 2. Rear Support Stand
  const legX = MIRROR_W / 2 - FRAME_W * 1.4;
  const hingeLocalY = MIRROR_H * HINGE_RATIO;
  const strutLocalY = MIRROR_H * STRUT_RATIO;

  // Compute world-space attachment points on the back of the tilted mirror
  const backZLocal = -FRAME_D / 2;
  const hingeLeft = new THREE.Vector3(-legX, hingeLocalY, backZLocal).applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -TILT_ANGLE
  );
  const hingeRight = new THREE.Vector3(legX, hingeLocalY, backZLocal).applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -TILT_ANGLE
  );

  const strutMirrorLeft = new THREE.Vector3(-legX, strutLocalY, backZLocal).applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -TILT_ANGLE
  );
  const strutMirrorRight = new THREE.Vector3(legX, strutLocalY, backZLocal).applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -TILT_ANGLE
  );

  const footY = TUBE_T / 2;
  const rearFootZ = -STAND_SPREAD_Z;
  const frontFootZ = backZLocal;

  const rearFootLeft = new THREE.Vector3(-legX, footY, rearFootZ);
  const rearFootRight = new THREE.Vector3(legX, footY, rearFootZ);
  const frontFootLeft = new THREE.Vector3(-legX, footY, frontFootZ);
  const frontFootRight = new THREE.Vector3(legX, footY, frontFootZ);

  // Rear angled legs
  assembly.add(
    createBarBetween(hingeLeft, rearFootLeft, TUBE_T, frameMat, 'left_rear_leg')
  );
  assembly.add(
    createBarBetween(hingeRight, rearFootRight, TUBE_T, frameMat, 'right_rear_leg')
  );

  // Floor rails connecting rear legs to bottom of mirror
  assembly.add(
    createBarBetween(rearFootLeft, frontFootLeft, TUBE_T, frameMat, 'left_floor_rail')
  );
  assembly.add(
    createBarBetween(rearFootRight, frontFootRight, TUBE_T, frameMat, 'right_floor_rail')
  );

  // Mid-level horizontal struts
  const strutLegLeft = new THREE.Vector3().lerpVectors(rearFootLeft, hingeLeft, 0.45);
  const strutLegRight = new THREE.Vector3().lerpVectors(rearFootRight, hingeRight, 0.45);

  assembly.add(
    createBarBetween(strutLegLeft, strutMirrorLeft, TUBE_T * 0.8, frameMat, 'left_mid_strut')
  );
  assembly.add(
    createBarBetween(strutLegRight, strutMirrorRight, TUBE_T * 0.8, frameMat, 'right_mid_strut')
  );

  // Hinge brackets
  const hingeGeo = new THREE.BoxGeometry(TUBE_T * 1.3, 0.032, 0.024);
  const leftHinge = new THREE.Mesh(hingeGeo, hingeMat);
  leftHinge.name = 'left_hinge_bracket';
  leftHinge.position.copy(hingeLeft);
  leftHinge.castShadow = true;
  leftHinge.receiveShadow = true;
  assembly.add(leftHinge);

  const rightHinge = new THREE.Mesh(hingeGeo, hingeMat);
  rightHinge.name = 'right_hinge_bracket';
  rightHinge.position.copy(hingeRight);
  rightHinge.castShadow = true;
  rightHinge.receiveShadow = true;
  assembly.add(rightHinge);

  // Center assembly at origin: bottom at y = 0, centered on x = 0 and z = 0
  const box = new THREE.Box3().setFromObject(assembly);
  const center = new THREE.Vector3();
  box.getCenter(center);
  assembly.position.set(-center.x, -box.min.y, -center.z);

  group.add(assembly);
  return group;
}
