function build(THREE) {
  const group = new THREE.Group();

  const W = 0.54;
  const H = 0.185;
  const D = 0.23;
  const FOOT_H = 0.005;
  const FOOT_R = 0.014;
  const BAFFLE_D = 0.012;
  const BAFFLE_INSET = 0.005;
  const BODY_D = D - BAFFLE_D;
  const BODY_H = H - FOOT_H;

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.72,
    metalness: 0.08
  });

  const baffleMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d30,
    roughness: 0.82,
    metalness: 0.05
  });

  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x202224,
    roughness: 0.65,
    metalness: 0.1
  });

  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d1f,
    roughness: 0.35,
    metalness: 0.2
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x101112,
    roughness: 0.92,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Rubber feet at bottom corners
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const footX = W / 2 - 0.032;
  const footZ = D / 2 - 0.032;
  addMesh(footGeo, portMat, 'foot_front_left', -footX, FOOT_H / 2, footZ);
  addMesh(footGeo, portMat, 'foot_front_right', footX, FOOT_H / 2, footZ);
  addMesh(footGeo, portMat, 'foot_back_left', -footX, FOOT_H / 2, -footZ);
  addMesh(footGeo, portMat, 'foot_back_right', footX, FOOT_H / 2, -footZ);

  // Main speaker cabinet body
  const bodyCenterY = FOOT_H + BODY_H / 2;
  const bodyCenterZ = -BAFFLE_D / 2;
  const bodyGeo = new THREE.BoxGeometry(W, BODY_H, BODY_D);
  addMesh(bodyGeo, cabinetMat, 'cabinet_body', 0, bodyCenterY, bodyCenterZ);

  // Front baffle
  const baffleW = W - BAFFLE_INSET * 2;
  const baffleH = BODY_H - BAFFLE_INSET * 2;
  const baffleCenterZ = BODY_D / 2;
  const baffleGeo = new THREE.BoxGeometry(baffleW, baffleH, BAFFLE_D);
  addMesh(baffleGeo, baffleMat, 'front_baffle', 0, bodyCenterY, baffleCenterZ);

  const frontZ = D / 2;

  // Two symmetric woofers
  const wooferX = 0.155;
  const wooferY = bodyCenterY + 0.004;
  const wooferR = 0.066;

  const surroundGeo = new THREE.TorusGeometry(wooferR, 0.007, 16, 32);
  const conePoints = [
    new THREE.Vector2(0.018, -0.014),
    new THREE.Vector2(0.042, -0.006),
    new THREE.Vector2(wooferR - 0.004, 0.0)
  ];
  const coneGeo = new THREE.LatheGeometry(conePoints, 32);
  const dustCapGeo = new THREE.SphereGeometry(0.02, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const x = side * wooferX;
    addMesh(surroundGeo, coneMat, `woofer_surround_${label}`, x, wooferY, frontZ);
    addMesh(coneGeo, coneMat, `woofer_cone_${label}`, x, wooferY, frontZ, Math.PI / 2, 0, 0);
    addMesh(dustCapGeo, domeMat, `woofer_dust_cap_${label}`, x, wooferY, frontZ - 0.014, Math.PI / 2, 0, 0);
  });

  // Center tweeter
  const tweeterY = bodyCenterY + 0.006;
  const waveguideGeo = new THREE.TorusGeometry(0.026, 0.006, 16, 32);
  addMesh(waveguideGeo, coneMat, 'tweeter_waveguide', 0, tweeterY, frontZ);

  const tweeterDomeGeo = new THREE.SphereGeometry(0.015, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  addMesh(tweeterDomeGeo, domeMat, 'tweeter_dome', 0, tweeterY, frontZ - 0.004, Math.PI / 2, 0, 0);

  // Bass reflex port slot below tweeter
  const portW = 0.088;
  const portH = 0.016;
  const portR = portH / 2;
  const portY = bodyCenterY - 0.056;

  const portShape = new THREE.Shape();
  portShape.moveTo(-portW / 2 + portR, -portR);
  portShape.lineTo(portW / 2 - portR, -portR);
  portShape.absarc(portW / 2 - portR, 0, portR, -Math.PI / 2, Math.PI / 2, false);
  portShape.lineTo(-portW / 2 + portR, portR);
  portShape.absarc(-portW / 2 + portR, 0, portR, Math.PI / 2, (Math.PI * 3) / 2, false);

  const portGeo = new THREE.ExtrudeGeometry(portShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3,
    curveSegments: 16
  });
  addMesh(portGeo, portMat, 'bass_reflex_port', 0, portY, frontZ - 0.012);

  return group;
}
