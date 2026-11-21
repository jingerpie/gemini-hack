function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const CARAFE_H = 0.132;
  const CARAFE_BASE_R = 0.036;
  const CARAFE_MAX_R = 0.062;
  const CARAFE_NECK_R = 0.044;
  const WALL_T = 0.004;

  const DRIPPER_FLANGE_R = 0.056;
  const DRIPPER_FLANGE_H = 0.010;
  const DRIPPER_NECK_R = 0.024;
  const DRIPPER_TOP_R = 0.063;
  const DRIPPER_H = 0.084;
  const TOTAL_H = CARAFE_H + DRIPPER_H;

  const RADIAL_SEGS = 32;

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb6673e,
    roughness: 0.86,
    metalness: 0.02
  });

  const terracottaDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9e5430,
    roughness: 0.9,
    metalness: 0.02
  });

  function setupMesh(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Carafe body (LatheGeometry with outer and inner profile)
  const carafePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(CARAFE_BASE_R, 0.0),
    new THREE.Vector2(CARAFE_BASE_R + 0.010, 0.008),
    new THREE.Vector2(CARAFE_MAX_R - 0.003, 0.022),
    new THREE.Vector2(CARAFE_MAX_R, 0.038),
    new THREE.Vector2(CARAFE_MAX_R - 0.004, 0.058),
    new THREE.Vector2(0.052, 0.088),
    new THREE.Vector2(CARAFE_NECK_R + 0.002, 0.115),
    new THREE.Vector2(CARAFE_NECK_R, CARAFE_H - 0.004),
    new THREE.Vector2(CARAFE_NECK_R + 0.001, CARAFE_H),
    new THREE.Vector2(CARAFE_NECK_R - WALL_T, CARAFE_H),
    new THREE.Vector2(CARAFE_NECK_R - WALL_T, CARAFE_H - 0.015),
    new THREE.Vector2(CARAFE_MAX_R - WALL_T - 0.005, 0.038),
    new THREE.Vector2(CARAFE_BASE_R - WALL_T, 0.008),
    new THREE.Vector2(0.0, 0.008)
  ];
  const carafeGeo = new THREE.LatheGeometry(carafePts, RADIAL_SEGS);
  const carafeMesh = setupMesh(new THREE.Mesh(carafeGeo, terracottaMat), 'carafe_body');
  group.add(carafeMesh);

  // 2. Carafe subtle foot ring
  const footGeo = new THREE.TorusGeometry(CARAFE_BASE_R - 0.002, 0.0025, 10, RADIAL_SEGS);
  footGeo.rotateX(Math.PI / 2);
  const footMesh = setupMesh(new THREE.Mesh(footGeo, terracottaDarkMat), 'carafe_foot_ring');
  footMesh.position.y = 0.0025;
  group.add(footMesh);

  // 3. Carafe pouring spout (on -X side)
  const spoutGeo = new THREE.ConeGeometry(0.011, 0.022, 16);
  spoutGeo.rotateZ(Math.PI * 0.36);
  const spoutMesh = setupMesh(new THREE.Mesh(spoutGeo, terracottaMat), 'carafe_spout');
  spoutMesh.position.set(-CARAFE_NECK_R - 0.006, CARAFE_H - 0.010, 0);
  spoutMesh.scale.set(1.0, 0.75, 0.85);
  group.add(spoutMesh);

  // 4. Spout lip
  const spoutLipGeo = new THREE.SphereGeometry(0.0045, 12, 10);
  const spoutLipMesh = setupMesh(new THREE.Mesh(spoutLipGeo, terracottaMat), 'carafe_spout_lip');
  spoutLipMesh.position.set(-CARAFE_NECK_R - 0.013, CARAFE_H - 0.006, 0);
  spoutLipMesh.scale.set(1.1, 0.7, 1.2);
  group.add(spoutLipMesh);

  // 5. Dripper bottom collar (sits slightly inside carafe neck)
  const collarGeo = new THREE.CylinderGeometry(CARAFE_NECK_R - WALL_T - 0.001, CARAFE_NECK_R - WALL_T - 0.003, 0.010, RADIAL_SEGS);
  const collarMesh = setupMesh(new THREE.Mesh(collarGeo, terracottaDarkMat), 'dripper_bottom_collar');
  collarMesh.position.y = CARAFE_H - 0.003;
  group.add(collarMesh);

  // 6. Dripper flange (wide flat disc resting on carafe rim)
  const flangePts = [
    new THREE.Vector2(0.012, 0.0),
    new THREE.Vector2(DRIPPER_FLANGE_R - 0.004, 0.0),
    new THREE.Vector2(DRIPPER_FLANGE_R, DRIPPER_FLANGE_H * 0.35),
    new THREE.Vector2(DRIPPER_FLANGE_R, DRIPPER_FLANGE_H * 0.7),
    new THREE.Vector2(DRIPPER_FLANGE_R - 0.004, DRIPPER_FLANGE_H),
    new THREE.Vector2(DRIPPER_NECK_R + 0.004, DRIPPER_FLANGE_H),
    new THREE.Vector2(DRIPPER_NECK_R, DRIPPER_FLANGE_H + 0.003),
    new THREE.Vector2(0.012, DRIPPER_FLANGE_H + 0.003)
  ];
  const flangeGeo = new THREE.LatheGeometry(flangePts, RADIAL_SEGS);
  const flangeMesh = setupMesh(new THREE.Mesh(flangeGeo, terracottaMat), 'dripper_flange');
  flangeMesh.position.y = CARAFE_H - 0.001;
  group.add(flangeMesh);

  // 7. Dripper conical funnel (LatheGeometry with inner and outer wall)
  const coneBaseY = CARAFE_H + DRIPPER_FLANGE_H - 0.002;
  const coneH = TOTAL_H - coneBaseY;
  const dripperPts = [
    new THREE.Vector2(0.011, 0.0),
    new THREE.Vector2(DRIPPER_NECK_R, 0.0),
    new THREE.Vector2(DRIPPER_NECK_R + 0.004, 0.008),
    new THREE.Vector2(DRIPPER_TOP_R - 0.002, coneH - 0.005),
    new THREE.Vector2(DRIPPER_TOP_R, coneH - 0.001),
    new THREE.Vector2(DRIPPER_TOP_R - 0.002, coneH),
    new THREE.Vector2(DRIPPER_TOP_R - WALL_T, coneH),
    new THREE.Vector2(DRIPPER_NECK_R - WALL_T + 0.002, 0.005),
    new THREE.Vector2(0.011, 0.005)
  ];
  const dripperGeo = new THREE.LatheGeometry(dripperPts, RADIAL_SEGS);
  const dripperMesh = setupMesh(new THREE.Mesh(dripperGeo, terracottaMat), 'dripper_cone');
  dripperMesh.position.y = coneBaseY;
  group.add(dripperMesh);

  // 8-15. Internal pour-over ribs (8 vertical/angled ribs inside the cone)
  const ribCount = 8;
  const ribGeo = new THREE.CapsuleGeometry(0.0016, coneH * 0.72, 4, 8);
  const coneAngle = Math.atan2(DRIPPER_TOP_R - DRIPPER_NECK_R, coneH);

  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const midR = (DRIPPER_NECK_R + DRIPPER_TOP_R) * 0.5 - WALL_T - 0.001;
    const rib = setupMesh(new THREE.Mesh(ribGeo, terracottaDarkMat), `dripper_rib_${i + 1}`);
    rib.position.set(
      Math.cos(angle) * midR,
      coneBaseY + coneH * 0.5,
      Math.sin(angle) * midR
    );
    rib.rotation.order = 'YXZ';
    rib.rotation.y = -angle + Math.PI / 2;
    rib.rotation.x = coneAngle;
    group.add(rib);
  }

  return group;
}
