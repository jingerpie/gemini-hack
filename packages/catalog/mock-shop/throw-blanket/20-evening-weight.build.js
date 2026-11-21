function build(THREE) {
  const group = new THREE.Group();

  const W = 0.46;
  const D = 0.36;
  const H = 0.084;
  const LAYER_H = 0.026;
  const BEVEL = 0.008;
  const CORNER_R = 0.028;
  const TRIM_R = 0.0055;

  const knitMat = new THREE.MeshStandardMaterial({
    color: 0x8c9b84,
    roughness: 0.92,
    metalness: 0.0
  });

  const satinMat = new THREE.MeshStandardMaterial({
    color: 0x7d8c75,
    roughness: 0.32,
    metalness: 0.06
  });

  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  function createLayerMesh(w, d, h, name) {
    const innerW = w - BEVEL * 2;
    const innerD = d - BEVEL * 2;
    const innerH = Math.max(0.002, h - BEVEL * 2);
    const shape = makeRoundedRectShape(innerW, innerD, CORNER_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: innerH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 12
    });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, knitMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Three stacked folded layers
  const layerConfigs = [
    { w: W, d: D, y: BEVEL, name: 'blanket_layer_bottom' },
    { w: W * 0.985, d: D * 0.985, y: LAYER_H + BEVEL, name: 'blanket_layer_middle' },
    { w: W * 0.97, d: D * 0.97, y: LAYER_H * 2 + BEVEL, name: 'blanket_layer_top' }
  ];

  layerConfigs.forEach((cfg) => {
    const layer = createLayerMesh(cfg.w, cfg.d, LAYER_H, cfg.name);
    layer.position.set(0, cfg.y, 0);
    group.add(layer);
  });

  // Folded spine rolls connecting layers on alternating sides
  const spineGeo = new THREE.CapsuleGeometry(LAYER_H * 0.52, D - CORNER_R * 2, 8, 16);
  spineGeo.rotateX(Math.PI / 2);

  const leftSpine = new THREE.Mesh(spineGeo, knitMat);
  leftSpine.name = 'fold_spine_left';
  leftSpine.position.set(-W / 2 + BEVEL * 0.4, LAYER_H, 0);
  leftSpine.castShadow = true;
  leftSpine.receiveShadow = true;
  group.add(leftSpine);

  const rightSpine = new THREE.Mesh(spineGeo, knitMat);
  rightSpine.name = 'fold_spine_right';
  rightSpine.position.set(W / 2 - BEVEL * 0.4, LAYER_H * 2, 0);
  rightSpine.castShadow = true;
  rightSpine.receiveShadow = true;
  group.add(rightSpine);

  // Satin trim binding along front (+Z) and back (-Z) edges of each layer
  const trimFrontBackGeo = new THREE.CapsuleGeometry(TRIM_R, W - CORNER_R * 2, 6, 12);
  trimFrontBackGeo.rotateZ(Math.PI / 2);

  layerConfigs.forEach((cfg, idx) => {
    const yPos = cfg.y + LAYER_H * 0.35;
    const zOffset = cfg.d / 2 - TRIM_R * 0.3;

    const frontTrim = new THREE.Mesh(trimFrontBackGeo, satinMat);
    frontTrim.name = `satin_trim_front_${idx + 1}`;
    frontTrim.position.set(0, yPos, zOffset);
    frontTrim.castShadow = true;
    frontTrim.receiveShadow = true;
    group.add(frontTrim);

    const backTrim = new THREE.Mesh(trimFrontBackGeo, satinMat);
    backTrim.name = `satin_trim_back_${idx + 1}`;
    backTrim.position.set(0, yPos, -zOffset);
    backTrim.castShadow = true;
    backTrim.receiveShadow = true;
    group.add(backTrim);
  });

  // Satin trim along open side edges
  const trimSideGeo = new THREE.CapsuleGeometry(TRIM_R, D - CORNER_R * 2, 6, 12);
  trimSideGeo.rotateX(Math.PI / 2);

  const rightBottomTrim = new THREE.Mesh(trimSideGeo, satinMat);
  rightBottomTrim.name = 'satin_trim_right_bottom';
  rightBottomTrim.position.set(W / 2 - TRIM_R * 0.3, BEVEL + LAYER_H * 0.35, 0);
  rightBottomTrim.castShadow = true;
  rightBottomTrim.receiveShadow = true;
  group.add(rightBottomTrim);

  const leftTopTrim = new THREE.Mesh(trimSideGeo, satinMat);
  leftTopTrim.name = 'satin_trim_left_top';
  leftTopTrim.position.set(-W * 0.97 / 2 + TRIM_R * 0.3, LAYER_H * 2 + BEVEL + LAYER_H * 0.35, 0);
  leftTopTrim.castShadow = true;
  leftTopTrim.receiveShadow = true;
  group.add(leftTopTrim);

  // Subtle soft surface ripples on top layer for organic textile feel
  const rippleCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.35, H - 0.008, -D * 0.15),
    new THREE.Vector3(-W * 0.1, H - 0.004, -D * 0.08),
    new THREE.Vector3(W * 0.15, H - 0.006, -D * 0.18),
    new THREE.Vector3(W * 0.36, H - 0.009, -D * 0.1)
  ]);
  const rippleGeo1 = new THREE.TubeGeometry(rippleCurve1, 20, 0.006, 8, false);
  const ripple1 = new THREE.Mesh(rippleGeo1, knitMat);
  ripple1.name = 'top_surface_ripple_1';
  ripple1.castShadow = true;
  ripple1.receiveShadow = true;
  group.add(ripple1);

  const rippleCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.34, H - 0.009, D * 0.12),
    new THREE.Vector3(-W * 0.05, H - 0.005, D * 0.18),
    new THREE.Vector3(W * 0.2, H - 0.007, D * 0.08),
    new THREE.Vector3(W * 0.35, H - 0.009, D * 0.15)
  ]);
  const rippleGeo2 = new THREE.TubeGeometry(rippleCurve2, 20, 0.0055, 8, false);
  const ripple2 = new THREE.Mesh(rippleGeo2, knitMat);
  ripple2.name = 'top_surface_ripple_2';
  ripple2.castShadow = true;
  ripple2.receiveShadow = true;
  group.add(ripple2);

  return group;
}
