function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const D = 0.42;
  const BODY_H = 0.34;
  const LID_H = 0.025;
  const WALL_T = 0.022;
  const HANDLE_W = 0.11;
  const HANDLE_H = 0.055;
  const HANDLE_TOP_MARGIN = 0.028;
  const LID_HANDLE_R = 0.042;
  const LID_HANDLE_TUBE = 0.009;
  const CORNER_R = 0.012;

  // Materials
  const weaveMat = new THREE.MeshStandardMaterial({
    color: 0xc59f6d,
    roughness: 0.85,
    metalness: 0.0,
  });

  const weaveDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb08956,
    roughness: 0.88,
    metalness: 0.0,
  });

  const linerMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede6,
    roughness: 0.92,
    metalness: 0.0,
  });

  const addMesh = (geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. Bottom base
  const baseGeo = new THREE.BoxGeometry(W, WALL_T, D);
  addMesh(baseGeo, weaveDarkMat, 'basket_base', 0, WALL_T / 2, 0);

  // 2. Inner fabric liner (visible through side handle cutouts)
  const linerW = W - WALL_T * 2 + 0.004;
  const linerD = D - WALL_T * 2 + 0.004;
  const linerH = BODY_H - WALL_T - 0.005;
  const linerGeo = new THREE.BoxGeometry(linerW, linerH, linerD);
  addMesh(linerGeo, linerMat, 'fabric_liner', 0, WALL_T + linerH / 2, 0);

  // 3. Front (+Z) and Back (-Z) solid woven walls
  const fbWallGeo = new THREE.BoxGeometry(W, BODY_H - WALL_T, WALL_T);
  addMesh(fbWallGeo, weaveMat, 'wall_front', 0, WALL_T + (BODY_H - WALL_T) / 2, D / 2 - WALL_T / 2);
  addMesh(fbWallGeo, weaveMat, 'wall_back', 0, WALL_T + (BODY_H - WALL_T) / 2, -D / 2 + WALL_T / 2);

  // 4. Left (-X) and Right (+X) walls with handle cutouts
  const sideInnerD = D - WALL_T * 2;
  const sideLowerH = BODY_H - WALL_T - HANDLE_H - HANDLE_TOP_MARGIN;
  const sidePillarD = (sideInnerD - HANDLE_W) / 2;

  const sideLowerGeo = new THREE.BoxGeometry(WALL_T, sideLowerH, sideInnerD);
  const sideTopGeo = new THREE.BoxGeometry(WALL_T, HANDLE_TOP_MARGIN, sideInnerD);
  const sidePillarGeo = new THREE.BoxGeometry(WALL_T, HANDLE_H, sidePillarD);

  const sides = [
    { sign: -1, label: 'left' },
    { sign: 1, label: 'right' },
  ];

  sides.forEach(({ sign, label }) => {
    const xPos = sign * (W / 2 - WALL_T / 2);

    // Lower section
    addMesh(
      sideLowerGeo,
      weaveMat,
      `wall_${label}_lower`,
      xPos,
      WALL_T + sideLowerH / 2,
      0
    );

    // Top rim above cutout
    addMesh(
      sideTopGeo,
      weaveMat,
      `wall_${label}_top`,
      xPos,
      BODY_H - HANDLE_TOP_MARGIN / 2,
      0
    );

    // Front & back pillars flanking cutout
    const pillarY = WALL_T + sideLowerH + HANDLE_H / 2;
    const pillarZ = HANDLE_W / 2 + sidePillarD / 2;
    addMesh(sidePillarGeo, weaveMat, `wall_${label}_pillar_front`, xPos, pillarY, pillarZ);
    addMesh(sidePillarGeo, weaveMat, `wall_${label}_pillar_back`, xPos, pillarY, -pillarZ);
  });

  // 5. Four vertical corner ribs for woven edge definition
  const cornerGeo = new THREE.CylinderGeometry(CORNER_R, CORNER_R, BODY_H, 12);
  const corners = [
    [1, 1, 'front_right'],
    [-1, 1, 'front_left'],
    [1, -1, 'back_right'],
    [-1, -1, 'back_left'],
  ];
  corners.forEach(([sx, sz, label]) => {
    addMesh(
      cornerGeo,
      weaveDarkMat,
      `corner_rib_${label}`,
      sx * (W / 2 - CORNER_R * 0.4),
      BODY_H / 2,
      sz * (D / 2 - CORNER_R * 0.4)
    );
  });

  // 6. Horizontal woven texture bands around the body
  const bandCount = 8;
  const bandH = 0.012;
  const bandStep = (BODY_H - 0.04) / bandCount;
  const bandW = W + 0.006;
  const bandD = D + 0.006;
  const bandFBGeo = new THREE.BoxGeometry(bandW, bandH, 0.006);
  const bandLRGeo = new THREE.BoxGeometry(0.006, bandH, bandD);

  for (let i = 0; i < bandCount; i++) {
    const yPos = 0.025 + i * bandStep;
    // Skip bands that intersect the handle cutout on left/right
    const inCutoutY =
      yPos > WALL_T + sideLowerH - bandH / 2 &&
      yPos < BODY_H - HANDLE_TOP_MARGIN + bandH / 2;

    addMesh(bandFBGeo, weaveDarkMat, `weave_band_front_${i}`, 0, yPos, D / 2 + 0.001);
    addMesh(bandFBGeo, weaveDarkMat, `weave_band_back_${i}`, 0, yPos, -D / 2 - 0.001);

    if (!inCutoutY) {
      addMesh(bandLRGeo, weaveDarkMat, `weave_band_left_${i}`, -W / 2 - 0.001, yPos, 0);
      addMesh(bandLRGeo, weaveDarkMat, `weave_band_right_${i}`, W / 2 + 0.001, yPos, 0);
    }
  }

  // 7. Fitted Lid
  const lidW = W + 0.012;
  const lidD = D + 0.012;
  const lidGeo = new THREE.BoxGeometry(lidW, LID_H, lidD);
  addMesh(lidGeo, weaveMat, 'basket_lid', 0, BODY_H + LID_H / 2, 0);

  // Lid perimeter rim
  const lidRimGeo = new THREE.BoxGeometry(lidW + 0.006, 0.01, lidD + 0.006);
  addMesh(lidRimGeo, weaveDarkMat, 'lid_rim', 0, BODY_H + 0.005, 0);

  // 8. Arched woven handle on top of lid
  const lidHandleGeo = new THREE.TorusGeometry(
    LID_HANDLE_R,
    LID_HANDLE_TUBE,
    10,
    24,
    Math.PI
  );
  addMesh(
    lidHandleGeo,
    weaveDarkMat,
    'lid_handle',
    0,
    BODY_H + LID_H - 0.002,
    0,
    0,
    Math.PI / 4,
    0
  );

  return group;
}
