function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.66;
  const D = 2.08;
  const LEG_H = 0.28;
  const LEG_W = 0.075;
  const RAIL_H = 0.13;
  const RAIL_T = 0.035;
  const SLAT_H = 0.02;
  const SLAT_W = 0.09;
  const MATT_W = 1.58;
  const MATT_D = 2.00;
  const MATT_H = 0.22;

  const RAIL_Y = LEG_H - RAIL_H / 2;
  const SLAT_Y = LEG_H - 0.04;
  const MATT_Y = SLAT_Y + SLAT_H / 2 + MATT_H / 2 - 0.005;
  const MATT_TOP = MATT_Y + MATT_H / 2;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xa87950,
    roughness: 0.6,
    metalness: 0.0
  });

  const greyLinenMat = new THREE.MeshStandardMaterial({
    color: 0x5e626b,
    roughness: 0.9,
    metalness: 0.0
  });

  const mustardLinenMat = new THREE.MeshStandardMaterial({
    color: 0xc2a878,
    roughness: 0.9,
    metalness: 0.0
  });

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xa64432,
    roughness: 0.88,
    metalness: 0.0
  });

  function makeMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function makeSoftBoxGeo(w, h, d, radius, bevel, bevelSegs = 4) {
    const shape = makeRoundedRectShape(w - bevel * 2, h - bevel * 2, radius);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.005, d - bevel * 2),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: bevelSegs,
      curveSegments: 8
    });
    geo.center();
    return geo;
  }

  function makePillowGeo(w, h, d) {
    const geo = new THREE.SphereGeometry(0.5, 24, 16);
    geo.scale(w, h, d);
    return geo;
  }

  // 1. Legs (4 corners + 1 center support)
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const legX = W / 2 - LEG_W / 2;
  const legZ = D / 2 - LEG_W / 2;

  makeMesh(legGeo, oakMat, 'leg_front_left', -legX, LEG_H / 2, legZ);
  makeMesh(legGeo, oakMat, 'leg_front_right', legX, LEG_H / 2, legZ);
  makeMesh(legGeo, oakMat, 'leg_back_left', -legX, LEG_H / 2, -legZ);
  makeMesh(legGeo, oakMat, 'leg_back_right', legX, LEG_H / 2, -legZ);

  const centerLegH = SLAT_Y - SLAT_H / 2;
  const centerLegGeo = new THREE.BoxGeometry(LEG_W * 0.85, centerLegH, LEG_W * 0.85);
  makeMesh(centerLegGeo, oakMat, 'leg_center_support', 0, centerLegH / 2, 0);

  // 2. Bed frame rails
  const frontBackRailGeo = new THREE.BoxGeometry(W - LEG_W * 2, RAIL_H, RAIL_T);
  makeMesh(frontBackRailGeo, oakMat, 'rail_front', 0, RAIL_Y, D / 2 - RAIL_T / 2);
  makeMesh(frontBackRailGeo, oakMat, 'rail_back', 0, RAIL_Y, -D / 2 + RAIL_T / 2);

  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, D - LEG_W * 2);
  makeMesh(sideRailGeo, oakMat, 'rail_left', -W / 2 + RAIL_T / 2, RAIL_Y, 0);
  makeMesh(sideRailGeo, oakMat, 'rail_right', W / 2 - RAIL_T / 2, RAIL_Y, 0);

  // Center longitudinal beam
  const centerBeamGeo = new THREE.BoxGeometry(0.05, 0.05, D - RAIL_T * 2);
  makeMesh(centerBeamGeo, oakMat, 'center_beam', 0, SLAT_Y - SLAT_H / 2 - 0.025, 0);

  // 3. Wooden slats
  const slatGeo = new THREE.BoxGeometry(W - RAIL_T * 2, SLAT_H, SLAT_W);
  const slatCount = 6;
  const slatSpan = D - 0.36;
  for (let i = 0; i < slatCount; i++) {
    const zPos = -slatSpan / 2 + (slatSpan / (slatCount - 1)) * i;
    makeMesh(slatGeo, oakMat, `slat_${i + 1}`, 0, SLAT_Y, zPos);
  }

  // 4. Mattress (soft rounded grey-blue fitted sheet)
  const mattressGeo = makeSoftBoxGeo(MATT_W, MATT_D, MATT_H, 0.07, 0.035, 4);
  makeMesh(mattressGeo, greyLinenMat, 'mattress', 0, MATT_Y, 0, Math.PI / 2, 0, 0);

  // 5. Grey-blue duvet base layer (soft rounded)
  const duvetBaseGeo = makeSoftBoxGeo(MATT_W + 0.04, MATT_D - 0.12, 0.05, 0.08, 0.022, 4);
  makeMesh(duvetBaseGeo, greyLinenMat, 'duvet_base', 0, MATT_TOP + 0.015, 0.05, Math.PI / 2, 0, 0);

  // 6. Mustard/beige folded duvet (lower 2/3 of bed, soft rounded)
  const beigeDuvetW = MATT_W + 0.08;
  const beigeDuvetD = 1.28;
  const beigeDuvetZ = MATT_D / 2 - beigeDuvetD / 2 - 0.02;
  const beigeDuvetGeo = makeSoftBoxGeo(beigeDuvetW, beigeDuvetD, 0.055, 0.08, 0.024, 4);
  makeMesh(beigeDuvetGeo, mustardLinenMat, 'duvet_mustard_top', 0, MATT_TOP + 0.04, beigeDuvetZ, Math.PI / 2, 0, 0);

  // Soft vertical side panels with rounded edges folding down over the sides
  const drapeGeo = makeSoftBoxGeo(0.035, beigeDuvetD - 0.08, 0.16, 0.015, 0.015, 4);
  makeMesh(drapeGeo, mustardLinenMat, 'duvet_mustard_drape_left', -beigeDuvetW / 2 + 0.012, MATT_TOP - 0.02, beigeDuvetZ, Math.PI / 2, 0, 0.04);
  makeMesh(drapeGeo, mustardLinenMat, 'duvet_mustard_drape_right', beigeDuvetW / 2 - 0.012, MATT_TOP - 0.02, beigeDuvetZ, Math.PI / 2, 0, -0.04);

  // 7. Terracotta/rust throw blanket on front-right corner (soft rounded)
  const throwGeo = makeSoftBoxGeo(0.66, 0.50, 0.036, 0.12, 0.016, 4);
  makeMesh(throwGeo, terracottaMat, 'throw_terracotta', 0.44, MATT_TOP + 0.068, 0.56, Math.PI / 2, -0.06, 0);

  const throwDrapeGeo = makeSoftBoxGeo(0.034, 0.44, 0.13, 0.014, 0.014, 4);
  makeMesh(throwDrapeGeo, terracottaMat, 'throw_terracotta_drape', beigeDuvetW / 2 + 0.002, MATT_TOP + 0.005, 0.56, Math.PI / 2, -0.04, -0.06);

  // 8. Soft plump pillows at the back (-Z) using scaled spheres
  const backPillowGeo = makePillowGeo(0.74, 0.44, 0.18);
  const backPillowY = MATT_TOP + 0.19;
  const backPillowZ = -MATT_D / 2 + 0.16;
  makeMesh(backPillowGeo, greyLinenMat, 'pillow_back_left', -0.39, backPillowY, backPillowZ, -0.22, 0.03, 0);
  makeMesh(backPillowGeo, greyLinenMat, 'pillow_back_right', 0.39, backPillowY, backPillowZ, -0.22, -0.03, 0);

  const frontPillowGeo = makePillowGeo(0.68, 0.35, 0.16);
  const frontPillowY = MATT_TOP + 0.15;
  const frontPillowZ = -MATT_D / 2 + 0.30;
  makeMesh(frontPillowGeo, mustardLinenMat, 'pillow_front_left', -0.38, frontPillowY, frontPillowZ, -0.32, 0.05, 0);
  makeMesh(frontPillowGeo, terracottaMat, 'pillow_front_right', 0.38, frontPillowY, frontPillowZ, -0.32, -0.05, 0);

  return group;
}
