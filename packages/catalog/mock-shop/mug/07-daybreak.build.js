function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BODY_R = 0.044;
  const BODY_H = 0.105;
  const HANDLE_W = 0.030;
  const HANDLE_TOP_Y = 0.090;
  const HANDLE_BOT_Y = 0.018;
  const HANDLE_THICK = 0.0055;
  const HANDLE_DEPTH = 0.014;
  const HANDLE_CORNER_R = 0.011;
  const LID_H = 0.008;

  // Center the bounding box on X = 0 (body shifted right by half handle width)
  const CX = HANDLE_W * 0.5;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xeae3d2,
    roughness: 0.55,
    metalness: 0.05
  });

  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f7f8,
    roughness: 0.12,
    metalness: 0.0,
    transparent: true,
    opacity: 0.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0xd0cbc0,
    roughness: 0.7,
    metalness: 0.0
  });

  // 1. Mug Body (LatheGeometry with rounded bottom and top lip)
  const bodyPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BODY_R - 0.009, 0),
    new THREE.Vector2(BODY_R - 0.004, 0.0015),
    new THREE.Vector2(BODY_R - 0.001, 0.0045),
    new THREE.Vector2(BODY_R, 0.009),
    new THREE.Vector2(BODY_R, BODY_H - 0.002),
    new THREE.Vector2(BODY_R - 0.002, BODY_H),
    new THREE.Vector2(BODY_R - 0.004, BODY_H - 0.012),
    new THREE.Vector2(0, BODY_H - 0.012)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const mugBody = new THREE.Mesh(bodyGeo, bodyMat);
  mugBody.name = "mug_body";
  mugBody.position.set(CX, 0, 0);
  mugBody.castShadow = true;
  mugBody.receiveShadow = true;
  group.add(mugBody);

  // 2. Mug Handle (ExtrudeGeometry D-strap)
  const hLeft = -BODY_R - HANDLE_W;
  const hRight = -BODY_R + 0.004;
  const rOut = HANDLE_CORNER_R;
  const rIn = HANDLE_CORNER_R - HANDLE_THICK;

  const handleShape = new THREE.Shape();
  handleShape.moveTo(hRight, HANDLE_TOP_Y);
  handleShape.lineTo(hLeft + rOut, HANDLE_TOP_Y);
  handleShape.quadraticCurveTo(hLeft, HANDLE_TOP_Y, hLeft, HANDLE_TOP_Y - rOut);
  handleShape.lineTo(hLeft, HANDLE_BOT_Y + rOut);
  handleShape.quadraticCurveTo(hLeft, HANDLE_BOT_Y, hLeft + rOut, HANDLE_BOT_Y);
  handleShape.lineTo(hRight, HANDLE_BOT_Y);
  handleShape.lineTo(hRight, HANDLE_BOT_Y + HANDLE_THICK);
  handleShape.lineTo(hLeft + HANDLE_THICK + rIn, HANDLE_BOT_Y + HANDLE_THICK);
  handleShape.quadraticCurveTo(
    hLeft + HANDLE_THICK,
    HANDLE_BOT_Y + HANDLE_THICK,
    hLeft + HANDLE_THICK,
    HANDLE_BOT_Y + HANDLE_THICK + rIn
  );
  handleShape.lineTo(hLeft + HANDLE_THICK, HANDLE_TOP_Y - HANDLE_THICK - rIn);
  handleShape.quadraticCurveTo(
    hLeft + HANDLE_THICK,
    HANDLE_TOP_Y - HANDLE_THICK,
    hLeft + HANDLE_THICK + rIn,
    HANDLE_TOP_Y - HANDLE_THICK
  );
  handleShape.lineTo(hRight, HANDLE_TOP_Y - HANDLE_THICK);
  handleShape.closePath();

  const handleGeo = new THREE.ExtrudeGeometry(handleShape, {
    depth: HANDLE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 3,
    curveSegments: 12
  });
  handleGeo.translate(0, 0, -HANDLE_DEPTH * 0.5);

  const mugHandle = new THREE.Mesh(handleGeo, bodyMat);
  mugHandle.name = "mug_handle";
  mugHandle.position.set(CX, 0, 0);
  mugHandle.castShadow = true;
  mugHandle.receiveShadow = true;
  group.add(mugHandle);

  // 3. Clear Lid Body (LatheGeometry)
  const lidPoints = [
    new THREE.Vector2(0, BODY_H + 0.001),
    new THREE.Vector2(BODY_R - 0.009, BODY_H + 0.001),
    new THREE.Vector2(BODY_R - 0.007, BODY_H + LID_H),
    new THREE.Vector2(BODY_R + 0.0005, BODY_H + LID_H),
    new THREE.Vector2(BODY_R + 0.0005, BODY_H - 0.001),
    new THREE.Vector2(BODY_R - 0.0025, BODY_H - 0.001),
    new THREE.Vector2(BODY_R - 0.003, BODY_H + 0.004),
    new THREE.Vector2(0, BODY_H + 0.001)
  ];
  const lidGeo = new THREE.LatheGeometry(lidPoints, 32);
  const lidBody = new THREE.Mesh(lidGeo, lidMat);
  lidBody.name = "lid_body";
  lidBody.position.set(CX, 0, 0);
  lidBody.castShadow = true;
  lidBody.receiveShadow = true;
  group.add(lidBody);

  // 4. Lid Pull Tab (+X side)
  const tabGeo = new THREE.BoxGeometry(0.006, 0.003, 0.012);
  const lidTab = new THREE.Mesh(tabGeo, lidMat);
  lidTab.name = "lid_pull_tab";
  lidTab.position.set(CX + BODY_R + 0.0015, BODY_H + LID_H - 0.002, 0);
  lidTab.castShadow = true;
  lidTab.receiveShadow = true;
  group.add(lidTab);

  // 5. Lid Sip Slider
  const sliderGeo = new THREE.CapsuleGeometry(0.0035, 0.014, 4, 12);
  sliderGeo.rotateZ(Math.PI * 0.5);
  sliderGeo.scale(1, 0.65, 1.3);
  const lidSlider = new THREE.Mesh(sliderGeo, lidMat);
  lidSlider.name = "lid_sip_slider";
  lidSlider.position.set(CX + 0.005, BODY_H + 0.004, 0);
  lidSlider.castShadow = true;
  lidSlider.receiveShadow = true;
  group.add(lidSlider);

  // 6. Silicone Gasket Ring
  const gasketGeo = new THREE.TorusGeometry(BODY_R - 0.0025, 0.0014, 8, 32);
  gasketGeo.rotateX(Math.PI * 0.5);
  const lidGasket = new THREE.Mesh(gasketGeo, gasketMat);
  lidGasket.name = "lid_gasket";
  lidGasket.position.set(CX, BODY_H - 0.001, 0);
  lidGasket.castShadow = true;
  lidGasket.receiveShadow = true;
  group.add(lidGasket);

  return group;
}
