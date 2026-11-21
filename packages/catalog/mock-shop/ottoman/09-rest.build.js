function build(THREE) {
  const group = new THREE.Group();

  const W = 0.88;
  const D = 0.66;
  const H = 0.38;
  const FOOT_H = 0.032;
  const FOOT_W = 0.08;
  const FOOT_D = 0.08;
  const FOOT_INSET_X = 0.025;
  const FOOT_INSET_Z = 0.025;
  const BODY_H = H - FOOT_H;
  const CORNER_R = 0.04;
  const BEVEL = 0.02;
  const PIPING_R = 0.0055;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8c7d6d,
    roughness: 0.92,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x7a6c5d,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88f60,
    roughness: 0.62,
    metalness: 0.0,
  });

  const underMat = new THREE.MeshStandardMaterial({
    color: 0x2c2824,
    roughness: 0.95,
    metalness: 0.0,
  });

  function makeRoundedRectShape(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // Main upholstered body
  const bodyShape = makeRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BODY_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
  bodyMesh.name = 'ottoman_body';
  bodyMesh.position.y = FOOT_H + BEVEL;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Subtle domed top cushion surface
  const topPadShape = makeRoundedRectShape(W - 0.06, D - 0.06, CORNER_R);
  const topPadGeo = new THREE.ExtrudeGeometry(topPadShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.022,
    bevelSegments: 4,
    curveSegments: 8,
  });
  topPadGeo.rotateX(-Math.PI / 2);
  const topPadMesh = new THREE.Mesh(topPadGeo, fabricMat);
  topPadMesh.name = 'top_cushion_pad';
  topPadMesh.position.y = H - 0.016;
  topPadMesh.castShadow = true;
  topPadMesh.receiveShadow = true;
  group.add(topPadMesh);

  // Underbody dust-cover panel
  const underGeo = new THREE.BoxGeometry(W - 0.06, 0.01, D - 0.06);
  const underMesh = new THREE.Mesh(underGeo, underMat);
  underMesh.name = 'underbody_panel';
  underMesh.position.y = FOOT_H + 0.002;
  underMesh.castShadow = true;
  underMesh.receiveShadow = true;
  group.add(underMesh);

  // Four short light-wood block feet
  const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H + 0.008, FOOT_D);
  const footX = W / 2 - FOOT_INSET_X - FOOT_W / 2;
  const footZ = D / 2 - FOOT_INSET_Z - FOOT_D / 2;
  const footPositions = [
    { name: 'foot_front_left', x: -footX, z: footZ },
    { name: 'foot_front_right', x: footX, z: footZ },
    { name: 'foot_back_left', x: -footX, z: -footZ },
    { name: 'foot_back_right', x: footX, z: -footZ },
  ];

  for (let i = 0; i < footPositions.length; i++) {
    const fp = footPositions[i];
    const foot = new THREE.Mesh(footGeo, woodMat);
    foot.name = fp.name;
    foot.position.set(fp.x, (FOOT_H + 0.008) / 2, fp.z);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  }

  // Top perimeter piping (4 straight edges + 4 corner arcs)
  const pw = W / 2 - 0.004;
  const pd = D / 2 - 0.004;
  const pr = CORNER_R + 0.008;
  const py = H - 0.016;

  const edgeXLen = 2 * (pw - pr);
  const edgeZLen = 2 * (pd - pr);
  const edgeXGeo = new THREE.CylinderGeometry(PIPING_R, PIPING_R, edgeXLen, 8);
  const edgeZGeo = new THREE.CylinderGeometry(PIPING_R, PIPING_R, edgeZLen, 8);

  const frontPipe = new THREE.Mesh(edgeXGeo, pipingMat);
  frontPipe.name = 'piping_top_front';
  frontPipe.rotation.z = Math.PI / 2;
  frontPipe.position.set(0, py, pd);
  frontPipe.castShadow = true;
  frontPipe.receiveShadow = true;
  group.add(frontPipe);

  const backPipe = new THREE.Mesh(edgeXGeo, pipingMat);
  backPipe.name = 'piping_top_back';
  backPipe.rotation.z = Math.PI / 2;
  backPipe.position.set(0, py, -pd);
  backPipe.castShadow = true;
  backPipe.receiveShadow = true;
  group.add(backPipe);

  const leftPipe = new THREE.Mesh(edgeZGeo, pipingMat);
  leftPipe.name = 'piping_top_left';
  leftPipe.rotation.x = Math.PI / 2;
  leftPipe.position.set(-pw, py, 0);
  leftPipe.castShadow = true;
  leftPipe.receiveShadow = true;
  group.add(leftPipe);

  const rightPipe = new THREE.Mesh(edgeZGeo, pipingMat);
  rightPipe.name = 'piping_top_right';
  rightPipe.rotation.x = Math.PI / 2;
  rightPipe.position.set(pw, py, 0);
  rightPipe.castShadow = true;
  rightPipe.receiveShadow = true;
  group.add(rightPipe);

  const cornerArcGeo = new THREE.TorusGeometry(pr, PIPING_R, 8, 12, Math.PI / 2);
  cornerArcGeo.rotateX(Math.PI / 2);

  const cornerArcs = [
    { name: 'piping_arc_front_right', x: pw - pr, z: pd - pr, rotY: 0 },
    { name: 'piping_arc_front_left', x: -(pw - pr), z: pd - pr, rotY: -Math.PI / 2 },
    { name: 'piping_arc_back_left', x: -(pw - pr), z: -(pd - pr), rotY: Math.PI },
    { name: 'piping_arc_back_right', x: pw - pr, z: -(pd - pr), rotY: Math.PI / 2 },
  ];

  for (let i = 0; i < cornerArcs.length; i++) {
    const ca = cornerArcs[i];
    const arc = new THREE.Mesh(cornerArcGeo, pipingMat);
    arc.name = ca.name;
    arc.position.set(ca.x, py, ca.z);
    arc.rotation.y = ca.rotY;
    arc.castShadow = true;
    arc.receiveShadow = true;
    group.add(arc);
  }

  // Four vertical corner piping strips
  const vertLen = BODY_H - 0.024;
  const vertGeo = new THREE.CylinderGeometry(PIPING_R, PIPING_R, vertLen, 8);
  const cx = pw - pr * 0.27;
  const cz = pd - pr * 0.27;
  const cy = FOOT_H + 0.012 + vertLen / 2;

  const cornerPipes = [
    { name: 'piping_corner_front_left', x: -cx, z: cz },
    { name: 'piping_corner_front_right', x: cx, z: cz },
    { name: 'piping_corner_back_left', x: -cx, z: -cz },
    { name: 'piping_corner_back_right', x: cx, z: -cz },
  ];

  for (let i = 0; i < cornerPipes.length; i++) {
    const cp = cornerPipes[i];
    const pipe = new THREE.Mesh(vertGeo, pipingMat);
    pipe.name = cp.name;
    pipe.position.set(cp.x, cy, cp.z);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    group.add(pipe);
  }

  return group;
}
