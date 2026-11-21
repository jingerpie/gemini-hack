function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.50;
  const BASE_R = 0.088;
  const BASE_H = 0.024;
  const PAD_H = 0.003;
  const BODY_BOT = BASE_H;
  const BODY_TOP = H;
  const MID_Y = (BODY_BOT + BODY_TOP) * 0.5;
  const MAX_W = 0.115; // half-width at widest point
  const TOP_R = 0.044;
  const BOT_R = 0.052;
  const DEPTH_Z = 0.048;

  // Materials
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9a049,
    metalness: 0.88,
    roughness: 0.26,
  });

  const resinMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,
    metalness: 0.08,
    roughness: 0.44,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base felt pad & gold disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.98, BASE_R * 0.98, PAD_H, 32),
    padMat,
    'base_felt_pad'
  ).position.y = PAD_H * 0.5;

  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H - PAD_H, 32),
    goldMat,
    'base_gold_disc'
  ).position.y = PAD_H + (BASE_H - PAD_H) * 0.5;

  // Helper to create a smooth tube along 3D points
  function makeTube(pts, radius, mat, name, radialSegs = 14) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 28, radius, radialSegs, false);
    return addMesh(geo, mat, name);
  }

  // 2. Black resin outer sculptural ribs (left & right mirrored, front & back depth)
  const y0 = BODY_BOT + 0.008;
  const y1 = BODY_BOT + 0.11;
  const y2 = MID_Y;
  const y3 = BODY_TOP - 0.11;
  const y4 = BODY_TOP - 0.008;

  // Left & Right upper-to-lower sweeping outer lobes (black resin)
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';

    // Outer twisting side lobe
    makeTube(
      [
        new THREE.Vector3(side * BOT_R * 0.72, y0, 0),
        new THREE.Vector3(side * (MAX_W * 0.78), y1, side * 0.014),
        new THREE.Vector3(side * MAX_W, y2 - 0.02, -side * 0.012),
        new THREE.Vector3(side * MAX_W * 0.96, y2 + 0.04, side * 0.016),
        new THREE.Vector3(side * (MAX_W * 0.72), y3, -side * 0.01),
        new THREE.Vector3(side * TOP_R * 0.72, y4, 0),
      ],
      0.022,
      resinMat,
      `resin_outer_lobe_${label}`
    );

    // Upper-inner resin arch curving toward center-top pinch
    makeTube(
      [
        new THREE.Vector3(side * TOP_R * 0.65, y4, 0.012),
        new THREE.Vector3(side * 0.048, y3 + 0.02, 0.022),
        new THREE.Vector3(side * 0.018, y2 + 0.055, 0.018),
        new THREE.Vector3(0, y2 + 0.025, 0.012),
      ],
      0.017,
      resinMat,
      `resin_upper_arch_front_${label}`
    );

    makeTube(
      [
        new THREE.Vector3(side * TOP_R * 0.65, y4, -0.012),
        new THREE.Vector3(side * 0.048, y3 + 0.02, -0.022),
        new THREE.Vector3(side * 0.018, y2 + 0.055, -0.018),
        new THREE.Vector3(0, y2 + 0.025, -0.012),
      ],
      0.017,
      resinMat,
      `resin_upper_arch_back_${label}`
    );

    // Lower-inner resin arch curving toward center-bottom pinch
    makeTube(
      [
        new THREE.Vector3(side * BOT_R * 0.65, y0, 0.012),
        new THREE.Vector3(side * 0.052, y1 - 0.01, 0.022),
        new THREE.Vector3(side * 0.018, y2 - 0.055, 0.018),
        new THREE.Vector3(0, y2 - 0.025, 0.012),
      ],
      0.017,
      resinMat,
      `resin_lower_arch_front_${label}`
    );

    makeTube(
      [
        new THREE.Vector3(side * BOT_R * 0.65, y0, -0.012),
        new THREE.Vector3(side * 0.052, y1 - 0.01, -0.022),
        new THREE.Vector3(side * 0.018, y2 - 0.055, -0.018),
        new THREE.Vector3(0, y2 - 0.025, -0.012),
      ],
      0.017,
      resinMat,
      `resin_lower_arch_back_${label}`
    );
  });

  // 3. Gold inner-edge trim ribs framing the 4 cutouts
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';

    // Gold inner edge along the left/right large vertical cutouts
    makeTube(
      [
        new THREE.Vector3(side * 0.008, y4, 0),
        new THREE.Vector3(side * 0.042, y3 + 0.01, 0.006),
        new THREE.Vector3(side * 0.072, y2, 0),
        new THREE.Vector3(side * 0.046, y1 - 0.01, -0.006),
        new THREE.Vector3(side * 0.008, y0, 0),
      ],
      0.011,
      goldMat,
      `gold_side_trim_${label}`
    );

    // Gold inner edge along the top diamond cutout
    makeTube(
      [
        new THREE.Vector3(0, y4, 0),
        new THREE.Vector3(side * 0.028, y3 + 0.025, 0.004),
        new THREE.Vector3(side * 0.022, y2 + 0.05, 0.004),
        new THREE.Vector3(0, y2 + 0.015, 0),
      ],
      0.009,
      goldMat,
      `gold_top_cutout_trim_${label}`
    );

    // Gold inner edge along the bottom diamond cutout
    makeTube(
      [
        new THREE.Vector3(0, y0, 0),
        new THREE.Vector3(side * 0.028, y1 - 0.02, 0.004),
        new THREE.Vector3(side * 0.022, y2 - 0.05, 0.004),
        new THREE.Vector3(0, y2 - 0.015, 0),
      ],
      0.009,
      goldMat,
      `gold_bot_cutout_trim_${label}`
    );
  });

  // 4. Central gold X-bridge where the 4 cutouts meet
  const centerBridge = addMesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.046, 20),
    goldMat,
    'gold_center_bridge'
  );
  centerBridge.position.y = MID_Y;

  // 5. Top & bottom gold collar/rim accents
  const topRim = addMesh(
    new THREE.TorusGeometry(TOP_R * 0.68, 0.008, 12, 28),
    goldMat,
    'gold_top_rim'
  );
  topRim.rotation.x = Math.PI * 0.5;
  topRim.position.y = BODY_TOP - 0.008;

  const botCollar = addMesh(
    new THREE.CylinderGeometry(BOT_R * 0.72, BOT_R * 0.78, 0.014, 28),
    goldMat,
    'gold_bottom_collar'
  );
  botCollar.position.y = BODY_BOT + 0.004;

  return group;
}
