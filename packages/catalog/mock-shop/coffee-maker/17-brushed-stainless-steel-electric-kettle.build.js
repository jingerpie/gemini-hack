function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.23;
  const BASE_H = 0.022;
  const SEAM_H = 0.003;
  const LOWER_H = 0.125;
  const UPPER_H = H - BASE_H - SEAM_H - LOWER_H;
  const R_MAX = 0.082;
  const R_TOP = 0.058;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc5a888,
    roughness: 0.65,
    metalness: 0.05
  });

  const darkBodyMat = new THREE.MeshStandardMaterial({
    color: 0x3e4042,
    roughness: 0.42,
    metalness: 0.35
  });

  const lightBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0ce,
    roughness: 0.48,
    metalness: 0.05
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f20,
    roughness: 0.7,
    metalness: 0.1
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Power Base
  const basePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.066, 0.0),
    new THREE.Vector2(0.075, 0.005),
    new THREE.Vector2(0.078, 0.013),
    new THREE.Vector2(0.077, BASE_H),
    new THREE.Vector2(0.0, BASE_H)
  ];
  addMesh(new THREE.LatheGeometry(basePoints, 32), baseMat, 'power_base');

  // 2. Base Seam
  const seamGeo = new THREE.CylinderGeometry(0.075, 0.075, SEAM_H, 32);
  const seam = addMesh(seamGeo, seamMat, 'base_seam');
  seam.position.y = BASE_H + SEAM_H * 0.5;

  // 3. Lower Dark Body
  const yLowerStart = BASE_H + SEAM_H;
  const yLowerEnd = yLowerStart + LOWER_H;
  const lowerPoints = [
    new THREE.Vector2(0.0, yLowerStart),
    new THREE.Vector2(0.077, yLowerStart),
    new THREE.Vector2(0.080, yLowerStart + LOWER_H * 0.25),
    new THREE.Vector2(R_MAX, yLowerStart + LOWER_H * 0.55),
    new THREE.Vector2(0.078, yLowerStart + LOWER_H * 0.80),
    new THREE.Vector2(0.073, yLowerEnd),
    new THREE.Vector2(0.0, yLowerEnd)
  ];
  addMesh(new THREE.LatheGeometry(lowerPoints, 32), darkBodyMat, 'lower_body');

  // 4. Upper Light-Grey Body
  const yUpperEnd = H;
  const upperPoints = [
    new THREE.Vector2(0.0, yLowerEnd),
    new THREE.Vector2(0.073, yLowerEnd),
    new THREE.Vector2(0.068, yLowerEnd + UPPER_H * 0.35),
    new THREE.Vector2(0.062, yLowerEnd + UPPER_H * 0.72),
    new THREE.Vector2(R_TOP, yUpperEnd - 0.003),
    new THREE.Vector2(R_TOP - 0.002, yUpperEnd),
    new THREE.Vector2(0.0, yUpperEnd)
  ];
  addMesh(new THREE.LatheGeometry(upperPoints, 32), lightBodyMat, 'upper_body');

  // 5. Lid Seam
  const lidSeamGeo = new THREE.TorusGeometry(R_TOP - 0.004, 0.001, 12, 32);
  const lidSeam = addMesh(lidSeamGeo, seamMat, 'lid_seam');
  lidSeam.rotation.x = Math.PI / 2;
  lidSeam.position.y = yUpperEnd - 0.0005;

  // 6. Lid
  const lidGeo = new THREE.CylinderGeometry(R_TOP - 0.005, R_TOP - 0.005, 0.002, 32);
  const lid = addMesh(lidGeo, lightBodyMat, 'lid');
  lid.position.y = yUpperEnd - 0.0005;

  // 7. Spout (-X side)
  const spoutGeo = new THREE.CylinderGeometry(0.020, 0.006, 0.056, 24);
  const spout = addMesh(spoutGeo, lightBodyMat, 'spout');
  spout.position.set(-0.076, 0.197, 0);
  spout.rotation.z = 0.42;

  // 8. Spout Lip
  const spoutLipGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.003, 24);
  const spoutLip = addMesh(spoutLipGeo, lightBodyMat, 'spout_lip');
  spoutLip.position.set(-0.087, 0.221, 0);
  spoutLip.rotation.z = 0.42;

  // 9. Handle Vertical Spine (+X side)
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.077, 0.036, 0),
    new THREE.Vector3(0.081, 0.085, 0),
    new THREE.Vector3(0.076, 0.145, 0),
    new THREE.Vector3(0.063, 0.205, 0)
  ]);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 20, 0.0065, 12, false);
  addMesh(spineGeo, lightBodyMat, 'handle_spine');

  // 10. Handle Main Arm (+X side)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.062, 0.202, 0),
    new THREE.Vector3(0.105, 0.200, 0),
    new THREE.Vector3(0.125, 0.186, 0),
    new THREE.Vector3(0.138, 0.145, 0),
    new THREE.Vector3(0.150, 0.102, 0)
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.0095, 14, false);
  addMesh(handleGeo, lightBodyMat, 'handle_arm');

  // 11. Handle Tip Cap
  const tipGeo = new THREE.SphereGeometry(0.0095, 16, 12);
  const tip = addMesh(tipGeo, lightBodyMat, 'handle_tip');
  tip.position.set(0.150, 0.102, 0);

  // 12. Switch Tab
  const switchGeo = new THREE.BoxGeometry(0.024, 0.007, 0.014);
  const switchTab = addMesh(switchGeo, lightBodyMat, 'switch_tab');
  switchTab.position.set(0.090, 0.048, 0);

  // 13. Front Button Face (+Z side)
  const btnGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.004, 24);
  const btn = addMesh(btnGeo, darkBodyMat, 'button_face');
  btn.rotation.x = Math.PI / 2;
  btn.position.set(0, 0.058, 0.079);

  // 14. Front Button LED Ring (+Z side)
  const ledGeo = new THREE.TorusGeometry(0.0115, 0.0018, 12, 28);
  const led = addMesh(ledGeo, ledMat, 'button_led_ring');
  led.position.set(0, 0.058, 0.0805);

  return group;
}
