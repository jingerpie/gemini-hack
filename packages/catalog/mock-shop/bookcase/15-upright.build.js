function build(THREE) {
  const group = new THREE.Group();

  const W = 0.90;
  const H = 1.90;
  const D = 0.36;
  const T = 0.025;
  const BACK_T = 0.015;
  const PLINTH_H = 0.065;
  const PLINTH_INSET = 0.025;
  const SHELF_FRONT_INSET = 0.004;

  const INNER_W = W - 2 * T;
  const CARCASS_H = H - PLINTH_H;
  const SHELF_D = D - BACK_T - SHELF_FRONT_INSET;
  const SHELF_Z = (BACK_T - SHELF_FRONT_INSET) / 2;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb6a997,
    roughness: 0.68,
    metalness: 0.02
  });

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0x4a433b,
    roughness: 0.4,
    metalness: 0.6
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Recessed plinth base
  const plinthW = W - 2 * PLINTH_INSET;
  const plinthD = D - PLINTH_INSET;
  const plinthGeo = new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD);
  addMesh(plinthGeo, woodMat, 'plinth_base', 0, PLINTH_H / 2, -PLINTH_INSET / 2);

  // Left and right side panels
  const sideGeo = new THREE.BoxGeometry(T, CARCASS_H, D);
  const sideY = PLINTH_H + CARCASS_H / 2;
  addMesh(sideGeo, woodMat, 'left_side_panel', -W / 2 + T / 2, sideY, 0);
  addMesh(sideGeo, woodMat, 'right_side_panel', W / 2 - T / 2, sideY, 0);

  // Bottom and top panels
  const horizGeo = new THREE.BoxGeometry(INNER_W, T, D);
  const bottomY = PLINTH_H + T / 2;
  const topY = H - T / 2;
  addMesh(horizGeo, woodMat, 'bottom_panel', 0, bottomY, 0);
  addMesh(horizGeo, woodMat, 'top_panel', 0, topY, 0);

  // Back panel
  const backH = CARCASS_H - 2 * T;
  const backGeo = new THREE.BoxGeometry(INNER_W, backH, BACK_T);
  addMesh(backGeo, woodMat, 'back_panel', 0, PLINTH_H + T + backH / 2, -D / 2 + BACK_T / 2);

  // 4 interior shelves creating 5 compartments
  const shelfCount = 4;
  const compartmentCount = shelfCount + 1;
  const usableH = CARCASS_H - 2 * T;
  const stepY = usableH / compartmentCount;

  const shelfGeo = new THREE.BoxGeometry(INNER_W, T, SHELF_D);
  const pinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.012, 8);
  const pinZFront = D / 2 - SHELF_FRONT_INSET - 0.035;
  const pinZBack = -D / 2 + BACK_T + 0.035;
  const pinXOffset = INNER_W / 2 - 0.004;

  for (let i = 1; i <= shelfCount; i++) {
    const shelfY = PLINTH_H + T + i * stepY;
    addMesh(shelfGeo, woodMat, `shelf_${i}`, 0, shelfY, SHELF_Z);

    const pinY = shelfY - T / 2 - 0.003;
    addMesh(pinGeo, pinMat, `shelf_${i}_pin_fl`, -pinXOffset, pinY, pinZFront, 0, 0, Math.PI / 2);
    addMesh(pinGeo, pinMat, `shelf_${i}_pin_fr`, pinXOffset, pinY, pinZFront, 0, 0, Math.PI / 2);
    addMesh(pinGeo, pinMat, `shelf_${i}_pin_bl`, -pinXOffset, pinY, pinZBack, 0, 0, Math.PI / 2);
    addMesh(pinGeo, pinMat, `shelf_${i}_pin_br`, pinXOffset, pinY, pinZBack, 0, 0, Math.PI / 2);
  }

  return group;
}
