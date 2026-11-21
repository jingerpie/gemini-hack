function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const H = 0.36;
  const D = 0.12;
  const FRAME_T = 0.016;
  const BORDER_W = 0.042;
  const LOBE_AMP = 0.065;
  const SEGMENTS = 144;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xf2ebd9,
    roughness: 0.65,
    metalness: 0.02
  });
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x5c4632,
    roughness: 0.85,
    metalness: 0.0
  });
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xd6ad78,
    roughness: 0.6,
    metalness: 0.05
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x8d9c75,
    roughness: 0.7,
    metalness: 0.0
  });
  const pearMat = new THREE.MeshStandardMaterial({
    color: 0x9ca676,
    roughness: 0.65,
    metalness: 0.0
  });
  const catMat = new THREE.MeshStandardMaterial({
    color: 0xc88b7d,
    roughness: 0.7,
    metalness: 0.0
  });
  const mothMat = new THREE.MeshStandardMaterial({
    color: 0xb58b6f,
    roughness: 0.7,
    metalness: 0.0
  });

  // Helper to create a 12-lobed scalloped shape
  function createScallopedShape(rx, ry, amp) {
    const shape = new THREE.Shape();
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = (i / SEGMENTS) * Math.PI * 2;
      const lobe = 1 + amp * Math.abs(Math.cos(6 * t));
      const x = rx * lobe * Math.cos(t);
      const y = ry * lobe * Math.sin(t);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    return shape;
  }

  function createScallopedPath(rx, ry, amp) {
    const path = new THREE.Path();
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = (i / SEGMENTS) * Math.PI * 2;
      const lobe = 1 + amp * Math.abs(Math.cos(6 * t));
      const x = rx * lobe * Math.cos(t);
      const y = ry * lobe * Math.sin(t);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    return path;
  }

  const outerRx = (W * 0.5) / (1 + LOBE_AMP);
  const outerRy = (H * 0.5) / (1 + LOBE_AMP);
  const innerRx = outerRx - BORDER_W;
  const innerRy = outerRy - BORDER_W;

  // Frame body
  const frameShape = createScallopedShape(outerRx, outerRy, LOBE_AMP);
  const innerHole = createScallopedPath(innerRx, innerRy, LOBE_AMP * 0.85);
  frameShape.holes.push(innerHole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_T,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.name = 'cloud_frame';
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;

  // Mirror glass
  const mirrorShape = createScallopedShape(innerRx + 0.002, innerRy + 0.002, LOBE_AMP * 0.85);
  const mirrorGeo = new THREE.ExtrudeGeometry(mirrorShape, {
    depth: 0.003,
    bevelEnabled: false
  });
  const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirrorMesh.name = 'mirror_glass';
  mirrorMesh.position.z = FRAME_T * 0.35;
  mirrorMesh.castShadow = true;
  mirrorMesh.receiveShadow = true;

  // Backing board
  const backShape = createScallopedShape(outerRx * 0.94, outerRy * 0.94, LOBE_AMP * 0.7);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.004,
    bevelEnabled: false
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.name = 'backing_board';
  backMesh.position.z = -0.004;
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;

  // Tilt assembly for tabletop stand
  const panelGroup = new THREE.Group();
  panelGroup.add(frameMesh, mirrorMesh, backMesh);

  // Decorative motifs on front face (z = FRAME_T + 0.002)
  const frontZ = FRAME_T + 0.0022;

  // Crescent moons (top, bottom, left, right)
  const crescentShape = new THREE.Shape();
  crescentShape.absarc(0, 0, 0.011, -Math.PI * 0.65, Math.PI * 0.65, false);
  crescentShape.absarc(0.004, 0, 0.0085, Math.PI * 0.6, -Math.PI * 0.6, true);
  const crescentGeo = new THREE.ExtrudeGeometry(crescentShape, {
    depth: 0.001,
    bevelEnabled: false
  });

  const moonPositions = [
    { name: 'crescent_moon_top', x: 0, y: H * 0.435, rot: 0 },
    { name: 'crescent_moon_bottom', x: 0, y: -H * 0.435, rot: Math.PI },
    { name: 'crescent_moon_left', x: -W * 0.425, y: 0, rot: Math.PI * 0.5 },
    { name: 'crescent_moon_right', x: W * 0.425, y: 0, rot: -Math.PI * 0.5 }
  ];
  moonPositions.forEach((m) => {
    const mesh = new THREE.Mesh(crescentGeo, moonMat);
    mesh.name = m.name;
    mesh.position.set(m.x, m.y, frontZ);
    mesh.rotation.z = m.rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    panelGroup.add(mesh);
  });

  // Leaves flanking the moons
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.006, 0.01, 0, 0.022);
  leafShape.quadraticCurveTo(-0.006, 0.01, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.0008,
    bevelEnabled: false
  });

  const leafPlacements = [
    { name: 'leaf_top_left', x: -0.028, y: H * 0.415, rot: 0.9 },
    { name: 'leaf_top_right', x: 0.028, y: H * 0.415, rot: -0.9 },
    { name: 'leaf_bottom_left', x: -0.028, y: -H * 0.415, rot: 2.2 },
    { name: 'leaf_bottom_right', x: 0.028, y: -H * 0.415, rot: -2.2 },
    { name: 'leaf_left_upper', x: -W * 0.40, y: 0.045, rot: 0.4 },
    { name: 'leaf_left_lower', x: -W * 0.40, y: -0.045, rot: 2.7 },
    { name: 'leaf_right_upper', x: W * 0.40, y: 0.045, rot: -0.4 },
    { name: 'leaf_right_lower', x: W * 0.40, y: -0.045, rot: -2.7 }
  ];
  leafPlacements.forEach((l) => {
    const mesh = new THREE.Mesh(leafGeo, leafMat);
    mesh.name = l.name;
    mesh.position.set(l.x, l.y, frontZ);
    mesh.rotation.z = l.rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    panelGroup.add(mesh);
  });

  // Pears on left & right sides
  const pearGeo = new THREE.SphereGeometry(0.011, 14, 12);
  pearGeo.scale(0.85, 1.2, 0.15);
  const pearPlacements = [
    { name: 'pear_upper_left', x: -W * 0.39, y: H * 0.17 },
    { name: 'pear_lower_left', x: -W * 0.39, y: -H * 0.17 },
    { name: 'pear_upper_right', x: W * 0.39, y: H * 0.17 },
    { name: 'pear_lower_right', x: W * 0.39, y: -H * 0.17 }
  ];
  pearPlacements.forEach((p) => {
    const mesh = new THREE.Mesh(pearGeo, pearMat);
    mesh.name = p.name;
    mesh.position.set(p.x, p.y, frontZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    panelGroup.add(mesh);
  });

  // Corner cats
  const catGeo = new THREE.CapsuleGeometry(0.008, 0.012, 4, 10);
  catGeo.scale(1.0, 1.0, 0.18);
  const catPlacements = [
    { name: 'cat_top_left', x: -W * 0.31, y: H * 0.33, rot: -0.4 },
    { name: 'cat_top_right', x: W * 0.31, y: H * 0.33, rot: 0.4 },
    { name: 'cat_bottom_left', x: -W * 0.32, y: -H * 0.32, rot: 0.2 },
    { name: 'cat_bottom_right', x: W * 0.32, y: -H * 0.32, rot: -0.2 }
  ];
  catPlacements.forEach((c) => {
    const mesh = new THREE.Mesh(catGeo, catMat);
    mesh.name = c.name;
    mesh.position.set(c.x, c.y, frontZ);
    mesh.rotation.z = c.rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    panelGroup.add(mesh);
  });

  // Moths near corners
  const mothGeo = new THREE.SphereGeometry(0.009, 12, 10);
  mothGeo.scale(1.3, 0.75, 0.12);
  const mothPlacements = [
    { name: 'moth_top_left', x: -W * 0.20, y: H * 0.37, rot: 0.3 },
    { name: 'moth_top_right', x: W * 0.20, y: H * 0.37, rot: -0.3 },
    { name: 'moth_bottom_left', x: -W * 0.23, y: -H * 0.35, rot: -0.2 },
    { name: 'moth_bottom_right', x: W * 0.23, y: -H * 0.35, rot: 0.2 }
  ];
  mothPlacements.forEach((m) => {
    const mesh = new THREE.Mesh(mothGeo, mothMat);
    mesh.name = m.name;
    mesh.position.set(m.x, m.y, frontZ);
    mesh.rotation.z = m.rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    panelGroup.add(mesh);
  });

  // Slight backward tilt for tabletop display
  const TILT = -0.14;
  panelGroup.rotation.x = TILT;
  group.add(panelGroup);

  // Easel kickstand at the back
  const STAND_W = 0.08;
  const STAND_H = 0.20;
  const STAND_T = 0.008;
  const standGeo = new THREE.BoxGeometry(STAND_W, STAND_H, STAND_T);
  const standMesh = new THREE.Mesh(standGeo, backMat);
  standMesh.name = 'easel_stand';
  standMesh.rotation.x = 0.36;
  standMesh.position.set(0, -H * 0.22, -D * 0.42);
  standMesh.castShadow = true;
  standMesh.receiveShadow = true;
  group.add(standMesh);

  // Easel hinge connecting stand to backing board
  const hingeGeo = new THREE.BoxGeometry(STAND_W * 0.85, 0.018, 0.012);
  const hingeMesh = new THREE.Mesh(hingeGeo, backMat);
  hingeMesh.name = 'easel_hinge';
  hingeMesh.position.set(0, -H * 0.02, -0.012);
  hingeMesh.castShadow = true;
  hingeMesh.receiveShadow = true;
  group.add(hingeMesh);

  // Normalize origin to bottom-center (y = 0 at lowest point, centered on x and z)
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;

  return group;
}
