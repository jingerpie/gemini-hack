function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.60;
  const OUTER_R = DIAMETER / 2; // 0.30 m
  const TOTAL_H = 0.78;

  const CANOPY_R = 0.07;
  const CANOPY_H = 0.025;
  const CANOPY_Y = TOTAL_H - CANOPY_H / 2;

  const RING_TUBE_R = 0.012;
  const TOP_RING_R = OUTER_R - RING_TUBE_R; // 0.288 m -> outer diameter = 0.60 m
  const TOP_RING_Y = 0.37;

  const MID_RING_R = 0.205;
  const MID_RING_Y = 0.25;

  const BOT_RING_R = 0.135;
  const BOT_RING_Y = 0.135;

  const CRYSTAL_H = 0.135;
  const CRYSTAL_R = 0.026;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89b5e,
    roughness: 0.32,
    metalness: 0.85
  });

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2
  });

  function addMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Canopy plate at top
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 24),
    brassMat
  );
  canopy.position.set(0, CANOPY_Y, 0);
  addMesh(canopy, "canopy_plate");

  // Canopy loop
  const canopyLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.014, 0.004, 8, 16),
    brassMat
  );
  canopyLoop.position.set(0, TOTAL_H - CANOPY_H - 0.008, 0);
  addMesh(canopyLoop, "canopy_loop");

  // Chain links (5 overlapping vertical links)
  const chainStartY = TOTAL_H - CANOPY_H - 0.036;
  const chainStep = 0.058;
  for (let i = 0; i < 5; i++) {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.026, 0.0045, 8, 16),
      brassMat
    );
    link.scale.set(0.75, 1.35, 1);
    link.position.set(0, chainStartY - i * chainStep, 0);
    if (i % 2 === 1) {
      link.rotation.y = Math.PI / 2;
    }
    addMesh(link, "chain_link_" + (i + 1));
  }

  // Fixture top loop
  const fixtureLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.005, 8, 16),
    brassMat
  );
  fixtureLoop.position.set(0, TOP_RING_Y + 0.035, 0);
  addMesh(fixtureLoop, "fixture_top_loop");

  // Central stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12),
    brassMat
  );
  stem.position.set(0, TOP_RING_Y - 0.04, 0);
  addMesh(stem, "central_stem");

  // Top brass ring (defines 0.60 m outer diameter)
  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(TOP_RING_R, RING_TUBE_R, 10, 32),
    brassMat
  );
  topRing.rotation.x = Math.PI / 2;
  topRing.scale.set(1, 1, 1.5);
  topRing.position.set(0, TOP_RING_Y, 0);
  addMesh(topRing, "top_brass_ring");

  // Middle brass ring
  const midRing = new THREE.Mesh(
    new THREE.TorusGeometry(MID_RING_R, 0.009, 8, 28),
    brassMat
  );
  midRing.rotation.x = Math.PI / 2;
  midRing.position.set(0, MID_RING_Y, 0);
  addMesh(midRing, "middle_brass_ring");

  // Bottom brass ring
  const botRing = new THREE.Mesh(
    new THREE.TorusGeometry(BOT_RING_R, 0.008, 8, 24),
    brassMat
  );
  botRing.rotation.x = Math.PI / 2;
  botRing.position.set(0, BOT_RING_Y, 0);
  addMesh(botRing, "bottom_brass_ring");

  // Emissive bulbs inside the upper tier
  const bulbGeo = new THREE.SphereGeometry(0.024, 12, 10);
  const bulbRadius = 0.09;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(
      Math.cos(angle) * bulbRadius,
      TOP_RING_Y - 0.06,
      Math.sin(angle) * bulbRadius
    );
    addMesh(bulb, "emit_bulb_" + (i + 1));
  }

  // Crystal prism geometry (hexagonal faceted prism)
  const crystalGeo = new THREE.CylinderGeometry(CRYSTAL_R, CRYSTAL_R, CRYSTAL_H, 6);

  // Top tier crystals (10)
  const topCrystalY = TOP_RING_Y - CRYSTAL_H / 2;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(
      Math.cos(angle) * (TOP_RING_R - 0.01),
      topCrystalY,
      Math.sin(angle) * (TOP_RING_R - 0.01)
    );
    crystal.rotation.y = -angle;
    addMesh(crystal, "crystal_top_" + (i + 1));
  }

  // Middle tier crystals (8)
  const midCrystalY = MID_RING_Y - CRYSTAL_H / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(
      Math.cos(angle) * MID_RING_R,
      midCrystalY,
      Math.sin(angle) * MID_RING_R
    );
    crystal.rotation.y = -angle;
    addMesh(crystal, "crystal_mid_" + (i + 1));
  }

  // Bottom tier crystals (6) - bottom touches y = 0
  const botCrystalY = CRYSTAL_H / 2;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(
      Math.cos(angle) * BOT_RING_R,
      botCrystalY,
      Math.sin(angle) * BOT_RING_R
    );
    crystal.rotation.y = -angle;
    addMesh(crystal, "crystal_bot_" + (i + 1));
  }

  return group;
}
