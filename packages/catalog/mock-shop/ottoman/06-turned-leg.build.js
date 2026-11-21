function build(THREE) {
  const group = new THREE.Group();

  const W = 0.54;
  const D = 0.44;
  const H = 0.36;

  const LEG_TURNED_H = 0.20;
  const BLOCK_H = 0.07;
  const BLOCK_W = 0.055;
  const APRON_H = 0.062;
  const APRON_THICK = 0.024;
  const CUSHION_H = H - LEG_TURNED_H - BLOCK_H; // 0.09

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2415,
    roughness: 0.45,
    metalness: 0.05
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x254630,
    roughness: 0.88,
    metalness: 0.0
  });

  // Turned leg profile (bottom y=0 to top y=LEG_TURNED_H)
  const legPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.015, 0.0),
    new THREE.Vector2(0.019, 0.022),
    new THREE.Vector2(0.016, 0.032),
    new THREE.Vector2(0.023, 0.042),
    new THREE.Vector2(0.016, 0.052),
    new THREE.Vector2(0.018, 0.075),
    new THREE.Vector2(0.027, 0.115),
    new THREE.Vector2(0.025, 0.138),
    new THREE.Vector2(0.016, 0.152),
    new THREE.Vector2(0.025, 0.165),
    new THREE.Vector2(0.017, 0.178),
    new THREE.Vector2(0.026, 0.190),
    new THREE.Vector2(0.022, LEG_TURNED_H),
    new THREE.Vector2(0.0, LEG_TURNED_H)
  ];
  const legGeo = new THREE.LatheGeometry(legPoints, 24);
  const blockGeo = new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_W);

  const legOffsetX = W / 2 - BLOCK_W / 2 - 0.005;
  const legOffsetZ = D / 2 - BLOCK_W / 2 - 0.005;

  const corners = [
    { name: 'front_left', x: -legOffsetX, z: legOffsetZ },
    { name: 'front_right', x: legOffsetX, z: legOffsetZ },
    { name: 'back_left', x: -legOffsetX, z: -legOffsetZ },
    { name: 'back_right', x: legOffsetX, z: -legOffsetZ }
  ];

  corners.forEach((c) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.name = `leg_${c.name}`;
    leg.position.set(c.x, 0, c.z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);

    const block = new THREE.Mesh(blockGeo, woodMat);
    block.name = `corner_block_${c.name}`;
    block.position.set(c.x, LEG_TURNED_H + BLOCK_H / 2, c.z);
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  });

  // Apron rails & moldings
  const apronY = LEG_TURNED_H + BLOCK_H / 2;
  const railSpanX = legOffsetX * 2 - BLOCK_W + 0.004;
  const railSpanZ = legOffsetZ * 2 - BLOCK_W + 0.004;

  const railConfigs = [
    { name: 'front', w: railSpanX, d: APRON_THICK, x: 0, z: legOffsetZ, rotY: 0 },
    { name: 'back', w: railSpanX, d: APRON_THICK, x: 0, z: -legOffsetZ, rotY: 0 },
    { name: 'left', w: railSpanZ, d: APRON_THICK, x: -legOffsetX, z: 0, rotY: Math.PI / 2 },
    { name: 'right', w: railSpanZ, d: APRON_THICK, x: legOffsetX, z: 0, rotY: Math.PI / 2 }
  ];

  railConfigs.forEach((r) => {
    const railGeo = new THREE.BoxGeometry(r.w, APRON_H, r.d);
    const rail = new THREE.Mesh(railGeo, woodMat);
    rail.name = `apron_rail_${r.name}`;
    rail.position.set(r.x, apronY, r.z);
    rail.rotation.y = r.rotY;
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);

    const moldingGeo = new THREE.BoxGeometry(r.w, 0.012, r.d + 0.008);
    const bottomMolding = new THREE.Mesh(moldingGeo, woodMat);
    bottomMolding.name = `apron_bottom_molding_${r.name}`;
    bottomMolding.position.set(r.x, apronY - APRON_H / 2 + 0.006, r.z);
    bottomMolding.rotation.y = r.rotY;
    bottomMolding.castShadow = true;
    bottomMolding.receiveShadow = true;
    group.add(bottomMolding);

    const topMolding = new THREE.Mesh(moldingGeo, woodMat);
    topMolding.name = `apron_top_molding_${r.name}`;
    topMolding.position.set(r.x, apronY + APRON_H / 2 - 0.006, r.z);
    topMolding.rotation.y = r.rotY;
    topMolding.castShadow = true;
    topMolding.receiveShadow = true;
    group.add(topMolding);
  });

  // Upholstered cushion
  const cushionBaseY = LEG_TURNED_H + BLOCK_H - 0.004;
  const cW = W - 0.02;
  const cD = D - 0.02;
  const cornerR = 0.028;

  const cushionShape = new THREE.Shape();
  cushionShape.moveTo(-cW / 2 + cornerR, -cD / 2);
  cushionShape.lineTo(cW / 2 - cornerR, -cD / 2);
  cushionShape.quadraticCurveTo(cW / 2, -cD / 2, cW / 2, -cD / 2 + cornerR);
  cushionShape.lineTo(cW / 2, cD / 2 - cornerR);
  cushionShape.quadraticCurveTo(cW / 2, cD / 2, cW / 2 - cornerR, cD / 2);
  cushionShape.lineTo(-cW / 2 + cornerR, cD / 2);
  cushionShape.quadraticCurveTo(-cW / 2, cD / 2, -cW / 2, cD / 2 - cornerR);
  cushionShape.lineTo(-cW / 2, -cD / 2 + cornerR);
  cushionShape.quadraticCurveTo(-cW / 2, -cD / 2, -cW / 2 + cornerR, -cD / 2);

  const bevelSize = 0.016;
  const extrudeDepth = CUSHION_H - bevelSize * 2 - 0.012;

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize
  });
  cushionGeo.rotateX(-Math.PI / 2);

  const cushionBase = new THREE.Mesh(cushionGeo, fabricMat);
  cushionBase.name = 'cushion_base';
  cushionBase.position.set(0, cushionBaseY + bevelSize, 0);
  cushionBase.castShadow = true;
  cushionBase.receiveShadow = true;
  group.add(cushionBase);

  // Subtle domed top for plump upholstered look
  const domeGeo = new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, fabricMat);
  dome.name = 'cushion_dome';
  dome.scale.set(cW * 0.96, 0.028, cD * 0.96);
  dome.position.set(0, cushionBaseY + extrudeDepth + bevelSize * 2 - 0.008, 0);
  dome.castShadow = true;
  dome.receiveShadow = true;
  group.add(dome);

  return group;
}
