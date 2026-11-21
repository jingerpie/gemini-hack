function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const LEN = 0.21;
  const R = 0.045;
  const BASE_H = 0.006;
  const BASE_W = 0.13;
  const BASE_D = 0.044;
  const CY = BASE_H + R - 0.002; // Cylinder center Y

  const CAP_T = 0.012;
  const STRAP_W = 0.018;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xa8aeb5,
    roughness: 0.85,
    metalness: 0.05,
  });

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec5,
    roughness: 0.45,
    metalness: 0.05,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x8e949b,
    roughness: 0.75,
    metalness: 0.05,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e2126,
    roughness: 0.6,
    metalness: 0.1,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xcfd4d9,
    roughness: 0.28,
    metalness: 0.8,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0xb0b6bd,
    roughness: 0.55,
    metalness: 0.05,
  });

  const addMesh = (geo, mat, name, pos, rot) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. Main cylindrical fabric body
  const bodyLen = LEN - CAP_T * 2;
  const bodyGeo = new THREE.CylinderGeometry(R, R, bodyLen, 32);
  addMesh(bodyGeo, fabricMat, "speaker_body", [0, CY, 0], [0, 0, Math.PI / 2]);

  // 2. Bottom rubberized base
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H + 0.006, BASE_D);
  addMesh(baseGeo, baseMat, "bottom_base", [0, (BASE_H + 0.006) / 2, 0]);

  // 3. Left & Right end caps (bumper ring, dark surround, metallic passive radiator)
  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? "left" : "right";
    const capX = side * (bodyLen / 2 + CAP_T / 2 - 0.001);

    // Outer bumper ring
    const bumperGeo = new THREE.TorusGeometry(R - 0.003, 0.0055, 16, 32);
    addMesh(
      bumperGeo,
      plasticMat,
      `${sideName}_bumper_ring`,
      [capX, CY, 0],
      [0, Math.PI / 2, 0]
    );

    // Dark recessed surround
    const darkGeo = new THREE.CylinderGeometry(R - 0.005, R - 0.005, CAP_T * 0.8, 32);
    addMesh(
      darkGeo,
      darkMat,
      `${sideName}_radiator_surround`,
      [capX - side * 0.002, CY, 0],
      [0, 0, Math.PI / 2]
    );

    // Metallic passive radiator disc
    const discGeo = new THREE.CylinderGeometry(R * 0.72, R * 0.72, 0.004, 32);
    addMesh(
      discGeo,
      metalMat,
      `${sideName}_passive_radiator`,
      [capX + side * 0.002, CY, 0],
      [0, 0, Math.PI / 2]
    );
  });

  // 4. Top control pad (+Y)
  const padLen = 0.082;
  const padW = 0.022;
  const padH = 0.004;
  const padY = CY + R - 0.0005;
  const padGeo = new THREE.CapsuleGeometry(padW / 2, padLen - padW, 8, 16);
  addMesh(
    padGeo,
    padMat,
    "top_control_pad",
    [0.01, padY, 0],
    [0, 0, Math.PI / 2]
  );

  // Control buttons on the pad
  const btnY = padY + padW / 2 - 0.0005;
  // Minus (-)
  addMesh(
    new THREE.BoxGeometry(0.008, 0.0015, 0.002),
    baseMat,
    "button_minus",
    [-0.018, btnY, 0]
  );
  // Power/Play (O)
  addMesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.0015, 16),
    baseMat,
    "button_power",
    [0.0, btnY, 0]
  );
  // Mode/Bluetooth
  addMesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.0015, 16),
    baseMat,
    "button_mode",
    [0.018, btnY, 0]
  );
  // Plus (+)
  addMesh(
    new THREE.BoxGeometry(0.008, 0.0015, 0.002),
    baseMat,
    "button_plus_h",
    [0.036, btnY, 0]
  );
  addMesh(
    new THREE.BoxGeometry(0.002, 0.0015, 0.008),
    baseMat,
    "button_plus_v",
    [0.036, btnY, 0]
  );

  // 5. Front port panel (+Z)
  const portY = CY - R * 0.42;
  const portZ = Math.sqrt(R * R - (portY - CY) * (portY - CY)) - 0.001;
  const portPanelGeo = new THREE.CapsuleGeometry(0.007, 0.022, 8, 16);
  addMesh(
    portPanelGeo,
    baseMat,
    "front_port_panel",
    [0.015, portY, portZ],
    [0, 0, Math.PI / 2]
  );

  // USB-C port
  addMesh(
    new THREE.BoxGeometry(0.009, 0.0035, 0.004),
    darkMat,
    "port_usbc",
    [0.008, portY, portZ + 0.0055]
  );
  // AUX 3.5mm jack
  addMesh(
    new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 16),
    darkMat,
    "port_aux",
    [0.024, portY, portZ + 0.0055],
    [Math.PI / 2, 0, 0]
  );

  // 6. Carrying strap anchor & loop (-X, +Y)
  const anchorX = -bodyLen / 2 + 0.006;
  const anchorY = CY + R - 0.002;
  addMesh(
    new THREE.BoxGeometry(0.014, 0.008, STRAP_W + 0.004),
    plasticMat,
    "strap_anchor",
    [anchorX, anchorY, 0]
  );

  // Strap loop using ExtrudeGeometry
  const strapShape = new THREE.Shape();
  strapShape.moveTo(0, 0);
  strapShape.bezierCurveTo(-0.015, 0.048, -0.068, 0.055, -0.072, 0.02);
  strapShape.bezierCurveTo(-0.075, -0.012, -0.035, -0.012, 0, -0.002);
  strapShape.lineTo(0, 0.003);
  strapShape.bezierCurveTo(-0.032, -0.006, -0.066, -0.006, -0.064, 0.019);
  strapShape.bezierCurveTo(-0.061, 0.046, -0.018, 0.04, -0.005, 0);
  strapShape.closePath();

  const strapGeo = new THREE.ExtrudeGeometry(strapShape, {
    depth: STRAP_W,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 24,
  });
  strapGeo.translate(0, 0, -STRAP_W / 2);

  addMesh(
    strapGeo,
    fabricMat,
    "carrying_strap",
    [anchorX, anchorY + 0.001, 0]
  );

  return group;
}
