function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.62;
  const D = 0.56;
  const H = 0.28;
  const BASE_H = 0.015;
  const CUSHION_W = 0.36;
  const CUSHION_D = 0.32;
  const CUSHION_H = 0.095;

  // Materials
  const creamSherpaMat = new THREE.MeshStandardMaterial({
    color: 0xf6edd6,
    roughness: 0.95,
    metalness: 0.0,
  });

  const pinkCushionMat = new THREE.MeshStandardMaterial({
    color: 0xf3d3d6,
    roughness: 0.95,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xebd9ae,
    roughness: 0.8,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  // 1. Bottom anti-slip base
  const baseGeo = new THREE.CylinderGeometry(0.24, 0.23, BASE_H, 28);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.scale.set(1.05, 1, 0.95);
  baseMesh.position.set(0, BASE_H * 0.5, 0);
  baseMesh.name = 'anti_slip_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Inner pink plush cushion
  const cushionGeo = new THREE.SphereGeometry(1, 24, 16);
  const cushionMesh = new THREE.Mesh(cushionGeo, pinkCushionMat);
  cushionMesh.scale.set(CUSHION_W * 0.5, CUSHION_H * 0.5, CUSHION_D * 0.5);
  cushionMesh.position.set(0, BASE_H + CUSHION_H * 0.42, 0.01);
  cushionMesh.name = 'inner_pink_cushion';
  cushionMesh.castShadow = true;
  cushionMesh.receiveShadow = true;
  group.add(cushionMesh);

  // 3. Cloud bolster lobes arranged around an oval perimeter
  // Angle 0 is +Z (front), PI is -Z (back)
  const lobes = [
    // Back center peak (-Z)
    { angle: Math.PI, rx: 0.115, ry: 0.145, rz: 0.095, yCenter: 0.135, name: 'back_center_lobe' },
    // Back-left and back-right medium-tall lobes
    { angle: Math.PI - 0.55, rx: 0.095, ry: 0.115, rz: 0.085, yCenter: 0.115, name: 'back_right_lobe' },
    { angle: Math.PI + 0.55, rx: 0.095, ry: 0.115, rz: 0.085, yCenter: 0.115, name: 'back_left_lobe' },
    // Side-left and side-right armrest lobes
    { angle: Math.PI - 1.15, rx: 0.085, ry: 0.09, rz: 0.085, yCenter: 0.095, name: 'side_right_lobe' },
    { angle: Math.PI + 1.15, rx: 0.085, ry: 0.09, rz: 0.085, yCenter: 0.095, name: 'side_left_lobe' },
    // Front-side transition lobes
    { angle: 1.35, rx: 0.08, ry: 0.068, rz: 0.08, yCenter: 0.072, name: 'front_right_corner_lobe' },
    { angle: -1.35, rx: 0.08, ry: 0.068, rz: 0.08, yCenter: 0.072, name: 'front_left_corner_lobe' },
    // Low front lip lobes (+Z)
    { angle: 0.72, rx: 0.085, ry: 0.056, rz: 0.075, yCenter: 0.06, name: 'front_right_lobe' },
    { angle: -0.72, rx: 0.085, ry: 0.056, rz: 0.075, yCenter: 0.06, name: 'front_left_lobe' },
    { angle: 0.22, rx: 0.08, ry: 0.052, rz: 0.072, yCenter: 0.056, name: 'front_center_right_lobe' },
    { angle: -0.22, rx: 0.08, ry: 0.052, rz: 0.072, yCenter: 0.056, name: 'front_center_left_lobe' },
  ];

  const ringRadiusX = W * 0.36;
  const ringRadiusZ = D * 0.35;
  const lobeGeo = new THREE.SphereGeometry(1, 20, 14);
  const pipingPoints = [];

  for (let i = 0; i < lobes.length; i++) {
    const lobe = lobes[i];
    const x = Math.sin(lobe.angle) * ringRadiusX;
    const z = Math.cos(lobe.angle) * ringRadiusZ;

    const mesh = new THREE.Mesh(lobeGeo, creamSherpaMat);
    mesh.scale.set(lobe.rx, lobe.ry, lobe.rz);
    mesh.position.set(x, lobe.yCenter, z);
    mesh.rotation.y = lobe.angle;
    mesh.name = lobe.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Collect top ridge point for piping
    pipingPoints.push(new THREE.Vector3(x, lobe.yCenter + lobe.ry * 0.92, z));
  }

  // Sort piping points by angle around Y so the closed curve is smooth
  pipingPoints.sort((a, b) => Math.atan2(a.x, a.z) - Math.atan2(b.x, b.z));

  // 4. Piping along the top cloud ridge
  const pipingCurve = new THREE.CatmullRomCurve3(pipingPoints, true, 'catmullrom', 0.5);
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, 0.007, 8, true);
  const pipingMesh = new THREE.Mesh(pipingGeo, pipingMat);
  pipingMesh.name = 'cloud_rim_piping';
  pipingMesh.castShadow = true;
  pipingMesh.receiveShadow = true;
  group.add(pipingMesh);

  return group;
}
