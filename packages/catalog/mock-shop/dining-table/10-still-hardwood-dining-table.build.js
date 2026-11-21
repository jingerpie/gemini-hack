function build(THREE) {
  const group = new THREE.Group();

  const W = 1.10;
  const D = 1.10;
  const H = 0.75;
  const TOP_THICK = 0.032;
  const LEG_SIZE = 0.068;
  const LEG_INSET = 0.006;
  const APRON_H = 0.072;
  const APRON_THICK = 0.024;
  const APRON_RECESS = 0.008;
  const FOOT_H = 0.004;
  const PLANK_COUNT = 6;
  const PLANK_GAP = 0.0015;

  const woodMatA = new THREE.MeshStandardMaterial({
    color: 0x9c6b43,
    roughness: 0.55,
    metalness: 0.0
  });
  const woodMatB = new THREE.MeshStandardMaterial({
    color: 0x95643d,
    roughness: 0.58,
    metalness: 0.0
  });
  const woodMatC = new THREE.MeshStandardMaterial({
    color: 0xa27149,
    roughness: 0.52,
    metalness: 0.0
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2a2420,
    roughness: 0.9,
    metalness: 0.0
  });

  const plankMats = [woodMatA, woodMatB, woodMatC, woodMatA, woodMatC, woodMatB];

  // Tabletop planks (running front-to-back along Z)
  const totalGap = PLANK_GAP * (PLANK_COUNT - 1);
  const plankW = (W - totalGap) / PLANK_COUNT;
  const topY = H - TOP_THICK / 2;

  for (let i = 0; i < PLANK_COUNT; i++) {
    const px = -W / 2 + plankW / 2 + i * (plankW + PLANK_GAP);
    const geo = new THREE.BoxGeometry(plankW, TOP_THICK, D);
    const mesh = new THREE.Mesh(geo, plankMats[i % plankMats.length]);
    mesh.position.set(px, topY, 0);
    mesh.name = `tabletop_plank_${i + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Legs and foot pads
  const legH = H - TOP_THICK - FOOT_H;
  const legY = FOOT_H + legH / 2;
  const legOffsetX = W / 2 - LEG_INSET - LEG_SIZE / 2;
  const legOffsetZ = D / 2 - LEG_INSET - LEG_SIZE / 2;

  const legPositions = [
    { name: 'front_left', x: -legOffsetX, z: legOffsetZ },
    { name: 'front_right', x: legOffsetX, z: legOffsetZ },
    { name: 'back_left', x: -legOffsetX, z: -legOffsetZ },
    { name: 'back_right', x: legOffsetX, z: -legOffsetZ }
  ];

  const legGeo = new THREE.BoxGeometry(LEG_SIZE, legH, LEG_SIZE);
  const footGeo = new THREE.BoxGeometry(LEG_SIZE - 0.008, FOOT_H, LEG_SIZE - 0.008);

  for (let i = 0; i < legPositions.length; i++) {
    const pos = legPositions[i];

    const legMesh = new THREE.Mesh(legGeo, woodMatA);
    legMesh.position.set(pos.x, legY, pos.z);
    legMesh.name = `leg_${pos.name}`;
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    const footMesh = new THREE.Mesh(footGeo, footMat);
    footMesh.position.set(pos.x, FOOT_H / 2, pos.z);
    footMesh.name = `foot_pad_${pos.name}`;
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    group.add(footMesh);
  }

  // Apron rails
  const apronY = H - TOP_THICK - APRON_H / 2;
  const apronSpanX = W - 2 * LEG_INSET - 2 * LEG_SIZE + 0.004;
  const apronSpanZ = D - 2 * LEG_INSET - 2 * LEG_SIZE + 0.004;
  const apronOffsetZ = D / 2 - LEG_INSET - APRON_RECESS - APRON_THICK / 2;
  const apronOffsetX = W / 2 - LEG_INSET - APRON_RECESS - APRON_THICK / 2;

  const frontBackApronGeo = new THREE.BoxGeometry(apronSpanX, APRON_H, APRON_THICK);
  const sideApronGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, apronSpanZ);

  const frontApron = new THREE.Mesh(frontBackApronGeo, woodMatB);
  frontApron.position.set(0, apronY, apronOffsetZ);
  frontApron.name = 'apron_front';
  frontApron.castShadow = true;
  frontApron.receiveShadow = true;
  group.add(frontApron);

  const backApron = new THREE.Mesh(frontBackApronGeo, woodMatB);
  backApron.position.set(0, apronY, -apronOffsetZ);
  backApron.name = 'apron_back';
  backApron.castShadow = true;
  backApron.receiveShadow = true;
  group.add(backApron);

  const leftApron = new THREE.Mesh(sideApronGeo, woodMatB);
  leftApron.position.set(-apronOffsetX, apronY, 0);
  leftApron.name = 'apron_left';
  leftApron.castShadow = true;
  leftApron.receiveShadow = true;
  group.add(leftApron);

  const rightApron = new THREE.Mesh(sideApronGeo, woodMatB);
  rightApron.position.set(apronOffsetX, apronY, 0);
  rightApron.name = 'apron_right';
  rightApron.castShadow = true;
  rightApron.receiveShadow = true;
  group.add(rightApron);

  // Corner support blocks under tabletop
  const blockSize = 0.045;
  const blockH = APRON_H * 0.75;
  const blockY = H - TOP_THICK - blockH / 2;
  const blockGeo = new THREE.BoxGeometry(blockSize, blockH, blockSize);
  const blockOffsetX = legOffsetX - LEG_SIZE / 2 - blockSize / 2 + 0.012;
  const blockOffsetZ = legOffsetZ - LEG_SIZE / 2 - blockSize / 2 + 0.012;

  const blockPositions = [
    { name: 'front_left', x: -blockOffsetX, z: blockOffsetZ },
    { name: 'front_right', x: blockOffsetX, z: blockOffsetZ },
    { name: 'back_left', x: -blockOffsetX, z: -blockOffsetZ },
    { name: 'back_right', x: blockOffsetX, z: -blockOffsetZ }
  ];

  for (let i = 0; i < blockPositions.length; i++) {
    const bp = blockPositions[i];
    const blockMesh = new THREE.Mesh(blockGeo, woodMatC);
    blockMesh.position.set(bp.x, blockY, bp.z);
    blockMesh.name = `corner_block_${bp.name}`;
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    group.add(blockMesh);
  }

  return group;
}
