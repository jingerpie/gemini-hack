function build(THREE) {
  const group = new THREE.Group();

  const W = 0.52;
  const H = 0.76;
  const D = 0.04;
  const WIRE_R = 0.007;
  const STANDOFF_R = 0.005;
  const FLANGE_R = 0.009;
  const FLANGE_T = 0.003;
  const COLLAR_R = 0.0085;
  const COLLAR_L = 0.012;

  const RX = W / 2 - WIRE_R;
  const RY = H / 2 - WIRE_R;
  const CENTER_Y = H / 2;
  const WIRE_Z = D / 2 - WIRE_R;
  const BACK_Z = -D / 2;

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x2b2c2e,
    roughness: 0.45,
    metalness: 0.65
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x3a3b3d,
    roughness: 0.35,
    metalness: 0.8
  });

  // Oval wire loop
  const pts = [];
  const numPts = 32;
  for (let i = 0; i < numPts; i++) {
    const theta = (i / numPts) * Math.PI * 2;
    const x = Math.cos(theta) * RX;
    const y = CENTER_Y + Math.sin(theta) * RY;
    pts.push(new THREE.Vector3(x, y, WIRE_Z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const loopGeo = new THREE.TubeGeometry(curve, 64, WIRE_R, 16, true);
  const loopMesh = new THREE.Mesh(loopGeo, wireMat);
  loopMesh.name = 'wire_loop';
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  // Standoffs, wall flanges, and wire collars at cardinal points
  const standoffLen = WIRE_Z - BACK_Z;
  const standoffGeo = new THREE.CylinderGeometry(STANDOFF_R, STANDOFF_R, standoffLen, 16);
  const flangeGeo = new THREE.CylinderGeometry(FLANGE_R, FLANGE_R, FLANGE_T, 16);
  const collarGeo = new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, COLLAR_L, 16);

  const mounts = [
    { name: 'top', x: 0, y: CENTER_Y + RY },
    { name: 'bottom', x: 0, y: CENTER_Y - RY },
    { name: 'left', x: -RX, y: CENTER_Y },
    { name: 'right', x: RX, y: CENTER_Y }
  ];

  for (let i = 0; i < mounts.length; i++) {
    const m = mounts[i];

    const standoff = new THREE.Mesh(standoffGeo, wireMat);
    standoff.name = 'standoff_' + m.name;
    standoff.rotation.x = Math.PI / 2;
    standoff.position.set(m.x, m.y, BACK_Z + standoffLen / 2);
    standoff.castShadow = true;
    standoff.receiveShadow = true;
    group.add(standoff);

    const flange = new THREE.Mesh(flangeGeo, hardwareMat);
    flange.name = 'flange_' + m.name;
    flange.rotation.x = Math.PI / 2;
    flange.position.set(m.x, m.y, BACK_Z + FLANGE_T / 2);
    flange.castShadow = true;
    flange.receiveShadow = true;
    group.add(flange);

    const collar = new THREE.Mesh(collarGeo, hardwareMat);
    collar.name = 'collar_' + m.name;
    collar.rotation.x = Math.PI / 2;
    collar.position.set(m.x, m.y, WIRE_Z - COLLAR_L / 2);
    collar.castShadow = true;
    collar.receiveShadow = true;
    group.add(collar);
  }

  return group;
}
