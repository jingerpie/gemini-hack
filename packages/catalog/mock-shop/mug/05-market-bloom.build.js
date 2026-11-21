function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) for a 16 oz glass can iced coffee cup
  const CUP_H = 0.148;
  const CUP_R = 0.038;
  const NECK_R = 0.034;
  const RIM_R = 0.0365;
  const LID_H = 0.009;
  const LID_R = 0.0385;
  const PLUG_H = 0.012;
  const PLUG_R = 0.0325;
  const STRAW_LEN = 0.215;
  const STRAW_R = 0.004;

  // Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f7f8,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xc89b6e,
    roughness: 0.58,
    metalness: 0.02,
  });

  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f2,
    roughness: 0.4,
    metalness: 0.0,
    transparent: true,
    opacity: 0.65,
  });

  const pinkFlowerMat = new THREE.MeshStandardMaterial({
    color: 0xe87a9c,
    roughness: 0.45,
    metalness: 0.0,
  });

  const darkPinkMat = new THREE.MeshStandardMaterial({
    color: 0xd15379,
    roughness: 0.45,
    metalness: 0.0,
  });

  const stemGreenMat = new THREE.MeshStandardMaterial({
    color: 0x5c8a58,
    roughness: 0.55,
    metalness: 0.0,
  });

  const framePinkMat = new THREE.MeshStandardMaterial({
    color: 0xe58ca8,
    roughness: 0.4,
    metalness: 0.0,
  });

  // 1. Glass can body (LatheGeometry)
  const bodyPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(CUP_R * 0.78, 0.0),
    new THREE.Vector2(CUP_R * 0.94, 0.004),
    new THREE.Vector2(CUP_R, 0.012),
    new THREE.Vector2(CUP_R, CUP_H - 0.022),
    new THREE.Vector2(NECK_R, CUP_H - 0.01),
    new THREE.Vector2(RIM_R, CUP_H - 0.003),
    new THREE.Vector2(RIM_R, CUP_H),
    new THREE.Vector2(RIM_R - 0.0025, CUP_H),
    new THREE.Vector2(NECK_R - 0.0025, CUP_H - 0.01),
    new THREE.Vector2(CUP_R - 0.0025, CUP_H - 0.022),
    new THREE.Vector2(CUP_R - 0.0025, 0.014),
    new THREE.Vector2(CUP_R * 0.72, 0.005),
    new THREE.Vector2(0.0, 0.005),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const glassBody = new THREE.Mesh(bodyGeo, glassMat);
  glassBody.name = 'glass_body';
  glassBody.castShadow = true;
  glassBody.receiveShadow = true;
  group.add(glassBody);

  // 2. Bamboo lid top
  const lidTopGeo = new THREE.CylinderGeometry(LID_R, LID_R * 0.98, LID_H, 32);
  const lidTop = new THREE.Mesh(lidTopGeo, bambooMat);
  lidTop.name = 'bamboo_lid_top';
  lidTop.position.y = CUP_H + LID_H * 0.5 - 0.001;
  lidTop.castShadow = true;
  lidTop.receiveShadow = true;
  group.add(lidTop);

  // 3. Bamboo lid lower plug
  const lidPlugGeo = new THREE.CylinderGeometry(PLUG_R, PLUG_R * 0.96, PLUG_H, 32);
  const lidPlug = new THREE.Mesh(lidPlugGeo, bambooMat);
  lidPlug.name = 'bamboo_lid_plug';
  lidPlug.position.y = CUP_H - PLUG_H * 0.5;
  lidPlug.castShadow = true;
  lidPlug.receiveShadow = true;
  group.add(lidPlug);

  // 4. Silicone gasket ring
  const gasketGeo = new THREE.TorusGeometry(PLUG_R + 0.001, 0.0022, 10, 32);
  const gasket = new THREE.Mesh(gasketGeo, gasketMat);
  gasket.name = 'silicone_gasket';
  gasket.rotation.x = Math.PI * 0.5;
  gasket.position.y = CUP_H - 0.006;
  gasket.castShadow = true;
  gasket.receiveShadow = true;
  group.add(gasket);

  // 5. Glass straw (tilted slightly from bottom-left to top-right)
  const strawGeo = new THREE.CylinderGeometry(STRAW_R, STRAW_R, STRAW_LEN, 16);
  const straw = new THREE.Mesh(strawGeo, glassMat);
  straw.name = 'glass_straw';
  straw.position.set(0.0, STRAW_LEN * 0.5 + 0.006, 0.0);
  straw.rotation.z = -0.14;
  straw.castShadow = true;
  straw.receiveShadow = true;
  group.add(straw);

  // 6. Front pink frame decal (thin vertical & horizontal bars on +Z)
  const frameZ = CUP_R + 0.0005;
  const frameW = 0.024;
  const frameH = 0.072;
  const frameCenterY = CUP_H * 0.44;
  const barThick = 0.0012;

  const vBarGeo = new THREE.BoxGeometry(barThick, frameH, barThick);
  const hBarGeo = new THREE.BoxGeometry(frameW, barThick, barThick);

  const frameLeft = new THREE.Mesh(vBarGeo, framePinkMat);
  frameLeft.name = 'decal_frame_left';
  frameLeft.position.set(-frameW * 0.5, frameCenterY, frameZ);
  frameLeft.castShadow = true;
  frameLeft.receiveShadow = true;
  group.add(frameLeft);

  const frameRight = new THREE.Mesh(vBarGeo, framePinkMat);
  frameRight.name = 'decal_frame_right';
  frameRight.position.set(frameW * 0.5, frameCenterY, frameZ);
  frameRight.castShadow = true;
  frameRight.receiveShadow = true;
  group.add(frameRight);

  const frameTop = new THREE.Mesh(hBarGeo, framePinkMat);
  frameTop.name = 'decal_frame_top';
  frameTop.position.set(0, frameCenterY + frameH * 0.5, frameZ);
  frameTop.castShadow = true;
  frameTop.receiveShadow = true;
  group.add(frameTop);

  const frameBottom = new THREE.Mesh(hBarGeo, framePinkMat);
  frameBottom.name = 'decal_frame_bottom';
  frameBottom.position.set(0, frameCenterY - frameH * 0.5, frameZ);
  frameBottom.castShadow = true;
  frameBottom.receiveShadow = true;
  group.add(frameBottom);

  // 7. Floral decal clusters around the cup
  const flowerConfigs = [
    { name: 'flower_front_left', angle: -0.55, y: 0.048, r: 0.0085, mat: pinkFlowerMat },
    { name: 'flower_top_left', angle: -0.45, y: 0.095, r: 0.0075, mat: pinkFlowerMat },
    { name: 'flower_front_right', angle: 0.58, y: 0.088, r: 0.009, mat: darkPinkMat },
    { name: 'flower_mid_right', angle: 0.65, y: 0.052, r: 0.008, mat: pinkFlowerMat },
    { name: 'flower_side_left', angle: -1.15, y: 0.072, r: 0.008, mat: darkPinkMat },
    { name: 'flower_side_right', angle: 1.2, y: 0.068, r: 0.0075, mat: pinkFlowerMat },
  ];

  const flowerGeo = new THREE.SphereGeometry(1, 12, 8);
  const stemGeo = new THREE.CylinderGeometry(0.0009, 0.0009, 0.055, 6);

  flowerConfigs.forEach((cfg, idx) => {
    const x = Math.sin(cfg.angle) * (CUP_R + 0.0006);
    const z = Math.cos(cfg.angle) * (CUP_R + 0.0006);

    const flower = new THREE.Mesh(flowerGeo, cfg.mat);
    flower.name = cfg.name;
    flower.scale.set(cfg.r, cfg.r, cfg.r * 0.25);
    flower.position.set(x, cfg.y, z);
    flower.rotation.y = cfg.angle;
    flower.castShadow = true;
    flower.receiveShadow = true;
    group.add(flower);

    if (idx < 4) {
      const stem = new THREE.Mesh(stemGeo, stemGreenMat);
      stem.name = `floral_stem_${idx + 1}`;
      stem.position.set(x, cfg.y - 0.025, z);
      stem.rotation.y = cfg.angle;
      stem.castShadow = true;
      stem.receiveShadow = true;
      group.add(stem);
    }
  });

  return group;
}
