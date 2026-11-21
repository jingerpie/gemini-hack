function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const DIAMETER = 0.50;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.30;
  const PANEL_COUNT = 16;
  const MEDALLION_R = RADIUS * 0.32;
  const SHOULDER_R = RADIUS * 0.785;
  const SHOULDER_Y = HEIGHT * 0.797;
  const BASE_R = RADIUS * 0.733;
  const PIPING_R = 0.004;

  // Materials
  const leatherMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a5c63,
    roughness: 0.45,
    metalness: 0.04,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x124247,
    roughness: 0.6,
    metalness: 0.04,
  });

  // 1. Main pouf body via LatheGeometry
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R * 0.85, 0.003),
    new THREE.Vector2(BASE_R, 0.011),
    new THREE.Vector2(RADIUS * 0.88, HEIGHT * 0.14),
    new THREE.Vector2(RADIUS * 0.98, HEIGHT * 0.31),
    new THREE.Vector2(RADIUS, HEIGHT * 0.485),
    new THREE.Vector2(RADIUS * 0.96, HEIGHT * 0.656),
    new THREE.Vector2(SHOULDER_R + 0.025, HEIGHT * 0.765),
    new THREE.Vector2(SHOULDER_R, SHOULDER_Y),
    new THREE.Vector2(RADIUS * 0.533, HEIGHT * 0.922),
    new THREE.Vector2(MEDALLION_R, HEIGHT * 0.981),
    new THREE.Vector2(0.0, HEIGHT),
  ];
  const bodyGeo = new THREE.LatheGeometry(profilePoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, leatherMat);
  bodyMesh.name = 'pouf_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Helper to evaluate surface radius/height along the profile for seam placement
  function getProfilePoint(t) {
    const idx = t * (profilePoints.length - 2) + 1;
    const i0 = Math.min(Math.floor(idx), profilePoints.length - 2);
    const i1 = i0 + 1;
    const f = idx - i0;
    const r = profilePoints[i0].x * (1 - f) + profilePoints[i1].x * f;
    const y = profilePoints[i0].y * (1 - f) + profilePoints[i1].y * f;
    return { r, y };
  }

  // 2. Bottom piping ring
  const bottomPipingGeo = new THREE.TorusGeometry(BASE_R, PIPING_R, 8, 32);
  bottomPipingGeo.rotateX(Math.PI / 2);
  const bottomPiping = new THREE.Mesh(bottomPipingGeo, seamMat);
  bottomPiping.position.y = 0.011;
  bottomPiping.name = 'bottom_piping';
  bottomPiping.castShadow = true;
  bottomPiping.receiveShadow = true;
  group.add(bottomPiping);

  // 3. Top central medallion disc
  const medallionGeo = new THREE.CylinderGeometry(MEDALLION_R, MEDALLION_R * 1.02, 0.008, 24);
  const medallion = new THREE.Mesh(medallionGeo, leatherMat);
  medallion.position.y = HEIGHT - 0.005;
  medallion.name = 'top_medallion';
  medallion.castShadow = true;
  medallion.receiveShadow = true;
  group.add(medallion);

  // 4. Top medallion piping ring
  const medallionPipingGeo = new THREE.TorusGeometry(MEDALLION_R, PIPING_R * 0.85, 8, 28);
  medallionPipingGeo.rotateX(Math.PI / 2);
  const medallionPiping = new THREE.Mesh(medallionPipingGeo, seamMat);
  medallionPiping.position.y = HEIGHT - 0.003;
  medallionPiping.name = 'medallion_piping';
  medallionPiping.castShadow = true;
  medallionPiping.receiveShadow = true;
  group.add(medallionPiping);

  // 5. Central embossed star/floral motif on medallion (8 petals)
  const petalGeo = new THREE.CapsuleGeometry(0.003, 0.035, 4, 8);
  petalGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, seamMat);
    petal.position.set(
      Math.cos(angle) * 0.023,
      HEIGHT - 0.0005,
      Math.sin(angle) * 0.023
    );
    petal.rotation.y = -angle;
    petal.name = `medallion_petal_${i + 1}`;
    petal.castShadow = true;
    petal.receiveShadow = true;
    group.add(petal);
  }

  // 6. 16 radial + vertical panel seams
  for (let i = 0; i < PANEL_COUNT; i++) {
    const angle = (i / PANEL_COUNT) * Math.PI * 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const seamPts = [];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * 0.92 + 0.05;
      const p = getProfilePoint(t);
      const r = p.r + 0.0012;
      seamPts.push(new THREE.Vector3(cosA * r, p.y, sinA * r));
    }

    const seamCurve = new THREE.CatmullRomCurve3(seamPts);
    const seamGeo = new THREE.TubeGeometry(seamCurve, 16, PIPING_R * 0.7, 6, false);
    const seamMesh = new THREE.Mesh(seamGeo, seamMat);
    seamMesh.name = `panel_seam_${i + 1}`;
    seamMesh.castShadow = true;
    seamMesh.receiveShadow = true;
    group.add(seamMesh);
  }

  // 7. Zigzag / scalloped shoulder seam ring connecting the panels
  const zigzagPts = [];
  const halfStep = (Math.PI * 2) / (PANEL_COUNT * 2);
  for (let i = 0; i < PANEL_COUNT * 2; i++) {
    const angle = i * halfStep;
    const isPeak = i % 2 === 0;
    const r = isPeak ? SHOULDER_R + 0.002 : SHOULDER_R + 0.022;
    const y = isPeak ? SHOULDER_Y + 0.007 : SHOULDER_Y - 0.013;
    zigzagPts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
  }
  const zigzagCurve = new THREE.CatmullRomCurve3(zigzagPts, true);
  const zigzagGeo = new THREE.TubeGeometry(zigzagCurve, 64, PIPING_R * 0.7, 6, true);
  const zigzagMesh = new THREE.Mesh(zigzagGeo, seamMat);
  zigzagMesh.name = 'shoulder_zigzag_seam';
  zigzagMesh.castShadow = true;
  zigzagMesh.receiveShadow = true;
  group.add(zigzagMesh);

  return group;
}
