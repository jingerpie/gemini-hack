function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BED_W = 0.76;
  const BED_D = 0.72;
  const BED_H = 0.20;
  const BASE_H = 0.015;
  const BOLSTER_R = 0.275;
  const BOLSTER_TUBE_R = 0.095;
  const CUSHION_R = 0.23;
  const CUSHION_H = 0.12;
  const SEGMENT_COUNT = 16;

  // Materials
  const marigoldPlush = new THREE.MeshStandardMaterial({
    color: 0xe3af42,
    roughness: 0.92,
    metalness: 0.0,
  });

  const marigoldSeam = new THREE.MeshStandardMaterial({
    color: 0xd19b2e,
    roughness: 0.95,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.85,
    metalness: 0.05,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Non-slip dark base
  const baseGeo = new THREE.CylinderGeometry(BED_W * 0.45, BED_W * 0.46, BASE_H, 32);
  const baseMesh = addMesh(baseGeo, baseMat, 'non_slip_base');
  baseMesh.scale.set(1, 1, BED_D / BED_W);
  baseMesh.position.set(0, BASE_H * 0.5, 0);

  // 2. Inner floor pad
  const floorGeo = new THREE.CylinderGeometry(CUSHION_R + 0.04, CUSHION_R + 0.04, 0.03, 28);
  const floorMesh = addMesh(floorGeo, marigoldSeam, 'inner_floor_pad');
  floorMesh.position.set(0, BASE_H + 0.015, 0);

  // 3. Plump center cushion
  const cushionGeo = new THREE.SphereGeometry(CUSHION_R, 28, 18);
  const cushionMesh = addMesh(cushionGeo, marigoldPlush, 'center_cushion');
  cushionMesh.scale.set(1.0, (CUSHION_H * 0.55) / CUSHION_R, 0.96);
  cushionMesh.position.set(0, BASE_H + CUSHION_H * 0.48, 0);

  // 4. Outer bolster segments (puffy gathered ring)
  const segGeo = new THREE.SphereGeometry(BOLSTER_TUBE_R, 20, 16);
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const angle = (i / SEGMENT_COUNT) * Math.PI * 2;
    // Front (+Z) is around angle = Math.PI / 2
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Slightly lower and flatter at the front (+Z)
    const isFront = sinA > 0.55;
    const heightScale = isFront ? 0.86 : 1.02;
    const radialScale = isFront ? 0.92 : 1.04;

    const seg = addMesh(segGeo, marigoldPlush, `bolster_segment_${i + 1}`);
    seg.scale.set(radialScale, heightScale, 1.08);
    seg.rotation.y = -angle;

    const rx = BOLSTER_R * (BED_W / BED_D) * 0.98;
    const rz = BOLSTER_R * 0.96;
    const yPos = BASE_H + BOLSTER_TUBE_R * heightScale * 0.92;

    seg.position.set(cosA * rx, yPos, sinA * rz);
  }

  // 5. Front bolster panel (slightly flatter front lip as seen in photo)
  const frontPanelGeo = new THREE.CapsuleGeometry(0.068, 0.24, 10, 18);
  const frontPanel = addMesh(frontPanelGeo, marigoldPlush, 'front_bolster_panel');
  frontPanel.rotation.z = Math.PI / 2;
  frontPanel.scale.set(1.05, 1.0, 0.88);
  frontPanel.position.set(0, BASE_H + 0.068, BOLSTER_R * 0.98);

  // 6. Front vertical pleat/seam details
  const pleatGeo = new THREE.CapsuleGeometry(0.016, 0.08, 6, 12);
  const pleatLeft = addMesh(pleatGeo, marigoldSeam, 'front_pleat_left');
  pleatLeft.position.set(-0.15, BASE_H + 0.072, BOLSTER_R * 0.99);
  pleatLeft.rotation.x = 0.15;

  const pleatRight = addMesh(pleatGeo, marigoldSeam, 'front_pleat_right');
  pleatRight.position.set(0.15, BASE_H + 0.072, BOLSTER_R * 0.99);
  pleatRight.rotation.x = 0.15;

  return group;
}
