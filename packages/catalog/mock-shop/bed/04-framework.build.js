function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - Queen Canopy Bed
  const W = 1.70;
  const D = 2.15;
  const H = 2.05;

  const POST_W = 0.065;
  const LEG_H = 0.22;
  const RAIL_H = 0.16;
  const RAIL_T = 0.035;
  const TOP_RAIL_H = 0.055;
  const TOP_RAIL_T = 0.045;
  const TOP_POST_OVERHANG = 0.015;

  const HB_BOTTOM_Y = 0.54;
  const HB_TOP_Y = 1.04;
  const HB_H = HB_TOP_Y - HB_BOTTOM_Y;
  const HB_FRAME_W = 0.055;
  const HB_T = 0.032;

  const SLAT_COUNT = 14;
  const SLAT_W = W - POST_W * 2 - 0.01;
  const SLAT_H = 0.018;
  const SLAT_D = 0.065;
  const SLAT_Y = LEG_H + RAIL_H - 0.045;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x9c7244,
    roughness: 0.62,
    metalness: 0.02,
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.72,
    metalness: 0.0,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.85,
    metalness: 0.0,
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

  const postX = W / 2 - POST_W / 2;
  const postZ = D / 2 - POST_W / 2;
  const upperPostH = H - LEG_H;
  const upperPostY = LEG_H + upperPostH / 2;

  // 4 Corner Posts & Tapered Legs
  const corners = [
    { id: 'fl', x: -postX, z: postZ },
    { id: 'fr', x: postX, z: postZ },
    { id: 'bl', x: -postX, z: -postZ },
    { id: 'br', x: postX, z: -postZ },
  ];

  const upperPostGeo = new THREE.BoxGeometry(POST_W, upperPostH, POST_W);
  const legGeo = new THREE.CylinderGeometry(POST_W * 0.68, POST_W * 0.52, LEG_H, 4);
  legGeo.rotateY(Math.PI / 4);

  for (const c of corners) {
    addMesh(upperPostGeo, oakMat, `post_${c.id}`, c.x, upperPostY, c.z);
    addMesh(legGeo, oakMat, `leg_${c.id}`, c.x, LEG_H / 2, c.z);
  }

  // Top Canopy Rails
  const topRailY = H - TOP_POST_OVERHANG - TOP_RAIL_H / 2;
  const spanX = W - POST_W * 2;
  const spanZ = D - POST_W * 2;

  const topRailFBGeo = new THREE.BoxGeometry(spanX, TOP_RAIL_H, TOP_RAIL_T);
  const topRailLRGeo = new THREE.BoxGeometry(TOP_RAIL_T, TOP_RAIL_H, spanZ);

  addMesh(topRailFBGeo, oakMat, 'canopy_rail_front', 0, topRailY, postZ);
  addMesh(topRailFBGeo, oakMat, 'canopy_rail_back', 0, topRailY, -postZ);
  addMesh(topRailLRGeo, oakMat, 'canopy_rail_left', -postX, topRailY, 0);
  addMesh(topRailLRGeo, oakMat, 'canopy_rail_right', postX, topRailY, 0);

  // Base Frame Rails
  const railY = LEG_H + RAIL_H / 2;
  const railFBGeo = new THREE.BoxGeometry(spanX, RAIL_H, RAIL_T);
  const railLRGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, spanZ);

  addMesh(railFBGeo, oakMat, 'base_rail_front', 0, railY, postZ);
  addMesh(railFBGeo, oakMat, 'base_rail_back', 0, railY, -postZ);
  addMesh(railLRGeo, oakMat, 'base_rail_left', -postX, railY, 0);
  addMesh(railLRGeo, oakMat, 'base_rail_right', postX, railY, 0);

  // Front rail recessed panel trim (subtle lip)
  const frontTrimGeo = new THREE.BoxGeometry(spanX - 0.08, RAIL_H - 0.06, 0.008);
  addMesh(frontTrimGeo, oakMat, 'base_rail_front_panel', 0, railY, postZ + RAIL_T / 2 + 0.002);

  // Center Support Beam & Leg
  const centerBeamH = 0.05;
  const centerBeamGeo = new THREE.BoxGeometry(0.05, centerBeamH, spanZ);
  addMesh(centerBeamGeo, oakMat, 'center_support_beam', 0, SLAT_Y - SLAT_H / 2 - centerBeamH / 2, 0);

  const centerLegH = SLAT_Y - SLAT_H / 2 - centerBeamH;
  const centerLegGeo = new THREE.BoxGeometry(0.045, centerLegH, 0.045);
  addMesh(centerLegGeo, oakMat, 'center_support_leg', 0, centerLegH / 2, 0);

  // Headboard (at -Z between back posts)
  const hbZ = -postZ;
  const hbTopBottomGeo = new THREE.BoxGeometry(spanX, HB_FRAME_W, HB_T);
  const hbStileH = HB_H - HB_FRAME_W * 2;
  const hbStileGeo = new THREE.BoxGeometry(HB_FRAME_W, hbStileH, HB_T);

  addMesh(hbTopBottomGeo, oakMat, 'headboard_top_rail', 0, HB_TOP_Y - HB_FRAME_W / 2, hbZ);
  addMesh(hbTopBottomGeo, oakMat, 'headboard_bottom_rail', 0, HB_BOTTOM_Y + HB_FRAME_W / 2, hbZ);

  const hbCenterY = HB_BOTTOM_Y + HB_H / 2;
  addMesh(hbStileGeo, oakMat, 'headboard_stile_left', -spanX / 2 + HB_FRAME_W / 2, hbCenterY, hbZ);
  addMesh(hbStileGeo, oakMat, 'headboard_stile_right', spanX / 2 - HB_FRAME_W / 2, hbCenterY, hbZ);
  addMesh(hbStileGeo, oakMat, 'headboard_stile_center', 0, hbCenterY, hbZ);

  // Two recessed headboard panels
  const panelW = (spanX - HB_FRAME_W * 3) / 2;
  const panelGeo = new THREE.BoxGeometry(panelW, hbStileH, HB_T * 0.55);
  const panelOffsetX = HB_FRAME_W / 2 + panelW / 2;
  addMesh(panelGeo, oakMat, 'headboard_panel_left', -panelOffsetX, hbCenterY, hbZ);
  addMesh(panelGeo, oakMat, 'headboard_panel_right', panelOffsetX, hbCenterY, hbZ);

  // Slats
  const slatGeo = new THREE.BoxGeometry(SLAT_W, SLAT_H, SLAT_D);
  const slatStartZ = -spanZ / 2 + SLAT_D;
  const slatEndZ = spanZ / 2 - SLAT_D;
  const slatStepZ = (slatEndZ - slatStartZ) / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const z = slatStartZ + i * slatStepZ;
    addMesh(slatGeo, slatMat, `slat_${i}`, 0, SLAT_Y, z);
  }

  // Center webbing strap over slats
  const strapGeo = new THREE.BoxGeometry(0.03, 0.004, slatEndZ - slatStartZ + SLAT_D);
  addMesh(strapGeo, strapMat, 'slat_center_strap', 0, SLAT_Y + SLAT_H / 2 + 0.002, 0);

  return group;
}
