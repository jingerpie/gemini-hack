function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (24-inch diameter = 0.61 m)
  const DIAMETER = 0.61;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.036;
  const CENTER_Y = RADIUS;
  const BACK_Z = -DEPTH / 2;
  const FRONT_Z = DEPTH / 2;

  const GLASS_THICKNESS = 0.005;
  const HOUSING_RADIUS = 0.282;
  const HOUSING_DEPTH = DEPTH - GLASS_THICKNESS;
  const LED_RING_RADIUS = 0.278;
  const LED_RING_TUBE = 0.011;

  // Materials
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const frontLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffe8c2,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.0
  });

  const backLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xffdfa8,
    emissiveIntensity: 0.85,
    roughness: 0.35,
    metalness: 0.0
  });

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    metalness: 0.6,
    roughness: 0.35
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    metalness: 0.8,
    roughness: 0.3
  });

  const touchIconMat = new THREE.MeshStandardMaterial({
    color: 0xeaf2ff,
    emissive: 0x9ec5ff,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.1
  });

  // 1. Main round mirror glass
  const glassGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, GLASS_THICKNESS, 32);
  glassGeo.rotateX(Math.PI / 2);
  const mirrorGlass = new THREE.Mesh(glassGeo, mirrorMat);
  mirrorGlass.name = 'mirror_glass_main';
  mirrorGlass.position.set(0, CENTER_Y, FRONT_Z - GLASS_THICKNESS / 2);
  group.add(mirrorGlass);

  // 2. Frosted LED ring inset on the front mirror face
  const frontLedGeo = new THREE.TorusGeometry(LED_RING_RADIUS, LED_RING_TUBE, 12, 32);
  frontLedGeo.scale(1, 1, 0.18);
  const frontLedRing = new THREE.Mesh(frontLedGeo, frontLedMat);
  frontLedRing.name = 'led_front_ring';
  frontLedRing.position.set(0, CENTER_Y, FRONT_Z - 0.0005);
  group.add(frontLedRing);

  // 3. Subtle polished edge rim around the mirror
  const rimGeo = new THREE.TorusGeometry(RADIUS - 0.0015, 0.0018, 8, 32);
  const mirrorRim = new THREE.Mesh(rimGeo, housingMat);
  mirrorRim.name = 'mirror_bevel_rim';
  mirrorRim.position.set(0, CENTER_Y, FRONT_Z - GLASS_THICKNESS / 2);
  group.add(mirrorRim);

  // 4. Cylindrical aluminum/white backing housing
  const housingGeo = new THREE.CylinderGeometry(HOUSING_RADIUS, HOUSING_RADIUS, HOUSING_DEPTH, 32);
  housingGeo.rotateX(Math.PI / 2);
  const backingHousing = new THREE.Mesh(housingGeo, housingMat);
  backingHousing.name = 'backing_housing';
  backingHousing.position.set(0, CENTER_Y, BACK_Z + HOUSING_DEPTH / 2);
  group.add(backingHousing);

  // 5. Flat back plate flush at z = BACK_Z
  const backPlateGeo = new THREE.CylinderGeometry(HOUSING_RADIUS - 0.005, HOUSING_RADIUS - 0.005, 0.003, 32);
  backPlateGeo.rotateX(Math.PI / 2);
  const backPlate = new THREE.Mesh(backPlateGeo, housingMat);
  backPlate.name = 'back_plate';
  backPlate.position.set(0, CENTER_Y, BACK_Z + 0.0015);
  group.add(backPlate);

  // 6. Rear perimeter LED backlight diffuser strip
  const backLedGeo = new THREE.TorusGeometry(HOUSING_RADIUS - 0.003, 0.006, 10, 32);
  const backLedStrip = new THREE.Mesh(backLedGeo, backLedMat);
  backLedStrip.name = 'backlight_led_strip';
  backLedStrip.position.set(0, CENTER_Y, BACK_Z + 0.008);
  group.add(backLedStrip);

  // 7. Central power driver box on back plate
  const driverGeo = new THREE.BoxGeometry(0.11, 0.06, 0.012);
  const driverBox = new THREE.Mesh(driverGeo, bracketMat);
  driverBox.name = 'power_driver_box';
  driverBox.position.set(0, CENTER_Y, BACK_Z + 0.006);
  group.add(driverBox);

  // 8 & 9. Wall mounting brackets (left and right)
  const bracketGeo = new THREE.BoxGeometry(0.03, 0.05, 0.006);
  const bracketOffsetX = 0.14;
  const bracketOffsetY = CENTER_Y + 0.11;

  const leftBracket = new THREE.Mesh(bracketGeo, bracketMat);
  leftBracket.name = 'mounting_bracket_left';
  leftBracket.position.set(-bracketOffsetX, bracketOffsetY, BACK_Z + 0.003);
  group.add(leftBracket);

  const rightBracket = new THREE.Mesh(bracketGeo, bracketMat);
  rightBracket.name = 'mounting_bracket_right';
  rightBracket.position.set(bracketOffsetX, bracketOffsetY, BACK_Z + 0.003);
  group.add(rightBracket);

  // 10-14. Touch sensor icon at bottom center of mirror
  const iconY = 0.085;
  const iconZ = FRONT_Z + 0.0002;
  const iconSize = 0.018;
  const iconBarThick = 0.0018;

  const hBarGeo = new THREE.BoxGeometry(iconSize, iconBarThick, 0.0006);
  const vBarGeo = new THREE.BoxGeometry(iconBarThick, iconSize, 0.0006);

  const iconTop = new THREE.Mesh(hBarGeo, touchIconMat);
  iconTop.name = 'touch_icon_top';
  iconTop.position.set(0, iconY + iconSize / 2 - iconBarThick / 2, iconZ);
  group.add(iconTop);

  const iconBottom = new THREE.Mesh(hBarGeo, touchIconMat);
  iconBottom.name = 'touch_icon_bottom';
  iconBottom.position.set(0, iconY - iconSize / 2 + iconBarThick / 2, iconZ);
  group.add(iconBottom);

  const iconLeft = new THREE.Mesh(vBarGeo, touchIconMat);
  iconLeft.name = 'touch_icon_left';
  iconLeft.position.set(-iconSize / 2 + iconBarThick / 2, iconY, iconZ);
  group.add(iconLeft);

  const iconRight = new THREE.Mesh(vBarGeo, touchIconMat);
  iconRight.name = 'touch_icon_right';
  iconRight.position.set(iconSize / 2 - iconBarThick / 2, iconY, iconZ);
  group.add(iconRight);

  const innerDotGeo = new THREE.BoxGeometry(0.006, 0.006, 0.0006);
  const iconCenter = new THREE.Mesh(innerDotGeo, touchIconMat);
  iconCenter.name = 'touch_icon_center';
  iconCenter.position.set(0, iconY, iconZ);
  group.add(iconCenter);

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
