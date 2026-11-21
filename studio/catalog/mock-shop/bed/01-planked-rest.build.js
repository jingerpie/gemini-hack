function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - Queen bed frame
  const W = 1.60;
  const D = 2.10;
  const HEAD_H = 1.15;
  const FOOT_H = 0.46;

  const POST_W = 0.085;
  const POST_D = 0.085;
  const RAIL_T = 0.035;

  const SIDE_RAIL_H = 0.16;
  const SIDE_RAIL_Y = 0.28; // center Y of side rails

  const SLAT_COUNT = 14;
  const SLAT_W = W - POST_W * 1.2;
  const SLAT_H = 0.022;
  const SLAT_D = 0.065;
  const SLAT_Y = SIDE_RAIL_Y + SIDE_RAIL_H * 0.5 - SLAT_H * 0.5 - 0.005;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3e,
    roughness: 0.65,
    metalness: 0.04,
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xd8be98,
    roughness: 0.72,
    metalness: 0.02,
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

  const halfW = W * 0.5;
  const halfD = D * 0.5;
  const postX = halfW - POST_W * 0.5;
  const headZ = -halfD + POST_D * 0.5;
  const footZ = halfD - POST_D * 0.5;

  // 1. Headboard posts
  const headPostGeo = new THREE.BoxGeometry(POST_W, HEAD_H, POST_D);
  addMesh(headPostGeo, woodMat, 'head_post_left', -postX, HEAD_H * 0.5, headZ);
  addMesh(headPostGeo, woodMat, 'head_post_right', postX, HEAD_H * 0.5, headZ);

  // Headboard rails
  const innerW = W - POST_W * 2;
  const headTopRailH = 0.09;
  const headBotRailH = 0.09;
  const headTopRailY = HEAD_H - 0.06 - headTopRailH * 0.5;
  const headBotRailY = 0.58;

  const headRailGeo = new THREE.BoxGeometry(innerW, headTopRailH, RAIL_T);
  addMesh(headRailGeo, woodMat, 'head_rail_top', 0, headTopRailY, headZ);
  addMesh(headRailGeo, woodMat, 'head_rail_bottom', 0, headBotRailY, headZ);

  // Headboard vertical planks
  const plankCount = 9;
  const plankGap = 0.006;
  const plankW = (innerW - plankGap * (plankCount + 1)) / plankCount;
  const plankH = headTopRailY - headTopRailH * 0.5 - (headBotRailY + headBotRailH * 0.5) + 0.01;
  const plankY = (headTopRailY + headBotRailY) * 0.5;
  const plankGeo = new THREE.BoxGeometry(plankW, plankH, RAIL_T * 0.65);

  for (let i = 0; i < plankCount; i++) {
    const px = -innerW * 0.5 + plankGap * (i + 1) + plankW * (i + 0.5);
    addMesh(plankGeo, woodMat, `head_plank_${i}`, px, plankY, headZ);
  }

  // 2. Footboard posts
  const footPostGeo = new THREE.BoxGeometry(POST_W, FOOT_H, POST_D);
  addMesh(footPostGeo, woodMat, 'foot_post_left', -postX, FOOT_H * 0.5, footZ);
  addMesh(footPostGeo, woodMat, 'foot_post_right', postX, FOOT_H * 0.5, footZ);

  // Footboard rails (upper narrower rail + lower wider rail)
  const footUpperRailH = 0.065;
  const footUpperRailY = FOOT_H - 0.06 - footUpperRailH * 0.5;
  const footLowerRailH = 0.11;
  const footLowerRailY = 0.22;

  const footUpperRailGeo = new THREE.BoxGeometry(innerW, footUpperRailH, RAIL_T);
  addMesh(footUpperRailGeo, woodMat, 'foot_rail_upper', 0, footUpperRailY, footZ);

  const footLowerRailGeo = new THREE.BoxGeometry(innerW, footLowerRailH, RAIL_T);
  addMesh(footLowerRailGeo, woodMat, 'foot_rail_lower', 0, footLowerRailY, footZ);

  // 3. Side rails
  const sideRailLen = D - POST_D * 2;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, SIDE_RAIL_H, sideRailLen);
  const sideRailX = halfW - POST_W * 0.5;
  addMesh(sideRailGeo, woodMat, 'side_rail_left', -sideRailX, SIDE_RAIL_Y, 0);
  addMesh(sideRailGeo, woodMat, 'side_rail_right', sideRailX, SIDE_RAIL_Y, 0);

  // 4. Center support beam & leg
  const centerBeamH = 0.06;
  const centerBeamW = 0.05;
  const centerBeamY = SLAT_Y - SLAT_H * 0.5 - centerBeamH * 0.5;
  const centerBeamGeo = new THREE.BoxGeometry(centerBeamW, centerBeamH, sideRailLen);
  addMesh(centerBeamGeo, woodMat, 'center_beam', 0, centerBeamY, 0);

  const centerLegH = centerBeamY - centerBeamH * 0.5;
  const centerLegGeo = new THREE.BoxGeometry(centerBeamW, centerLegH, centerBeamW);
  addMesh(centerLegGeo, woodMat, 'center_leg', 0, centerLegH * 0.5, footZ - 0.12);

  // 5. Slats
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, SLAT_D);
  const slatSpan = sideRailLen - 0.08;
  const slatStep = slatSpan / (SLAT_COUNT - 1);
  const startZ = -slatSpan * 0.5;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const sz = startZ + i * slatStep;
    addMesh(slatGeo, slatMat, `slat_${i}`, 0, SLAT_Y, sz);
  }

  return group;
}
