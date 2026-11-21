function build(THREE) {
  const group = new THREE.Group();

  const W = 0.46;
  const D = 0.34;
  const H = 0.075;
  const LAYER_H = H / 3;
  const BEVEL = 0.008;
  const FRINGE_LEN = 0.045;
  const FRINGE_R = 0.0035;
  const FRINGE_COUNT = 20;

  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0xc8b9a6,
    roughness: 0.92,
    metalness: 0.0,
  });

  const hemMat = new THREE.MeshStandardMaterial({
    color: 0xbcae9a,
    roughness: 0.9,
    metalness: 0.0,
  });

  const fringeMat = new THREE.MeshStandardMaterial({
    color: 0xd4c7b4,
    roughness: 0.95,
    metalness: 0.0,
  });

  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    shape.moveTo(-hw + radius, -hd);
    shape.lineTo(hw - radius, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
    shape.lineTo(hw, hd - radius);
    shape.quadraticCurveTo(hw, hd, hw - radius, hd);
    shape.lineTo(-hw + radius, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
    shape.lineTo(-hw, -hd + radius);
    shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
    return shape;
  }

  const layerShape = createRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, 0.025);
  const layerGeo = new THREE.ExtrudeGeometry(layerShape, {
    depth: LAYER_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  layerGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < 3; i++) {
    const layer = new THREE.Mesh(layerGeo, blanketMat);
    layer.name = `folded_layer_${i + 1}`;
    layer.position.set(0, (i + 1) * LAYER_H - BEVEL, 0);
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
  }

  const foldGeo = new THREE.CapsuleGeometry(LAYER_H * 0.95, W - 0.04, 8, 16);
  foldGeo.rotateZ(Math.PI / 2);

  const backFold = new THREE.Mesh(foldGeo, blanketMat);
  backFold.name = "back_fold_spine";
  backFold.position.set(0, LAYER_H, -D / 2 + 0.006);
  backFold.castShadow = true;
  backFold.receiveShadow = true;
  group.add(backFold);

  const frontFold = new THREE.Mesh(foldGeo, blanketMat);
  frontFold.name = "front_fold_spine";
  frontFold.position.set(0, LAYER_H * 2, D / 2 - 0.006);
  frontFold.castShadow = true;
  frontFold.receiveShadow = true;
  group.add(frontFold);

  const hemGeo = new THREE.CapsuleGeometry(0.006, D - 0.04, 6, 12);
  hemGeo.rotateX(Math.PI / 2);

  const hemPositions = [
    { name: "left_top_hem", x: -W / 2 + 0.004, y: H - LAYER_H * 0.5 },
    { name: "right_top_hem", x: W / 2 - 0.004, y: H - LAYER_H * 0.5 },
    { name: "left_bottom_hem", x: -W / 2 + 0.004, y: LAYER_H * 0.5 },
    { name: "right_bottom_hem", x: W / 2 - 0.004, y: LAYER_H * 0.5 },
  ];

  for (const hp of hemPositions) {
    const hem = new THREE.Mesh(hemGeo, hemMat);
    hem.name = hp.name;
    hem.position.set(hp.x, hp.y, 0);
    hem.castShadow = true;
    hem.receiveShadow = true;
    group.add(hem);
  }

  const fringeGeo = new THREE.CapsuleGeometry(FRINGE_R, FRINGE_LEN, 4, 8);
  fringeGeo.rotateX(Math.PI / 2);

  const fringeSpan = W - 0.05;
  for (let i = 0; i < FRINGE_COUNT; i++) {
    const t = i / (FRINGE_COUNT - 1) - 0.5;
    const tassel = new THREE.Mesh(fringeGeo, fringeMat);
    tassel.name = `fringe_tassel_${i + 1}`;
    tassel.position.set(
      t * fringeSpan,
      FRINGE_R + 0.002,
      D / 2 + FRINGE_LEN / 2 - 0.004
    );
    tassel.castShadow = true;
    tassel.receiveShadow = true;
    group.add(tassel);
  }

  return group;
}
