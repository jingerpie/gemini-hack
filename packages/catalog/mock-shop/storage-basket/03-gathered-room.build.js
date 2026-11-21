function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const R_BOT = 0.165;
  const R_TOP = 0.175;
  const H_BODY = 0.34;
  const WALL_T = 0.006;
  const HEM_H = 0.045;
  const HANDLE_H = 0.068;
  const HANDLE_W = 0.032;
  const HANDLE_T = 0.004;
  const TAB_H = 0.042;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xb7a68e,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const webbingMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29b,
    roughness: 0.85,
    metalness: 0.0
  });

  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0xe6e2d8,
    roughness: 0.8,
    metalness: 0.0
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0xa3927a,
    roughness: 0.9,
    metalness: 0.0
  });

  // 1. Main Basket Body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R_BOT - 0.01, 0),
    new THREE.Vector2(R_BOT, 0.008),
    new THREE.Vector2(R_BOT + 0.002, 0.06),
    new THREE.Vector2(R_BOT + 0.005, 0.15),
    new THREE.Vector2(R_TOP - 0.003, 0.25),
    new THREE.Vector2(R_TOP, H_BODY - 0.01),
    new THREE.Vector2(R_TOP + 0.002, H_BODY - 0.003),
    new THREE.Vector2(R_TOP - 0.002, H_BODY),
    new THREE.Vector2(R_TOP - WALL_T, H_BODY - 0.003),
    new THREE.Vector2(R_TOP - WALL_T - 0.002, H_BODY - HEM_H),
    new THREE.Vector2(R_TOP - WALL_T, H_BODY - HEM_H - 0.004),
    new THREE.Vector2(R_BOT - WALL_T, 0.012),
    new THREE.Vector2(0, 0.01)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, canvasMat);
  bodyMesh.name = 'basket_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Bottom Seam Piping
  const botSeamGeo = new THREE.TorusGeometry(R_BOT - 0.002, 0.0035, 8, 32);
  botSeamGeo.rotateX(Math.PI / 2);
  const botSeamMesh = new THREE.Mesh(botSeamGeo, canvasMat);
  botSeamMesh.position.y = 0.005;
  botSeamMesh.name = 'bottom_seam_piping';
  botSeamMesh.castShadow = true;
  botSeamMesh.receiveShadow = true;
  group.add(botSeamMesh);

  // 3. Outer Top Hem Stitch Line
  const topStitchGeo = new THREE.TorusGeometry(R_TOP - 0.001, 0.0015, 6, 32);
  topStitchGeo.rotateX(Math.PI / 2);
  const topStitchMesh = new THREE.Mesh(topStitchGeo, stitchMat);
  topStitchMesh.position.y = H_BODY - HEM_H;
  topStitchMesh.name = 'top_hem_stitch';
  topStitchMesh.castShadow = true;
  topStitchMesh.receiveShadow = true;
  group.add(topStitchMesh);

  // 4. Inner White Bias Tape Binding Ring
  const innerBindingGeo = new THREE.TorusGeometry(R_TOP - WALL_T - 0.001, 0.004, 8, 32);
  innerBindingGeo.rotateX(Math.PI / 2);
  const innerBindingMesh = new THREE.Mesh(innerBindingGeo, bindingMat);
  innerBindingMesh.position.y = H_BODY - HEM_H - 0.002;
  innerBindingMesh.name = 'inner_bias_binding_ring';
  innerBindingMesh.castShadow = true;
  innerBindingMesh.receiveShadow = true;
  group.add(innerBindingMesh);

  // 5. Inner Vertical Seam Bindings (Left & Right)
  const vSeamH = H_BODY - HEM_H - 0.015;
  const vSeamGeo = new THREE.BoxGeometry(0.004, vSeamH, 0.012);
  [-1, 1].forEach((side, idx) => {
    const vSeam = new THREE.Mesh(vSeamGeo, bindingMat);
    const r = (R_TOP + R_BOT) * 0.5 - WALL_T - 0.001;
    vSeam.position.set(side * r, vSeamH * 0.5 + 0.012, 0);
    vSeam.rotation.z = side * Math.atan2(R_TOP - R_BOT, H_BODY);
    vSeam.name = idx === 0 ? 'inner_vertical_seam_left' : 'inner_vertical_seam_right';
    vSeam.castShadow = true;
    vSeam.receiveShadow = true;
    group.add(vSeam);
  });

  // 6. Webbing Handles (Left & Right)
  const handleSides = [
    { sign: -1, label: 'left' },
    { sign: 1, label: 'right' }
  ];

  handleSides.forEach(({ sign, label }) => {
    const handleGroup = new THREE.Group();
    const attachR = R_TOP + 0.001;
    const zSpan = 0.075;

    // Stitched tabs on the outer wall
    const tabGeo = new THREE.BoxGeometry(HANDLE_T, TAB_H, HANDLE_W);
    [-1, 1].forEach((zDir, tIdx) => {
      const tab = new THREE.Mesh(tabGeo, webbingMat);
      tab.position.set(
        sign * (attachR + HANDLE_T * 0.5),
        H_BODY - HEM_H - TAB_H * 0.35,
        zDir * zSpan
      );
      tab.rotation.z = -sign * 0.03;
      tab.name = `handle_${label}_tab_${tIdx === 0 ? 'back' : 'front'}`;
      tab.castShadow = true;
      tab.receiveShadow = true;
      handleGroup.add(tab);
    });

    // Arched webbing strap loop
    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * (attachR + HANDLE_T * 0.5), H_BODY - HEM_H + 0.005, -zSpan),
      new THREE.Vector3(sign * (attachR + 0.004), H_BODY + 0.02, -zSpan * 0.85),
      new THREE.Vector3(sign * (attachR - 0.005), H_BODY + HANDLE_H, 0),
      new THREE.Vector3(sign * (attachR + 0.004), H_BODY + 0.02, zSpan * 0.85),
      new THREE.Vector3(sign * (attachR + HANDLE_T * 0.5), H_BODY - HEM_H + 0.005, zSpan)
    ]);

    const strapShape = new THREE.Shape();
    strapShape.moveTo(-HANDLE_T * 0.5, -HANDLE_W * 0.5);
    strapShape.lineTo(HANDLE_T * 0.5, -HANDLE_W * 0.5);
    strapShape.lineTo(HANDLE_T * 0.5, HANDLE_W * 0.5);
    strapShape.lineTo(-HANDLE_T * 0.5, HANDLE_W * 0.5);
    strapShape.closePath();

    const loopGeo = new THREE.ExtrudeGeometry(strapShape, {
      steps: 24,
      bevelEnabled: false,
      extrudePath: loopCurve
    });

    const loopMesh = new THREE.Mesh(loopGeo, webbingMat);
    loopMesh.name = `handle_${label}_strap`;
    loopMesh.castShadow = true;
    loopMesh.receiveShadow = true;
    handleGroup.add(loopMesh);

    group.add(handleGroup);
  });

  return group;
}
