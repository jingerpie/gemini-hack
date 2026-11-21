function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const SPK_W = 0.14;
  const SPK_H = 0.22;
  const SPK_D = 0.17;
  const BASE_H = 0.022;
  const BASE_W = 0.146;
  const BASE_D = 0.176;
  const GAP = 0.06;

  const LEFT_X = -(SPK_W + GAP) / 2;
  const RIGHT_X = (SPK_W + GAP) / 2;
  const CAB_CENTER_Y = BASE_H + SPK_H / 2;

  // Materials
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x3a3b3e,
    roughness: 0.75,
    metalness: 0.05
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x18181a,
    roughness: 0.85,
    metalness: 0.05
  });
  const driverConeMat = new THREE.MeshStandardMaterial({
    color: 0x262729,
    roughness: 0.8,
    metalness: 0.05
  });
  const blackSatinMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.45,
    metalness: 0.15
  });
  const ampPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.55,
    metalness: 0.25
  });
  const redPostMat = new THREE.MeshStandardMaterial({
    color: 0xb82222,
    roughness: 0.4,
    metalness: 0.2
  });
  const whiteJackMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.4,
    metalness: 0.1
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a248,
    roughness: 0.3,
    metalness: 0.85
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

  // Shared geometries
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
  const cabGeo = new THREE.BoxGeometry(SPK_W, SPK_H, SPK_D);
  const tweeterRingGeo = new THREE.TorusGeometry(0.022, 0.004, 12, 28);
  const tweeterDomeGeo = new THREE.SphereGeometry(0.013, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const wooferRingGeo = new THREE.TorusGeometry(0.048, 0.005, 12, 32);
  const wooferConeGeo = new THREE.ConeGeometry(0.045, 0.016, 32, 1, true);
  const dustCapGeo = new THREE.SphereGeometry(0.015, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const portRingGeo = new THREE.TorusGeometry(0.018, 0.004, 12, 24);
  const postGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.014, 16);

  const speakers = [
    { prefix: 'left', x: LEFT_X, isPowered: true },
    { prefix: 'right', x: RIGHT_X, isPowered: false }
  ];

  speakers.forEach((spk) => {
    const sx = spk.x;
    const frontZ = SPK_D / 2;
    const backZ = -SPK_D / 2;

    // Isolation base pad
    addMesh(baseGeo, baseMat, `${spk.prefix}_base_pad`, sx, BASE_H / 2, 0);

    // Main cabinet
    addMesh(cabGeo, cabinetMat, `${spk.prefix}_cabinet`, sx, CAB_CENTER_Y, 0);

    // Tweeter (upper front)
    const tweeterY = BASE_H + SPK_H * 0.76;
    addMesh(tweeterRingGeo, blackSatinMat, `${spk.prefix}_tweeter_ring`, sx, tweeterY, frontZ + 0.001);
    addMesh(tweeterDomeGeo, blackSatinMat, `${spk.prefix}_tweeter_dome`, sx, tweeterY, frontZ + 0.001, Math.PI / 2, 0, 0);

    // Woofer (middle-lower front)
    const wooferY = BASE_H + SPK_H * 0.42;
    addMesh(wooferRingGeo, blackSatinMat, `${spk.prefix}_woofer_ring`, sx, wooferY, frontZ + 0.002);
    addMesh(wooferConeGeo, driverConeMat, `${spk.prefix}_woofer_cone`, sx, wooferY, frontZ - 0.004, -Math.PI / 2, 0, 0);
    addMesh(dustCapGeo, blackSatinMat, `${spk.prefix}_woofer_dust_cap`, sx, wooferY, frontZ - 0.002, Math.PI / 2, 0, 0);

    // Rear bass reflex port
    const portY = BASE_H + SPK_H * 0.72;
    addMesh(portRingGeo, blackSatinMat, `${spk.prefix}_bass_port`, sx, portY, backZ - 0.001);

    // Rear binding posts
    const postY = BASE_H + SPK_H * 0.22;
    addMesh(postGeo, blackSatinMat, `${spk.prefix}_binding_post_black`, sx - 0.014, postY, backZ - 0.006, Math.PI / 2, 0, 0);
    addMesh(postGeo, redPostMat, `${spk.prefix}_binding_post_red`, sx + 0.014, postY, backZ - 0.006, Math.PI / 2, 0, 0);

    // Powered speaker controls & amp plate
    if (spk.isPowered) {
      const ctrlY = BASE_H + 0.022;
      // Volume knob (front right)
      const knobGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.014, 24);
      addMesh(knobGeo, blackSatinMat, 'left_volume_knob', sx + 0.038, ctrlY, frontZ + 0.007, Math.PI / 2, 0, 0);

      // Headphone jack (front left)
      const jackGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12);
      addMesh(jackGeo, brassMat, 'left_headphone_jack', sx - 0.044, ctrlY, frontZ + 0.001, Math.PI / 2, 0, 0);

      // Power LED
      const ledGeo = new THREE.SphereGeometry(0.002, 10, 8);
      addMesh(ledGeo, blackSatinMat, 'left_power_led', sx - 0.012, ctrlY, frontZ + 0.001);

      // Side/Back amp plate on outer left side
      const plateGeo = new THREE.BoxGeometry(0.004, SPK_H * 0.76, SPK_D * 0.68);
      const sideX = sx - SPK_W / 2 - 0.001;
      addMesh(plateGeo, ampPlateMat, 'left_amp_plate', sideX, CAB_CENTER_Y, 0);

      // RCA input jacks on amp plate
      const rcaGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 16);
      addMesh(rcaGeo, redPostMat, 'left_rca_red', sideX - 0.004, CAB_CENTER_Y + 0.015, 0.012, 0, 0, Math.PI / 2);
      addMesh(rcaGeo, whiteJackMat, 'left_rca_white', sideX - 0.004, CAB_CENTER_Y + 0.015, -0.008, 0, 0, Math.PI / 2);
    }
  });

  return group;
}
