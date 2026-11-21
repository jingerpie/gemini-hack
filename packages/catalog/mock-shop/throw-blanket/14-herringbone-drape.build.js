function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const H = 0.12;
  const D = 0.34;
  const LAYER_H = H / 3;
  const BEVEL = 0.012;
  const FRINGE_LEN = 0.055;
  const FRINGE_COUNT = 20;

  // Materials
  const woolMat = new THREE.MeshStandardMaterial({
    color: 0x38573e,
    roughness: 0.92,
    metalness: 0.0
  });

  const woolDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2b4530,
    roughness: 0.95,
    metalness: 0.0
  });

  const fringeMat = new THREE.MeshStandardMaterial({
    color: 0x6f876d,
    roughness: 0.9,
    metalness: 0.0
  });

  // Helper to create a rounded rectangular layer
  function createRoundedLayer(width, height, depth, radius) {
    const hw = width / 2 - BEVEL;
    const hd = depth / 2 - BEVEL;
    const r = Math.min(radius, hw * 0.4, hd * 0.4);

    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

    const extrudeDepth = Math.max(0.004, height - BEVEL * 2);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: extrudeDepth,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 8
    });

    // Rotate so extrusion is along +Y, centered on X and Z
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, BEVEL, 0);
    return geom;
  }

  // 1. Bottom layer
  const bottomGeom = createRoundedLayer(W, LAYER_H, D, 0.025);
  const bottomLayer = new THREE.Mesh(bottomGeom, woolMat);
  bottomLayer.name = 'blanket_layer_bottom';
  bottomLayer.position.set(0, 0, -FRINGE_LEN * 0.15);
  bottomLayer.castShadow = true;
  bottomLayer.receiveShadow = true;
  group.add(bottomLayer);

  // 2. Middle layer
  const middleGeom = createRoundedLayer(W * 0.985, LAYER_H, D * 0.97, 0.025);
  const middleLayer = new THREE.Mesh(middleGeom, woolMat);
  middleLayer.name = 'blanket_layer_middle';
  middleLayer.position.set(0, LAYER_H * 0.92, -FRINGE_LEN * 0.15);
  middleLayer.castShadow = true;
  middleLayer.receiveShadow = true;
  group.add(middleLayer);

  // 3. Top layer
  const topGeom = createRoundedLayer(W * 0.97, LAYER_H, D * 0.94, 0.025);
  const topLayer = new THREE.Mesh(topGeom, woolMat);
  topLayer.name = 'blanket_layer_top';
  topLayer.position.set(0, LAYER_H * 1.84, -FRINGE_LEN * 0.15);
  topLayer.castShadow = true;
  topLayer.receiveShadow = true;
  group.add(topLayer);

  // 4. Back fold spine (connects bottom and middle layers smoothly at -Z)
  const backSpineGeom = new THREE.CapsuleGeometry(LAYER_H * 0.72, W * 0.86, 6, 16);
  backSpineGeom.rotateZ(Math.PI / 2);
  const backSpine = new THREE.Mesh(backSpineGeom, woolDarkMat);
  backSpine.name = 'fold_spine_back';
  backSpine.position.set(0, LAYER_H * 0.92, -D / 2 + BEVEL * 0.8 - FRINGE_LEN * 0.15);
  backSpine.castShadow = true;
  backSpine.receiveShadow = true;
  group.add(backSpine);

  // 5. Side fold spine (connects middle and top layers smoothly at -X)
  const sideSpineGeom = new THREE.CapsuleGeometry(LAYER_H * 0.7, D * 0.82, 6, 16);
  sideSpineGeom.rotateX(Math.PI / 2);
  const sideSpine = new THREE.Mesh(sideSpineGeom, woolDarkMat);
  sideSpine.name = 'fold_spine_side';
  sideSpine.position.set(-W / 2 + BEVEL * 0.9, LAYER_H * 1.84, -FRINGE_LEN * 0.15);
  sideSpine.castShadow = true;
  sideSpine.receiveShadow = true;
  group.add(sideSpine);

  // 6. Fringe tassels along the +Z front edge
  const fringeStartX = -W * 0.43;
  const fringeEndX = W * 0.43;
  const fringeZ = D / 2 - FRINGE_LEN * 0.15;

  for (let i = 0; i < FRINGE_COUNT; i++) {
    const t = i / (FRINGE_COUNT - 1);
    const x = fringeStartX + t * (fringeEndX - fringeStartX);
    const lenVar = 1.0 + 0.12 * Math.sin(i * 1.7);
    const tasselLen = FRINGE_LEN * lenVar;
    const tasselRadius = 0.0032;

    const tasselGeom = new THREE.CapsuleGeometry(tasselRadius, tasselLen, 4, 8);
    tasselGeom.rotateX(Math.PI / 2);

    const tassel = new THREE.Mesh(tasselGeom, fringeMat);
    const idxStr = String(i + 1).padStart(2, '0');
    tassel.name = `fringe_tassel_${idxStr}`;

    const yPos = LAYER_H * 0.35 + 0.002 * Math.cos(i * 2.1);
    tassel.position.set(x, yPos, fringeZ + tasselLen * 0.45);
    tassel.rotation.y = 0.06 * Math.sin(i * 2.3);
    tassel.rotation.x = 0.14;
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
