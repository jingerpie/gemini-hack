function build(THREE) {
  const group = new THREE.Group();

  const W = 0.64;
  const H = 0.94;
  const D = 0.026;
  const FRAME_T = 0.008;
  const GLASS_T = 0.004;
  const BACK_T = 0.012;
  const CLEAT_T = 0.004;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    metalness: 0.85,
    roughness: 0.28,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2e,
    metalness: 0.1,
    roughness: 0.85,
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    metalness: 0.8,
    roughness: 0.35,
  });

  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Asymmetrical organic pebble contour (normalized around origin, then fitted to W x H)
  const ctrlPts = [
    new THREE.Vector2(0.14, 0.47),
    new THREE.Vector2(-0.18, 0.36),
    new THREE.Vector2(-0.31, 0.14),
    new THREE.Vector2(-0.32, -0.14),
    new THREE.Vector2(-0.20, -0.37),
    new THREE.Vector2(0.08, -0.47),
    new THREE.Vector2(0.27, -0.34),
    new THREE.Vector2(0.32, -0.06),
    new THREE.Vector2(0.28, 0.24),
  ];

  const spline = new THREE.SplineCurve([...ctrlPts, ctrlPts[0]]);
  const rawPts = spline.getPoints(96);
  rawPts.pop();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of rawPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const scaleX = W / (maxX - minX);
  const scaleY = H / (maxY - minY);
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;

  const outerPts = rawPts.map(
    (p) => new THREE.Vector2((p.x - cx) * scaleX, (p.y - cy) * scaleY + H * 0.5)
  );

  // Offset inward along vertex normals for inner glass/frame boundary
  const innerPts = [];
  const n = outerPts.length;
  for (let i = 0; i < n; i++) {
    const prev = outerPts[(i - 1 + n) % n];
    const curr = outerPts[i];
    const next = outerPts[(i + 1) % n];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    // Inward normal for CCW contour
    const nx = -ty / len;
    const ny = tx / len;
    innerPts.push(new THREE.Vector2(curr.x + nx * FRAME_T, curr.y + ny * FRAME_T));
  }

  const outerShape = new THREE.Shape(outerPts);
  const innerShape = new THREE.Shape(innerPts);

  // 1. Outer metal frame (with inner cutout)
  const frameShape = new THREE.Shape(outerPts);
  frameShape.holes.push(new THREE.Path(innerPts.slice().reverse()));

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: D - 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0012,
    bevelSegments: 2,
    curveSegments: 1,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.z = -D * 0.5 + 0.0015;
  frameMesh.name = 'outer_frame';
  group.add(frameMesh);

  // 2. Mirror glass
  const glassGeo = new THREE.ExtrudeGeometry(innerShape, {
    depth: GLASS_T,
    bevelEnabled: false,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.z = D * 0.5 - GLASS_T - 0.002;
  glassMesh.name = 'mirror_glass';
  group.add(glassMesh);

  // 3. Backing board
  const backGeo = new THREE.ExtrudeGeometry(innerShape, {
    depth: BACK_T,
    bevelEnabled: false,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.position.z = -D * 0.5 + CLEAT_T;
  backMesh.name = 'backing_board';
  group.add(backMesh);

  // 4. Mounting cleats (flush with back plane z = -D/2)
  const cleatGeo = new THREE.BoxGeometry(0.24, 0.032, CLEAT_T);
  const cleatYPositions = [H * 0.72, H * 0.28];
  const cleatNames = ['mounting_cleat_top', 'mounting_cleat_bottom'];

  cleatYPositions.forEach((cyPos, idx) => {
    const cleat = new THREE.Mesh(cleatGeo, hardwareMat);
    cleat.position.set(0, cyPos, -D * 0.5 + CLEAT_T * 0.5);
    cleat.name = cleatNames[idx];
    group.add(cleat);

    // Screws on each cleat
    const screwGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.003, 12);
    screwGeo.rotateX(Math.PI * 0.5);
    [-0.09, 0.09].forEach((sx, sIdx) => {
      const screw = new THREE.Mesh(screwGeo, hardwareMat);
      screw.position.set(sx, cyPos, -D * 0.5 + 0.0015);
      screw.name = `cleat_screw_${idx * 2 + sIdx + 1}`;
      group.add(screw);
    });
  });

  // 5. Wall spacer bumpers on the back
  const bumperGeo = new THREE.CylinderGeometry(0.012, 0.012, CLEAT_T, 16);
  bumperGeo.rotateX(Math.PI * 0.5);
  const bumperPositions = [
    [-0.14, H * 0.14],
    [0.14, H * 0.14],
    [-0.14, H * 0.82],
  ];
  bumperPositions.forEach(([bx, by], idx) => {
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.position.set(bx, by, -D * 0.5 + CLEAT_T * 0.5);
    bumper.name = `wall_bumper_${idx + 1}`;
    group.add(bumper);
  });

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
