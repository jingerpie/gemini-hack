function build(THREE) {
  const group = new THREE.Group();

  const W = 2.10;
  const H = 0.50;
  const D = 0.45;
  const PLINTH_H = 0.06;
  const PLINTH_INSET = 0.04;
  const THICK = 0.022;
  const SLAT_COUNT = 30;
  const SLAT_D = 0.016;
  const SLAT_W = 0.028;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x1e1d1b,
    roughness: 0.65,
    metalness: 0.05,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x121110,
    roughness: 0.85,
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

  // Recessed plinth base
  const plinthW = W - PLINTH_INSET * 2;
  const plinthD = D - PLINTH_INSET * 2;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    woodMat,
    "plinth_base",
    0,
    PLINTH_H / 2,
    0
  );

  // Main cabinet shell
  const bodyH = H - PLINTH_H;
  const innerH = bodyH - THICK * 2;
  const innerW = W - THICK * 2;

  addMesh(
    new THREE.BoxGeometry(W, THICK, D),
    woodMat,
    "top_panel",
    0,
    H - THICK / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(W, THICK, D),
    woodMat,
    "bottom_panel",
    0,
    PLINTH_H + THICK / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(THICK, innerH, D),
    woodMat,
    "left_side_panel",
    -W / 2 + THICK / 2,
    PLINTH_H + bodyH / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(THICK, innerH, D),
    woodMat,
    "right_side_panel",
    W / 2 - THICK / 2,
    PLINTH_H + bodyH / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(innerW, innerH, THICK),
    woodMat,
    "back_panel",
    0,
    PLINTH_H + bodyH / 2,
    -D / 2 + THICK / 2
  );

  // Recessed door backing panels (left, center, right)
  const backingZ = D / 2 - SLAT_D - THICK / 2;
  const gap = 0.004;
  const sideDoorW = innerW * 0.25 - gap;
  const centerDoorW = innerW * 0.5 - gap;

  addMesh(
    new THREE.BoxGeometry(sideDoorW, innerH - 0.004, THICK),
    backingMat,
    "door_backing_left",
    -innerW / 2 + sideDoorW / 2,
    PLINTH_H + bodyH / 2,
    backingZ
  );

  addMesh(
    new THREE.BoxGeometry(centerDoorW, innerH - 0.004, THICK),
    backingMat,
    "door_backing_center",
    0,
    PLINTH_H + bodyH / 2,
    backingZ
  );

  addMesh(
    new THREE.BoxGeometry(sideDoorW, innerH - 0.004, THICK),
    backingMat,
    "door_backing_right",
    innerW / 2 - sideDoorW / 2,
    PLINTH_H + bodyH / 2,
    backingZ
  );

  // Vertical front slats
  const slatGeo = new THREE.BoxGeometry(SLAT_W, innerH - 0.004, SLAT_D);
  const slatSpan = innerW - SLAT_W - 0.016;
  const slatZ = D / 2 - SLAT_D / 2;
  const slatY = PLINTH_H + bodyH / 2;

  for (let i = 0; i < SLAT_COUNT; i++) {
    const t = i / (SLAT_COUNT - 1);
    const x = -slatSpan / 2 + t * slatSpan;
    const idx = String(i + 1).padStart(2, "0");
    addMesh(slatGeo, woodMat, `front_slat_${idx}`, x, slatY, slatZ);
  }

  return group;
}
