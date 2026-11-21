function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.70;
  const D = 0.50;
  const H = 0.58;
  const HW = W / 2;
  const HD = D / 2;
  const TUBE_R = 0.010;
  const SLEEVE_R = 0.014;
  const BAR_Y = 0.10;
  const WALL_T = 0.005;

  const HW_FRAME = HW - SLEEVE_R;
  const HD_FRAME = HD - SLEEVE_R;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xeae0cc,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const canvasTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe3d7c0,
    roughness: 0.85,
    metalness: 0.0
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xd6ccb6,
    roughness: 0.45,
    metalness: 0.15
  });

  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.5,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Arch curve points in XY plane
  const archPts = [
    new THREE.Vector3(-HW_FRAME, 0.015, 0),
    new THREE.Vector3(-HW_FRAME * 0.94, H * 0.42, 0),
    new THREE.Vector3(-HW_FRAME * 0.62, H * 0.82, 0),
    new THREE.Vector3(0, H - SLEEVE_R, 0),
    new THREE.Vector3(HW_FRAME * 0.62, H * 0.82, 0),
    new THREE.Vector3(HW_FRAME * 0.94, H * 0.42, 0),
    new THREE.Vector3(HW_FRAME, 0.015, 0)
  ];
  const archCurve = new THREE.CatmullRomCurve3(archPts);

  // 1. Front and Back Arch Sleeves
  const sleeveGeo = new THREE.TubeGeometry(archCurve, 32, SLEEVE_R, 12, false);
  addMesh(sleeveGeo, canvasTrimMat, 'front_arch_sleeve', 0, 0, HD_FRAME);
  addMesh(sleeveGeo, canvasTrimMat, 'back_arch_sleeve', 0, 0, -HD_FRAME);

  // 2. Main Canopy Shell (Extruded thin arch)
  const sampled = archCurve.getPoints(28);
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(sampled[0].x, sampled[0].y);
  for (let i = 1; i < sampled.length; i++) {
    canopyShape.lineTo(sampled[i].x, sampled[i].y);
  }
  for (let i = sampled.length - 1; i >= 0; i--) {
    const p = sampled[i];
    const len = Math.hypot(p.x, p.y - H * 0.2) || 1;
    const nx = p.x / len;
    const ny = (p.y - H * 0.2) / len;
    canopyShape.lineTo(p.x - nx * WALL_T, p.y - ny * WALL_T);
  }
  canopyShape.closePath();

  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, {
    depth: D - SLEEVE_R * 2,
    bevelEnabled: false,
    curveSegments: 24
  });
  addMesh(canopyGeo, canvasMat, 'canopy_shell', 0, 0, -HD_FRAME);

  // 3. Back Wall Panel with lower horizontal vent cutout
  const backShape = new THREE.Shape();
  backShape.moveTo(sampled[0].x, BAR_Y * 0.65);
  for (let i = 0; i < sampled.length; i++) {
    if (sampled[i].y >= BAR_Y * 0.65) {
      backShape.lineTo(sampled[i].x, sampled[i].y);
    }
  }
  backShape.lineTo(sampled[sampled.length - 1].x, BAR_Y * 0.65);
  backShape.closePath();

  const ventW = W * 0.42;
  const ventH = 0.045;
  const ventY = BAR_Y + 0.025;
  const ventHole = new THREE.Path();
  ventHole.moveTo(-ventW / 2, ventY);
  ventHole.lineTo(ventW / 2, ventY);
  ventHole.lineTo(ventW / 2, ventY + ventH);
  ventHole.lineTo(-ventW / 2, ventY + ventH);
  ventHole.closePath();
  backShape.holes.push(ventHole);

  const backWallGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: WALL_T,
    bevelEnabled: false
  });
  addMesh(backWallGeo, canvasMat, 'back_wall_panel', 0, 0, -HD_FRAME);

  // 4. Four Corner Legs
  const legH = BAR_Y + 0.025;
  const legGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, legH, 12);
  addMesh(legGeo, frameMat, 'leg_front_left', -HW_FRAME, legH / 2, HD_FRAME);
  addMesh(legGeo, frameMat, 'leg_front_right', HW_FRAME, legH / 2, HD_FRAME);
  addMesh(legGeo, frameMat, 'leg_back_left', -HW_FRAME, legH / 2, -HD_FRAME);
  addMesh(legGeo, frameMat, 'leg_back_right', HW_FRAME, legH / 2, -HD_FRAME);

  // 5. Bottom Horizontal Frame Bars (Left, Right, Rear)
  const sideBarLen = D - SLEEVE_R * 2;
  const sideBarGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, sideBarLen, 12);
  addMesh(sideBarGeo, frameMat, 'bottom_bar_left', -HW_FRAME, BAR_Y, 0, Math.PI / 2, 0, 0);
  addMesh(sideBarGeo, frameMat, 'bottom_bar_right', HW_FRAME, BAR_Y, 0, Math.PI / 2, 0, 0);

  const rearBarLen = W - SLEEVE_R * 2;
  const rearBarGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, rearBarLen, 12);
  addMesh(rearBarGeo, frameMat, 'bottom_bar_rear', 0, BAR_Y, -HD_FRAME, 0, 0, Math.PI / 2);

  // 6. Upper Side Tension Seams
  const seamGeo = new THREE.CylinderGeometry(0.005, 0.005, sideBarLen, 8);
  addMesh(seamGeo, canvasTrimMat, 'upper_seam_left', -HW_FRAME * 0.68, H * 0.76, 0, Math.PI / 2, 0, 0);
  addMesh(seamGeo, canvasTrimMat, 'upper_seam_right', HW_FRAME * 0.68, H * 0.76, 0, Math.PI / 2, 0, 0);

  // 7. Cot Attachment Straps & Buckles (2 on left bar, 2 on right bar)
  const strapGeo = new THREE.TorusGeometry(TUBE_R + 0.004, 0.005, 8, 16);
  const buckleGeo = new THREE.BoxGeometry(0.018, 0.022, 0.012);
  const strapZOffsets = [-0.08, 0.08];

  strapZOffsets.forEach((sz, idx) => {
    addMesh(strapGeo, canvasTrimMat, `strap_left_${idx + 1}`, -HW_FRAME, BAR_Y, sz, 0, Math.PI / 2, 0);
    addMesh(buckleGeo, buckleMat, `buckle_left_${idx + 1}`, -HW_FRAME, BAR_Y - 0.022, sz);

    addMesh(strapGeo, canvasTrimMat, `strap_right_${idx + 1}`, HW_FRAME, BAR_Y, sz, 0, Math.PI / 2, 0);
    addMesh(buckleGeo, buckleMat, `buckle_right_${idx + 1}`, HW_FRAME, BAR_Y - 0.022, sz);
  });

  // 8. Arch Loop Tabs (upper-left and upper-right on front and back arches)
  const tabGeo = new THREE.BoxGeometry(0.022, 0.016, 0.028);
  addMesh(tabGeo, canvasTrimMat, 'arch_tab_front_left', -HW_FRAME * 0.66, H * 0.78, HD_FRAME, 0, 0, 0.65);
  addMesh(tabGeo, canvasTrimMat, 'arch_tab_front_right', HW_FRAME * 0.66, H * 0.78, HD_FRAME, 0, 0, -0.65);
  addMesh(tabGeo, canvasTrimMat, 'arch_tab_back_left', -HW_FRAME * 0.66, H * 0.78, -HD_FRAME, 0, 0, 0.65);
  addMesh(tabGeo, canvasTrimMat, 'arch_tab_back_right', HW_FRAME * 0.66, H * 0.78, -HD_FRAME, 0, 0, -0.65);

  return group;
}
