function build(THREE) {
  const group = new THREE.Group();

  const W = 1.6;
  const D = 2.0;
  const H = 0.016;
  const BORDER_D = 0.025;
  const CENTER_STRIPE_W = 0.24;
  const SIDE_W = (W - CENTER_STRIPE_W) / 2;
  const INNER_D = D - BORDER_D * 2;

  const matDark = new THREE.MeshStandardMaterial({
    color: 0x5b4e3e,
    roughness: 0.92,
    metalness: 0.0
  });
  const matTan = new THREE.MeshStandardMaterial({
    color: 0xb58b52,
    roughness: 0.9,
    metalness: 0.0
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe5dfd3,
    roughness: 0.88,
    metalness: 0.0
  });
  const matBorder = new THREE.MeshStandardMaterial({
    color: 0xd4c7b4,
    roughness: 0.92,
    metalness: 0.0
  });
  const matBase = new THREE.MeshStandardMaterial({
    color: 0x4a3f32,
    roughness: 0.95,
    metalness: 0.0
  });

  // Base backing layer
  const baseGeo = new THREE.BoxGeometry(W - 0.004, H * 0.4, INNER_D);
  const baseMesh = new THREE.Mesh(baseGeo, matBase);
  baseMesh.position.set(0, H * 0.2, 0);
  baseMesh.name = 'rug_backing';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Top and bottom selvedge borders
  const borderGeo = new THREE.BoxGeometry(W, H * 0.85, BORDER_D);

  const topBorder = new THREE.Mesh(borderGeo, matBorder);
  topBorder.position.set(0, H * 0.425, -D / 2 + BORDER_D / 2);
  topBorder.name = 'selvedge_border_north';
  topBorder.castShadow = true;
  topBorder.receiveShadow = true;
  group.add(topBorder);

  const bottomBorder = new THREE.Mesh(borderGeo, matBorder);
  bottomBorder.position.set(0, H * 0.425, D / 2 - BORDER_D / 2);
  bottomBorder.name = 'selvedge_border_south';
  bottomBorder.castShadow = true;
  bottomBorder.receiveShadow = true;
  group.add(bottomBorder);

  // Central vertical smoked jute stripe
  const centerGeo = new THREE.BoxGeometry(CENTER_STRIPE_W, H * 0.65, INNER_D);
  const centerStripe = new THREE.Mesh(centerGeo, matDark);
  centerStripe.position.set(0, H * 0.4 + (H * 0.65) / 2, 0);
  centerStripe.name = 'central_vertical_stripe';
  centerStripe.castShadow = true;
  centerStripe.receiveShadow = true;
  group.add(centerStripe);

  // 9 horizontal bands on left and right of the central stripe
  const bands = [
    { name: 'dark', mat: matDark, weight: 0.85 },
    { name: 'tan', mat: matTan, weight: 1.0 },
    { name: 'cream', mat: matCream, weight: 1.25 },
    { name: 'tan', mat: matTan, weight: 1.0 },
    { name: 'dark', mat: matDark, weight: 0.9 },
    { name: 'tan', mat: matTan, weight: 1.0 },
    { name: 'cream', mat: matCream, weight: 1.25 },
    { name: 'tan', mat: matTan, weight: 1.0 },
    { name: 'dark', mat: matDark, weight: 0.85 }
  ];

  const totalWeight = bands.reduce((sum, b) => sum + b.weight, 0);
  const bandH = H * 0.6;
  const bandY = H * 0.4 + bandH / 2;
  const leftX = -CENTER_STRIPE_W / 2 - SIDE_W / 2;
  const rightX = CENTER_STRIPE_W / 2 + SIDE_W / 2;

  let currentZ = -INNER_D / 2;
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const bandD = (band.weight / totalWeight) * INNER_D;
    const zPos = currentZ + bandD / 2;
    const bandGeo = new THREE.BoxGeometry(SIDE_W, bandH, bandD);

    const leftMesh = new THREE.Mesh(bandGeo, band.mat);
    leftMesh.position.set(leftX, bandY, zPos);
    leftMesh.name = `band_${i + 1}_${band.name}_left`;
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    group.add(leftMesh);

    const rightMesh = new THREE.Mesh(bandGeo, band.mat);
    rightMesh.position.set(rightX, bandY, zPos);
    rightMesh.name = `band_${i + 1}_${band.name}_right`;
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    group.add(rightMesh);

    currentZ += bandD;
  }

  return group;
}
