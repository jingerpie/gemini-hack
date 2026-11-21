function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.10;
  const D = 0.88;
  const H = 0.76;
  const LEG_H = 0.16;
  const BASE_H = 0.10;
  const CUSHION_H = 0.13;
  const SEAT_H = LEG_H + BASE_H + CUSHION_H; // 0.39m
  const ARM_H = 0.56;
  const ARM_THICK = 0.15;
  const BACK_THICK = 0.18;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8c7f73,
    roughness: 0.88,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x323234,
    roughness: 0.35,
    metalness: 0.8
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Four slim splayed tapered dark metal legs + floor glides
  const legRadiusTop = 0.013;
  const legRadiusBot = 0.008;
  const glideH = 0.006;
  const legTilt = 10 * (Math.PI / 180); // ~10 degrees outward splay
  const legLen = (LEG_H + 0.02) / Math.cos(legTilt);
  const legGeo = new THREE.CylinderGeometry(legRadiusTop, legRadiusBot, legLen, 16);
  const glideGeo = new THREE.CylinderGeometry(legRadiusBot * 1.15, legRadiusBot * 1.25, glideH, 16);

  const insetX = W * 0.5 - 0.14;
  const insetZ = D * 0.5 - 0.11;
  const legPositions = [
    { name: 'front_left',  x: -insetX, z:  insetZ, rx: -legTilt, rz: -legTilt },
    { name: 'front_right', x:  insetX, z:  insetZ, rx: -legTilt, rz:  legTilt },
    { name: 'back_left',   x: -insetX + 0.04, z: -insetZ, rx:  legTilt, rz: -legTilt },
    { name: 'back_right',  x:  insetX - 0.04, z: -insetZ, rx:  legTilt, rz:  legTilt }
  ];

  legPositions.forEach((lp) => {
    const leg = addMesh(legGeo, metalMat, `leg_${lp.name}`);
    leg.position.set(lp.x, LEG_H * 0.5 + 0.005, lp.z);
    leg.rotation.set(lp.rx, 0, lp.rz);

    const glide = addMesh(glideGeo, metalMat, `leg_glide_${lp.name}`);
    glide.position.set(
      lp.x + Math.sin(lp.rz) * (LEG_H * 0.5),
      glideH * 0.5,
      lp.z - Math.sin(lp.rx) * (LEG_H * 0.5)
    );
  });

  // 2. Upholstered base / apron (starts at y = LEG_H)
  const baseW = W - 0.04;
  const baseD = D - 0.06;
  const baseR = 0.08;
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-baseW / 2 + baseR, -baseD / 2);
  baseShape.lineTo(baseW / 2 - baseR, -baseD / 2);
  baseShape.quadraticCurveTo(baseW / 2, -baseD / 2, baseW / 2, -baseD / 2 + baseR);
  baseShape.lineTo(baseW / 2, baseD / 2 - baseR);
  baseShape.quadraticCurveTo(baseW / 2, baseD / 2, baseW / 2 - baseR, baseD / 2);
  baseShape.lineTo(-baseW / 2 + baseR, baseD / 2);
  baseShape.quadraticCurveTo(-baseW / 2, baseD / 2, -baseW / 2, baseD / 2 - baseR);
  baseShape.lineTo(-baseW / 2, -baseD / 2 + baseR);
  baseShape.quadraticCurveTo(-baseW / 2, -baseD / 2, -baseW / 2 + baseR, -baseD / 2);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 0.02,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 4
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = addMesh(baseGeo, fabricMat, 'sofa_base_apron');
  baseMesh.position.set(0, LEG_H + BASE_H - 0.01, 0);

  // 3. Single bench seat cushion with slightly rounded front edge
  const cushW = W - ARM_THICK * 2 + 0.02;
  const cushD = D - BACK_THICK - 0.02;
  const cushR = 0.08;
  const cushShape = new THREE.Shape();
  cushShape.moveTo(-cushW / 2 + cushR, -cushD / 2);
  cushShape.lineTo(cushW / 2 - cushR, -cushD / 2);
  cushShape.quadraticCurveTo(cushW / 2, -cushD / 2, cushW / 2, -cushD / 2 + cushR);
  cushShape.lineTo(cushW / 2, cushD / 2 - cushR);
  cushShape.quadraticCurveTo(cushW / 2, cushD / 2, cushW / 2 - cushR, cushD / 2);
  cushShape.lineTo(-cushW / 2 + cushR, cushD / 2);
  cushShape.quadraticCurveTo(-cushW / 2, cushD / 2, -cushW / 2, cushD / 2 - cushR);
  cushShape.lineTo(-cushW / 2, -cushD / 2 + cushR);
  cushShape.quadraticCurveTo(-cushW / 2, -cushD / 2, -cushW / 2 + cushR, -cushD / 2);

  const cushGeo = new THREE.ExtrudeGeometry(cushShape, {
    depth: CUSHION_H - 0.04,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 5
  });
  cushGeo.rotateX(Math.PI / 2);
  const cushMesh = addMesh(cushGeo, fabricMat, 'seat_cushion');
  cushMesh.position.set(0, SEAT_H - 0.02, BACK_THICK * 0.45);

  // 4. Thick, rounded upholstered tub backrest (LatheGeometry arc)
  const backPts = [
    new THREE.Vector2(0.70, LEG_H + 0.01),
    new THREE.Vector2(0.96, LEG_H + 0.03),
    new THREE.Vector2(1.00, LEG_H + 0.16),
    new THREE.Vector2(0.98, H - 0.14),
    new THREE.Vector2(0.92, H - 0.04),
    new THREE.Vector2(0.84, H - 0.02),
    new THREE.Vector2(0.74, H - 0.05),
    new THREE.Vector2(0.66, LEG_H + 0.08),
    new THREE.Vector2(0.70, LEG_H + 0.01)
  ];
  const backGeo = new THREE.LatheGeometry(
    backPts,
    32,
    Math.PI * 0.58,
    Math.PI * 0.84
  );
  const backMesh = addMesh(backGeo, fabricMat, 'curved_backrest');
  backMesh.scale.set(W * 0.49, 1.0, D * 0.48);
  backMesh.position.set(0, 0, -0.02);

  // 5. Continuous rounded top rim curving smoothly from center back into both arms
  const rimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.455, ARM_H - 0.05, D * 0.34),
    new THREE.Vector3(-W * 0.46,  ARM_H + 0.03, D * 0.06),
    new THREE.Vector3(-W * 0.36,  H - 0.08,     -D * 0.28),
    new THREE.Vector3( 0,         H - 0.055,    -D * 0.39),
    new THREE.Vector3( W * 0.36,  H - 0.08,     -D * 0.28),
    new THREE.Vector3( W * 0.46,  ARM_H + 0.03, D * 0.06),
    new THREE.Vector3( W * 0.455, ARM_H - 0.05, D * 0.34)
  ]);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 32, 0.072, 16, false);
  addMesh(rimGeo, fabricMat, 'tub_top_rim');

  // 6. Low, rounded Left and Right Armrests blending into the back
  const armLen = D * 0.72;
  const armShape = new THREE.Shape();
  armShape.moveTo(-armLen * 0.5, LEG_H + 0.02);
  armShape.lineTo(armLen * 0.40, LEG_H + 0.02);
  armShape.quadraticCurveTo(armLen * 0.50, LEG_H + 0.02, armLen * 0.50, LEG_H + 0.12);
  armShape.lineTo(armLen * 0.48, ARM_H - 0.08);
  armShape.quadraticCurveTo(armLen * 0.44, ARM_H, armLen * 0.28, ARM_H);
  armShape.quadraticCurveTo(0, ARM_H + 0.04, -armLen * 0.42, H - 0.14);
  armShape.quadraticCurveTo(-armLen * 0.50, H - 0.16, -armLen * 0.50, H - 0.24);
  armShape.closePath();

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_THICK - 0.07,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 5
  });
  armGeo.rotateY(Math.PI / 2);

  const leftArm = addMesh(armGeo, fabricMat, 'armrest_left');
  leftArm.position.set(-W / 2 + 0.04, 0, D * 0.06);

  const rightArm = addMesh(armGeo, fabricMat, 'armrest_right');
  rightArm.position.set(W / 2 - ARM_THICK + 0.03, 0, D * 0.06);

  return group;
}
