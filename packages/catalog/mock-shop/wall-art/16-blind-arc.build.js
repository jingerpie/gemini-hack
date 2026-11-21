function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) - 21 x 30 cm
  const W = 0.21;
  const H = 0.30;
  const PAPER_D = 0.003;
  const TUBE_R = 0.0012;
  const TOTAL_D = PAPER_D + TUBE_R;

  const ARC_CENTER_Y = H * 0.50;
  const R_INNER = 0.025;
  const R_OUTER = 0.075;
  const ARC_COUNT = 6;
  const R_STEP = (R_OUTER - R_INNER) / (ARC_COUNT - 1);

  // Material: warm off-white cotton paper (blind emboss)
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Back of paper at z = -TOTAL_D / 2, front at z = -TOTAL_D / 2 + PAPER_D
  const paperZ = -TOTAL_D / 2 + PAPER_D / 2;
  const frontZ = -TOTAL_D / 2 + PAPER_D;

  // Paper sheet
  const paperGeo = new THREE.BoxGeometry(W, H, PAPER_D);
  const paperMesh = new THREE.Mesh(paperGeo, paperMat);
  paperMesh.name = 'paper_sheet';
  paperMesh.position.set(0, H / 2, paperZ);
  paperMesh.castShadow = true;
  paperMesh.receiveShadow = true;
  group.add(paperMesh);

  // Embossed concentric arcs
  const startAngles = [
    0.0,
    0.0,
    -0.08 * Math.PI,
    -0.16 * Math.PI,
    -0.24 * Math.PI,
    -0.32 * Math.PI,
  ];
  const endAngle = 1.5 * Math.PI;
  const capGeo = new THREE.SphereGeometry(TUBE_R, 12, 12);

  for (let i = 0; i < ARC_COUNT; i++) {
    const r = R_INNER + i * R_STEP;
    const startAngle = startAngles[i];
    const arcLen = endAngle - startAngle;

    const arcGeo = new THREE.TorusGeometry(r, TUBE_R, 12, 32, arcLen);
    const arcMesh = new THREE.Mesh(arcGeo, paperMat);
    arcMesh.name = `embossed_arc_${i + 1}`;
    arcMesh.position.set(0, ARC_CENTER_Y, frontZ);
    arcMesh.rotation.z = startAngle;
    arcMesh.castShadow = true;
    arcMesh.receiveShadow = true;
    group.add(arcMesh);

    // Rounded end caps
    const startCap = new THREE.Mesh(capGeo, paperMat);
    startCap.name = `arc_${i + 1}_start_cap`;
    startCap.position.set(
      r * Math.cos(startAngle),
      ARC_CENTER_Y + r * Math.sin(startAngle),
      frontZ
    );
    startCap.castShadow = true;
    startCap.receiveShadow = true;
    group.add(startCap);

    const endCap = new THREE.Mesh(capGeo, paperMat);
    endCap.name = `arc_${i + 1}_end_cap`;
    endCap.position.set(
      r * Math.cos(endAngle),
      ARC_CENTER_Y + r * Math.sin(endAngle),
      frontZ
    );
    endCap.castShadow = true;
    endCap.receiveShadow = true;
    group.add(endCap);
  }

  return group;
}
