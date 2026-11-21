function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.68;
  const H = 0.92;
  const D = 0.032;

  const OUTER_RX = W / 2;
  const OUTER_RY = H / 2;
  const INNER_RX = 0.205;
  const INNER_RY = 0.325;

  const BACK_THICK = 0.020;
  const MIRROR_THICK = 0.006;
  const TILE_THICK = 0.008;
  const CENTER_Y = OUTER_RY;

  // Materials
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const groutMat = new THREE.MeshStandardMaterial({
    color: 0xc8c4bc,
    roughness: 0.85,
    metalness: 0.05,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xb5afa3,
    roughness: 0.55,
    metalness: 0.25,
  });

  const tileMats = [
    new THREE.MeshPhysicalMaterial({
      color: 0xc9a26d,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.6,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0xe6dfd3,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.5,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0xd4b892,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.6,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0xb58952,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.6,
    }),
    mirrorMat,
  ];

  // 1. Backing board (flat back at z = -D / 2)
  const backGeo = new THREE.CylinderGeometry(1, 1, BACK_THICK, 32);
  const backing = new THREE.Mesh(backGeo, groutMat);
  backing.name = 'backing_board';
  backing.rotation.x = Math.PI / 2;
  backing.scale.set(OUTER_RX, 1, OUTER_RY);
  backing.position.set(0, CENTER_Y, -D / 2 + BACK_THICK / 2);
  backing.castShadow = true;
  backing.receiveShadow = true;
  group.add(backing);

  // 2. Central oval mirror glass
  const mirrorGeo = new THREE.CylinderGeometry(1, 1, MIRROR_THICK, 32);
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.name = 'mirror_glass';
  mirror.rotation.x = Math.PI / 2;
  mirror.scale.set(INNER_RX, 1, INNER_RY);
  mirror.position.set(0, CENTER_Y, -D / 2 + BACK_THICK + MIRROR_THICK / 2);
  mirror.castShadow = true;
  mirror.receiveShadow = true;
  group.add(mirror);

  // 3. Inner bezel around mirror glass
  const innerBezelGeo = new THREE.TorusGeometry(1, 0.012, 10, 32);
  const innerBezel = new THREE.Mesh(innerBezelGeo, trimMat);
  innerBezel.name = 'inner_bezel';
  innerBezel.scale.set(INNER_RX, INNER_RY, 1);
  innerBezel.position.set(0, CENTER_Y, -D / 2 + BACK_THICK + 0.004);
  innerBezel.castShadow = true;
  innerBezel.receiveShadow = true;
  group.add(innerBezel);

  // 4. Outer rim trim
  const outerRimGeo = new THREE.TorusGeometry(1, 0.014, 10, 32);
  const outerRim = new THREE.Mesh(outerRimGeo, trimMat);
  outerRim.name = 'outer_rim';
  outerRim.scale.set(OUTER_RX - 0.004, OUTER_RY - 0.004, 1);
  outerRim.position.set(0, CENTER_Y, -D / 2 + BACK_THICK + 0.002);
  outerRim.castShadow = true;
  outerRim.receiveShadow = true;
  group.add(outerRim);

  // Helper to place a mosaic tile along an oval ring
  function addTile(name, angle, rxMid, ryMid, radialH, tangentW, mat) {
    const x = rxMid * Math.cos(angle);
    const y = CENTER_Y + ryMid * Math.sin(angle);

    // Outward normal of the ellipse
    const nx = Math.cos(angle) / rxMid;
    const ny = Math.sin(angle) / ryMid;
    const rotZ = Math.atan2(ny, nx) - Math.PI / 2;

    const tileGeo = new THREE.BoxGeometry(tangentW, radialH, TILE_THICK);
    const tile = new THREE.Mesh(tileGeo, mat);
    tile.name = name;
    tile.position.set(x, y, -D / 2 + BACK_THICK + TILE_THICK / 2);
    tile.rotation.z = rotZ;
    tile.castShadow = true;
    tile.receiveShadow = true;
    group.add(tile);
  }

  // 5. Inner mosaic ring (12 tiles)
  const INNER_RING_COUNT = 12;
  const innerRingRx = INNER_RX + 0.026;
  const innerRingRy = INNER_RY + 0.026;
  const innerPattern = [4, 1, 2, 4, 0, 1, 4, 2, 1, 4, 0, 2];

  for (let i = 0; i < INNER_RING_COUNT; i++) {
    const angle = (i / INNER_RING_COUNT) * Math.PI * 2;
    const mat = tileMats[innerPattern[i % innerPattern.length]];
    addTile(
      `inner_mosaic_tile_${i + 1}`,
      angle,
      innerRingRx,
      innerRingRy,
      0.032,
      0.075,
      mat
    );
  }

  // 6. Outer mosaic ring (20 tiles)
  const OUTER_RING_COUNT = 20;
  const outerRingRx = INNER_RX + 0.088;
  const outerRingRy = INNER_RY + 0.088;
  const outerPattern = [
    0, 1, 2, 3, 4, 0, 1, 2, 0, 1,
    3, 2, 0, 4, 1, 2, 0, 3, 1, 2,
  ];

  for (let i = 0; i < OUTER_RING_COUNT; i++) {
    const angle = (i / OUTER_RING_COUNT) * Math.PI * 2;
    const mat = tileMats[outerPattern[i % outerPattern.length]];
    addTile(
      `outer_mosaic_tile_${i + 1}`,
      angle,
      outerRingRx,
      outerRingRy,
      0.078,
      0.072,
      mat
    );
  }

  return group;
}
