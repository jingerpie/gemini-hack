function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.22;
  const BASE_R = 0.032;
  const BELLY_R = 0.048;
  const BELLY_Y = 0.055;
  const NECK_R = 0.021;
  const NECK_Y = 0.135;
  const RIM_R = 0.032;
  const WALL_T = 0.003;
  const BASE_T = 0.012;

  // Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x6e3d12,
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: 0.75,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide
  });

  const twineMat = new THREE.MeshStandardMaterial({
    color: 0xd8cbb8,
    roughness: 0.9,
    metalness: 0.0
  });

  const tagMat = new THREE.MeshStandardMaterial({
    color: 0xb89f7d,
    roughness: 0.85,
    metalness: 0.0
  });

  const eyeletMat = new THREE.MeshStandardMaterial({
    color: 0x7c6448,
    roughness: 0.75,
    metalness: 0.1
  });

  // 1. Glass Vase Body (LatheGeometry with outer and inner wall)
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(BASE_R * 0.85, 0.0),
    new THREE.Vector2(BASE_R, 0.004),
    new THREE.Vector2(BASE_R + 0.009, 0.018),
    new THREE.Vector2(BELLY_R, BELLY_Y),
    new THREE.Vector2(BELLY_R * 0.92, 0.082),
    new THREE.Vector2(NECK_R * 1.25, 0.112),
    new THREE.Vector2(NECK_R, NECK_Y),
    new THREE.Vector2(NECK_R * 1.12, 0.165),
    new THREE.Vector2(RIM_R * 0.92, 0.205),
    new THREE.Vector2(RIM_R, H - 0.003),
    new THREE.Vector2(RIM_R - WALL_T * 0.4, H),
    new THREE.Vector2(RIM_R - WALL_T, H - 0.003),
    new THREE.Vector2(RIM_R * 0.92 - WALL_T, 0.205),
    new THREE.Vector2(NECK_R * 1.12 - WALL_T, 0.165),
    new THREE.Vector2(NECK_R - WALL_T, NECK_Y),
    new THREE.Vector2(NECK_R * 1.25 - WALL_T, 0.112),
    new THREE.Vector2(BELLY_R * 0.92 - WALL_T, 0.082),
    new THREE.Vector2(BELLY_R - WALL_T, BELLY_Y),
    new THREE.Vector2(BASE_R + 0.006 - WALL_T, 0.022),
    new THREE.Vector2(BASE_R * 0.75, BASE_T),
    new THREE.Vector2(0.0, BASE_T)
  ];

  const vaseGeo = new THREE.LatheGeometry(profile, 32);
  const vaseMesh = new THREE.Mesh(vaseGeo, glassMat);
  vaseMesh.name = 'glass_vase_body';
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // 2. Twine wrap around pinched neck
  const twineGeo = new THREE.TorusGeometry(NECK_R + 0.0012, 0.0012, 8, 28);
  twineGeo.rotateX(Math.PI / 2);
  const twineMesh = new THREE.Mesh(twineGeo, twineMat);
  twineMesh.position.y = NECK_Y;
  twineMesh.name = 'neck_twine_wrap';
  twineMesh.castShadow = true;
  twineMesh.receiveShadow = true;
  group.add(twineMesh);

  // Twine loose ends on the left (-X)
  const endCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-(NECK_R + 0.001), NECK_Y, 0.002),
    new THREE.Vector3(-(NECK_R + 0.008), NECK_Y - 0.006, 0.004),
    new THREE.Vector3(-(NECK_R + 0.013), NECK_Y - 0.015, 0.005)
  ]);
  const endGeo1 = new THREE.TubeGeometry(endCurve1, 8, 0.0009, 6, false);
  const endMesh1 = new THREE.Mesh(endGeo1, twineMat);
  endMesh1.name = 'twine_loose_end_left';
  endMesh1.castShadow = true;
  endMesh1.receiveShadow = true;
  group.add(endMesh1);

  const endCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-(NECK_R + 0.001), NECK_Y, -0.001),
    new THREE.Vector3(-(NECK_R + 0.006), NECK_Y - 0.009, -0.003),
    new THREE.Vector3(-(NECK_R + 0.011), NECK_Y - 0.018, -0.004)
  ]);
  const endGeo2 = new THREE.TubeGeometry(endCurve2, 8, 0.0009, 6, false);
  const endMesh2 = new THREE.Mesh(endGeo2, twineMat);
  endMesh2.name = 'twine_loose_end_right';
  endMesh2.castShadow = true;
  endMesh2.receiveShadow = true;
  group.add(endMesh2);

  // 3. Kraft Paper Hang Tag on the right (+X, slightly +Z)
  const TAG_W = 0.022;
  const TAG_H = 0.056;
  const TAG_T = 0.0008;
  const CHAMFER = 0.006;

  const tagShape = new THREE.Shape();
  tagShape.moveTo(-TAG_W / 2, 0);
  tagShape.lineTo(TAG_W / 2, 0);
  tagShape.lineTo(TAG_W / 2, TAG_H - CHAMFER);
  tagShape.lineTo(TAG_W / 2 - CHAMFER, TAG_H);
  tagShape.lineTo(-TAG_W / 2 + CHAMFER, TAG_H);
  tagShape.lineTo(-TAG_W / 2, TAG_H - CHAMFER);
  tagShape.closePath();

  const tagGeo = new THREE.ExtrudeGeometry(tagShape, {
    depth: TAG_T,
    bevelEnabled: false
  });
  tagGeo.translate(0, -TAG_H, -TAG_T / 2);

  const tagGroup = new THREE.Group();
  tagGroup.position.set(NECK_R + 0.006, NECK_Y - 0.006, 0.014);
  tagGroup.rotation.z = 0.28;
  tagGroup.rotation.y = -0.35;

  const tagMesh = new THREE.Mesh(tagGeo, tagMat);
  tagMesh.name = 'kraft_hang_tag';
  tagMesh.castShadow = true;
  tagMesh.receiveShadow = true;
  tagGroup.add(tagMesh);

  // Eyelet on tag
  const eyeletGeo = new THREE.TorusGeometry(0.0024, 0.0008, 8, 16);
  const eyeletMesh = new THREE.Mesh(eyeletGeo, eyeletMat);
  eyeletMesh.position.set(0, -0.007, TAG_T / 2 + 0.0002);
  eyeletMesh.name = 'tag_eyelet';
  eyeletMesh.castShadow = true;
  eyeletMesh.receiveShadow = true;
  tagGroup.add(eyeletMesh);

  group.add(tagGroup);

  // Connecting twine loop from neck to tag
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(NECK_R + 0.001, NECK_Y, 0.005),
    new THREE.Vector3(NECK_R + 0.005, NECK_Y - 0.004, 0.010),
    new THREE.Vector3(NECK_R + 0.007, NECK_Y - 0.012, 0.014)
  ]);
  const loopGeo = new THREE.TubeGeometry(loopCurve, 8, 0.0009, 6, false);
  const loopMesh = new THREE.Mesh(loopGeo, twineMat);
  loopMesh.name = 'tag_hanging_twine';
  loopMesh.castShadow = true;
  loopMesh.receiveShadow = true;
  group.add(loopMesh);

  return group;
}
