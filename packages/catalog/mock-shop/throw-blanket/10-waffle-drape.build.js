function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters) for a neatly folded waffle-weave throw blanket
  const W = 0.42;
  const D = 0.34;
  const H = 0.135;
  const LAYER_COUNT = 3;
  const LAYER_H = H / LAYER_COUNT;
  const BEVEL = 0.012;
  const CORNER_R = 0.025;

  // Materials
  const waffleMat = new THREE.MeshStandardMaterial({
    color: 0xa44827,
    roughness: 0.92,
    metalness: 0.0
  });

  const waffleRibMat = new THREE.MeshStandardMaterial({
    color: 0x943e20,
    roughness: 0.95,
    metalness: 0.0
  });

  const hemMat = new THREE.MeshStandardMaterial({
    color: 0xb05230,
    roughness: 0.88,
    metalness: 0.0
  });

  const tagMat = new THREE.MeshStandardMaterial({
    color: 0xe6dccf,
    roughness: 0.85,
    metalness: 0.0
  });

  // Helper to create a rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // Create 3 stacked folded layers
  const layerInnerW = W - BEVEL * 2;
  const layerInnerD = D - BEVEL * 2;
  const layerExtrudeDepth = LAYER_H - BEVEL * 2;
  const layerShape = createRoundedRectShape(layerInnerW, layerInnerD, CORNER_R);

  const layerGeo = new THREE.ExtrudeGeometry(layerShape, {
    depth: layerExtrudeDepth,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8
  });
  // Rotate so extrusion is along +Y, and bottom sits at y = 0
  layerGeo.rotateX(-Math.PI / 2);
  layerGeo.translate(0, BEVEL, 0);

  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = new THREE.Mesh(layerGeo, waffleMat);
    // Slight natural offset per layer so it doesn't look rigid
    const xOffset = i === 1 ? 0.003 : 0;
    const zOffset = i === 2 ? -0.002 : 0;
    layer.position.set(xOffset, i * (LAYER_H - 0.002), zOffset);
    layer.name = `folded_layer_${i + 1}`;
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
  }

  // Curved fold-over spines connecting the layers (alternating left and right)
  const spineRadius = LAYER_H * 0.92;
  const spineLen = D - CORNER_R * 1.4;
  const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, spineLen, 16);
  spineGeo.rotateX(Math.PI / 2);

  // Left fold spine connecting layer 1 and layer 2
  const leftSpine = new THREE.Mesh(spineGeo, waffleMat);
  leftSpine.position.set(-W / 2 + spineRadius * 0.45, LAYER_H * 0.95, 0);
  leftSpine.name = "fold_spine_left";
  leftSpine.castShadow = true;
  leftSpine.receiveShadow = true;
  group.add(leftSpine);

  // Right fold spine connecting layer 2 and layer 3
  const rightSpine = new THREE.Mesh(spineGeo, waffleMat);
  rightSpine.position.set(W / 2 - spineRadius * 0.45, LAYER_H * 1.92, 0);
  rightSpine.name = "fold_spine_right";
  rightSpine.castShadow = true;
  rightSpine.receiveShadow = true;
  group.add(rightSpine);

  // Hemmed edge trims on the top layer's front, back, left, and right
  const topY = (LAYER_COUNT - 1) * (LAYER_H - 0.002) + LAYER_H - 0.004;
  const hemRadius = 0.0045;

  const frontBackHemGeo = new THREE.CapsuleGeometry(hemRadius, W - CORNER_R * 2, 4, 8);
  frontBackHemGeo.rotateZ(Math.PI / 2);

  const frontHem = new THREE.Mesh(frontBackHemGeo, hemMat);
  frontHem.position.set(0, topY - 0.004, D / 2 - 0.006);
  frontHem.name = "hem_trim_front";
  frontHem.castShadow = true;
  frontHem.receiveShadow = true;
  group.add(frontHem);

  const backHem = new THREE.Mesh(frontBackHemGeo, hemMat);
  backHem.position.set(0, topY - 0.004, -D / 2 + 0.006);
  backHem.name = "hem_trim_back";
  backHem.castShadow = true;
  backHem.receiveShadow = true;
  group.add(backHem);

  const sideHemGeo = new THREE.CapsuleGeometry(hemRadius, D - CORNER_R * 2, 4, 8);
  sideHemGeo.rotateX(Math.PI / 2);

  const leftHem = new THREE.Mesh(sideHemGeo, hemMat);
  leftHem.position.set(-W / 2 + 0.006, topY - 0.004, 0);
  leftHem.name = "hem_trim_left";
  leftHem.castShadow = true;
  leftHem.receiveShadow = true;
  group.add(leftHem);

  const rightHem = new THREE.Mesh(sideHemGeo, hemMat);
  rightHem.position.set(W / 2 - 0.006, topY - 0.004, 0);
  rightHem.name = "hem_trim_right";
  rightHem.castShadow = true;
  rightHem.receiveShadow = true;
  group.add(rightHem);

  // Waffle-weave texture ribs on the top surface
  const ribCountX = 5;
  const ribCountZ = 5;
  const ribRadius = 0.0022;
  const ribSpanX = W - CORNER_R * 2.2;
  const ribSpanZ = D - CORNER_R * 2.2;

  const ribXGeo = new THREE.CapsuleGeometry(ribRadius, ribSpanX, 3, 6);
  ribXGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < ribCountZ; i++) {
    const zPos = -ribSpanZ / 2 + (i / (ribCountZ - 1)) * ribSpanZ;
    const rib = new THREE.Mesh(ribXGeo, waffleRibMat);
    rib.position.set(0, topY + 0.0005, zPos);
    rib.name = `waffle_rib_x_${i + 1}`;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  const ribZGeo = new THREE.CapsuleGeometry(ribRadius, ribSpanZ, 3, 6);
  ribZGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < ribCountX; i++) {
    const xPos = -ribSpanX / 2 + (i / (ribCountX - 1)) * ribSpanX;
    const rib = new THREE.Mesh(ribZGeo, waffleRibMat);
    rib.position.set(xPos, topY + 0.0005, 0);
    rib.name = `waffle_rib_z_${i + 1}`;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  // Small woven fabric label/tag on the front-right corner
  const tagGeo = new THREE.BoxGeometry(0.032, 0.003, 0.018);
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(W / 2 - 0.055, topY + 0.001, D / 2 - 0.018);
  tag.rotation.y = -0.08;
  tag.name = "woven_brand_tag";
  tag.castShadow = true;
  tag.receiveShadow = true;
  group.add(tag);

  return group;
}
