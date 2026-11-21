function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.6;
  const H = 2.0;
  const D = 0.12;

  const CORD_R = 0.0055;
  const BULB_R = 0.048;
  const CAP_R_TOP = 0.014;
  const CAP_R_BOT = 0.020;
  const CAP_H = 0.018;
  const LOOP_R = 0.012;
  const LOOP_TUBE = 0.004;

  const SWITCH_W = 0.028;
  const SWITCH_H = 0.072;
  const SWITCH_D = 0.022;

  const PLUG_W = 0.065;
  const PLUG_H = 0.032;
  const PLUG_D = 0.036;

  const Z_WALL = -D / 2 + CORD_R;

  // Materials
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x5e5040,
    roughness: 0.72,
    metalness: 0.05
  });

  const darkHardwareMat = new THREE.MeshStandardMaterial({
    color: 0x4a3f32,
    roughness: 0.55,
    metalness: 0.15
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8c8c8,
    roughness: 0.3,
    metalness: 0.85
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffdf9e,
    emissiveIntensity: 1.5,
    roughness: 0.35,
    metalness: 0.0
  });

  // Helper to add shadows
  function prepMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Build continuous cord path
  const pts = [];

  // Swag 1 (top): left to right
  const swag1X = 0.78;
  const swag1Y = H - 0.02;
  const swag1Sag = 0.38;
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -swag1X + t * (2 * swag1X);
    const normX = x / swag1X;
    const y = swag1Y - swag1Sag * (1 - normX * normX);
    pts.push(new THREE.Vector3(x, y, Z_WALL));
  }

  // Transition down right side to Swag 2
  const swag2X = 0.72;
  const swag2Y = 1.48;
  const swag2Sag = 0.35;
  pts.push(new THREE.Vector3(0.80, 1.75, Z_WALL));

  // Swag 2 (middle): right to left
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = swag2X - t * (2 * swag2X);
    const normX = x / swag2X;
    const y = swag2Y - swag2Sag * (1 - normX * normX);
    pts.push(new THREE.Vector3(x, y, Z_WALL));
  }

  // Transition down left side to Swag 3
  const swag3X = 0.68;
  const swag3Y = 0.98;
  const swag3Sag = 0.35;
  pts.push(new THREE.Vector3(-0.74, 1.24, Z_WALL));

  // Swag 3 (bottom): left to right
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -swag3X + t * (2 * swag3X);
    const normX = x / swag3X;
    const y = swag3Y - swag3Sag * (1 - normX * normX);
    pts.push(new THREE.Vector3(x, y, Z_WALL));
  }

  // Vertical drop down right side to floor
  pts.push(new THREE.Vector3(0.72, 0.72, Z_WALL));
  pts.push(new THREE.Vector3(0.70, 0.32, Z_WALL));
  pts.push(new THREE.Vector3(0.68, 0.08, Z_WALL + 0.02));

  // Coil on the floor (y = CORD_R)
  const coilCenterX = 0.45;
  const coilCenterZ = 0.015;
  const coilLoops = 2.2;
  const coilSteps = 32;
  for (let i = 0; i <= coilSteps; i++) {
    const t = i / coilSteps;
    const angle = t * Math.PI * 2 * coilLoops;
    const r = 0.14 - t * 0.035;
    const x = coilCenterX + Math.cos(angle) * r;
    const z = coilCenterZ + Math.sin(angle) * r * 0.32;
    pts.push(new THREE.Vector3(x, CORD_R, z));
  }

  // Lead to plug
  pts.push(new THREE.Vector3(0.68, PLUG_H * 0.4, 0.02));
  pts.push(new THREE.Vector3(0.74, PLUG_H * 0.5, 0.02));

  const cordCurve = new THREE.CatmullRomCurve3(pts);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 180, CORD_R, 10, false);
  prepMesh(new THREE.Mesh(cordGeo, cordMat), "main_cord");

  // Place 9 bulbs (3 per swag)
  const swags = [
    { xMax: swag1X, yHook: swag1Y, sag: swag1Sag },
    { xMax: swag2X, yHook: swag2Y, sag: swag2Sag },
    { xMax: swag3X, yHook: swag3Y, sag: swag3Sag }
  ];

  const loopGeo = new THREE.TorusGeometry(LOOP_R, LOOP_TUBE, 10, 20);
  const capGeo = new THREE.CylinderGeometry(CAP_R_TOP, CAP_R_BOT, CAP_H, 18);
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 20);

  let bulbIdx = 1;
  for (let s = 0; s < swags.length; s++) {
    const sw = swags[s];
    const xPositions = [-sw.xMax * 0.52, 0, sw.xMax * 0.52];
    for (let b = 0; b < xPositions.length; b++) {
      const bx = xPositions[b];
      const normX = bx / sw.xMax;
      const by = sw.yHook - sw.sag * (1 - normX * normX);
      const bz = Z_WALL + 0.008;

      // Hanging loop
      const loop = new THREE.Mesh(loopGeo, darkHardwareMat);
      loop.position.set(bx, by - LOOP_R * 0.3, bz);
      prepMesh(loop, "bulb_loop_" + bulbIdx);

      // Socket cap
      const cap = new THREE.Mesh(capGeo, darkHardwareMat);
      cap.position.set(bx, by - LOOP_R - CAP_H * 0.4, bz);
      prepMesh(cap, "bulb_cap_" + bulbIdx);

      // Glowing bulb
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(bx, by - LOOP_R - CAP_H * 0.7 - BULB_R * 0.85, bz);
      prepMesh(bulb, "emit_bulb_" + bulbIdx);

      bulbIdx++;
    }
  }

  // Inline switch on vertical drop
  const switchBody = new THREE.Mesh(
    new THREE.BoxGeometry(SWITCH_W, SWITCH_H, SWITCH_D),
    darkHardwareMat
  );
  switchBody.position.set(0.70, 0.30, Z_WALL + 0.004);
  prepMesh(switchBody, "inline_switch");

  const switchBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.008, 16),
    cordMat
  );
  switchBtn.rotation.x = Math.PI / 2;
  switchBtn.position.set(0.70, 0.30, Z_WALL + 0.004 + SWITCH_D / 2 + 0.002);
  prepMesh(switchBtn, "switch_button");

  // Plug at end of cord
  const plugBody = new THREE.Mesh(
    new THREE.BoxGeometry(PLUG_W, PLUG_H, PLUG_D),
    darkHardwareMat
  );
  plugBody.position.set(0.77, PLUG_H / 2, 0.02);
  prepMesh(plugBody, "plug_body");

  const prongGeo = new THREE.BoxGeometry(0.018, 0.007, 0.002);
  const prong1 = new THREE.Mesh(prongGeo, metalMat);
  prong1.position.set(0.77 + PLUG_W / 2 + 0.008, PLUG_H / 2, 0.02 - 0.006);
  prepMesh(prong1, "plug_prong_1");

  const prong2 = new THREE.Mesh(prongGeo, metalMat);
  prong2.position.set(0.77 + PLUG_W / 2 + 0.008, PLUG_H / 2, 0.02 + 0.006);
  prepMesh(prong2, "plug_prong_2");

  return group;
}
