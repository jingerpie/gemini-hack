function build(THREE) {
  const R_TOP = 0.041;
  const R_BOT = 0.037;
  const GLASS_H = 0.092;
  const BASE_THICK = 0.008;
  const WAX_H = 0.068;
  const WICK_H = 0.006;
  const LID_R = 0.043;
  const LID_H = 0.012;
  const LABEL_H = 0.042;
  const LABEL_ARC = 1.25;

  const group = new THREE.Group();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x6b2d0c,
    roughness: 0.12,
    metalness: 0.0,
    transparent: true,
    opacity: 0.48,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0x5c2614,
    roughness: 0.65,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x2a1d17,
    roughness: 0.9,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa33,
    emissive: 0xff8811,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0xb8b9bc,
    roughness: 0.32,
    metalness: 0.85
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xeae2d0,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const inkMat = new THREE.MeshStandardMaterial({
    color: 0x2b2118,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  // Amber glass jar
  const glassGeo = new THREE.CylinderGeometry(R_TOP, R_BOT, GLASS_H, 32);
  const glassJar = new THREE.Mesh(glassGeo, glassMat);
  glassJar.name = "glass_jar";
  glassJar.position.y = GLASS_H / 2;
  glassJar.castShadow = true;
  glassJar.receiveShadow = true;
  group.add(glassJar);

  // Wax body inside jar
  const waxTopR = R_BOT + (R_TOP - R_BOT) * ((BASE_THICK + WAX_H) / GLASS_H) - 0.0025;
  const waxBotR = R_BOT + (R_TOP - R_BOT) * (BASE_THICK / GLASS_H) - 0.0025;
  const waxGeo = new THREE.CylinderGeometry(waxTopR, waxBotR, WAX_H, 32);
  const waxBody = new THREE.Mesh(waxGeo, waxMat);
  waxBody.name = "wax_body";
  waxBody.position.y = BASE_THICK + WAX_H / 2;
  waxBody.castShadow = true;
  waxBody.receiveShadow = true;
  group.add(waxBody);

  // Cotton wick
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0012, WICK_H, 8);
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.name = "cotton_wick";
  wick.position.y = BASE_THICK + WAX_H + WICK_H / 2 - 0.001;
  wick.castShadow = true;
  wick.receiveShadow = true;
  group.add(wick);

  // Lit flame
  const flameGeo = new THREE.SphereGeometry(0.0032, 16, 16);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.name = "emit_flame";
  flame.scale.set(0.8, 1.8, 0.8);
  flame.position.y = BASE_THICK + WAX_H + WICK_H + 0.003;
  flame.castShadow = true;
  flame.receiveShadow = true;
  group.add(flame);

  // Brushed metal lid
  const lidGeo = new THREE.CylinderGeometry(LID_R, LID_R, LID_H, 32);
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.name = "metal_lid";
  lid.position.y = GLASS_H + LID_H / 2 - 0.002;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  // Front paper label
  const labelY = GLASS_H * 0.45;
  const labelTopR = R_BOT + (R_TOP - R_BOT) * ((labelY + LABEL_H / 2) / GLASS_H) + 0.0005;
  const labelBotR = R_BOT + (R_TOP - R_BOT) * ((labelY - LABEL_H / 2) / GLASS_H) + 0.0005;
  const labelGeo = new THREE.CylinderGeometry(
    labelTopR,
    labelBotR,
    LABEL_H,
    24,
    1,
    true,
    -LABEL_ARC / 2,
    LABEL_ARC
  );
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.name = "front_label";
  label.position.y = labelY;
  label.castShadow = true;
  label.receiveShadow = true;
  group.add(label);

  // Label accent lines
  const lineArc = LABEL_ARC * 0.82;
  const lineGeoTop = new THREE.CylinderGeometry(
    labelTopR + 0.0002,
    labelTopR + 0.0002,
    0.0012,
    16,
    1,
    true,
    -lineArc / 2,
    lineArc
  );
  const lineTop = new THREE.Mesh(lineGeoTop, inkMat);
  lineTop.name = "label_line_top";
  lineTop.position.y = labelY + LABEL_H * 0.36;
  lineTop.castShadow = true;
  lineTop.receiveShadow = true;
  group.add(lineTop);

  const lineGeoBot = new THREE.CylinderGeometry(
    labelBotR + 0.0002,
    labelBotR + 0.0002,
    0.0012,
    16,
    1,
    true,
    -lineArc / 2,
    lineArc
  );
  const lineBot = new THREE.Mesh(lineGeoBot, inkMat);
  lineBot.name = "label_line_bottom";
  lineBot.position.y = labelY - LABEL_H * 0.36;
  lineBot.castShadow = true;
  lineBot.receiveShadow = true;
  group.add(lineBot);

  return group;
}
