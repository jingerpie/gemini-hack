function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.50;
  const R = DIAMETER / 2; // 0.25
  const H = 0.21;
  const BASE_H = 0.024;
  const LOWER_WALL_H = 0.105;
  const CUSHION_R = 0.165;
  const CUSHION_H = 0.115;

  // Materials
  const creamFabricMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.88,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xe4ddd0,
    roughness: 0.9,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc8b294,
    roughness: 0.92,
    metalness: 0.0,
  });

  const zipperMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.5,
    metalness: 0.2,
  });

  // 1. Non-slip tan base pad (touches y = 0)
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.175, 0.0),
    new THREE.Vector2(0.205, 0.012),
    new THREE.Vector2(0.222, BASE_H),
    new THREE.Vector2(0.0, BASE_H),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 32);
  const basePad = new THREE.Mesh(baseGeo, baseMat);
  basePad.name = "non_slip_base";
  basePad.castShadow = true;
  basePad.receiveShadow = true;
  group.add(basePad);

  // 2. Lower bolster ring (gives exact 0.50m diameter)
  const lowerPoints = [
    new THREE.Vector2(0.14, BASE_H),
    new THREE.Vector2(0.22, BASE_H),
    new THREE.Vector2(0.242, 0.048),
    new THREE.Vector2(R, 0.085),
    new THREE.Vector2(0.246, LOWER_WALL_H),
    new THREE.Vector2(0.15, LOWER_WALL_H),
  ];
  const lowerGeo = new THREE.LatheGeometry(lowerPoints, 32);
  const lowerBolster = new THREE.Mesh(lowerGeo, creamFabricMat);
  lowerBolster.name = "lower_bolster_wall";
  lowerBolster.castShadow = true;
  lowerBolster.receiveShadow = true;
  group.add(lowerBolster);

  // 3. Horizontal seam piping around outer wall
  const pipingGeo = new THREE.TorusGeometry(R - 0.001, 0.0025, 10, 32);
  pipingGeo.rotateX(Math.PI / 2);
  const piping = new THREE.Mesh(pipingGeo, seamMat);
  piping.position.y = 0.092;
  piping.name = "outer_seam_piping";
  piping.castShadow = true;
  piping.receiveShadow = true;
  group.add(piping);

  // 4. Upper bolster segments (9 plump segments around back & sides, leaving front +Z open)
  const numSegments = 9;
  const startAngle = 0.24 * Math.PI;
  const endAngle = 1.76 * Math.PI;
  const ringRadius = 0.185;

  const segGeo = new THREE.SphereGeometry(0.064, 20, 16);
  segGeo.scale(1.0, 1.15, 0.95);

  for (let i = 0; i < numSegments; i++) {
    const t = i / (numSegments - 1);
    const theta = startAngle + t * (endAngle - startAngle);
    // Taper height slightly near the front entry
    const edgeFactor = Math.sin(t * Math.PI);
    const segScaleY = 0.88 + 0.16 * edgeFactor;
    const segY = 0.132 + 0.012 * edgeFactor;

    const seg = new THREE.Mesh(segGeo, creamFabricMat);
    seg.scale.set(1.0, segScaleY, 1.0);
    seg.position.set(
      ringRadius * Math.sin(theta),
      segY,
      ringRadius * Math.cos(theta)
    );
    seg.rotation.y = theta;
    seg.name = `bolster_segment_${i + 1}`;
    seg.castShadow = true;
    seg.receiveShadow = true;
    group.add(seg);
  }

  // 5. Front entry lip (smoothly dips at +Z)
  const lipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(
      ringRadius * Math.sin(startAngle),
      0.132,
      ringRadius * Math.cos(startAngle)
    ),
    new THREE.Vector3(0.095, 0.105, 0.185),
    new THREE.Vector3(0.0, 0.102, 0.195),
    new THREE.Vector3(-0.095, 0.105, 0.185),
    new THREE.Vector3(
      ringRadius * Math.sin(endAngle),
      0.132,
      ringRadius * Math.cos(endAngle)
    ),
  ]);
  const lipGeo = new THREE.TubeGeometry(lipCurve, 24, 0.046, 14, false);
  const frontLip = new THREE.Mesh(lipGeo, creamFabricMat);
  frontLip.name = "front_entry_lip";
  frontLip.castShadow = true;
  frontLip.receiveShadow = true;
  group.add(frontLip);

  // 6. Inner plump cushion
  const cushionGeo = new THREE.SphereGeometry(CUSHION_R, 28, 18);
  cushionGeo.scale(1.0, 0.42, 1.0);
  const innerCushion = new THREE.Mesh(cushionGeo, creamFabricMat);
  innerCushion.position.y = CUSHION_H - CUSHION_R * 0.42;
  innerCushion.name = "inner_cushion";
  innerCushion.castShadow = true;
  innerCushion.receiveShadow = true;
  group.add(innerCushion);

  // 7. Bottom zipper track
  const zipTrackGeo = new THREE.TorusGeometry(0.218, 0.0022, 8, 32);
  zipTrackGeo.rotateX(Math.PI / 2);
  const zipTrack = new THREE.Mesh(zipTrackGeo, seamMat);
  zipTrack.position.y = BASE_H;
  zipTrack.name = "bottom_zipper_track";
  zipTrack.castShadow = true;
  zipTrack.receiveShadow = true;
  group.add(zipTrack);

  // 8. Front zipper pull at +Z
  const zipPullGeo = new THREE.BoxGeometry(0.005, 0.014, 0.003);
  const zipPull = new THREE.Mesh(zipPullGeo, zipperMat);
  zipPull.position.set(0.0, BASE_H - 0.006, 0.22);
  zipPull.rotation.x = 0.2;
  zipPull.name = "zipper_pull";
  zipPull.castShadow = true;
  zipPull.receiveShadow = true;
  group.add(zipPull);

  return group;
}
