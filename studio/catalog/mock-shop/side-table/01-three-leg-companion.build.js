function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const TABLE_H = 0.48;
  const TOP_RADIUS = 0.23;
  const TOP_THICKNESS = 0.032;
  const LEG_TOP_W = 0.056;
  const LEG_TOP_D = 0.036;
  const LEG_BOT_W = 0.034;
  const LEG_BOT_D = 0.028;
  const LEG_TOP_R = 0.145;
  const LEG_BOT_R = 0.205;
  const APRON_H = 0.055;
  const APRON_T = 0.024;
  const PEG_R = 0.0045;
  const PEG_L = 0.006;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a34,
    roughness: 0.65,
    metalness: 0.02,
  });

  const pegMat = new THREE.MeshStandardMaterial({
    color: 0x5c381e,
    roughness: 0.72,
    metalness: 0.02,
  });

  // 1. Tabletop with rounded bullnose edge using LatheGeometry
  const edgeR = TOP_THICKNESS * 0.5;
  const flatR = TOP_RADIUS - edgeR;
  const topProfile = [
    new THREE.Vector2(0, TABLE_H - TOP_THICKNESS),
    new THREE.Vector2(flatR, TABLE_H - TOP_THICKNESS),
    new THREE.Vector2(flatR + edgeR * 0.707, TABLE_H - TOP_THICKNESS + edgeR * (1 - 0.707)),
    new THREE.Vector2(TOP_RADIUS, TABLE_H - edgeR),
    new THREE.Vector2(flatR + edgeR * 0.707, TABLE_H - edgeR * (1 - 0.707)),
    new THREE.Vector2(flatR, TABLE_H),
    new THREE.Vector2(0, TABLE_H),
  ];
  const topGeo = new THREE.LatheGeometry(topProfile, 32);
  const topMesh = new THREE.Mesh(topGeo, woodMat);
  topMesh.name = 'table_top';
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // 2. Center hub where the 3 radial aprons meet
  const hubGeo = new THREE.CylinderGeometry(APRON_T * 0.85, APRON_T * 0.85, APRON_H, 16);
  const hubMesh = new THREE.Mesh(hubGeo, woodMat);
  hubMesh.name = 'apron_center_hub';
  hubMesh.position.set(0, TABLE_H - TOP_THICKNESS - APRON_H * 0.5 + 0.002, 0);
  hubMesh.castShadow = true;
  hubMesh.receiveShadow = true;
  group.add(hubMesh);

  // 3. Circular apron ring under the top
  const ringInnerR = LEG_TOP_R - APRON_T * 0.55;
  const ringOuterR = LEG_TOP_R + APRON_T * 0.25;
  const ringYTop = TABLE_H - TOP_THICKNESS + 0.002;
  const ringYBot = ringYTop - APRON_H * 0.85;
  const ringProfile = [
    new THREE.Vector2(ringInnerR, ringYBot),
    new THREE.Vector2(ringOuterR, ringYBot),
    new THREE.Vector2(ringOuterR, ringYTop),
    new THREE.Vector2(ringInnerR, ringYTop),
    new THREE.Vector2(ringInnerR, ringYBot),
  ];
  const apronRingGeo = new THREE.LatheGeometry(ringProfile, 32);
  const apronRingMesh = new THREE.Mesh(apronRingGeo, woodMat);
  apronRingMesh.name = 'apron_ring';
  apronRingMesh.castShadow = true;
  apronRingMesh.receiveShadow = true;
  group.add(apronRingMesh);

  // Leg geometry: tapered rectangular prism centered at local origin
  const legTopY = TABLE_H - TOP_THICKNESS * 0.5;
  const legBotY = 0;
  const legDeltaY = legTopY - legBotY;
  const legDeltaR = LEG_BOT_R - LEG_TOP_R;
  const legLen = Math.sqrt(legDeltaY * legDeltaY + legDeltaR * legDeltaR);
  const splayAngle = Math.atan2(legDeltaR, legDeltaY);

  const legGeo = new THREE.BoxGeometry(LEG_TOP_W, legLen, LEG_TOP_D, 1, 1, 1);
  const posAttr = legGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = (legLen * 0.5 - y) / legLen; // 0 at top, 1 at bottom
    const scaleX = 1 - t * (1 - LEG_BOT_W / LEG_TOP_W);
    const scaleZ = 1 - t * (1 - LEG_BOT_D / LEG_TOP_D);
    posAttr.setX(i, posAttr.getX(i) * scaleX);
    posAttr.setZ(i, posAttr.getZ(i) * scaleZ);
  }
  legGeo.computeVertexNormals();

  // 4. Three splayed legs evenly spaced (120 degrees apart)
  const legAngles = [
    Math.PI / 6,       // front-right (+X, +Z)
    (5 * Math.PI) / 6, // front-left (-X, +Z)
    (3 * Math.PI) / 2, // back-center (0, -Z)
  ];

  const pegGeo = new THREE.CylinderGeometry(PEG_R, PEG_R, PEG_L, 12);

  legAngles.forEach((angle, idx) => {
    const legHolder = new THREE.Group();
    legHolder.rotation.y = -angle + Math.PI / 2;

    const midR = (LEG_TOP_R + LEG_BOT_R) * 0.5;
    const midY = (legTopY + legBotY) * 0.5;

    const legMesh = new THREE.Mesh(legGeo, woodMat);
    legMesh.name = `leg_${idx + 1}`;
    legMesh.position.set(0, midY, midR);
    legMesh.rotation.x = -splayAngle; // splay outward toward the floor
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legHolder.add(legMesh);

    // 4 wooden dowel pegs on the outer face of each leg near the top
    const pegOffsets = [
      [-LEG_TOP_W * 0.24, legLen * 0.5 - 0.028],
      [LEG_TOP_W * 0.24, legLen * 0.5 - 0.028],
      [-LEG_TOP_W * 0.24, legLen * 0.5 - 0.052],
      [LEG_TOP_W * 0.24, legLen * 0.5 - 0.052],
    ];

    pegOffsets.forEach(([px, py], pIdx) => {
      const pegMesh = new THREE.Mesh(pegGeo, pegMat);
      pegMesh.name = `leg_${idx + 1}_peg_${pIdx + 1}`;
      pegMesh.rotation.x = Math.PI / 2;
      pegMesh.position.set(px, py, LEG_TOP_D * 0.5 + PEG_L * 0.25);
      pegMesh.castShadow = true;
      pegMesh.receiveShadow = true;
      legMesh.add(pegMesh);
    });

    // Radial apron connecting center hub to this leg
    const apronLen = LEG_TOP_R + 0.01;
    const apronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, apronLen);
    const apronMesh = new THREE.Mesh(apronGeo, woodMat);
    apronMesh.name = `apron_${idx + 1}`;
    apronMesh.position.set(
      0,
      TABLE_H - TOP_THICKNESS - APRON_H * 0.5 + 0.002,
      apronLen * 0.5
    );
    apronMesh.castShadow = true;
    apronMesh.receiveShadow = true;
    legHolder.add(apronMesh);

    group.add(legHolder);
  });

  return group;
}
