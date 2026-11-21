function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world scale: Queen-size storage bed)
  const W = 1.68;
  const D = 2.12;
  const H = 1.05;
  const POST_W = 0.03;
  const FLOOR_GAP = 0.025;
  const RAIL_H = 0.29;
  const RAIL_THICK = 0.06;
  const HB_H = 0.48;
  const HB_THICK = 0.065;
  const HB_TOP = H - 0.02;
  const SLAT_FRAME_Y = FLOOR_GAP + RAIL_H - 0.04;
  const SLAT_BAR_H = 0.03;
  const SLAT_BAR_W = 0.03;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.88,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3c,
    roughness: 0.42,
    metalness: 0.65
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.65,
    metalness: 0.05
  });

  const slatWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc29b6c,
    roughness: 0.6,
    metalness: 0.02
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 4 Metal Corner Posts
  const frontPostH = FLOOR_GAP + RAIL_H;
  const backPostH = H;
  const postGeoFront = new THREE.BoxGeometry(POST_W, frontPostH, POST_W);
  const postGeoBack = new THREE.BoxGeometry(POST_W, backPostH, POST_W);

  const xPost = W / 2 - POST_W / 2;
  const zFrontPost = D / 2 - POST_W / 2;
  const zBackPost = -D / 2 + POST_W / 2;

  addMesh(postGeoFront, metalMat, 'front_left_post', -xPost, frontPostH / 2, zFrontPost);
  addMesh(postGeoFront, metalMat, 'front_right_post', xPost, frontPostH / 2, zFrontPost);
  addMesh(postGeoBack, metalMat, 'back_left_post', -xPost, backPostH / 2, zBackPost);
  addMesh(postGeoBack, metalMat, 'back_right_post', xPost, backPostH / 2, zBackPost);

  // Upholstered Headboard (between back posts)
  const hbW = W - POST_W * 2;
  const hbGeo = new THREE.BoxGeometry(hbW, HB_H, HB_THICK);
  addMesh(hbGeo, fabricMat, 'headboard', 0, HB_TOP - HB_H / 2, -D / 2 + HB_THICK / 2);

  // Upholstered Footboard (+Z)
  const fbW = W - POST_W * 2;
  const fbGeo = new THREE.BoxGeometry(fbW, RAIL_H, RAIL_THICK);
  addMesh(fbGeo, fabricMat, 'footboard', 0, FLOOR_GAP + RAIL_H / 2, D / 2 - RAIL_THICK / 2);

  // Upholstered Side Rails (-X and +X)
  const sideRailLen = D - POST_W * 2;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_THICK, RAIL_H, sideRailLen);
  addMesh(sideRailGeo, fabricMat, 'left_side_rail', -W / 2 + RAIL_THICK / 2, FLOOR_GAP + RAIL_H / 2, 0);
  addMesh(sideRailGeo, fabricMat, 'right_side_rail', W / 2 - RAIL_THICK / 2, FLOOR_GAP + RAIL_H / 2, 0);

  // Back lower rail (connects back posts behind storage)
  const backRailGeo = new THREE.BoxGeometry(fbW, RAIL_H, RAIL_THICK);
  addMesh(backRailGeo, fabricMat, 'back_lower_rail', 0, FLOOR_GAP + RAIL_H / 2, -D / 2 + RAIL_THICK / 2);

  // Storage Compartment Floor & Central Divider
  const innerW = W - RAIL_THICK * 2;
  const innerD = D - RAIL_THICK * 2;
  const floorThick = 0.02;
  const storageFloorGeo = new THREE.BoxGeometry(innerW, floorThick, innerD);
  addMesh(storageFloorGeo, woodDarkMat, 'storage_floor', 0, FLOOR_GAP + floorThick / 2, 0);

  const dividerH = RAIL_H - floorThick - 0.05;
  const dividerGeo = new THREE.BoxGeometry(0.025, dividerH, innerD);
  addMesh(dividerGeo, woodDarkMat, 'storage_center_divider', 0, FLOOR_GAP + floorThick + dividerH / 2, 0);

  // Slatted Base Metal Frame (closed / at rest)
  const frameW = innerW - 0.01;
  const frameD = innerD - 0.01;
  const frameFrontBackGeo = new THREE.BoxGeometry(frameW, SLAT_BAR_H, SLAT_BAR_W);
  const frameSideGeo = new THREE.BoxGeometry(SLAT_BAR_W, SLAT_BAR_H, frameD - SLAT_BAR_W * 2);

  addMesh(frameFrontBackGeo, metalMat, 'slat_frame_front', 0, SLAT_FRAME_Y, frameD / 2 - SLAT_BAR_W / 2);
  addMesh(frameFrontBackGeo, metalMat, 'slat_frame_back', 0, SLAT_FRAME_Y, -frameD / 2 + SLAT_BAR_W / 2);
  addMesh(frameSideGeo, metalMat, 'slat_frame_left', -frameW / 2 + SLAT_BAR_W / 2, SLAT_FRAME_Y, 0);
  addMesh(frameSideGeo, metalMat, 'slat_frame_right', frameW / 2 - SLAT_BAR_W / 2, SLAT_FRAME_Y, 0);
  addMesh(frameSideGeo, metalMat, 'slat_frame_center', 0, SLAT_FRAME_Y, 0);

  // Wooden Slats (8 per side = 16 slats)
  const numSlatsPerSide = 8;
  const slatW = (frameW - SLAT_BAR_W * 3) / 2;
  const slatD = 0.065;
  const slatH = 0.014;
  const slatGeo = new THREE.BoxGeometry(slatW, slatH, slatD);
  const slatSpanD = frameD - SLAT_BAR_W * 2 - 0.08;
  const slatStep = slatSpanD / (numSlatsPerSide - 1);
  const slatStartZ = -slatSpanD / 2;
  const leftSlatX = -SLAT_BAR_W / 2 - slatW / 2;
  const rightSlatX = SLAT_BAR_W / 2 + slatW / 2;
  const slatY = SLAT_FRAME_Y + SLAT_BAR_H / 2 + slatH / 2 - 0.004;

  for (let i = 0; i < numSlatsPerSide; i++) {
    const z = slatStartZ + i * slatStep;
    addMesh(slatGeo, slatWoodMat, `slat_left_${i + 1}`, leftSlatX, slatY, z);
    addMesh(slatGeo, slatWoodMat, `slat_right_${i + 1}`, rightSlatX, slatY, z);
  }

  return group;
}
