function build(THREE) {
  const group = new THREE.Group();

  const W = 1.8;
  const H = 0.43;
  const BULB_R = 0.025;
  const BULB_COUNT = 9;
  const BULB_SPAN = 1.56;
  const SOCKET_R = 0.012;
  const SOCKET_H = 0.032;
  const CORD_R = 0.0045;
  const HOOK_R = 0.012;
  const HOOK_TUBE = 0.003;

  const CORD_Y_MIN = SOCKET_H + BULB_R * 2 - 0.006;
  const CORD_Y_MAX = H - HOOK_R;

  function cordY(x) {
    const u = x / (W / 2);
    return CORD_Y_MIN + (CORD_Y_MAX - CORD_Y_MIN) * u * u;
  }

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x1b1b1d,
    roughness: 0.72,
    metalness: 0.08
  });

  const hookMat = new THREE.MeshStandardMaterial({
    color: 0x6e7378,
    roughness: 0.38,
    metalness: 0.85
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffdca8,
    roughness: 0.18,
    metalness: 0.0,
    emissive: 0xffbe73,
    emissiveIntensity: 1.5
  });

  const curvePoints = [];
  const curveSteps = 32;
  for (let i = 0; i <= curveSteps; i++) {
    const t = i / curveSteps;
    const x = -W / 2 + t * W;
    curvePoints.push(new THREE.Vector3(x, cordY(x), 0));
  }
  const cordCurve = new THREE.CatmullRomCurve3(curvePoints);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 32, CORD_R, 10, false);
  const cordMesh = new THREE.Mesh(cordGeo, cordMat);
  cordMesh.name = "main_cord";
  cordMesh.castShadow = true;
  cordMesh.receiveShadow = true;
  group.add(cordMesh);

  const hookGeo = new THREE.TorusGeometry(HOOK_R, HOOK_TUBE, 10, 20);
  const leftHook = new THREE.Mesh(hookGeo, hookMat);
  leftHook.name = "wall_hook_left";
  leftHook.position.set(-W / 2, CORD_Y_MAX, 0);
  leftHook.castShadow = true;
  leftHook.receiveShadow = true;
  group.add(leftHook);

  const rightHook = new THREE.Mesh(hookGeo, hookMat);
  rightHook.name = "wall_hook_right";
  rightHook.position.set(W / 2, CORD_Y_MAX, 0);
  rightHook.castShadow = true;
  rightHook.receiveShadow = true;
  group.add(rightHook);

  const socketGeo = new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R, SOCKET_H, 16);
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 20, 16);

  for (let i = 0; i < BULB_COUNT; i++) {
    const x = -BULB_SPAN / 2 + (i / (BULB_COUNT - 1)) * BULB_SPAN;
    const cy = cordY(x);

    const socket = new THREE.Mesh(socketGeo, cordMat);
    socket.name = "socket_" + i;
    socket.position.set(x, cy - SOCKET_H / 2 + 0.002, 0);
    socket.castShadow = true;
    socket.receiveShadow = true;
    group.add(socket);

    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.name = "emit_bulb_" + i;
    bulb.position.set(x, cy - SOCKET_H - BULB_R + 0.006, 0);
    bulb.castShadow = true;
    bulb.receiveShadow = true;
    group.add(bulb);
  }

  return group;
}
