function build(THREE) {
  const group = new THREE.Group();

  const W = 0.91;
  const H = 1.83;
  const D = 0.075;

  const BRACKET_H = 0.006;
  const CASSETTE_H = 0.072;
  const CASSETTE_TOP = H - BRACKET_H;
  const CASSETTE_BOT = CASSETTE_TOP - CASSETTE_H;
  const END_CAP_T = 0.006;
  const CASSETTE_BODY_W = W - END_CAP_T * 2;

  const BOTTOM_H = 0.022;
  const BOTTOM_D = 0.024;
  const SHADE_W = W - 0.016;
  const SHADE_TOP = CASSETTE_BOT + 0.005;
  const SHADE_BOT = BOTTOM_H - 0.004;
  const SHADE_H = SHADE_TOP - SHADE_BOT;

  const VANE_COUNT = 23;
  const VANE_D = 0.042;
  const VANE_T = 0.002;

  const CORD_X = W / 2 - 0.012;
  const CORD_Z = D / 2 - 0.016;

  // Materials
  const cassetteMat = new THREE.MeshStandardMaterial({
    color: 0xb8b2a8,
    roughness: 0.42,
    metalness: 0.15
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x8e887f,
    roughness: 0.4,
    metalness: 0.6
  });

  const sheerMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6e1d8,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const vaneMat = new THREE.MeshStandardMaterial({
    color: 0x9c9286,
    roughness: 0.78,
    metalness: 0.02
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xd0cbc2,
    roughness: 0.35,
    metalness: 0.2
  });

  // Helper to configure shadows
  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Cassette / Headrail (flat back at -D/2, rounded front at +D/2)
  const cassetteShape = new THREE.Shape();
  const r = CASSETTE_H / 2;
  cassetteShape.moveTo(-D / 2, -r);
  cassetteShape.lineTo(D / 2 - r, -r);
  cassetteShape.absarc(D / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  cassetteShape.lineTo(-D / 2, r);
  cassetteShape.closePath();

  const cassetteGeo = new THREE.ExtrudeGeometry(cassetteShape, {
    depth: CASSETTE_BODY_W,
    bevelEnabled: false,
    curveSegments: 24
  });
  cassetteGeo.rotateY(Math.PI / 2);
  cassetteGeo.translate(-CASSETTE_BODY_W / 2, CASSETTE_BOT + r, 0);
  addMesh(new THREE.Mesh(cassetteGeo, cassetteMat), 'cassette_headrail');

  // 2. Cassette End Caps
  const capGeo = new THREE.ExtrudeGeometry(cassetteShape, {
    depth: END_CAP_T,
    bevelEnabled: false,
    curveSegments: 24
  });
  capGeo.rotateY(Math.PI / 2);

  const leftCap = new THREE.Mesh(capGeo, cassetteMat);
  leftCap.position.set(-W / 2, CASSETTE_BOT + r, 0);
  addMesh(leftCap, 'cassette_end_cap_left');

  const rightCap = new THREE.Mesh(capGeo, cassetteMat);
  rightCap.position.set(W / 2 - END_CAP_T, CASSETTE_BOT + r, 0);
  addMesh(rightCap, 'cassette_end_cap_right');

  // 3. Top Mounting Brackets
  const bracketGeo = new THREE.BoxGeometry(0.026, BRACKET_H, 0.036);
  const bracketXOffset = W / 2 - 0.08;

  const leftBracket = new THREE.Mesh(bracketGeo, bracketMat);
  leftBracket.position.set(-bracketXOffset, H - BRACKET_H / 2, -D / 2 + 0.022);
  addMesh(leftBracket, 'mounting_bracket_left');

  const rightBracket = new THREE.Mesh(bracketGeo, bracketMat);
  rightBracket.position.set(bracketXOffset, H - BRACKET_H / 2, -D / 2 + 0.022);
  addMesh(rightBracket, 'mounting_bracket_right');

  // 4. Front & Back Sheer Fabric Layers
  const sheerGeo = new THREE.BoxGeometry(SHADE_W, SHADE_H, 0.0015);

  const frontSheer = new THREE.Mesh(sheerGeo, sheerMat);
  frontSheer.position.set(0, SHADE_BOT + SHADE_H / 2, VANE_D / 2);
  addMesh(frontSheer, 'sheer_layer_front');

  const backSheer = new THREE.Mesh(sheerGeo, sheerMat);
  backSheer.position.set(0, SHADE_BOT + SHADE_H / 2, -VANE_D / 2);
  addMesh(backSheer, 'sheer_layer_back');

  // 5. Horizontal Fabric Vanes
  const vaneGeo = new THREE.BoxGeometry(SHADE_W, VANE_T, VANE_D);
  const vaneStep = (SHADE_H - 0.04) / (VANE_COUNT - 1);
  const firstVaneY = SHADE_BOT + 0.02;

  for (let i = 0; i < VANE_COUNT; i++) {
    const vane = new THREE.Mesh(vaneGeo, vaneMat);
    vane.position.set(0, firstVaneY + i * vaneStep, 0);
    vane.rotation.x = 0.22;
    addMesh(vane, `shade_vane_${i + 1}`);
  }

  // 6. Bottom Weighted Bar
  const bottomBarGeo = new THREE.BoxGeometry(SHADE_W - 0.006, BOTTOM_H, BOTTOM_D);
  const bottomBar = new THREE.Mesh(bottomBarGeo, cassetteMat);
  bottomBar.position.set(0, BOTTOM_H / 2, 0);
  addMesh(bottomBar, 'bottom_weighted_bar');

  const bottomCapGeo = new THREE.BoxGeometry(0.005, BOTTOM_H, BOTTOM_D + 0.002);
  const bottomCapLeft = new THREE.Mesh(bottomCapGeo, cassetteMat);
  bottomCapLeft.position.set(-SHADE_W / 2 + 0.0025, BOTTOM_H / 2, 0);
  addMesh(bottomCapLeft, 'bottom_bar_cap_left');

  const bottomCapRight = new THREE.Mesh(bottomCapGeo, cassetteMat);
  bottomCapRight.position.set(SHADE_W / 2 - 0.0025, BOTTOM_H / 2, 0);
  addMesh(bottomCapRight, 'bottom_bar_cap_right');

  // 7. Pull Cord & Weight on Right Side
  const cordTop = CASSETTE_BOT + 0.004;
  const cordBot = 0.22;
  const cordH = cordTop - cordBot;
  const cordGeo = new THREE.CylinderGeometry(0.0018, 0.0018, cordH, 8);
  const pullCord = new THREE.Mesh(cordGeo, cordMat);
  pullCord.position.set(CORD_X, cordBot + cordH / 2, CORD_Z);
  addMesh(pullCord, 'pull_cord');

  const weightGeo = new THREE.CapsuleGeometry(0.007, 0.055, 8, 12);
  const cordWeight = new THREE.Mesh(weightGeo, cordMat);
  cordWeight.position.set(CORD_X, cordBot - 0.025, CORD_Z);
  addMesh(cordWeight, 'cord_weight');

  return group;
}
