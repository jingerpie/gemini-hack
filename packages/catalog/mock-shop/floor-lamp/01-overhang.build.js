function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const TOTAL_H = 2.20;
  const BASE_DISC_R = 0.16;
  const BASE_DISC_H = 0.014;
  const COUNTERWEIGHT_R = 0.082;
  const COUNTERWEIGHT_H = 0.34;
  const STEM_R = 0.011;
  const COLLAR_R = 0.015;
  const REACH = 1.22; // horizontal distance from base center to shade center
  const SHADE_R = 0.24;
  const SHADE_H = 0.25;
  const SHADE_BOTTOM_Y = 1.72;

  // Center the bounding box on z = 0
  const zBase = -(REACH + SHADE_R - BASE_DISC_R) / 2;
  const zShade = zBase + REACH;

  // Materials
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x5c4632,
    roughness: 0.38,
    metalness: 0.78,
  });

  const shadeOuterMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.88,
    metalness: 0.0,
    emissive: 0x3b2610,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });

  const shadeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    roughness: 0.65,
    metalness: 0.0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffdca0,
    emissiveIntensity: 1.4,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Flat circular base disc (sits on y = 0)
  addMesh(
    new THREE.CylinderGeometry(BASE_DISC_R, BASE_DISC_R, BASE_DISC_H, 32),
    bronzeMat,
    'base_disc',
    0,
    BASE_DISC_H / 2,
    zBase
  );

  // 2. Heavy cylindrical counterweight
  addMesh(
    new THREE.CylinderGeometry(COUNTERWEIGHT_R, COUNTERWEIGHT_R, COUNTERWEIGHT_H, 32),
    bronzeMat,
    'counterweight_cylinder',
    0,
    BASE_DISC_H + COUNTERWEIGHT_H / 2 - 0.002,
    zBase
  );

  // 3. Counterweight top bevel
  const baseTopY = BASE_DISC_H + COUNTERWEIGHT_H;
  addMesh(
    new THREE.CylinderGeometry(COUNTERWEIGHT_R * 0.94, COUNTERWEIGHT_R, 0.008, 32),
    bronzeMat,
    'counterweight_top_bevel',
    0,
    baseTopY + 0.002,
    zBase
  );

  // 4. Continuous pole rising vertically from inside the base top, curving to the shade
  const shadeTopY = SHADE_BOTTOM_Y + SHADE_H;
  const arcTipY = shadeTopY + 0.045;
  const poleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, baseTopY - 0.04, zBase),
    new THREE.Vector3(0, 0.72, zBase),
    new THREE.Vector3(0, 1.15, zBase + 0.01),
    new THREE.Vector3(0, 1.56, zBase + 0.12),
    new THREE.Vector3(0, TOTAL_H - 0.14, zBase + 0.42),
    new THREE.Vector3(0, TOTAL_H, zBase + 0.85),
    new THREE.Vector3(0, arcTipY, zShade),
  ]);

  addMesh(
    new THREE.TubeGeometry(poleCurve, 48, STEM_R, 12, false),
    bronzeMat,
    'arc_pole',
    0,
    0,
    0
  );

  // 5. Telescoping joint collars along the pole
  const lowerPt = poleCurve.getPointAt(0.35);
  const lowerTan = poleCurve.getTangentAt(0.35);
  const lowerCollar = addMesh(
    new THREE.CylinderGeometry(COLLAR_R, COLLAR_R, 0.04, 16),
    bronzeMat,
    'stem_collar',
    lowerPt.x,
    lowerPt.y,
    lowerPt.z
  );
  lowerCollar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lowerTan);

  const midPt = poleCurve.getPointAt(0.58);
  const midTan = poleCurve.getTangentAt(0.58);
  const midCollar = addMesh(
    new THREE.CylinderGeometry(COLLAR_R * 0.88, COLLAR_R * 0.88, 0.032, 16),
    bronzeMat,
    'arc_collar',
    midPt.x,
    midPt.y,
    midPt.z
  );
  midCollar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), midTan);

  // 6. Vertical drop from arc tip into shade
  const dropH = 0.055;
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 0.9, STEM_R * 0.9, dropH, 16),
    bronzeMat,
    'arc_tip_drop',
    0,
    arcTipY - dropH / 2 + 0.005,
    zShade
  );

  // 7. Shade mounting cap
  addMesh(
    new THREE.CylinderGeometry(0.024, 0.028, 0.018, 20),
    bronzeMat,
    'shade_mount_cap',
    0,
    shadeTopY + 0.004,
    zShade
  );

  // 8. Drum shade outer fabric
  const shadeCenterY = SHADE_BOTTOM_Y + SHADE_H / 2;
  addMesh(
    new THREE.CylinderGeometry(SHADE_R, SHADE_R, SHADE_H, 32, 1, true),
    shadeOuterMat,
    'shade_outer',
    0,
    shadeCenterY,
    zShade
  );

  // 9. Drum shade inner lining
  addMesh(
    new THREE.CylinderGeometry(SHADE_R - 0.003, SHADE_R - 0.003, SHADE_H - 0.004, 32, 1, true),
    shadeInnerMat,
    'shade_inner_lining',
    0,
    shadeCenterY,
    zShade
  );

  // 10. Shade top and bottom trim rings
  const topRing = addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.002, 0.0035, 8, 32),
    bronzeMat,
    'shade_top_ring',
    0,
    shadeTopY - 0.002,
    zShade
  );
  topRing.rotation.x = Math.PI / 2;

  const bottomRing = addMesh(
    new THREE.TorusGeometry(SHADE_R - 0.002, 0.0035, 8, 32),
    bronzeMat,
    'shade_bottom_ring',
    0,
    SHADE_BOTTOM_Y + 0.002,
    zShade
  );
  bottomRing.rotation.x = Math.PI / 2;

  // 11. Lamp socket & glowing bulb inside shade
  addMesh(
    new THREE.CylinderGeometry(0.02, 0.022, 0.045, 16),
    bronzeMat,
    'lamp_socket',
    0,
    shadeTopY - 0.025,
    zShade
  );

  addMesh(
    new THREE.SphereGeometry(0.036, 16, 12),
    bulbMat,
    'lamp_bulb',
    0,
    shadeTopY - 0.068,
    zShade
  );

  return group;
}
