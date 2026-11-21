function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const TOTAL_H = 1.55;
  const SHADE_R = 0.25;
  const SHADE_H = 0.30;
  const SHADE_Y = TOTAL_H - SHADE_H / 2; // 1.40
  const SHADE_BOT_Y = TOTAL_H - SHADE_H; // 1.25

  const HUB_Y = 1.15;
  const HUB_H = 0.095;
  const HUB_R = 0.052;

  const LEG_W = 0.034;
  const LEG_D = 0.026;
  const LEG_TOP_R = 0.040;
  const LEG_BOT_R = 0.34;
  const FOOT_PAD_H = 0.006;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xd4b287,
    roughness: 0.58,
    metalness: 0.02,
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.88,
    metalness: 0.0,
    emissive: 0x3a2612,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x9c8870,
    roughness: 0.65,
    metalness: 0.1,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    roughness: 0.32,
    metalness: 0.82,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.4,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xb8aa96,
    roughness: 0.78,
    metalness: 0.0,
  });

  const footPadMat = new THREE.MeshStandardMaterial({
    color: 0x3b352e,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Drum Shade
  const shadeGeo = new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.name = 'shade_outer';
  shade.position.y = SHADE_Y;
  addMesh(shade);

  const rimGeo = new THREE.TorusGeometry(SHADE_R, 0.0035, 10, 32);
  const topRim = new THREE.Mesh(rimGeo, trimMat);
  topRim.name = 'shade_top_rim';
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = TOTAL_H;
  addMesh(topRim);

  const botRim = new THREE.Mesh(rimGeo, trimMat);
  botRim.name = 'shade_bottom_rim';
  botRim.rotation.x = Math.PI / 2;
  botRim.position.y = SHADE_BOT_Y;
  addMesh(botRim);

  // Inner spider ring & struts
  const spiderRingGeo = new THREE.TorusGeometry(0.024, 0.003, 8, 24);
  const spiderRing = new THREE.Mesh(spiderRingGeo, metalMat);
  spiderRing.name = 'shade_spider_ring';
  spiderRing.rotation.x = Math.PI / 2;
  spiderRing.position.y = SHADE_BOT_Y + 0.04;
  addMesh(spiderRing);

  const strutLen = SHADE_R - 0.024;
  const strutGeo = new THREE.CylinderGeometry(0.002, 0.002, strutLen, 8);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const strut = new THREE.Mesh(strutGeo, metalMat);
    strut.name = `shade_strut_${i + 1}`;
    const midR = 0.024 + strutLen / 2;
    strut.position.set(Math.cos(angle) * midR, SHADE_BOT_Y + 0.04, Math.sin(angle) * midR);
    strut.rotation.z = Math.PI / 2;
    strut.rotation.y = -angle;
    addMesh(strut);
  }

  // 2. Socket & Bulb
  const socketGeo = new THREE.CylinderGeometry(0.020, 0.022, 0.055, 20);
  const socket = new THREE.Mesh(socketGeo, metalMat);
  socket.name = 'lamp_socket';
  socket.position.y = SHADE_BOT_Y + 0.035;
  addMesh(socket);

  const bulbGeo = new THREE.SphereGeometry(0.036, 20, 16);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.name = 'lamp_bulb';
  bulb.position.y = SHADE_BOT_Y + 0.085;
  addMesh(bulb);

  // 3. Wooden Stem & Hub
  const stemH = SHADE_BOT_Y + 0.01 - (HUB_Y + HUB_H / 2);
  const stemGeo = new THREE.CylinderGeometry(0.014, 0.014, stemH, 20);
  const stem = new THREE.Mesh(stemGeo, oakMat);
  stem.name = 'wooden_stem';
  stem.position.y = HUB_Y + HUB_H / 2 + stemH / 2;
  addMesh(stem);

  const hubGeo = new THREE.CylinderGeometry(HUB_R * 0.92, HUB_R, HUB_H, 12);
  const hub = new THREE.Mesh(hubGeo, oakMat);
  hub.name = 'tripod_hub';
  hub.position.y = HUB_Y;
  addMesh(hub);

  const hubCapGeo = new THREE.CylinderGeometry(HUB_R * 0.72, HUB_R * 0.92, 0.014, 12);
  const hubCap = new THREE.Mesh(hubCapGeo, oakMat);
  hubCap.name = 'tripod_hub_cap';
  hubCap.position.y = HUB_Y + HUB_H / 2 + 0.007;
  addMesh(hubCap);

  // 4. Three Tripod Legs (front-right, front-left, back-center)
  const legAngles = [Math.PI / 6, (5 * Math.PI) / 6, -Math.PI / 2];
  const upVec = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < 3; i++) {
    const a = legAngles[i];
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);

    const topPt = new THREE.Vector3(LEG_TOP_R * cosA, HUB_Y, LEG_TOP_R * sinA);
    const botPt = new THREE.Vector3(LEG_BOT_R * cosA, FOOT_PAD_H, LEG_BOT_R * sinA);

    const dir = new THREE.Vector3().subVectors(topPt, botPt);
    const legLen = dir.length();
    dir.normalize();

    const legGeo = new THREE.BoxGeometry(LEG_W, legLen, LEG_D);
    const leg = new THREE.Mesh(legGeo, oakMat);
    leg.name = `tripod_leg_${i + 1}`;
    leg.position.copy(botPt).add(topPt).multiplyScalar(0.5);

    // Align Y axis with leg direction, and face outward radially
    const qAlign = new THREE.Quaternion().setFromUnitVectors(upVec, dir);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(upVec, -a);
    leg.quaternion.copy(qAlign).multiply(qYaw);
    addMesh(leg);

    // Metal bolt on outer face of hub
    const boltGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12);
    const bolt = new THREE.Mesh(boltGeo, metalMat);
    bolt.name = `hub_bolt_${i + 1}`;
    const boltR = HUB_R + 0.003;
    bolt.position.set(boltR * cosA, HUB_Y + 0.008, boltR * sinA);
    bolt.quaternion.setFromUnitVectors(upVec, new THREE.Vector3(cosA, 0, sinA));
    addMesh(bolt);

    // Floor pad
    const padGeo = new THREE.CylinderGeometry(0.016, 0.017, FOOT_PAD_H, 16);
    const pad = new THREE.Mesh(padGeo, footPadMat);
    pad.name = `leg_foot_pad_${i + 1}`;
    pad.position.set(LEG_BOT_R * cosA, FOOT_PAD_H / 2, LEG_BOT_R * sinA);
    addMesh(pad);
  }

  // 5. Power Cord & Foot Switch
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, HUB_Y - HUB_H / 2, 0),
    new THREE.Vector3(0.02, 0.65, 0.02),
    new THREE.Vector3(0.06, 0.16, 0.04),
    new THREE.Vector3(0.14, 0.012, 0.08),
    new THREE.Vector3(0.28, 0.004, 0.12),
    new THREE.Vector3(0.44, 0.004, 0.14),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 32, 0.0035, 8, false);
  const cord = new THREE.Mesh(cordGeo, cordMat);
  cord.name = 'power_cord';
  addMesh(cord);

  const switchGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.014, 20);
  const switchBody = new THREE.Mesh(switchGeo, cordMat);
  switchBody.name = 'foot_switch_body';
  switchBody.scale.set(1.3, 1, 0.85);
  switchBody.position.set(0.44, 0.007, 0.14);
  addMesh(switchBody);

  const btnGeo = new THREE.CylinderGeometry(0.009, 0.010, 0.006, 16);
  const switchBtn = new THREE.Mesh(btnGeo, cordMat);
  switchBtn.name = 'foot_switch_button';
  switchBtn.position.set(0.44, 0.016, 0.14);
  addMesh(switchBtn);

  return group;
}
