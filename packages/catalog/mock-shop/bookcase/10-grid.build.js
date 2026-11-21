function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.80;
  const H = 1.76;
  const D = 0.30;
  const T = 0.02;
  const BASE_H = 0.055;
  const BAY_W = (W - 3 * T) / 2;
  const LEFT_BAY_X = -(T / 2 + BAY_W / 2);
  const RIGHT_BAY_X = T / 2 + BAY_W / 2;
  const NUM_LEVELS = 6;
  const FASTENER_R = 0.0035;
  const FASTENER_D = 0.002;
  const FASTENER_OFFSET_Y = 0.016;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa26f42,
    roughness: 0.65,
    metalness: 0.02,
  });

  const fastenerMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.5,
  });

  // Vertical panels (left, center, right)
  const verticalGeo = new THREE.BoxGeometry(T, H, D);
  const verticalSpecs = [
    { name: 'left_side_panel', x: -W / 2 + T / 2 },
    { name: 'center_divider_panel', x: 0 },
    { name: 'right_side_panel', x: W / 2 - T / 2 },
  ];

  for (const spec of verticalSpecs) {
    const panel = new THREE.Mesh(verticalGeo, woodMat);
    panel.name = spec.name;
    panel.position.set(spec.x, H / 2, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  }

  // Horizontal shelves (6 levels, 2 bays each)
  const shelfGeo = new THREE.BoxGeometry(BAY_W, T, D);
  const yBottom = BASE_H + T / 2;
  const yTop = H - T / 2;
  const levelStep = (yTop - yBottom) / (NUM_LEVELS - 1);

  for (let i = 0; i < NUM_LEVELS; i++) {
    const y = yBottom + i * levelStep;

    const leftShelf = new THREE.Mesh(shelfGeo, woodMat);
    leftShelf.name = `left_shelf_${i + 1}`;
    leftShelf.position.set(LEFT_BAY_X, y, 0);
    leftShelf.castShadow = true;
    leftShelf.receiveShadow = true;
    group.add(leftShelf);

    const rightShelf = new THREE.Mesh(shelfGeo, woodMat);
    rightShelf.name = `right_shelf_${i + 1}`;
    rightShelf.position.set(RIGHT_BAY_X, y, 0);
    rightShelf.castShadow = true;
    rightShelf.receiveShadow = true;
    group.add(rightShelf);
  }

  // Modular joint fasteners on front edges of vertical panels
  const fastenerGeo = new THREE.CylinderGeometry(FASTENER_R, FASTENER_R, FASTENER_D, 12);
  const jointY = H / 2;

  for (const spec of verticalSpecs) {
    for (const dy of [-FASTENER_OFFSET_Y, FASTENER_OFFSET_Y]) {
      const fastener = new THREE.Mesh(fastenerGeo, fastenerMat);
      fastener.name = `${spec.name}_fastener_${dy > 0 ? 'upper' : 'lower'}`;
      fastener.rotation.x = Math.PI / 2;
      fastener.position.set(spec.x, jointY + dy, D / 2 + FASTENER_D / 2 - 0.0005);
      fastener.castShadow = true;
      fastener.receiveShadow = true;
      group.add(fastener);
    }
  }

  return group;
}
