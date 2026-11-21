function build(THREE) {
  const TOTAL_W = 0.42;
  const HALF_W = 0.192;
  const HALF_D = 0.22;
  const KB_D = 0.132;
  const WRIST_D = 0.088;
  const BACK_H = 0.032;
  const FRONT_H = 0.014;
  const SPLAY_ANGLE = 0.085;
  const HALF_OFFSET_X = 0.112;

  const KEY_W = 0.0155;
  const KEY_H = 0.008;
  const KEY_D = 0.0155;
  const KEY_GAP = 0.0025;
  const TILT_X = 0.075;

  const group = new THREE.Group();

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d3,
    roughness: 0.45,
    metalness: 0.05
  });
  const wristMat = new THREE.MeshStandardMaterial({
    color: 0x454e54,
    roughness: 0.65,
    metalness: 0.05
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x24282b,
    roughness: 0.75,
    metalness: 0.1
  });
  const keyLightMat = new THREE.MeshStandardMaterial({
    color: 0xebe7da,
    roughness: 0.38,
    metalness: 0.04
  });
  const keyBlueMat = new THREE.MeshStandardMaterial({
    color: 0x5c748c,
    roughness: 0.4,
    metalness: 0.05
  });

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  const caseShape = createRoundedRectShape(HALF_W, KB_D, 0.014);
  const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
    depth: BACK_H - 0.006,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3
  });
  caseGeo.rotateX(Math.PI / 2);

  const wristShape = createRoundedRectShape(HALF_W, WRIST_D, 0.018);
  const wristGeo = new THREE.ExtrudeGeometry(wristShape, {
    depth: FRONT_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3
  });
  wristGeo.rotateX(Math.PI / 2);

  const plateGeo = new THREE.BoxGeometry(HALF_W - 0.018, 0.004, KB_D - 0.018);
  const keyGeo = new THREE.BoxGeometry(KEY_W, KEY_H, KEY_D);
  const wideKeyGeo = new THREE.BoxGeometry(KEY_W * 1.55, KEY_H, KEY_D);
  const spaceKeyGeo = new THREE.BoxGeometry(KEY_W * 3.8, KEY_H, KEY_D);

  function buildHalf(isLeft) {
    const half = new THREE.Group();
    const sideName = isLeft ? 'left' : 'right';

    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, BACK_H - 0.003, -WRIST_D / 2);
    kbGroup.rotation.x = TILT_X;

    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.name = sideName + '_case';
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    kbGroup.add(caseMesh);

    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.name = sideName + '_plate';
    plateMesh.position.set(0, 0.001, 0);
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    kbGroup.add(plateMesh);

    const rows = [
      { z: -0.047, cols: 9, blueCols: isLeft ? [0, 4, 5] : [3, 4, 8] },
      { z: -0.028, cols: 9, blueCols: isLeft ? [8] : [0] },
      { z: -0.009, cols: 9, blueCols: isLeft ? [0] : [8] },
      { z: 0.010, cols: 9, blueCols: isLeft ? [0, 8] : [0, 8] },
      { z: 0.029, cols: 9, blueCols: isLeft ? [0, 8] : [0, 8] }
    ];

    const stepX = KEY_W + KEY_GAP;
    let keyIdx = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const startX = -((row.cols - 1) * stepX) / 2;
      for (let c = 0; c < row.cols; c++) {
        const isBlue = row.blueCols.indexOf(c) !== -1;
        const keyMesh = new THREE.Mesh(keyGeo, isBlue ? keyBlueMat : keyLightMat);
        keyMesh.name = sideName + '_key_' + keyIdx++;
        keyMesh.position.set(startX + c * stepX, 0.005, row.z);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        kbGroup.add(keyMesh);
      }
    }

    // Bottom row: modifiers + split spacebar
    const bottomZ = 0.048;
    const modOffsets = isLeft
      ? [-0.072, -0.052, -0.033, 0.042, 0.060, 0.076]
      : [-0.076, -0.060, -0.042, 0.033, 0.052, 0.072];

    for (let m = 0; m < modOffsets.length; m++) {
      const modMesh = new THREE.Mesh(keyGeo, keyBlueMat);
      modMesh.name = sideName + '_mod_key_' + m;
      modMesh.position.set(modOffsets[m], 0.005, bottomZ);
      modMesh.castShadow = true;
      modMesh.receiveShadow = true;
      kbGroup.add(modMesh);
    }

    const spaceMesh = new THREE.Mesh(spaceKeyGeo, keyLightMat);
    spaceMesh.name = sideName + '_spacebar';
    spaceMesh.position.set(isLeft ? 0.005 : -0.005, 0.005, bottomZ);
    spaceMesh.castShadow = true;
    spaceMesh.receiveShadow = true;
    kbGroup.add(spaceMesh);

    half.add(kbGroup);

    const wristMesh = new THREE.Mesh(wristGeo, wristMat);
    wristMesh.name = sideName + '_wrist_rest';
    wristMesh.position.set(0, FRONT_H + 0.003, KB_D / 2 - 0.004);
    wristMesh.rotation.x = TILT_X * 1.1;
    wristMesh.castShadow = true;
    wristMesh.receiveShadow = true;
    half.add(wristMesh);

    half.position.set(isLeft ? -HALF_OFFSET_X : HALF_OFFSET_X, 0, 0);
    half.rotation.y = isLeft ? SPLAY_ANGLE : -SPLAY_ANGLE;

    return half;
  }

  group.add(buildHalf(true));
  group.add(buildHalf(false));

  return group;
}
