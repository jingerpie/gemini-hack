function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.22;
  const R_MAX = 0.0725;
  const R_TOP = 0.054;
  const R_BASE = 0.050;
  const BASE_H = 0.008;
  const FOOT_R = 0.0025;
  const CORD_R = 0.0025;

  // Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f2ee,
    roughness: 0.55,
    metalness: 0.0,
    transparent: true,
    opacity: 0.9,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xe6e4e0,
    roughness: 0.5,
    metalness: 0.05
  });

  const siliconeMat = new THREE.MeshStandardMaterial({
    color: 0xd0cec8,
    roughness: 0.85,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    roughness: 0.35,
    metalness: 0.8
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xe8e6e1,
    roughness: 0.65,
    metalness: 0.0
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xffe4c4,
    emissive: 0xffc98a,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0
  });

  // 1. Silicone foot ring at y = 0
  const footGeo = new THREE.TorusGeometry(R_BASE - 0.006, FOOT_R, 12, 32);
  footGeo.rotateX(Math.PI / 2);
  const footRing = new THREE.Mesh(footGeo, siliconeMat);
  footRing.position.y = FOOT_R;
  footRing.name = 'foot_ring';
  group.add(footRing);

  // 2. Base plate
  const basePlateGeo = new THREE.CylinderGeometry(R_BASE, R_BASE - 0.003, BASE_H, 32);
  const basePlate = new THREE.Mesh(basePlateGeo, baseMat);
  basePlate.position.y = FOOT_R + BASE_H / 2;
  basePlate.name = 'base_plate';
  group.add(basePlate);

  // 3. Base trim ring
  const trimH = 0.004;
  const trimGeo = new THREE.CylinderGeometry(R_BASE + 0.002, R_BASE, trimH, 32);
  const baseTrim = new THREE.Mesh(trimGeo, baseMat);
  baseTrim.position.y = FOOT_R + BASE_H + trimH / 2;
  baseTrim.name = 'base_trim_ring';
  group.add(baseTrim);

  // 4. Internal driver housing
  const driverH = 0.028;
  const driverGeo = new THREE.CylinderGeometry(0.032, 0.036, driverH, 24);
  const driverHousing = new THREE.Mesh(driverGeo, baseMat);
  driverHousing.position.y = FOOT_R + BASE_H + driverH / 2;
  driverHousing.name = 'internal_driver_housing';
  group.add(driverHousing);

  // 5. Internal heatsink
  const heatsinkH = 0.022;
  const heatsinkGeo = new THREE.CylinderGeometry(0.022, 0.026, heatsinkH, 24);
  const heatsink = new THREE.Mesh(heatsinkGeo, metalMat);
  heatsink.position.y = FOOT_R + BASE_H + driverH + heatsinkH / 2;
  heatsink.name = 'internal_heatsink';
  group.add(heatsink);

  // 6. Socket base
  const socketH = 0.016;
  const socketGeo = new THREE.CylinderGeometry(0.016, 0.018, socketH, 24);
  const socketBase = new THREE.Mesh(socketGeo, metalMat);
  socketBase.position.y = FOOT_R + BASE_H + driverH + heatsinkH + socketH / 2;
  socketBase.name = 'socket_base';
  group.add(socketBase);

  // 7. Emissive bulb
  const bulbY = FOOT_R + BASE_H + driverH + heatsinkH + socketH + 0.024;
  const bulbGeo = new THREE.SphereGeometry(0.028, 24, 20);
  bulbGeo.scale(1, 1.2, 1);
  const emitBulb = new THREE.Mesh(bulbGeo, emitMat);
  emitBulb.position.y = bulbY;
  emitBulb.name = 'emit_bulb';
  group.add(emitBulb);

  // 8. Emissive LED ring around heatsink top
  const ledRingGeo = new THREE.TorusGeometry(0.02, 0.003, 10, 24);
  ledRingGeo.rotateX(Math.PI / 2);
  const emitLedRing = new THREE.Mesh(ledRingGeo, emitMat);
  emitLedRing.position.y = FOOT_R + BASE_H + driverH + heatsinkH;
  emitLedRing.name = 'emit_led_ring';
  group.add(emitLedRing);

  // 9. Frosted glass shade (LatheGeometry)
  const shadeBaseY = FOOT_R + BASE_H;
  const shadePoints = [
    new THREE.Vector2(R_BASE, shadeBaseY),
    new THREE.Vector2(R_BASE + 0.012, shadeBaseY + 0.008),
    new THREE.Vector2(R_MAX - 0.004, shadeBaseY + 0.024),
    new THREE.Vector2(R_MAX, shadeBaseY + 0.048),
    new THREE.Vector2(R_MAX - 0.002, shadeBaseY + 0.085),
    new THREE.Vector2(R_MAX - 0.007, shadeBaseY + 0.130),
    new THREE.Vector2(R_TOP + 0.005, H - 0.032),
    new THREE.Vector2(R_TOP, H - 0.016),
    new THREE.Vector2(R_TOP - 0.006, H - 0.004),
    new THREE.Vector2(R_TOP - 0.016, H),
    new THREE.Vector2(R_TOP - 0.030, H - 0.003),
    new THREE.Vector2(0.0, H - 0.006)
  ];
  const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);
  const glassShade = new THREE.Mesh(shadeGeo, glassMat);
  glassShade.name = 'frosted_glass_shade';
  group.add(glassShade);

  // 10. Cord grommet at back (-Z)
  const grommetGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 16);
  grommetGeo.rotateX(Math.PI / 2);
  const cordGrommet = new THREE.Mesh(grommetGeo, siliconeMat);
  cordGrommet.position.set(0, FOOT_R + BASE_H / 2, -R_BASE);
  cordGrommet.name = 'cord_grommet';
  group.add(cordGrommet);

  // 11. Power cord curving out from back (-Z)
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, FOOT_R + BASE_H / 2, -R_BASE - 0.002),
    new THREE.Vector3(0, CORD_R + 0.001, -R_BASE - 0.035),
    new THREE.Vector3(0.02, CORD_R, -R_BASE - 0.085),
    new THREE.Vector3(0.06, CORD_R, -R_BASE - 0.145),
    new THREE.Vector3(0.11, CORD_R, -R_BASE - 0.19)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, CORD_R, 10, false);
  const powerCord = new THREE.Mesh(cordGeo, cordMat);
  powerCord.name = 'power_cord';
  group.add(powerCord);

  // 12. Inline dimmer/switch body on the cord
  const switchGeo = new THREE.BoxGeometry(0.022, 0.012, 0.044);
  const switchBody = new THREE.Mesh(switchGeo, baseMat);
  switchBody.position.set(0.06, 0.006, -R_BASE - 0.145);
  switchBody.rotation.y = -0.65;
  switchBody.name = 'inline_switch_body';
  group.add(switchBody);

  // 13. Inline switch button
  const btnGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.004, 16);
  const switchBtn = new THREE.Mesh(btnGeo, siliconeMat);
  switchBtn.position.set(0.06, 0.013, -R_BASE - 0.145);
  switchBtn.name = 'inline_switch_button';
  group.add(switchBtn);

  // Enable shadows on all meshes
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
