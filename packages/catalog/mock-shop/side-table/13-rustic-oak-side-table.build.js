function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions in meters
  const W = 0.55;
  const D = 0.55;
  const H = 0.55;
  const TOP_THICK = 0.042;
  const OVERHANG = 0.032;
  const LEG_SIZE = 0.064;
  const APRON_H = 0.078;
  const APRON_THICK = 0.024;
  const APRON_INSET = 0.012;

  const LEG_H = H - TOP_THICK;
  const LEG_OFFSET_X = W / 2 - OVERHANG - LEG_SIZE / 2;
  const LEG_OFFSET_Z = D / 2 - OVERHANG - LEG_SIZE / 2;

  // Materials
  const oakMainMat = new THREE.MeshStandardMaterial({
    color: 0xa67b4d,
    roughness: 0.78,
    metalness: 0.02,
  });

  const oakLightMat = new THREE.MeshStandardMaterial({
    color: 0xb38859,
    roughness: 0.8,
    metalness: 0.02,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8f663b,
    roughness: 0.82,
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

  // 4 Sturdy Square Legs
  const legGeo = new THREE.BoxGeometry(LEG_SIZE, LEG_H, LEG_SIZE);
  const legPositions = [
    ["leg_front_left", -LEG_OFFSET_X, LEG_OFFSET_Z],
    ["leg_front_right", LEG_OFFSET_X, LEG_OFFSET_Z],
    ["leg_back_left", -LEG_OFFSET_X, -LEG_OFFSET_Z],
    ["leg_back_right", LEG_OFFSET_X, -LEG_OFFSET_Z],
  ];

  for (const [name, lx, lz] of legPositions) {
    addMesh(legGeo, oakMainMat, name, lx, LEG_H / 2, lz);
  }

  // 4 Apron Rails
  const apronY = LEG_H - APRON_H / 2;
  const apronSpanX = LEG_OFFSET_X * 2 - LEG_SIZE;
  const apronSpanZ = LEG_OFFSET_Z * 2 - LEG_SIZE;

  const apronFrontBackGeo = new THREE.BoxGeometry(apronSpanX, APRON_H, APRON_THICK);
  const apronSideGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, apronSpanZ);

  const apronZPos = LEG_OFFSET_Z - LEG_SIZE / 2 + APRON_THICK / 2 + APRON_INSET;
  const apronXPos = LEG_OFFSET_X - LEG_SIZE / 2 + APRON_THICK / 2 + APRON_INSET;

  addMesh(apronFrontBackGeo, oakDarkMat, "apron_front", 0, apronY, apronZPos);
  addMesh(apronFrontBackGeo, oakDarkMat, "apron_back", 0, apronY, -apronZPos);
  addMesh(apronSideGeo, oakDarkMat, "apron_left", -apronXPos, apronY, 0);
  addMesh(apronSideGeo, oakDarkMat, "apron_right", apronXPos, apronY, 0);

  // Tabletop constructed with breadboard ends and 3 center planks
  const topY = H - TOP_THICK / 2;
  const breadboardW = 0.085;
  const centerSpanW = W - breadboardW * 2;
  const plankCount = 3;
  const plankGap = 0.0015;
  const plankD = (D - plankGap * (plankCount - 1)) / plankCount;

  const breadboardGeo = new THREE.BoxGeometry(breadboardW, TOP_THICK, D);
  addMesh(
    breadboardGeo,
    oakLightMat,
    "top_breadboard_left",
    -W / 2 + breadboardW / 2,
    topY,
    0
  );
  addMesh(
    breadboardGeo,
    oakLightMat,
    "top_breadboard_right",
    W / 2 - breadboardW / 2,
    topY,
    0
  );

  const centerPlankGeo = new THREE.BoxGeometry(
    centerSpanW - plankGap * 2,
    TOP_THICK,
    plankD
  );
  const plankMats = [oakMainMat, oakLightMat, oakMainMat];
  for (let i = 0; i < plankCount; i++) {
    const pz = -D / 2 + plankD / 2 + i * (plankD + plankGap);
    addMesh(
      centerPlankGeo,
      plankMats[i],
      `top_center_plank_${i + 1}`,
      0,
      topY,
      pz
    );
  }

  // Under-top support cleats
  const cleatSize = 0.028;
  const cleatGeo = new THREE.BoxGeometry(cleatSize, cleatSize, cleatSize);
  const cleatY = LEG_H - cleatSize / 2;
  const cleatOffsetX = LEG_OFFSET_X - LEG_SIZE / 2 - cleatSize / 2;
  const cleatOffsetZ = LEG_OFFSET_Z - LEG_SIZE / 2 - cleatSize / 2;

  const cleatPositions = [
    ["cleat_front_left", -cleatOffsetX, cleatOffsetZ],
    ["cleat_front_right", cleatOffsetX, cleatOffsetZ],
    ["cleat_back_left", -cleatOffsetX, -cleatOffsetZ],
    ["cleat_back_right", cleatOffsetX, -cleatOffsetZ],
  ];

  for (const [name, cx, cz] of cleatPositions) {
    addMesh(cleatGeo, oakDarkMat, name, cx, cleatY, cz);
  }

  return group;
}
