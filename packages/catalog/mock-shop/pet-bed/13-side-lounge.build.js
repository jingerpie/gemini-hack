function build(THREE) {
  const group = new THREE.Group();

  const W = 1.05;
  const D = 0.70;
  const H = 0.35;
  const FOOT_H = 0.015;
  const BASE_H = 0.10;
  const WALL_T = 0.09;
  const CUSHION_H = 0.085;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x8a8b8d,
    roughness: 0.88,
    metalness: 0.02,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0x7a7b7d,
    roughness: 0.9,
    metalness: 0.02,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.6,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed dark feet (y = 0 to FOOT_H)
  const footGeo = new THREE.CylinderGeometry(0.022, 0.02, FOOT_H, 16);
  const footInsetX = W / 2 - 0.06;
  const footInsetZ = D / 2 - 0.06;
  addMesh(footGeo, footMat, 'foot_front_left', -footInsetX, FOOT_H / 2, footInsetZ);
  addMesh(footGeo, footMat, 'foot_front_right', footInsetX, FOOT_H / 2, footInsetZ);
  addMesh(footGeo, footMat, 'foot_back_left', -footInsetX, FOOT_H / 2, -footInsetZ);
  addMesh(footGeo, footMat, 'foot_back_right', footInsetX, FOOT_H / 2, -footInsetZ);

  // 2. Upholstered base platform (y = FOOT_H to FOOT_H + BASE_H)
  const baseBevel = 0.015;
  const baseW = W - baseBevel * 2;
  const baseD = D - baseBevel * 2;
  const baseR = 0.03;

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
    depth: BASE_H - baseBevel * 2,
    bevelEnabled: true,
    bevelThickness: baseBevel,
    bevelSize: baseBevel,
    bevelSegments: 4,
    curveSegments: 8,
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, fabricMat, 'base_platform', 0, FOOT_H + baseBevel, 0);

  // 3. Backrest (-Z side, full width W)
  const wallBevel = 0.014;
  const backH = H - (FOOT_H + BASE_H * 0.6);
  const backLen = W - wallBevel * 2;
  const wallCoreT = WALL_T - wallBevel * 2;

  const backProfile = new THREE.Shape();
  backProfile.moveTo(-wallCoreT / 2, 0);
  backProfile.lineTo(wallCoreT / 2, 0);
  backProfile.lineTo(wallCoreT / 2 - 0.01, backH - wallBevel * 2);
  backProfile.lineTo(-wallCoreT / 2 + 0.005, backH - wallBevel * 2);
  backProfile.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backProfile, {
    depth: backLen,
    bevelEnabled: true,
    bevelThickness: wallBevel,
    bevelSize: wallBevel,
    bevelSegments: 4,
  });
  backGeo.rotateY(Math.PI / 2);
  backGeo.translate(-backLen / 2, FOOT_H + BASE_H * 0.6 + wallBevel, -D / 2 + WALL_T / 2);
  addMesh(backGeo, fabricMat, 'backrest', 0, 0, 0);

  // 4. Left armrest (-X side, full depth D)
  const armLen = D - wallBevel * 2;
  const armGeo = new THREE.ExtrudeGeometry(backProfile, {
    depth: armLen,
    bevelEnabled: true,
    bevelThickness: wallBevel,
    bevelSize: wallBevel,
    bevelSegments: 4,
  });
  armGeo.translate(-W / 2 + WALL_T / 2, FOOT_H + BASE_H * 0.6 + wallBevel, -armLen / 2);
  addMesh(armGeo, fabricMat, 'left_armrest', 0, 0, 0);

  // 5. Piping / pinched seams along backrest and armrest
  const pipeRadius = 0.005;

  const backTopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + WALL_T * 0.5, H - 0.005, -D / 2 + WALL_T * 0.5),
    new THREE.Vector3(0, H - 0.008, -D / 2 + WALL_T * 0.5),
    new THREE.Vector3(W / 2 - 0.015, H - 0.005, -D / 2 + WALL_T * 0.5),
  ]);
  const backTopPipeGeo = new THREE.TubeGeometry(backTopCurve, 20, pipeRadius, 8, false);
  addMesh(backTopPipeGeo, pipingMat, 'backrest_top_piping');

  const backRightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W / 2 - 0.015, H - 0.005, -D / 2 + WALL_T * 0.5),
    new THREE.Vector3(W / 2 - 0.008, H * 0.65, -D / 2 + WALL_T * 0.65),
    new THREE.Vector3(W / 2 - 0.012, FOOT_H + BASE_H, -D / 2 + WALL_T * 0.8),
  ]);
  const backRightPipeGeo = new THREE.TubeGeometry(backRightCurve, 12, pipeRadius, 8, false);
  addMesh(backRightPipeGeo, pipingMat, 'backrest_right_piping');

  const armTopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + WALL_T * 0.5, H - 0.005, -D / 2 + WALL_T * 0.5),
    new THREE.Vector3(-W / 2 + WALL_T * 0.5, H - 0.008, 0),
    new THREE.Vector3(-W / 2 + WALL_T * 0.5, H - 0.005, D / 2 - 0.015),
  ]);
  const armTopPipeGeo = new THREE.TubeGeometry(armTopCurve, 20, pipeRadius, 8, false);
  addMesh(armTopPipeGeo, pipingMat, 'armrest_top_piping');

  const armFrontCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + WALL_T * 0.5, H - 0.005, D / 2 - 0.015),
    new THREE.Vector3(-W / 2 + WALL_T * 0.65, H * 0.65, D / 2 - 0.008),
    new THREE.Vector3(-W / 2 + WALL_T * 0.8, FOOT_H + BASE_H, D / 2 - 0.012),
  ]);
  const armFrontPipeGeo = new THREE.TubeGeometry(armFrontCurve, 12, pipeRadius, 8, false);
  addMesh(armFrontPipeGeo, pipingMat, 'armrest_front_piping');

  // 6. Plush seat cushion
  const cushBevel = 0.032;
  const cushW = W - WALL_T - 0.055;
  const cushD = D - WALL_T - 0.055;
  const cushCoreW = cushW - cushBevel * 2;
  const cushCoreD = cushD - cushBevel * 2;
  const cushR = 0.025;

  const cushShape = new THREE.Shape();
  cushShape.moveTo(-cushCoreW / 2 + cushR, -cushCoreD / 2);
  cushShape.lineTo(cushCoreW / 2 - cushR, -cushCoreD / 2);
  cushShape.quadraticCurveTo(cushCoreW / 2, -cushCoreD / 2, cushCoreW / 2, -cushCoreD / 2 + cushR);
  cushShape.lineTo(cushCoreW / 2, cushCoreD / 2 - cushR);
  cushShape.quadraticCurveTo(cushCoreW / 2, cushCoreD / 2, cushCoreW / 2 - cushR, cushCoreD / 2);
  cushShape.lineTo(-cushCoreW / 2 + cushR, cushCoreD / 2);
  cushShape.quadraticCurveTo(-cushCoreW / 2, cushCoreD / 2, -cushCoreW / 2, cushCoreD / 2 - cushR);
  cushShape.lineTo(-cushCoreW / 2, -cushCoreD / 2 + cushR);
  cushShape.quadraticCurveTo(-cushCoreW / 2, -cushCoreD / 2, -cushCoreW / 2 + cushR, -cushCoreD / 2);

  const cushGeo = new THREE.ExtrudeGeometry(cushShape, {
    depth: CUSHION_H - cushBevel * 2,
    bevelEnabled: true,
    bevelThickness: cushBevel,
    bevelSize: cushBevel,
    bevelSegments: 6,
    curveSegments: 8,
  });
  cushGeo.rotateX(-Math.PI / 2);

  const cushCenterX = -W / 2 + WALL_T + cushW / 2 + 0.005;
  const cushCenterZ = -D / 2 + WALL_T + cushD / 2 + 0.005;
  const cushBaseY = FOOT_H + BASE_H + cushBevel - 0.005;
  addMesh(cushGeo, fabricMat, 'seat_cushion', cushCenterX, cushBaseY, cushCenterZ);

  // 7. Cushion perimeter seam piping
  const seamY = FOOT_H + BASE_H + CUSHION_H * 0.45;
  const seamHalfW = cushW / 2 - 0.004;
  const seamHalfD = cushD / 2 - 0.004;
  const cushSeamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cushCenterX - seamHalfW, seamY, cushCenterZ + seamHalfD),
    new THREE.Vector3(cushCenterX + seamHalfW, seamY, cushCenterZ + seamHalfD),
    new THREE.Vector3(cushCenterX + seamHalfW, seamY, cushCenterZ - seamHalfD),
    new THREE.Vector3(cushCenterX - seamHalfW, seamY, cushCenterZ - seamHalfD),
  ], true);
  const cushSeamGeo = new THREE.TubeGeometry(cushSeamCurve, 32, 0.0045, 8, true);
  addMesh(cushSeamGeo, pipingMat, 'seat_cushion_piping');

  return group;
}
