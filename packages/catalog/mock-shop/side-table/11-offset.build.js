function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.45; // Exact overall height: 450 mm
  const TOP_R = 0.22;
  const TOP_T = 0.022;
  const BASE_R = 0.17;
  const BASE_T = 0.036;
  const PAD_H = 0.002;
  const PAD_R = 0.015;

  const PILLAR_W = 0.055;
  const PILLAR_D = 0.055;
  const PILLAR_X = 0.105;

  const BEAM_H = 0.026;
  const BEAM_D = 0.04;
  const BEAM_X_MIN = -0.135;
  const BEAM_X_MAX = 0.165;
  const BEAM_L = BEAM_X_MAX - BEAM_X_MIN;
  const BEAM_CENTER_X = (BEAM_X_MIN + BEAM_X_MAX) / 2;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8a99a,
    roughness: 0.72,
    metalness: 0.02,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.95,
    metalness: 0.0,
  });

  function makeMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Felt pads under base (touching y = 0)
  const padGeo = new THREE.CylinderGeometry(PAD_R, PAD_R, PAD_H, 16);
  const padOffset = BASE_R * 0.68;
  const padAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  padAngles.forEach((ang, idx) => {
    makeMesh(
      padGeo,
      feltMat,
      `felt_pad_${idx + 1}`,
      Math.cos(ang) * padOffset,
      PAD_H / 2,
      Math.sin(ang) * padOffset
    );
  });

  // 2. Round base disc
  const baseY = PAD_H + BASE_T / 2;
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_T, 32);
  makeMesh(baseGeo, woodMat, 'base_disc', 0, baseY, 0);

  // Subtle top bevel on base
  const baseBevelGeo = new THREE.CylinderGeometry(BASE_R - 0.003, BASE_R, 0.002, 32);
  makeMesh(baseBevelGeo, woodMat, 'base_top_bevel', 0, PAD_H + BASE_T + 0.001, 0);

  // 3. Vertical offset pillar
  const pillarBottom = PAD_H + BASE_T;
  const pillarTop = H - TOP_T;
  const pillarH = pillarTop - pillarBottom;
  const pillarGeo = new THREE.BoxGeometry(PILLAR_W, pillarH, PILLAR_D);
  makeMesh(
    pillarGeo,
    woodMat,
    'vertical_pillar',
    PILLAR_X,
    pillarBottom + pillarH / 2,
    0
  );

  // Subtle base collar at pillar-base joint
  const collarGeo = new THREE.BoxGeometry(PILLAR_W + 0.002, 0.003, PILLAR_D + 0.002);
  makeMesh(collarGeo, woodMat, 'pillar_base_collar', PILLAR_X, pillarBottom + 0.0015, 0);

  // 4. Horizontal support beam under tabletop
  const beamY = H - TOP_T - BEAM_H / 2;
  const beamGeo = new THREE.BoxGeometry(BEAM_L, BEAM_H, BEAM_D);
  makeMesh(beamGeo, woodMat, 'support_beam', BEAM_CENTER_X, beamY, 0);

  // Subtle end caps on beam
  const capGeo = new THREE.BoxGeometry(0.002, BEAM_H - 0.002, BEAM_D - 0.002);
  makeMesh(capGeo, woodMat, 'beam_left_cap', BEAM_X_MIN - 0.001, beamY, 0);
  makeMesh(capGeo, woodMat, 'beam_right_cap', BEAM_X_MAX + 0.001, beamY, 0);

  // 5. Round tabletop
  const topY = H - TOP_T / 2;
  const topGeo = new THREE.CylinderGeometry(TOP_R, TOP_R, TOP_T, 32);
  makeMesh(topGeo, woodMat, 'tabletop_disc', 0, topY, 0);

  // Subtle underside chamfer on tabletop
  const topChamferGeo = new THREE.CylinderGeometry(TOP_R, TOP_R - 0.004, 0.003, 32);
  makeMesh(topChamferGeo, woodMat, 'tabletop_bottom_chamfer', 0, H - TOP_T - 0.0015, 0);

  return group;
}
