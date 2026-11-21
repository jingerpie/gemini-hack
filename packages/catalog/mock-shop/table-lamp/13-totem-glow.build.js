function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const FOOT_H = 0.005;
  const FOOT_R = 0.052;

  const BOT_R = 0.082;
  const BOT_H = 0.135;
  const BOT_Y0 = FOOT_H - 0.001;

  const MID_R = 0.064;
  const MID_H = 0.085;
  const MID_Y0 = BOT_Y0 + BOT_H - 0.004;

  const TOP_R_BOT = 0.058;
  const TOP_R_TOP = 0.036;
  const TOP_H = 0.115;
  const TOP_Y0 = MID_Y0 + MID_H - 0.004;

  const NECK_R = 0.014;
  const NECK_H = 0.030;
  const NECK_Y0 = TOP_Y0 + TOP_H - 0.003;

  const SHADE_R = 0.165;
  const SHADE_H = 0.215;
  const SHADE_Y0 = NECK_Y0 + NECK_H - 0.003;

  const BULB_R = 0.028;
  const BULB_Y = SHADE_Y0 + 0.055;

  // Materials
  const matFelt = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  const matBaseBottom = new THREE.MeshStandardMaterial({
    color: 0x166a75,
    roughness: 0.55,
    metalness: 0.05,
  });

  const matBaseMiddle = new THREE.MeshPhysicalMaterial({
    color: 0x0e6f7c,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
  });

  const matBaseTop = new THREE.MeshStandardMaterial({
    color: 0x245d66,
    roughness: 0.65,
    metalness: 0.05,
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.35,
    metalness: 0.8,
  });

  const matShadeOuter = new THREE.MeshStandardMaterial({
    color: 0x126d78,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.FrontSide,
  });

  const matShadeInner = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  const matBulb = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffdfa0,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Foot pad at y = 0
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 24);
  const foot = addMesh(footGeo, matFelt, 'base_foot_pad');
  foot.position.y = FOOT_H * 0.5;

  // 2. Bottom pebbled/textured sphere (flattened at bottom & top)
  const botPoints = [];
  const botSteps = 16;
  for (let i = 0; i <= botSteps; i++) {
    const t = i / botSteps;
    const angle = -Math.PI * 0.36 + t * Math.PI * 0.74;
    const r = Math.cos(angle) * BOT_R;
    const y = (Math.sin(angle) - Math.sin(-Math.PI * 0.36)) /
              (Math.sin(Math.PI * 0.38) - Math.sin(-Math.PI * 0.36)) * BOT_H;
    botPoints.push(new THREE.Vector2(Math.max(0.001, r), y));
  }
  const botGeo = new THREE.LatheGeometry(botPoints, 32);
  const botMesh = addMesh(botGeo, matBaseBottom, 'base_bottom_sphere');
  botMesh.position.y = BOT_Y0;

  // 3. Middle glossy cylinder with rounded edges
  const midBevel = 0.008;
  const midPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(MID_R - midBevel, 0),
    new THREE.Vector2(MID_R - midBevel * 0.3, midBevel * 0.3),
    new THREE.Vector2(MID_R, midBevel),
    new THREE.Vector2(MID_R, MID_H - midBevel),
    new THREE.Vector2(MID_R - midBevel * 0.3, MID_H - midBevel * 0.3),
    new THREE.Vector2(MID_R - midBevel, MID_H),
    new THREE.Vector2(0.001, MID_H),
  ];
  const midGeo = new THREE.LatheGeometry(midPoints, 32);
  const midMesh = addMesh(midGeo, matBaseMiddle, 'base_middle_cylinder');
  midMesh.position.y = MID_Y0;

  // 4. Top matte tapered frustum with rounded transitions
  const topPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(TOP_R_BOT - 0.008, 0),
    new THREE.Vector2(TOP_R_BOT, 0.009),
    new THREE.Vector2(TOP_R_BOT - 0.002, 0.020),
    new THREE.Vector2(TOP_R_TOP + 0.003, TOP_H - 0.012),
    new THREE.Vector2(TOP_R_TOP, TOP_H - 0.003),
    new THREE.Vector2(TOP_R_TOP - 0.005, TOP_H),
    new THREE.Vector2(0.001, TOP_H),
  ];
  const topGeo = new THREE.LatheGeometry(topPoints, 32);
  const topMesh = addMesh(topGeo, matBaseTop, 'base_top_frustum');
  topMesh.position.y = TOP_Y0;

  // 5. Neck collar
  const neckGeo = new THREE.CylinderGeometry(NECK_R, NECK_R * 1.15, NECK_H, 24);
  const neckMesh = addMesh(neckGeo, matMetal, 'neck_collar');
  neckMesh.position.y = NECK_Y0 + NECK_H * 0.5;

  // 6. Socket body inside shade
  const socketH = 0.042;
  const socketGeo = new THREE.CylinderGeometry(0.018, 0.018, socketH, 24);
  const socketMesh = addMesh(socketGeo, matMetal, 'socket_body');
  socketMesh.position.y = SHADE_Y0 + socketH * 0.5;

  // 7. Light-emitting bulb
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 16);
  const bulbMesh = addMesh(bulbGeo, matBulb, 'emit_bulb');
  bulbMesh.scale.set(1, 1.25, 1);
  bulbMesh.position.y = BULB_Y;

  // 8. Shade spider/harp ring & arms
  const spiderY = SHADE_Y0 + SHADE_H - 0.035;
  const spiderRingGeo = new THREE.TorusGeometry(0.022, 0.003, 8, 24);
  const spiderRing = addMesh(spiderRingGeo, matMetal, 'shade_spider_ring');
  spiderRing.rotation.x = Math.PI * 0.5;
  spiderRing.position.y = spiderY;

  const armLen = SHADE_R - 0.022;
  const armGeo = new THREE.CylinderGeometry(0.0025, 0.0025, armLen, 8);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const arm = addMesh(armGeo, matMetal, `shade_spider_arm_${i + 1}`);
    arm.rotation.z = Math.PI * 0.5;
    arm.rotation.y = angle;
    const midR = 0.022 + armLen * 0.5;
    arm.position.set(Math.cos(angle) * midR, spiderY, -Math.sin(angle) * midR);
  }

  // 9. Drum shade (outer fabric + inner white lining + top/bottom rims)
  const shadeOuterGeo = new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true);
  const shadeOuter = addMesh(shadeOuterGeo, matShadeOuter, 'shade_outer');
  shadeOuter.position.y = SHADE_Y0 + SHADE_H * 0.5;

  const shadeInnerGeo = new THREE.CylinderGeometry(SHADE_R - 0.002, SHADE_R - 0.002, SHADE_H, 32, 1, true);
  const shadeInner = addMesh(shadeInnerGeo, matShadeInner, 'shade_inner');
  shadeInner.position.y = SHADE_Y0 + SHADE_H * 0.5;

  const rimGeo = new THREE.TorusGeometry(SHADE_R - 0.001, 0.0025, 8, 32);
  const rimTop = addMesh(rimGeo, matShadeOuter, 'shade_rim_top');
  rimTop.rotation.x = Math.PI * 0.5;
  rimTop.position.y = SHADE_Y0 + SHADE_H;

  const rimBot = addMesh(rimGeo, matShadeOuter, 'shade_rim_bottom');
  rimBot.rotation.x = Math.PI * 0.5;
  rimBot.position.y = SHADE_Y0;

  // 10. Small cord grommet at the back of the base
  const grommetGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12);
  const grommet = addMesh(grommetGeo, matMetal, 'cord_grommet');
  grommet.rotation.x = Math.PI * 0.5;
  grommet.position.set(0, BOT_Y0 + 0.022, -BOT_R * 0.82);

  return group;
}
