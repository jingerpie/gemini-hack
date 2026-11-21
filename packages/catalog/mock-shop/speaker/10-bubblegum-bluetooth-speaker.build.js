function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.112;
  const H = 0.106;
  const D = 0.108;
  const R = W * 0.5;
  const BODY_CENTER_Y = H - R;
  const GRILLE_R = 0.032;
  const GRILLE_Y = BODY_CENTER_Y - 0.002;
  const GRILLE_Z = D * 0.5 - 0.004;

  // Materials
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xe88fa2,
    roughness: 0.55,
    metalness: 0.04,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd97d90,
    roughness: 0.75,
    metalness: 0.02,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0xd6aa7e,
    roughness: 0.62,
    metalness: 0.08,
  });

  const grilleRimMat = new THREE.MeshStandardMaterial({
    color: 0x9c724c,
    roughness: 0.65,
    metalness: 0.1,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xeae09a,
    roughness: 0.45,
    metalness: 0.02,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x4de8f4,
    emissive: 0x3ad8e8,
    emissiveIntensity: 1.4,
    roughness: 0.25,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Main spherical body (slightly squashed vertically)
  const bodyGeo = new THREE.SphereGeometry(R, 32, 24);
  addMesh(
    bodyGeo,
    pinkMat,
    'speaker_body',
    [0, BODY_CENTER_Y, 0],
    [0, 0, 0],
    [1, H / W, D / W]
  );

  // Flat bottom base pad so it rests at y = 0
  const baseR = 0.026;
  const baseH = 0.004;
  const baseGeo = new THREE.CylinderGeometry(baseR, baseR * 0.92, baseH, 24);
  addMesh(baseGeo, baseMat, 'base_pad', [0, baseH * 0.5, 0]);

  // Front grille recess rim
  const rimGeo = new THREE.TorusGeometry(GRILLE_R, 0.0018, 12, 32);
  addMesh(rimGeo, grilleRimMat, 'grille_recess_rim', [0, GRILLE_Y, GRILLE_Z]);

  // Front grille face
  const grilleGeo = new THREE.CylinderGeometry(GRILLE_R - 0.001, GRILLE_R - 0.001, 0.004, 32);
  addMesh(
    grilleGeo,
    grilleMat,
    'grille_face',
    [0, GRILLE_Y, GRILLE_Z - 0.001],
    [Math.PI * 0.5, 0, 0]
  );

  // Subtle concentric rings on grille for texture/depth
  const innerRing1Geo = new THREE.TorusGeometry(GRILLE_R * 0.68, 0.0007, 8, 32);
  addMesh(innerRing1Geo, grilleRimMat, 'grille_inner_ring_outer', [0, GRILLE_Y, GRILLE_Z + 0.001]);

  const innerRing2Geo = new THREE.TorusGeometry(GRILLE_R * 0.36, 0.0007, 8, 24);
  addMesh(innerRing2Geo, grilleRimMat, 'grille_inner_ring_inner', [0, GRILLE_Y, GRILLE_Z + 0.001]);

  const centerCapGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.0015, 20);
  addMesh(
    centerCapGeo,
    grilleRimMat,
    'grille_center_cap',
    [0, GRILLE_Y, GRILLE_Z + 0.001],
    [Math.PI * 0.5, 0, 0]
  );

  // Glowing cyan ring near bottom of grille
  const cyanRingGeo = new THREE.TorusGeometry(0.0032, 0.0008, 10, 20);
  addMesh(
    cyanRingGeo,
    cyanGlowMat,
    'grille_cyan_ring',
    [0, GRILLE_Y - GRILLE_R * 0.66, GRILLE_Z + 0.0015]
  );

  // Tiny glowing cyan LED indicator below grille
  const ledGeo = new THREE.SphereGeometry(0.0014, 12, 8);
  addMesh(
    ledGeo,
    cyanGlowMat,
    'led_indicator',
    [0, GRILLE_Y - GRILLE_R - 0.009, GRILLE_Z - 0.008],
    [0, 0, 0],
    [1.2, 0.8, 0.6]
  );

  // Top curved cream control strip
  const stripArcR = R * 0.97;
  const stripGeo = new THREE.TorusGeometry(stripArcR, 0.0045, 10, 24, Math.PI * 0.32);
  addMesh(
    stripGeo,
    creamMat,
    'top_control_strip',
    [0, BODY_CENTER_Y + 0.002, 0.004],
    [0.12, 0, Math.PI * 0.5 - Math.PI * 0.16],
    [1, H / W, 1.3]
  );

  // Top buttons (+, power, -)
  const btnY = H - 0.0015;
  const btnZ = 0.004;
  const btnGeo = new THREE.CylinderGeometry(0.0055, 0.006, 0.003, 18);

  // Left button (+)
  const plusX = -0.017;
  const plusY = btnY - 0.0028;
  const plusRotZ = 0.32;
  addMesh(btnGeo, creamMat, 'button_plus_base', [plusX, plusY, btnZ], [0.1, 0, plusRotZ]);

  const plusBarGeo = new THREE.BoxGeometry(0.005, 0.0012, 0.0012);
  addMesh(plusBarGeo, grilleRimMat, 'button_plus_h', [plusX, plusY + 0.0018, btnZ], [0.1, 0, plusRotZ]);
  addMesh(plusBarGeo, grilleRimMat, 'button_plus_v', [plusX, plusY + 0.0018, btnZ], [0.1, Math.PI * 0.5, plusRotZ]);

  // Center button (power/play)
  addMesh(btnGeo, creamMat, 'button_power_base', [0, btnY, btnZ], [0.1, 0, 0]);
  const powerBarGeo = new THREE.BoxGeometry(0.0012, 0.0012, 0.0045);
  addMesh(powerBarGeo, grilleRimMat, 'button_power_bar', [0, btnY + 0.0018, btnZ], [0.1, 0, 0]);

  // Right button (-)
  const minusX = 0.017;
  const minusY = btnY - 0.0028;
  const minusRotZ = -0.32;
  addMesh(btnGeo, creamMat, 'button_minus_base', [minusX, minusY, btnZ], [0.1, 0, minusRotZ]);
  addMesh(plusBarGeo, grilleRimMat, 'button_minus_bar', [minusX, minusY + 0.0018, btnZ], [0.1, 0, minusRotZ]);

  return group;
}
