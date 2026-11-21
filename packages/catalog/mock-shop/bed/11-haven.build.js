function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const MATTRESS_W = 1.52;
  const MATTRESS_L = 2.03;
  const CLEARANCE = 0.02;
  const INNER_W = MATTRESS_W + CLEARANCE;
  const INNER_L = MATTRESS_L + CLEARANCE;

  const LEG_W = 0.055;
  const RAIL_T = 0.035;
  const RAIL_H = 0.14;
  const LEG_CLEARANCE = 0.20;
  const FRAME_TOP_Y = LEG_CLEARANCE + RAIL_H;
  const HEADBOARD_H = 1.05;

  const TOTAL_W = INNER_W + 2 * LEG_W;
  const TOTAL_L = INNER_L + 2 * LEG_W;

  const SLAT_COUNT = 14;
  const SLAT_W = INNER_W - 0.01;
  const SLAT_H = 0.018;
  const SLAT_D = 0.065;
  const SLAT_Y = FRAME_TOP_Y - 0.045;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a986,
    roughness: 0.65,
    metalness: 0.0,
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xdecbb1,
    roughness: 0.75,
    metalness: 0.0,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee8,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const xLeg = TOTAL_W / 2 - LEG_W / 2;
  const zFront = TOTAL_L / 2 - LEG_W / 2;
  const zBack = -TOTAL_L / 2 + LEG_W / 2;

  // Front legs
  const frontLegGeom = new THREE.BoxGeometry(LEG_W, FRAME_TOP_Y, LEG_W);
  addMesh(frontLegGeom, oakMat, 'front_left_leg', -xLeg, FRAME_TOP_Y / 2, zFront);
  addMesh(frontLegGeom, oakMat, 'front_right_leg', xLeg, FRAME_TOP_Y / 2, zFront);

  // Back legs / headboard posts
  const backPostGeom = new THREE.BoxGeometry(LEG_W, HEADBOARD_H, LEG_W);
  addMesh(backPostGeom, oakMat, 'back_left_post', -xLeg, HEADBOARD_H / 2, zBack);
  addMesh(backPostGeom, oakMat, 'back_right_post', xLeg, HEADBOARD_H / 2, zBack);

  // Center support leg
  const centerLegH = SLAT_Y - SLAT_H / 2 - 0.04;
  const centerLegGeom = new THREE.BoxGeometry(0.045, centerLegH, 0.045);
  addMesh(centerLegGeom, oakMat, 'center_support_leg', 0, centerLegH / 2, 0);

  // Center support beam
  const centerBeamGeom = new THREE.BoxGeometry(0.045, 0.04, INNER_L);
  addMesh(centerBeamGeom, oakMat, 'center_support_beam', 0, SLAT_Y - SLAT_H / 2 - 0.02, 0);

  // Side rails
  const sideRailGeom = new THREE.BoxGeometry(RAIL_T, RAIL_H, INNER_L);
  const railY = LEG_CLEARANCE + RAIL_H / 2;
  const sideRailX = TOTAL_W / 2 - RAIL_T / 2 - (LEG_W - RAIL_T) / 2;
  addMesh(sideRailGeom, oakMat, 'left_side_rail', -sideRailX, railY, 0);
  addMesh(sideRailGeom, oakMat, 'right_side_rail', sideRailX, railY, 0);

  // Front and back rails
  const endRailGeom = new THREE.BoxGeometry(INNER_W, RAIL_H, RAIL_T);
  const frontRailZ = TOTAL_L / 2 - RAIL_T / 2 - (LEG_W - RAIL_T) / 2;
  const backRailZ = -TOTAL_L / 2 + RAIL_T / 2 + (LEG_W - RAIL_T) / 2;
  addMesh(endRailGeom, oakMat, 'front_rail', 0, railY, frontRailZ);
  addMesh(endRailGeom, oakMat, 'back_rail', 0, railY, backRailZ);

  // Upholstered headboard panel
  const hbPanelH = HEADBOARD_H - FRAME_TOP_Y;
  const hbPanelD = 0.06;
  const hbPanelGeom = new THREE.BoxGeometry(INNER_W, hbPanelH, hbPanelD);
  addMesh(
    hbPanelGeom,
    fabricMat,
    'headboard_cushion',
    0,
    FRAME_TOP_Y + hbPanelH / 2,
    zBack + 0.005
  );

  // Wooden slats
  const slatGeom = new THREE.BoxGeometry(SLAT_W, SLAT_H, SLAT_D);
  const usableL = INNER_L - 0.10;
  const startZ = -usableL / 2;
  const stepZ = usableL / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const z = startZ + i * stepZ;
    addMesh(slatGeom, slatMat, `slat_${i + 1}`, 0, SLAT_Y, z);
  }

  return group;
}
