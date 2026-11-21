function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.8;
  const HALF_W = W / 2;
  const Y_TOP = 1.35;
  const SAG = 0.32;
  const CABLE_R = 0.005;

  const BULB_COUNT = 10;
  const BULB_R = 0.025;
  const SOCKET_R_TOP = 0.014;
  const SOCKET_R_BOT = 0.017;
  const SOCKET_H = 0.032;
  const LOOP_R = 0.008;
  const LOOP_TUBE = 0.0025;

  const CTRL_W = 0.036;
  const CTRL_H = 0.085;
  const CTRL_D = 0.022;
  const BTN_R = 0.007;
  const BTN_H = 0.004;

  // Materials
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1d,
    roughness: 0.65,
    metalness: 0.05
  });

  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x151518,
    roughness: 0.55,
    metalness: 0.1
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff9a1f,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.0
  });

  // Helper for catenary curve height
  function catenaryY(x) {
    const t = x / HALF_W;
    return Y_TOP - SAG * (1 - t * t);
  }

  // 1. Main cable (left drop + catenary swag)
  const curvePoints = [];
  curvePoints.push(new THREE.Vector3(-HALF_W, CTRL_H, 0));
  curvePoints.push(new THREE.Vector3(-HALF_W, Y_TOP * 0.5, 0));
  const swagSegments = 24;
  for (let i = 0; i <= swagSegments; i++) {
    const x = -HALF_W + (W * i) / swagSegments;
    curvePoints.push(new THREE.Vector3(x, catenaryY(x), 0));
  }

  const cableCurve = new THREE.CatmullRomCurve3(curvePoints);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 48, CABLE_R, 8, false);
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.name = 'main_cable';
  cableMesh.castShadow = true;
  cableMesh.receiveShadow = true;
  group.add(cableMesh);

  // 2. Inline smart controller at bottom-left (touching y = 0)
  const ctrlGeo = new THREE.BoxGeometry(CTRL_W, CTRL_H, CTRL_D);
  const ctrlMesh = new THREE.Mesh(ctrlGeo, socketMat);
  ctrlMesh.name = 'inline_controller';
  ctrlMesh.position.set(-HALF_W, CTRL_H / 2, 0);
  ctrlMesh.castShadow = true;
  ctrlMesh.receiveShadow = true;
  group.add(ctrlMesh);

  const btnGeo = new THREE.CylinderGeometry(BTN_R, BTN_R, BTN_H, 16);
  const btnMesh = new THREE.Mesh(btnGeo, cableMat);
  btnMesh.name = 'controller_button';
  btnMesh.rotation.x = Math.PI / 2;
  btnMesh.position.set(-HALF_W, CTRL_H / 2, CTRL_D / 2 + BTN_H / 2 - 0.001);
  btnMesh.castShadow = true;
  btnMesh.receiveShadow = true;
  group.add(btnMesh);

  // 3. Bulbs, sockets, and hanging loops along the catenary
  const loopGeo = new THREE.TorusGeometry(LOOP_R, LOOP_TUBE, 8, 16);
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R_TOP, SOCKET_R_BOT, SOCKET_H, 18);
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 20, 16);

  const span = W * 0.86;
  const startX = -span / 2;

  for (let i = 0; i < BULB_COUNT; i++) {
    const x = startX + (span * i) / (BULB_COUNT - 1);
    const yCable = catenaryY(x);

    // Hanging loop around the cable
    const loopMesh = new THREE.Mesh(loopGeo, socketMat);
    loopMesh.name = `socket_loop_${i + 1}`;
    loopMesh.position.set(x, yCable - LOOP_R * 0.4, 0);
    loopMesh.castShadow = true;
    loopMesh.receiveShadow = true;
    group.add(loopMesh);

    // Socket housing
    const socketY = yCable - LOOP_R - SOCKET_H / 2 + 0.002;
    const socketMesh = new THREE.Mesh(socketGeo, socketMat);
    socketMesh.name = `socket_${i + 1}`;
    socketMesh.position.set(x, socketY, 0);
    socketMesh.castShadow = true;
    socketMesh.receiveShadow = true;
    group.add(socketMesh);

    // Emissive bulb
    const bulbY = socketY - SOCKET_H / 2 - BULB_R * 0.72;
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.name = `emit_bulb_${i + 1}`;
    bulbMesh.position.set(x, bulbY, 0);
    bulbMesh.castShadow = true;
    bulbMesh.receiveShadow = true;
    group.add(bulbMesh);
  }

  return group;
}
