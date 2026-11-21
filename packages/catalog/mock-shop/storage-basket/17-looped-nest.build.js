function build(THREE) {
  const group = new THREE.Group();

  const RADIUS = 0.11;
  const BODY_H = 0.18;
  const WALL_T = 0.014;
  const RIM_R = 0.011;
  const LOOP_H = 0.065;
  const LOOP_W = 0.024;
  const LOOP_TUBE_R = 0.0085;
  const ROW_COUNT = 14;
  const RADIAL_SEGMENTS = 32;

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x7ea8cb,
    roughness: 0.9,
    metalness: 0.0
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x89b2d3,
    roughness: 0.92,
    metalness: 0.0
  });

  // Main basket shell via LatheGeometry (outer wall, rounded bottom, inner wall, inner floor)
  const pts = [];
  pts.push(new THREE.Vector2(0.0, 0.0));
  pts.push(new THREE.Vector2(RADIUS * 0.62, 0.0));
  pts.push(new THREE.Vector2(RADIUS * 0.82, 0.008));
  pts.push(new THREE.Vector2(RADIUS * 0.94, 0.024));
  pts.push(new THREE.Vector2(RADIUS * 0.99, 0.05));
  pts.push(new THREE.Vector2(RADIUS, BODY_H - RIM_R * 0.5));
  pts.push(new THREE.Vector2(RADIUS - WALL_T * 0.5, BODY_H));
  pts.push(new THREE.Vector2(RADIUS - WALL_T, BODY_H - RIM_R * 0.5));
  pts.push(new THREE.Vector2(RADIUS - WALL_T, 0.05));
  pts.push(new THREE.Vector2((RADIUS - WALL_T) * 0.9, 0.025));
  pts.push(new THREE.Vector2((RADIUS - WALL_T) * 0.65, WALL_T));
  pts.push(new THREE.Vector2(0.0, WALL_T));

  const bodyGeo = new THREE.LatheGeometry(pts, RADIAL_SEGMENTS);
  const bodyMesh = new THREE.Mesh(bodyGeo, cordMat);
  bodyMesh.name = "basket_body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Horizontal crocheted stitch rows along the outer wall
  for (let i = 0; i < ROW_COUNT; i++) {
    const t = (i + 1) / (ROW_COUNT + 1);
    const y = 0.022 + t * (BODY_H - 0.036);
    let r = RADIUS;
    if (y < 0.05) {
      const k = (y - 0.022) / (0.05 - 0.022);
      r = RADIUS * (0.93 + 0.07 * Math.sin(k * Math.PI * 0.5));
    }
    const rowGeo = new THREE.TorusGeometry(r - 0.001, 0.0042, 8, RADIAL_SEGMENTS);
    const rowMesh = new THREE.Mesh(rowGeo, stitchMat);
    rowMesh.name = `crochet_row_${i + 1}`;
    rowMesh.rotation.x = Math.PI / 2;
    rowMesh.position.y = y;
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    group.add(rowMesh);
  }

  // Thick braided/crocheted top rim
  const rimGeo = new THREE.TorusGeometry(RADIUS - WALL_T * 0.5, RIM_R, 12, RADIAL_SEGMENTS);
  const rimMesh = new THREE.Mesh(rimGeo, stitchMat);
  rimMesh.name = "basket_rim";
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = BODY_H;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Hanging loop at the back (-Z)
  const loopZ = -(RADIUS - WALL_T * 0.5);
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.006, BODY_H - 0.004, loopZ),
    new THREE.Vector3(-LOOP_W, BODY_H + LOOP_H * 0.45, loopZ),
    new THREE.Vector3(-LOOP_W * 0.72, BODY_H + LOOP_H * 0.9, loopZ),
    new THREE.Vector3(0.0, BODY_H + LOOP_H, loopZ),
    new THREE.Vector3(LOOP_W * 0.72, BODY_H + LOOP_H * 0.9, loopZ),
    new THREE.Vector3(LOOP_W, BODY_H + LOOP_H * 0.45, loopZ),
    new THREE.Vector3(0.006, BODY_H - 0.004, loopZ)
  ]);

  const loopGeo = new THREE.TubeGeometry(loopCurve, 28, LOOP_TUBE_R, 10, false);
  const loopMesh = new THREE.Mesh(loopGeo, stitchMat);
  loopMesh.name = "hanging_loop";
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  // Loop base wrap/knot where it joins the rim
  const knotGeo = new THREE.TorusGeometry(LOOP_TUBE_R * 1.15, 0.0045, 8, 16);
  const knotMesh = new THREE.Mesh(knotGeo, cordMat);
  knotMesh.name = "hanging_loop_knot";
  knotMesh.rotation.x = Math.PI / 2;
  knotMesh.position.set(0, BODY_H + 0.004, loopZ);
  knotMesh.castShadow = true;
  knotMesh.receiveShadow = true;
  group.add(knotMesh);

  return group;
}
