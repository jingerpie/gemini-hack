function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.40; // Exact overall width along X (wooden dowel)
  const DOWEL_R = 0.011;
  const BODY_W = 0.30;
  const BODY_H = 0.34;
  const BODY_D = 0.012;
  const FRINGE_H_LEFT = 0.16;
  const FRINGE_H_RIGHT = 0.08;
  const CORD_H = 0.16;
  const CORD_R = 0.0022;

  const BODY_BOTTOM_Y = FRINGE_H_LEFT;
  const BODY_TOP_Y = BODY_BOTTOM_Y + BODY_H;
  const DOWEL_Y = BODY_TOP_Y + DOWEL_R;
  const CORD_TOP_Y = DOWEL_Y + CORD_H;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3b,
    roughness: 0.65,
    metalness: 0.02
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xebe3d3,
    roughness: 0.92,
    metalness: 0.0
  });

  const creamBrightMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece0,
    roughness: 0.9,
    metalness: 0.0
  });

  const tanMat = new THREE.MeshStandardMaterial({
    color: 0xbda688,
    roughness: 0.9,
    metalness: 0.0
  });

  // Helper to configure shadows
  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Wooden dowel (exact width W = 0.40)
  const dowelGeo = new THREE.CylinderGeometry(DOWEL_R, DOWEL_R, W, 24);
  addMesh(dowelGeo, woodMat, 'wooden_dowel', 0, DOWEL_Y, 0, 0, 0, Math.PI / 2);

  // 2. Hanging cord (triangular loop above dowel)
  const cordAttachX = BODY_W * 0.5 + 0.018;
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-cordAttachX, DOWEL_Y + DOWEL_R * 0.8, 0),
    new THREE.Vector3(-cordAttachX * 0.5, (DOWEL_Y + CORD_TOP_Y) * 0.5, 0),
    new THREE.Vector3(0, CORD_TOP_Y, 0),
    new THREE.Vector3(cordAttachX * 0.5, (DOWEL_Y + CORD_TOP_Y) * 0.5, 0),
    new THREE.Vector3(cordAttachX, DOWEL_Y + DOWEL_R * 0.8, 0)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, CORD_R, 8, false);
  addMesh(cordGeo, creamBrightMat, 'hanging_cord', 0, 0, 0);

  // Cord tie wraps at dowel ends
  const tieGeo = new THREE.TorusGeometry(DOWEL_R + 0.0018, 0.0022, 8, 16);
  addMesh(tieGeo, creamBrightMat, 'cord_tie_left', -cordAttachX, DOWEL_Y, 0, 0, Math.PI / 2, 0);
  addMesh(tieGeo, creamBrightMat, 'cord_tie_right', cordAttachX, DOWEL_Y, 0, 0, Math.PI / 2, 0);

  // 3. Woven base panel (back flush at z = -DOWEL_R)
  const panelZ = -DOWEL_R + BODY_D * 0.5;
  const panelGeo = new THREE.BoxGeometry(BODY_W, BODY_H, BODY_D);
  addMesh(panelGeo, creamMat, 'woven_base_panel', 0, BODY_BOTTOM_Y + BODY_H * 0.5, panelZ);

  // 4. Dowel hanging loops (10 evenly spaced loops)
  const loopCount = 10;
  const loopGeo = new THREE.TorusGeometry(DOWEL_R + 0.002, 0.0028, 8, 18);
  for (let i = 0; i < loopCount; i++) {
    const lx = -BODY_W * 0.46 + (i / (loopCount - 1)) * (BODY_W * 0.92);
    addMesh(loopGeo, creamBrightMat, 'dowel_loop_' + (i + 1), lx, DOWEL_Y, 0, 0, Math.PI / 2, 0);
  }

  // 5. Textured horizontal relief bands on front face
  const frontZ = -DOWEL_R + BODY_D;
  const chunkyBandR = 0.0065;
  const chunkyGeo = new THREE.CapsuleGeometry(chunkyBandR, BODY_W - 0.01, 6, 12);

  // Upper chunky band (2 rows)
  const upperBandY = BODY_BOTTOM_Y + BODY_H * 0.76;
  addMesh(chunkyGeo, creamBrightMat, 'upper_chunky_band_top', 0, upperBandY + 0.007, frontZ + 0.002, 0, 0, Math.PI / 2);
  addMesh(chunkyGeo, creamBrightMat, 'upper_chunky_band_bottom', 0, upperBandY - 0.007, frontZ + 0.002, 0, 0, Math.PI / 2);

  // Center tan/beige woven band + cream borders
  const centerBandY = BODY_BOTTOM_Y + BODY_H * 0.48;
  const tanBandGeo = new THREE.BoxGeometry(BODY_W + 0.002, 0.036, 0.006);
  addMesh(tanBandGeo, tanMat, 'center_tan_band', 0, centerBandY, frontZ + 0.001);

  const borderGeo = new THREE.CapsuleGeometry(0.0038, BODY_W - 0.006, 6, 10);
  addMesh(borderGeo, creamBrightMat, 'center_border_top', 0, centerBandY + 0.021, frontZ + 0.002, 0, 0, Math.PI / 2);
  addMesh(borderGeo, creamBrightMat, 'center_border_bottom', 0, centerBandY - 0.021, frontZ + 0.002, 0, 0, Math.PI / 2);

  // Lower chunky band (2 rows)
  const lowerBandY = BODY_BOTTOM_Y + BODY_H * 0.20;
  addMesh(chunkyGeo, creamBrightMat, 'lower_chunky_band_top', 0, lowerBandY + 0.007, frontZ + 0.002, 0, 0, Math.PI / 2);
  addMesh(chunkyGeo, creamBrightMat, 'lower_chunky_band_bottom', 0, lowerBandY - 0.007, frontZ + 0.002, 0, 0, Math.PI / 2);

  // 6. Asymmetrical fringe strands (16 strands, longer on left, shorter on right)
  const fringeCount = 16;
  const strandR = 0.0042;
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    const fx = -BODY_W * 0.47 + t * (BODY_W * 0.94);
    const fh = FRINGE_H_LEFT + t * (FRINGE_H_RIGHT - FRINGE_H_LEFT);
    const strandGeo = new THREE.CylinderGeometry(strandR, strandR * 0.7, fh, 8);
    addMesh(
      strandGeo,
      creamBrightMat,
      'fringe_strand_' + (i + 1),
      fx,
      BODY_BOTTOM_Y - fh * 0.5,
      panelZ
    );
  }

  return group;
}
