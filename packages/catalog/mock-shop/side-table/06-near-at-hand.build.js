function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const D = 0.40;
  const H = 0.48;

  const RIM_R = 0.009;
  const RIM_Y = H - RIM_R;
  const CORNER_R = 0.032;
  const RIM_SPAN_X = W - 2 * RIM_R - 2 * CORNER_R;
  const RIM_SPAN_Z = D - 2 * RIM_R - 2 * CORNER_R;
  const RIM_OFFSET_X = W / 2 - RIM_R;
  const RIM_OFFSET_Z = D / 2 - RIM_R;

  const PLATE_T = 0.006;
  const PLATE_HALF_W = W / 2 - 2 * RIM_R - 0.002;
  const PLATE_HALF_D = D / 2 - 2 * RIM_R - 0.002;
  const PLATE_CORNER_R = CORNER_R - RIM_R - 0.002;
  const PLATE_Y = RIM_Y - PLATE_T / 2;

  const LEG_R = 0.008;
  const LEG_TOP_Y = RIM_Y - 0.002;
  const LEG_BOT_Y = LEG_R;
  const LEG_TOP_XZ = 0.145;
  const LEG_BOT_XZ = 0.178;

  const STR_R = 0.007;
  const STR_Y = 0.125;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x383c3a,
    roughness: 0.62,
    metalness: 0.35
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x3b3f3d,
    roughness: 0.72,
    metalness: 0.25
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tabletop plate (rounded square)
  const plateShape = new THREE.Shape();
  const pw = PLATE_HALF_W;
  const pd = PLATE_HALF_D;
  const pr = PLATE_CORNER_R;
  plateShape.moveTo(-pw + pr, -pd);
  plateShape.lineTo(pw - pr, -pd);
  plateShape.quadraticCurveTo(pw, -pd, pw, -pd + pr);
  plateShape.lineTo(pw, pd - pr);
  plateShape.quadraticCurveTo(pw, pd, pw - pr, pd);
  plateShape.lineTo(-pw + pr, pd);
  plateShape.quadraticCurveTo(-pw, pd, -pw, pd - pr);
  plateShape.lineTo(-pw, -pd + pr);
  plateShape.quadraticCurveTo(-pw, -pd, -pw + pr, -pd);

  const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
    depth: PLATE_T,
    bevelEnabled: false,
    curveSegments: 12
  });
  plateGeo.rotateX(Math.PI / 2);
  const plateMesh = addMesh(plateGeo, plateMat, 'tabletop_plate');
  plateMesh.position.y = PLATE_Y + PLATE_T / 2;

  // Tabletop tubular rim: 4 straight segments
  const rimGeoX = new THREE.CylinderGeometry(RIM_R, RIM_R, RIM_SPAN_X, 16);
  const rimFront = addMesh(rimGeoX, frameMat, 'rim_front');
  rimFront.rotation.z = Math.PI / 2;
  rimFront.position.set(0, RIM_Y, RIM_OFFSET_Z);

  const rimBack = addMesh(rimGeoX, frameMat, 'rim_back');
  rimBack.rotation.z = Math.PI / 2;
  rimBack.position.set(0, RIM_Y, -RIM_OFFSET_Z);

  const rimGeoZ = new THREE.CylinderGeometry(RIM_R, RIM_R, RIM_SPAN_Z, 16);
  const rimRight = addMesh(rimGeoZ, frameMat, 'rim_right');
  rimRight.rotation.x = Math.PI / 2;
  rimRight.position.set(RIM_OFFSET_X, RIM_Y, 0);

  const rimLeft = addMesh(rimGeoZ, frameMat, 'rim_left');
  rimLeft.rotation.x = Math.PI / 2;
  rimLeft.position.set(-RIM_OFFSET_X, RIM_Y, 0);

  // Tabletop tubular rim: 4 rounded corners
  const cornerGeo = new THREE.TorusGeometry(CORNER_R, RIM_R, 16, 16, Math.PI / 2);
  const cx = RIM_OFFSET_X - CORNER_R;
  const cz = RIM_OFFSET_Z - CORNER_R;
  const corners = [
    { name: 'rim_corner_fr', x: cx, z: cz, rotY: 0 },
    { name: 'rim_corner_fl', x: -cx, z: cz, rotY: -Math.PI / 2 },
    { name: 'rim_corner_bl', x: -cx, z: -cz, rotY: Math.PI },
    { name: 'rim_corner_br', x: cx, z: -cz, rotY: Math.PI / 2 }
  ];
  for (const c of corners) {
    const cm = addMesh(cornerGeo, frameMat, c.name);
    cm.rotation.x = Math.PI / 2;
    cm.rotation.z = -c.rotY;
    cm.position.set(c.x, RIM_Y, c.z);
  }

  // 4 splayed legs + rounded foot caps
  const legSpecs = [
    { name: 'leg_front_right', sx: 1, sz: 1 },
    { name: 'leg_front_left', sx: -1, sz: 1 },
    { name: 'leg_back_left', sx: -1, sz: -1 },
    { name: 'leg_back_right', sx: 1, sz: -1 }
  ];
  const upVec = new THREE.Vector3(0, 1, 0);
  const footGeo = new THREE.SphereGeometry(LEG_R, 16, 12);

  for (const l of legSpecs) {
    const topPos = new THREE.Vector3(l.sx * LEG_TOP_XZ, LEG_TOP_Y, l.sz * LEG_TOP_XZ);
    const botPos = new THREE.Vector3(l.sx * LEG_BOT_XZ, LEG_BOT_Y, l.sz * LEG_BOT_XZ);
    const dir = new THREE.Vector3().subVectors(botPos, topPos);
    const len = dir.length();

    const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R, len, 16);
    const legMesh = addMesh(legGeo, frameMat, l.name);
    legMesh.position.copy(topPos).addScaledVector(dir, 0.5);
    legMesh.quaternion.setFromUnitVectors(upVec, dir.normalize());

    const footMesh = addMesh(footGeo, frameMat, `${l.name}_foot`);
    footMesh.position.copy(botPos);
  }

  // H-shaped lower stretcher
  const tStr = (STR_Y - LEG_BOT_Y) / (LEG_TOP_Y - LEG_BOT_Y);
  const strXZ = LEG_BOT_XZ + tStr * (LEG_TOP_XZ - LEG_BOT_XZ);

  const sideStrGeo = new THREE.CylinderGeometry(STR_R, STR_R, strXZ * 2, 14);
  const strRight = addMesh(sideStrGeo, frameMat, 'stretcher_right');
  strRight.rotation.x = Math.PI / 2;
  strRight.position.set(strXZ, STR_Y, 0);

  const strLeft = addMesh(sideStrGeo, frameMat, 'stretcher_left');
  strLeft.rotation.x = Math.PI / 2;
  strLeft.position.set(-strXZ, STR_Y, 0);

  const centerStrGeo = new THREE.CylinderGeometry(STR_R, STR_R, strXZ * 2, 14);
  const strCenter = addMesh(centerStrGeo, frameMat, 'stretcher_center');
  strCenter.rotation.z = Math.PI / 2;
  strCenter.position.set(0, STR_Y, 0);

  return group;
}
