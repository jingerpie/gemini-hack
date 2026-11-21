function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.45;
  const D = 0.38;
  const H = 0.78;

  const TOP_THICK = 0.028;
  const TOP_BEVEL = 0.004;
  const TOP_CORNER_R = 0.015;

  const LEG_INSET_X = 0.055;
  const LEG_INSET_Z = 0.04;
  const LEG_TOP_W = 0.046;
  const LEG_BOT_W = 0.03;
  const LEG_H = H - TOP_THICK;

  const APRON_H = 0.055;
  const APRON_T = 0.02;

  const SHELF_Y = 0.16;
  const SHELF_RAIL_H = 0.032;
  const SHELF_RAIL_T = 0.022;
  const SLAT_COUNT = 5;
  const SLAT_W = 0.034;
  const SLAT_T = 0.014;

  // Light natural oak material
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xcab08c,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Helper to create a rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Tabletop
  const topShape = createRoundedRectShape(
    W - TOP_BEVEL * 2,
    D - TOP_BEVEL * 2,
    TOP_CORNER_R
  );
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK - TOP_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: TOP_BEVEL,
    bevelSize: TOP_BEVEL,
    bevelSegments: 3,
    curveSegments: 8,
  });
  topGeo.rotateX(-Math.PI / 2);
  const tabletop = new THREE.Mesh(topGeo, oakMat);
  tabletop.name = 'tabletop';
  tabletop.position.y = H - TOP_THICK + TOP_BEVEL;
  group.add(tabletop);

  // 2. Four tapered square legs
  const legGeo = new THREE.CylinderGeometry(
    LEG_TOP_W / Math.SQRT2,
    LEG_BOT_W / Math.SQRT2,
    LEG_H,
    4,
    1
  );
  legGeo.rotateY(Math.PI / 4);

  const legX = W / 2 - LEG_INSET_X;
  const legZ = D / 2 - LEG_INSET_Z;

  const legPositions = [
    { name: 'leg_front_left', x: -legX, z: legZ },
    { name: 'leg_front_right', x: legX, z: legZ },
    { name: 'leg_back_left', x: -legX, z: -legZ },
    { name: 'leg_back_right', x: legX, z: -legZ },
  ];

  for (const pos of legPositions) {
    const leg = new THREE.Mesh(legGeo, oakMat);
    leg.name = pos.name;
    leg.position.set(pos.x, LEG_H / 2, pos.z);
    group.add(leg);
  }

  // 3. Upper apron rails
  const apronY = LEG_H - APRON_H / 2;
  const spanX = legX * 2;
  const spanZ = legZ * 2;

  const longApronGeo = new THREE.BoxGeometry(spanX, APRON_H, APRON_T);
  const shortApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, spanZ);

  const apronFront = new THREE.Mesh(longApronGeo, oakMat);
  apronFront.name = 'apron_front';
  apronFront.position.set(0, apronY, legZ);
  group.add(apronFront);

  const apronBack = new THREE.Mesh(longApronGeo, oakMat);
  apronBack.name = 'apron_back';
  apronBack.position.set(0, apronY, -legZ);
  group.add(apronBack);

  const apronLeft = new THREE.Mesh(shortApronGeo, oakMat);
  apronLeft.name = 'apron_left';
  apronLeft.position.set(-legX, apronY, 0);
  group.add(apronLeft);

  const apronRight = new THREE.Mesh(shortApronGeo, oakMat);
  apronRight.name = 'apron_right';
  apronRight.position.set(legX, apronY, 0);
  group.add(apronRight);

  // 4. Lower shelf frame rails
  const longShelfRailGeo = new THREE.BoxGeometry(
    spanX,
    SHELF_RAIL_H,
    SHELF_RAIL_T
  );
  const shortShelfRailGeo = new THREE.BoxGeometry(
    SHELF_RAIL_T,
    SHELF_RAIL_H,
    spanZ
  );

  const shelfRailFront = new THREE.Mesh(longShelfRailGeo, oakMat);
  shelfRailFront.name = 'shelf_rail_front';
  shelfRailFront.position.set(0, SHELF_Y, legZ);
  group.add(shelfRailFront);

  const shelfRailBack = new THREE.Mesh(longShelfRailGeo, oakMat);
  shelfRailBack.name = 'shelf_rail_back';
  shelfRailBack.position.set(0, SHELF_Y, -legZ);
  group.add(shelfRailBack);

  const shelfRailLeft = new THREE.Mesh(shortShelfRailGeo, oakMat);
  shelfRailLeft.name = 'shelf_rail_left';
  shelfRailLeft.position.set(-legX, SHELF_Y, 0);
  group.add(shelfRailLeft);

  const shelfRailRight = new THREE.Mesh(shortShelfRailGeo, oakMat);
  shelfRailRight.name = 'shelf_rail_right';
  shelfRailRight.position.set(legX, SHELF_Y, 0);
  group.add(shelfRailRight);

  // 5. Lower shelf slats (5 longitudinal slats)
  const slatSpanX = spanX - SHELF_RAIL_T * 0.5;
  const slatGeo = new THREE.BoxGeometry(slatSpanX, SLAT_T, SLAT_W);
  const innerZ = spanZ - SHELF_RAIL_T;
  const slatStepZ = (innerZ - SLAT_W) / (SLAT_COUNT + 1);
  const slatY = SHELF_Y + SHELF_RAIL_H / 2 - SLAT_T / 2;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const zOffset = -innerZ / 2 + SLAT_W / 2 + slatStepZ * (i + 1);
    const slat = new THREE.Mesh(slatGeo, oakMat);
    slat.name = `shelf_slat_${i + 1}`;
    slat.position.set(0, slatY, zOffset);
    group.add(slat);
  }

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
