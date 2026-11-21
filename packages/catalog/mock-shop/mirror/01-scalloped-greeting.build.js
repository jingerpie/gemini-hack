function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.56;
  const H = 0.72;
  const D = 0.036;
  const FRAME_W = 0.092;
  const RX_OUT = W / 2;
  const RY_OUT = H / 2;
  const RX_IN = RX_OUT - FRAME_W;
  const RY_IN = RY_OUT - FRAME_W;
  const CY = H / 2;
  const Z_BACK = -D / 2;

  // Materials
  const tinMat = new THREE.MeshStandardMaterial({
    color: 0x4a4c4e,
    metalness: 0.78,
    roughness: 0.36
  });

  const darkTinMat = new THREE.MeshStandardMaterial({
    color: 0x2c2d2f,
    metalness: 0.65,
    roughness: 0.5
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x252422,
    metalness: 0.1,
    roughness: 0.85
  });

  // 1. Flat backing board at z = Z_BACK
  const backShape = new THREE.Shape();
  const backSegs = 64;
  for (let i = 0; i <= backSegs; i++) {
    const t = (i / backSegs) * Math.PI * 2;
    const x = (RX_OUT - 0.012) * Math.cos(t);
    const y = (RY_OUT - 0.012) * Math.sin(t);
    if (i === 0) backShape.moveTo(x, y);
    else backShape.lineTo(x, y);
  }
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 32
  });
  const backMesh = new THREE.Mesh(backGeo, backingMat);
  backMesh.name = 'backing_board';
  backMesh.position.set(0, CY, Z_BACK);
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  group.add(backMesh);

  // 2. Mirror glass
  const glassShape = new THREE.Shape();
  for (let i = 0; i <= backSegs; i++) {
    const t = (i / backSegs) * Math.PI * 2;
    const x = (RX_IN + 0.008) * Math.cos(t);
    const y = (RY_IN + 0.008) * Math.sin(t);
    if (i === 0) glassShape.moveTo(x, y);
    else glassShape.lineTo(x, y);
  }
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 32
  });
  const glassMesh = new THREE.Mesh(glassGeo, mirrorMat);
  glassMesh.name = 'mirror_glass';
  glassMesh.position.set(0, CY, Z_BACK + 0.006);
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  group.add(glassMesh);

  // 3. Scalloped tin frame (24 scallops, 3 per 45-degree section)
  const frameShape = new THREE.Shape();
  const frameSegs = 192;
  const scallopCount = 24;
  const scallopAmp = 0.012;
  for (let i = 0; i <= frameSegs; i++) {
    const t = (i / frameSegs) * Math.PI * 2;
    const scallop = scallopAmp * Math.abs(Math.sin((scallopCount / 2) * t));
    const x = (RX_OUT - scallopAmp + scallop) * Math.cos(t);
    const y = (RY_OUT - scallopAmp + scallop) * Math.sin(t);
    if (i === 0) frameShape.moveTo(x, y);
    else frameShape.lineTo(x, y);
  }

  const holePath = new THREE.Path();
  for (let i = 0; i <= backSegs; i++) {
    const t = (i / backSegs) * Math.PI * 2;
    const x = RX_IN * Math.cos(t);
    const y = RY_IN * Math.sin(t);
    if (i === 0) holePath.moveTo(x, y);
    else holePath.lineTo(x, y);
  }
  frameShape.holes.push(holePath);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.007,
    bevelSegments: 3,
    curveSegments: 32
  });
  const frameMesh = new THREE.Mesh(frameGeo, tinMat);
  frameMesh.name = 'scalloped_frame';
  frameMesh.position.set(0, CY, Z_BACK + 0.008);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // 4. Inner raised bezel around the mirror opening
  const bezelGeo = new THREE.TorusGeometry(1, 0.0075, 12, 32);
  const bezelMesh = new THREE.Mesh(bezelGeo, tinMat);
  bezelMesh.name = 'inner_bezel';
  bezelMesh.scale.set(RX_IN + 0.004, RY_IN + 0.004, 1);
  bezelMesh.position.set(0, CY, Z_BACK + 0.025);
  bezelMesh.castShadow = true;
  bezelMesh.receiveShadow = true;
  group.add(bezelMesh);

  // 5. Eight radial ribs dividing the frame into 8 sections
  const ribZ = Z_BACK + 0.027;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rInX = RX_IN * cosA;
    const rInY = RY_IN * sinA;
    const rOutX = (RX_OUT - scallopAmp * 0.6) * cosA;
    const rOutY = (RY_OUT - scallopAmp * 0.6) * sinA;

    const dx = rOutX - rInX;
    const dy = rOutY - rInY;
    const ribLen = Math.hypot(dx, dy);

    const ribGeo = new THREE.CapsuleGeometry(0.0055, ribLen - 0.011, 6, 12);
    const ribMesh = new THREE.Mesh(ribGeo, tinMat);
    ribMesh.name = `radial_rib_${i}`;
    ribMesh.position.set((rInX + rOutX) / 2, CY + (rInY + rOutY) / 2, ribZ);
    ribMesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    ribMesh.scale.set(1, 1, 0.65);
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  }

  // 6. Embossed decorative bead clusters (8 arc accents, one per section)
  for (let i = 0; i < 8; i++) {
    const midAngle = (i * Math.PI) / 4 + Math.PI / 8;
    const rxMid = (RX_IN + RX_OUT) * 0.5 - 0.005;
    const ryMid = (RY_IN + RY_OUT) * 0.5 - 0.005;
    const bx = rxMid * Math.cos(midAngle);
    const by = CY + ryMid * Math.sin(midAngle);

    const beadGeo = new THREE.SphereGeometry(0.0045, 10, 8);
    const beadMesh = new THREE.Mesh(beadGeo, tinMat);
    beadMesh.name = `embossed_bead_${i}`;
    beadMesh.position.set(bx, by, Z_BACK + 0.028);
    beadMesh.scale.set(1, 1, 0.5);
    beadMesh.castShadow = true;
    beadMesh.receiveShadow = true;
    group.add(beadMesh);
  }

  // 7. Top hanging tab & keyhole recess
  const tabGeo = new THREE.CapsuleGeometry(0.011, 0.014, 6, 12);
  const tabMesh = new THREE.Mesh(tabGeo, tinMat);
  tabMesh.name = 'hanging_tab';
  tabMesh.position.set(0, CY + RY_OUT - 0.018, Z_BACK + 0.029);
  tabMesh.scale.set(1, 1, 0.45);
  tabMesh.castShadow = true;
  tabMesh.receiveShadow = true;
  group.add(tabMesh);

  const keyholeGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 12);
  const keyholeMesh = new THREE.Mesh(keyholeGeo, darkTinMat);
  keyholeMesh.name = 'keyhole_recess';
  keyholeMesh.rotation.x = Math.PI / 2;
  keyholeMesh.position.set(0, CY + RY_OUT - 0.016, Z_BACK + 0.032);
  keyholeMesh.castShadow = true;
  keyholeMesh.receiveShadow = true;
  group.add(keyholeMesh);

  return group;
}
