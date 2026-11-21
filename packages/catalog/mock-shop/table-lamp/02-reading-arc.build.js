function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.50;
  const BASE_R = 0.085;
  const BASE_H = 0.016;
  const PAD_H = 0.002;
  const STEM_R = 0.0075;
  const SHADE_LEN = 0.165;
  const SHADE_TOP_R = 0.023;
  const SHADE_BOT_R = 0.082;
  const SHADE_THICK = 0.0025;
  const CORD_R = 0.0032;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xeae4d7,
    roughness: 0.52,
    metalness: 0.08,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xe2dcd0,
    roughness: 0.72,
    metalness: 0.02,
  });

  const darkPadMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  const socketMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.45,
    metalness: 0.15,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffe4b5,
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

  // 1. Base pad & disc
  const padGeo = new THREE.CylinderGeometry(BASE_R - 0.003, BASE_R - 0.003, PAD_H, 32);
  const padMesh = addMesh(padGeo, darkPadMat, 'base_pad');
  padMesh.position.y = PAD_H / 2;

  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32);
  const baseMesh = addMesh(baseGeo, creamMat, 'base_disc');
  baseMesh.position.y = PAD_H + BASE_H / 2;

  const baseTopY = PAD_H + BASE_H;

  // 2. Stem base collar
  const collarGeo = new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.5, 0.008, 24);
  const collarMesh = addMesh(collarGeo, creamMat, 'stem_base_collar');
  collarMesh.position.y = baseTopY + 0.004;

  // 3. Curved main stem
  const stemPoints = [
    new THREE.Vector3(0, baseTopY, 0),
    new THREE.Vector3(0, 0.065, 0),
    new THREE.Vector3(0, 0.15, -0.042),
    new THREE.Vector3(0, 0.27, -0.095),
    new THREE.Vector3(0, 0.365, -0.072),
    new THREE.Vector3(0, 0.415, -0.015),
    new THREE.Vector3(0, 0.422, 0.012),
  ];
  const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 40, STEM_R, 16, false);
  addMesh(stemGeo, creamMat, 'stem_tube');

  // 4. Shade assembly (tilted forward toward +Z and downward)
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(0, 0.422, 0.045);
  shadeGroup.rotation.x = 0.62; // tilts bottom opening toward +Z
  group.add(shadeGroup);

  function addShadeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shadeGroup.add(mesh);
    return mesh;
  }

  // Hollow conical shade via LatheGeometry (local Y: 0 at bottom rim, SHADE_LEN at top)
  const shadeProfile = [
    new THREE.Vector2(SHADE_BOT_R - SHADE_THICK, 0),
    new THREE.Vector2(SHADE_BOT_R, 0),
    new THREE.Vector2(SHADE_TOP_R, SHADE_LEN),
    new THREE.Vector2(0.004, SHADE_LEN + 0.003),
    new THREE.Vector2(0, SHADE_LEN + 0.003),
    new THREE.Vector2(0, SHADE_LEN - SHADE_THICK),
    new THREE.Vector2(SHADE_TOP_R - SHADE_THICK, SHADE_LEN - SHADE_THICK),
    new THREE.Vector2(SHADE_BOT_R - SHADE_THICK, 0),
  ];
  const shadeGeo = new THREE.LatheGeometry(shadeProfile, 32);
  const shadeMesh = addShadeMesh(shadeGeo, creamMat, 'lamp_shade');
  shadeMesh.position.y = -SHADE_LEN * 0.58;

  // Bulb socket inside shade
  const socketGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.032, 20);
  const socketMesh = addShadeMesh(socketGeo, socketMat, 'bulb_socket');
  socketMesh.position.y = SHADE_LEN * 0.42 - 0.035;

  // Emissive bulb inside shade
  const bulbGeo = new THREE.SphereGeometry(0.022, 20, 16);
  const bulbMesh = addShadeMesh(bulbGeo, bulbMat, 'emit_bulb');
  bulbMesh.position.y = SHADE_LEN * 0.42 - 0.062;

  // Top cord bushing on shade
  const topBushingGeo = new THREE.CylinderGeometry(0.0055, 0.007, 0.012, 16);
  const topBushingMesh = addShadeMesh(topBushingGeo, creamMat, 'top_cord_bushing');
  topBushingMesh.position.y = SHADE_LEN * 0.42 + 0.006;

  // Pivot joint connecting stem tip to shade
  const jointGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.034, 16);
  const jointMesh = addMesh(jointGeo, creamMat, 'shade_joint_collar');
  jointMesh.position.set(0, 0.422, 0.018);
  jointMesh.rotation.x = Math.PI / 2 - 0.25;

  // 5. Top cord loop from shade top to upper stem
  const topCordStart = new THREE.Vector3(0, 0.422 + Math.cos(0.62) * (SHADE_LEN * 0.42 + 0.01), 0.045 - Math.sin(0.62) * (SHADE_LEN * 0.42 + 0.01));
  const topCordPoints = [
    topCordStart,
    new THREE.Vector3(0, 0.50, -0.025),
    new THREE.Vector3(0, 0.485, -0.065),
    new THREE.Vector3(0, 0.435, -0.055),
    new THREE.Vector3(0, 0.398, -0.040),
  ];
  const topCordCurve = new THREE.CatmullRomCurve3(topCordPoints);
  const topCordGeo = new THREE.TubeGeometry(topCordCurve, 28, CORD_R, 12, false);
  addMesh(topCordGeo, cordMat, 'top_cord_loop');

  // 6. Lower power cord & inline switch
  const lowerCordPoints = [
    new THREE.Vector3(0, 0.085, -0.008),
    new THREE.Vector3(0.012, 0.045, -0.035),
    new THREE.Vector3(0.035, 0.012, -0.065),
    new THREE.Vector3(0.075, CORD_R, -0.085),
    new THREE.Vector3(0.135, CORD_R, -0.095),
    new THREE.Vector3(0.185, CORD_R, -0.095),
  ];
  const lowerCordCurve = new THREE.CatmullRomCurve3(lowerCordPoints);
  const lowerCordGeo = new THREE.TubeGeometry(lowerCordCurve, 28, CORD_R, 12, false);
  addMesh(lowerCordGeo, cordMat, 'power_cord');

  // Inline switch resting on table
  const switchBodyGeo = new THREE.BoxGeometry(0.046, 0.012, 0.020);
  const switchBodyMesh = addMesh(switchBodyGeo, cordMat, 'inline_switch_body');
  switchBodyMesh.position.set(0.155, 0.006, -0.095);

  const switchRockerGeo = new THREE.BoxGeometry(0.016, 0.006, 0.010);
  const switchRockerMesh = addMesh(switchRockerGeo, cordMat, 'inline_switch_rocker');
  switchRockerMesh.position.set(0.155, 0.013, -0.095);
  switchRockerMesh.rotation.z = 0.18;

  return group;
}
