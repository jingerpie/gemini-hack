function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.20;          // Total height
  const R = 0.0425;        // Outer radius (8.5 cm diameter)
  const CAP_H = 0.014;     // Height of top/bottom rubber caps
  const BODY_H = H - CAP_H * 2 + 0.004; // Fabric body height (overlaps caps slightly)
  const SEG = 32;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x35393d,
    roughness: 0.92,
    metalness: 0.05
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x42474c,
    roughness: 0.65,
    metalness: 0.08
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x4b5056,
    roughness: 0.55,
    metalness: 0.1
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x16181a,
    roughness: 0.85,
    metalness: 0.1
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a9096,
    roughness: 0.35,
    metalness: 0.85
  });

  // Helper to add shadow flags
  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main Fabric Body
  const bodyGeo = new THREE.CylinderGeometry(R, R, BODY_H, SEG);
  addMesh(bodyGeo, fabricMat, 'speaker_fabric_body', 0, H / 2, 0);

  // 2. Bottom Cap (LatheGeometry for rounded bottom edge)
  const bottomPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R - 0.007, 0.0),
    new THREE.Vector2(R - 0.002, 0.003),
    new THREE.Vector2(R, 0.008),
    new THREE.Vector2(R, CAP_H),
    new THREE.Vector2(R - 0.004, CAP_H),
    new THREE.Vector2(0.0, CAP_H)
  ];
  const bottomCapGeo = new THREE.LatheGeometry(bottomPts, SEG);
  addMesh(bottomCapGeo, rubberMat, 'bottom_cap', 0, 0, 0);

  // 3. Bottom Foot Ring
  const footGeo = new THREE.TorusGeometry(R - 0.012, 0.0015, 8, SEG);
  footGeo.rotateX(Math.PI / 2);
  addMesh(footGeo, recessMat, 'bottom_foot_ring', 0, 0.0015, 0);

  // 4. Top Cap (LatheGeometry with rounded rim and slight top dish)
  const topPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R - 0.003, 0.0),
    new THREE.Vector2(R, 0.0),
    new THREE.Vector2(R, CAP_H - 0.007),
    new THREE.Vector2(R - 0.002, CAP_H - 0.002),
    new THREE.Vector2(R - 0.008, CAP_H),
    new THREE.Vector2(R - 0.011, CAP_H - 0.0018),
    new THREE.Vector2(0.0, CAP_H - 0.0018)
  ];
  const topCapGeo = new THREE.LatheGeometry(topPts, SEG);
  addMesh(topCapGeo, rubberMat, 'top_cap', 0, H - CAP_H, 0);

  // 5. Top Lanyard / Strap Mount (front +Z)
  const mountW = 0.019;
  const mountH = 0.022;
  const mountD = 0.008;
  const mountGeo = new THREE.BoxGeometry(mountW, mountH, mountD);
  addMesh(mountGeo, rubberMat, 'top_strap_mount', 0, H - CAP_H - 0.004, R - 0.0025);

  const strapRecessGeo = new THREE.BoxGeometry(mountW - 0.006, 0.008, 0.004);
  addMesh(strapRecessGeo, recessMat, 'top_strap_recess', 0, H - CAP_H - 0.007, R + 0.0002);

  const strapBarGeo = new THREE.CylinderGeometry(0.002, 0.002, mountW - 0.004, 12);
  strapBarGeo.rotateZ(Math.PI / 2);
  addMesh(strapBarGeo, rubberMat, 'top_strap_bar', 0, H - CAP_H - 0.004, R + 0.0018);

  // 6. Bottom USB-C Port Tab (front +Z)
  const tabW = 0.017;
  const tabH = 0.016;
  const tabD = 0.006;
  const tabGeo = new THREE.BoxGeometry(tabW, tabH, tabD);
  addMesh(tabGeo, rubberMat, 'bottom_port_tab', 0, CAP_H * 0.65, R - 0.002);

  const usbRecessGeo = new THREE.CapsuleGeometry(0.0018, 0.0055, 6, 12);
  usbRecessGeo.rotateZ(Math.PI / 2);
  addMesh(usbRecessGeo, recessMat, 'usb_c_recess', 0, CAP_H * 0.72, R + 0.0005);

  const usbTongueGeo = new THREE.BoxGeometry(0.005, 0.001, 0.003);
  addMesh(usbTongueGeo, metalMat, 'usb_c_tongue', 0, CAP_H * 0.72, R - 0.0002);

  // 7. Top Control Buttons
  const topSurfaceY = H - 0.0015;

  // Power button (center-back)
  const pwrGeo = new THREE.CylinderGeometry(0.0075, 0.008, 0.0022, 24);
  addMesh(pwrGeo, buttonMat, 'btn_power_base', 0, topSurfaceY + 0.0008, -0.008);

  const pwrRingGeo = new THREE.TorusGeometry(0.0038, 0.0007, 8, 20);
  pwrRingGeo.rotateX(Math.PI / 2);
  addMesh(pwrRingGeo, rubberMat, 'btn_power_ring', 0, topSurfaceY + 0.002, -0.008);

  // Volume Minus button (left -X)
  const minusGeo = new THREE.BoxGeometry(0.008, 0.0018, 0.0022);
  addMesh(minusGeo, buttonMat, 'btn_vol_minus', -0.016, topSurfaceY + 0.0008, 0.0);

  // Volume Plus button (right +X)
  const plusHGeo = new THREE.BoxGeometry(0.008, 0.0018, 0.0022);
  addMesh(plusHGeo, buttonMat, 'btn_vol_plus_h', 0.016, topSurfaceY + 0.0008, 0.0);

  const plusVGeo = new THREE.BoxGeometry(0.0022, 0.0018, 0.008);
  addMesh(plusVGeo, buttonMat, 'btn_vol_plus_v', 0.016, topSurfaceY + 0.0008, 0.0);

  // Play/Pause / Bluetooth button (front +Z)
  const playGeo = new THREE.CapsuleGeometry(0.0035, 0.006, 6, 12);
  playGeo.rotateZ(Math.PI / 2);
  playGeo.scale(1, 0.45, 1);
  addMesh(playGeo, buttonMat, 'btn_play_pause', 0, topSurfaceY + 0.0008, 0.013);

  return group;
}
