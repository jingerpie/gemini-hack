function build(THREE) {
  const group = new THREE.Group();

  // Named dimensions (meters)
  const TOTAL_H = 0.48;
  const SHADE_R = 0.13;
  const SHADE_H = 0.18;
  const SHADE_Y = TOTAL_H - SHADE_H / 2; // 0.39
  const RIM_TUBE_R = 0.0025;

  const HUB_Y = 0.285;
  const HUB_R = 0.021;
  const HUB_H = 0.042;
  const STEM_R = 0.007;
  const STEM_H = 0.045;

  const LEG_W = 0.022;
  const LEG_D = 0.024;
  const LEG_TOP_R = 0.027;
  const LEG_BOT_R = 0.125;

  const CORD_R = 0.0032;
  const SWITCH_W = 0.052;
  const SWITCH_H = 0.014;
  const SWITCH_D = 0.022;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.6,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    roughness: 0.35,
    metalness: 0.85
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3c3e,
    roughness: 0.4,
    metalness: 0.8
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    roughness: 0.5,
    metalness: 0.1
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.65,
    metalness: 0.0
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e8,
    emissive: 0xfff0cc,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // Helper to enable shadows
  function addMesh(mesh, name, parent = group) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // 1. Tripod legs
  const legAngles = [Math.PI, Math.PI / 3, -Math.PI / 3];
  const legNames = ["leg_back", "leg_front_right", "leg_front_left"];
  const pinNames = ["pin_back", "pin_front_right", "pin_front_left"];

  const dx = LEG_BOT_R - LEG_TOP_R;
  const dy = HUB_Y;
  const legLen = Math.hypot(dx, dy);
  const tiltAngle = Math.atan2(dx, dy);
  const yLift = (LEG_D / 2) * Math.sin(tiltAngle);

  const legGeo = new THREE.BoxGeometry(LEG_W, legLen, LEG_D);
  const pinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 12);

  for (let i = 0; i < 3; i++) {
    const yaw = legAngles[i];
    const legPivot = new THREE.Group();
    legPivot.rotation.y = yaw;
    group.add(legPivot);

    const midR = (LEG_TOP_R + LEG_BOT_R) / 2;
    const midY = HUB_Y / 2 + yLift;

    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(0, midY, midR);
    leg.rotation.x = tiltAngle;
    addMesh(leg, legNames[i], legPivot);

    // Small metal mounting pin near top of leg
    const pin = new THREE.Mesh(pinGeo, darkMetalMat);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(0, HUB_Y - 0.005, LEG_TOP_R + LEG_D * 0.52);
    addMesh(pin, pinNames[i], legPivot);
  }

  // 2. Central metal hub & stem
  const hubGeo = new THREE.CylinderGeometry(HUB_R, HUB_R, HUB_H, 24);
  const hub = new THREE.Mesh(hubGeo, metalMat);
  hub.position.set(0, HUB_Y, 0);
  addMesh(hub, "hub_body");

  const grommetGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.012, 16);
  const grommet = new THREE.Mesh(grommetGeo, wireMat);
  grommet.position.set(0, HUB_Y - HUB_H / 2 - 0.005, 0);
  addMesh(grommet, "hub_grommet");

  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 16);
  const stem = new THREE.Mesh(stemGeo, metalMat);
  stem.position.set(0, HUB_Y + HUB_H / 2 + STEM_H / 2, 0);
  addMesh(stem, "hub_stem");

  // 3. Socket & emit_bulb inside shade
  const socketY = HUB_Y + HUB_H / 2 + STEM_H + 0.018;
  const socketGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.04, 20);
  const socket = new THREE.Mesh(socketGeo, wireMat);
  socket.position.set(0, socketY, 0);
  addMesh(socket, "lamp_socket");

  const bulbGeo = new THREE.SphereGeometry(0.03, 20, 16);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.scale.set(1, 1.25, 1);
  bulb.position.set(0, socketY + 0.045, 0);
  addMesh(bulb, "emit_bulb");

  // 4. Drum shade & rims
  const shadeGeo = new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.set(0, SHADE_Y, 0);
  addMesh(shade, "lamp_shade");

  const rimGeo = new THREE.TorusGeometry(SHADE_R, RIM_TUBE_R, 10, 32);
  const topRim = new THREE.Mesh(rimGeo, wireMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.set(0, SHADE_Y + SHADE_H / 2, 0);
  addMesh(topRim, "shade_rim_top");

  const botRim = new THREE.Mesh(rimGeo, wireMat);
  botRim.rotation.x = Math.PI / 2;
  botRim.position.set(0, SHADE_Y - SHADE_H / 2, 0);
  addMesh(botRim, "shade_rim_bottom");

  // 5. Spider wires connecting socket to top rim
  const spokeLen = SHADE_R - 0.016;
  const spokeGeo = new THREE.CylinderGeometry(0.0018, 0.0018, spokeLen, 8);
  const spiderY = SHADE_Y + SHADE_H / 2 - 0.015;
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3 + 0.3;
    const spoke = new THREE.Mesh(spokeGeo, wireMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = a;
    const rMid = 0.016 + spokeLen / 2;
    spoke.position.set(Math.cos(a) * rMid, spiderY, -Math.sin(a) * rMid);
    addMesh(spoke, `spider_wire_${i + 1}`);
  }

  // 6. Power cord & inline switch
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, HUB_Y - HUB_H / 2 - 0.01, 0),
    new THREE.Vector3(0.004, 0.14, 0.005),
    new THREE.Vector3(0.015, 0.03, 0.015),
    new THREE.Vector3(0.06, CORD_R, 0.03),
    new THREE.Vector3(0.14, CORD_R, 0.035),
    new THREE.Vector3(0.24, CORD_R, 0.03)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 28, CORD_R, 8, false);
  const cord = new THREE.Mesh(cordGeo, cordMat);
  addMesh(cord, "power_cord");

  const switchX = 0.21;
  const switchZ = 0.032;
  const switchGeo = new THREE.BoxGeometry(SWITCH_W, SWITCH_H, SWITCH_D);
  const switchBody = new THREE.Mesh(switchGeo, cordMat);
  switchBody.position.set(switchX, SWITCH_H / 2, switchZ);
  addMesh(switchBody, "switch_body");

  const rockerGeo = new THREE.BoxGeometry(0.016, 0.006, 0.01);
  const rocker = new THREE.Mesh(rockerGeo, cordMat);
  rocker.position.set(switchX, SWITCH_H + 0.002, switchZ);
  rocker.rotation.z = 0.15;
  addMesh(rocker, "switch_rocker");

  return group;
}
