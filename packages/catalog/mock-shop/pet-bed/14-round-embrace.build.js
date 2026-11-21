function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.60;
  const OUTER_R = DIAMETER / 2;
  const BOLSTER_H = 0.17;
  const TUBE_R = BOLSTER_H / 2; // 0.085
  const TORUS_R = OUTER_R - TUBE_R; // 0.215
  const SEGMENT_COUNT = 12;

  const CUSHION_R = 0.165;
  const CUSHION_H = 0.115;
  const BASE_R = 0.23;
  const BASE_H = 0.025;

  // Materials
  const sherpaMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.94,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xe4dccb,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Base pad
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.name = 'base_pad';
  baseMesh.position.set(0, BASE_H / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Center plush cushion
  const cushionGeo = new THREE.SphereGeometry(CUSHION_R, 28, 18);
  const cushionMesh = new THREE.Mesh(cushionGeo, sherpaMat);
  cushionMesh.name = 'center_cushion';
  const cushionScaleY = (CUSHION_H / 2) / CUSHION_R;
  cushionMesh.scale.set(1, cushionScaleY, 1);
  cushionMesh.position.set(0, CUSHION_H / 2, 0);
  cushionMesh.castShadow = true;
  cushionMesh.receiveShadow = true;
  group.add(cushionMesh);

  // Segmented bolster ring
  const segGeo = new THREE.SphereGeometry(TUBE_R, 22, 16);
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const angle = (i / SEGMENT_COUNT) * Math.PI * 2;
    const segMesh = new THREE.Mesh(segGeo, sherpaMat);
    segMesh.name = `bolster_segment_${i + 1}`;
    segMesh.position.set(
      Math.cos(angle) * TORUS_R,
      TUBE_R,
      Math.sin(angle) * TORUS_R
    );
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;
    group.add(segMesh);
  }

  return group;
}
