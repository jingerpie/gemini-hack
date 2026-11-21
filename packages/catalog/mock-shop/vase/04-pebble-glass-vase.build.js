function build(THREE) {
  const group = new THREE.Group();

  const VASE_H = 0.28;
  const BASE_R = 0.042;
  const WAIST1_Y = 0.046;
  const WAIST1_R = 0.018;
  const MID_BULB_Y = 0.080;
  const MID_BULB_R = 0.062;
  const WAIST2_Y = 0.114;
  const WAIST2_R = 0.015;
  const TOP_BULB_Y = 0.154;
  const TOP_BULB_R = 0.046;
  const NECK_BASE_Y = 0.194;
  const NECK_R = 0.0135;
  const WALL_T = 0.0025;
  const WATER_Y = 0.078;
  const RADIAL_SEGS = 32;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8b242,
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: 0.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide
  });

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8c860,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  // Outer profile from bottom center to top rim
  const outerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R, 0.0),
    new THREE.Vector2(BASE_R * 0.99, 0.010),
    new THREE.Vector2(BASE_R * 0.92, 0.022),
    new THREE.Vector2(BASE_R * 0.72, 0.034),
    new THREE.Vector2(WAIST1_R, WAIST1_Y),
    new THREE.Vector2(MID_BULB_R * 0.65, 0.054),
    new THREE.Vector2(MID_BULB_R * 0.94, 0.066),
    new THREE.Vector2(MID_BULB_R, MID_BULB_Y),
    new THREE.Vector2(MID_BULB_R * 0.94, 0.094),
    new THREE.Vector2(MID_BULB_R * 0.62, 0.105),
    new THREE.Vector2(WAIST2_R, WAIST2_Y),
    new THREE.Vector2(TOP_BULB_R * 0.58, 0.124),
    new THREE.Vector2(TOP_BULB_R * 0.92, 0.138),
    new THREE.Vector2(TOP_BULB_R, TOP_BULB_Y),
    new THREE.Vector2(TOP_BULB_R * 0.92, 0.170),
    new THREE.Vector2(TOP_BULB_R * 0.55, 0.184),
    new THREE.Vector2(NECK_R, NECK_BASE_Y),
    new THREE.Vector2(NECK_R * 0.98, VASE_H - 0.002),
    new THREE.Vector2(NECK_R, VASE_H)
  ];

  // Inner profile from top rim back down to inner base
  const innerPts = [
    new THREE.Vector2(NECK_R - WALL_T, VASE_H),
    new THREE.Vector2(NECK_R - WALL_T, NECK_BASE_Y),
    new THREE.Vector2(TOP_BULB_R * 0.55 - WALL_T, 0.184),
    new THREE.Vector2(TOP_BULB_R * 0.92 - WALL_T, 0.170),
    new THREE.Vector2(TOP_BULB_R - WALL_T, TOP_BULB_Y),
    new THREE.Vector2(TOP_BULB_R * 0.92 - WALL_T, 0.138),
    new THREE.Vector2(TOP_BULB_R * 0.58 - WALL_T, 0.124),
    new THREE.Vector2(WAIST2_R - WALL_T, WAIST2_Y),
    new THREE.Vector2(MID_BULB_R * 0.62 - WALL_T, 0.105),
    new THREE.Vector2(MID_BULB_R * 0.94 - WALL_T, 0.094),
    new THREE.Vector2(MID_BULB_R - WALL_T, MID_BULB_Y),
    new THREE.Vector2(MID_BULB_R * 0.94 - WALL_T, 0.066),
    new THREE.Vector2(MID_BULB_R * 0.65 - WALL_T, 0.054),
    new THREE.Vector2(WAIST1_R - WALL_T, WAIST1_Y),
    new THREE.Vector2(0.0, WAIST1_Y - 0.002)
  ];

  const vaseGeo = new THREE.LatheGeometry(outerPts.concat(innerPts), RADIAL_SEGS);
  const vaseMesh = new THREE.Mesh(vaseGeo, glassMat);
  vaseMesh.name = 'pebble_glass_vase_body';
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Subtle rim highlight
  const rimGeo = new THREE.TorusGeometry(NECK_R - WALL_T * 0.5, WALL_T * 0.5, 12, RADIAL_SEGS);
  const rimMesh = new THREE.Mesh(rimGeo, glassMat);
  rimMesh.name = 'vase_top_rim';
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = VASE_H;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Water volume inside the middle bulb
  const waterPts = [
    new THREE.Vector2(0.0, WAIST1_Y),
    new THREE.Vector2(WAIST1_R - WALL_T * 1.2, WAIST1_Y),
    new THREE.Vector2(MID_BULB_R * 0.64 - WALL_T, 0.054),
    new THREE.Vector2(MID_BULB_R * 0.93 - WALL_T, 0.066),
    new THREE.Vector2(MID_BULB_R - WALL_T * 1.1, WATER_Y),
    new THREE.Vector2(0.0, WATER_Y)
  ];
  const waterGeo = new THREE.LatheGeometry(waterPts, RADIAL_SEGS);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.name = 'vase_water';
  waterMesh.castShadow = true;
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  return group;
}
