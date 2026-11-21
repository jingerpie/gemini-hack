function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.56;
  const D = 0.40;
  const H_BODY = 0.36;
  const HANDLE_H = 0.10;
  const BOTTOM_SCALE = 0.78;
  const WALL_T = 0.016;
  const RIM_R = 0.014;
  const WICKER_RINGS = 13;

  const RX_TOP = W / 2;
  const RZ_TOP = D / 2;
  const ASPECT_Z = RZ_TOP / RX_TOP;

  // Materials
  const wickerMat = new THREE.MeshStandardMaterial({
    color: 0xc8a472,
    roughness: 0.78,
    metalness: 0.02
  });

  const wickerDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb08b57,
    roughness: 0.82,
    metalness: 0.02
  });

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.92,
    metalness: 0.0
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xc9beae,
    roughness: 0.88,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Basket solid base
  const baseGeo = new THREE.CylinderGeometry(
    RX_TOP * BOTTOM_SCALE,
    RX_TOP * BOTTOM_SCALE * 0.96,
    0.018,
    32
  );
  baseGeo.scale(1, 1, ASPECT_Z);
  const baseMesh = addMesh(baseGeo, wickerDarkMat, 'basket_base');
  baseMesh.position.y = 0.009;

  // 2. Basket tapered body (hollow lathe wall)
  const pts = [
    new THREE.Vector2(RX_TOP * BOTTOM_SCALE - WALL_T, 0.015),
    new THREE.Vector2(RX_TOP * BOTTOM_SCALE, 0.015),
    new THREE.Vector2(RX_TOP, H_BODY),
    new THREE.Vector2(RX_TOP - WALL_T, H_BODY),
    new THREE.Vector2(RX_TOP * BOTTOM_SCALE - WALL_T, 0.015)
  ];
  const bodyGeo = new THREE.LatheGeometry(pts, 32);
  bodyGeo.scale(1, 1, ASPECT_Z);
  addMesh(bodyGeo, wickerDarkMat, 'basket_body');

  // 3. Horizontal woven wicker rings along the exterior
  for (let i = 0; i < WICKER_RINGS; i++) {
    const t = (i + 0.5) / WICKER_RINGS;
    const y = 0.022 + t * (H_BODY - 0.036);
    const scaleAtY = BOTTOM_SCALE + (1 - BOTTOM_SCALE) * (y / H_BODY);
    const ringR = RX_TOP * scaleAtY;
    const tubeR = 0.0095;

    const ringGeo = new THREE.TorusGeometry(ringR, tubeR, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    ringGeo.scale(1, 1, ASPECT_Z);
    const ringMesh = addMesh(ringGeo, wickerMat, `wicker_ring_${i + 1}`);
    ringMesh.position.y = y;
  }

  // 4. Braided top rim
  const rimGeo = new THREE.TorusGeometry(RX_TOP - WALL_T * 0.35, RIM_R, 10, 32);
  rimGeo.rotateX(Math.PI / 2);
  rimGeo.scale(1, 1, ASPECT_Z);
  const rimMesh = addMesh(rimGeo, wickerMat, 'top_rim_braid');
  rimMesh.position.y = H_BODY;

  // 5. Left and Right arched handles
  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? 'left' : 'right';
    const xBase = side * (RX_TOP - 0.012);
    const zSpan = 0.085;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xBase, H_BODY - 0.01, -zSpan),
      new THREE.Vector3(xBase * 1.03, H_BODY + HANDLE_H * 0.65, -zSpan * 0.6),
      new THREE.Vector3(xBase * 1.04, H_BODY + HANDLE_H, 0),
      new THREE.Vector3(xBase * 1.03, H_BODY + HANDLE_H * 0.65, zSpan * 0.6),
      new THREE.Vector3(xBase, H_BODY - 0.01, zSpan)
    ]);
    const handleGeo = new THREE.TubeGeometry(curve, 24, 0.013, 10, false);
    addMesh(handleGeo, wickerMat, `handle_${sideName}`);
  });

  // 6. Inner fabric liner wall
  const linerTopR = RX_TOP - WALL_T - 0.003;
  const linerBotR = RX_TOP * BOTTOM_SCALE - WALL_T - 0.003;
  const linerGeo = new THREE.CylinderGeometry(
    linerTopR,
    linerBotR,
    H_BODY - 0.04,
    32,
    1,
    true
  );
  linerGeo.scale(1, 1, ASPECT_Z);
  const linerMesh = addMesh(linerGeo, linenMat, 'fabric_liner_wall');
  linerMesh.position.y = (H_BODY - 0.04) / 2 + 0.02;

  // 7. Gathered drawstring pouch inside
  const pouchGeo = new THREE.SphereGeometry(linerTopR * 0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  pouchGeo.scale(1, 0.42, ASPECT_Z * 0.92);
  const pouchMesh = addMesh(pouchGeo, linenMat, 'fabric_pouch_dome');
  pouchMesh.position.y = H_BODY * 0.58;

  // 8. Gathered collar / ruffle at pouch center
  const ruffleGeo = new THREE.TorusGeometry(0.042, 0.018, 10, 20);
  ruffleGeo.rotateX(Math.PI / 2);
  ruffleGeo.scale(1.1, 1.4, 0.95);
  const ruffleMesh = addMesh(ruffleGeo, linenMat, 'fabric_pouch_gather');
  ruffleMesh.position.y = H_BODY * 0.72;

  // 9. Drawstring cord loop
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, H_BODY * 0.73, 0.01),
    new THREE.Vector3(0.08, H_BODY * 0.76, 0.03),
    new THREE.Vector3(0.11, H_BODY * 0.74, -0.01),
    new THREE.Vector3(0.04, H_BODY * 0.72, -0.02)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 16, 0.0045, 6, false);
  addMesh(cordGeo, cordMat, 'drawstring_cord');

  return group;
}
