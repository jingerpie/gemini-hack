function build(THREE) {
  const group = new THREE.Group();

  const W = 0.90;
  const H = 0.75;
  const D = 0.66;

  const TOP_THICK = 0.022;
  const LEAF_GAP = 0.002;
  const CENTER_W = 0.46;
  const LEAF_W = (W - CENTER_W - LEAF_GAP * 2) / 2;

  const LEG_R = 0.021;
  const LEG_H = H - TOP_THICK;
  const LEG_INSET_X = 0.028;
  const LEG_INSET_Z = 0.032;

  const APRON_H = 0.055;
  const APRON_T = 0.018;

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc9a982,
    roughness: 0.65,
    metalness: 0.0
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb8966e,
    roughness: 0.7,
    metalness: 0.0
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8c734b,
    roughness: 0.4,
    metalness: 0.6
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tabletop panels
  const topY = H - TOP_THICK / 2;
  const centerTopGeo = new THREE.BoxGeometry(CENTER_W, TOP_THICK, D);
  addMesh(centerTopGeo, oakMat, 'center_top', 0, topY, 0);

  const leafGeo = new THREE.BoxGeometry(LEAF_W, TOP_THICK, D);
  const leafOffsetX = CENTER_W / 2 + LEAF_GAP + LEAF_W / 2;
  addMesh(leafGeo, oakMat, 'left_leaf', -leafOffsetX, topY, 0);
  addMesh(leafGeo, oakMat, 'right_leaf', leafOffsetX, topY, 0);

  // Subtle hinge pins at the leaf seams
  const hingeGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.025, 10);
  const hingeY = H - TOP_THICK;
  const hingeX = CENTER_W / 2 + LEAF_GAP / 2;
  const hingeZ = D * 0.34;
  addMesh(hingeGeo, brassMat, 'hinge_fl', -hingeX, hingeY, hingeZ, Math.PI / 2, 0, 0);
  addMesh(hingeGeo, brassMat, 'hinge_bl', -hingeX, hingeY, -hingeZ, Math.PI / 2, 0, 0);
  addMesh(hingeGeo, brassMat, 'hinge_fr', hingeX, hingeY, hingeZ, Math.PI / 2, 0, 0);
  addMesh(hingeGeo, brassMat, 'hinge_br', hingeX, hingeY, -hingeZ, Math.PI / 2, 0, 0);

  // Four cylindrical legs
  const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R * 0.92, LEG_H, 20);
  const legX = CENTER_W / 2 - LEG_INSET_X;
  const legZ = D / 2 - LEG_INSET_Z;
  const legY = LEG_H / 2;

  addMesh(legGeo, oakMat, 'leg_fl', -legX, legY, legZ);
  addMesh(legGeo, oakMat, 'leg_fr', legX, legY, legZ);
  addMesh(legGeo, oakMat, 'leg_bl', -legX, legY, -legZ);
  addMesh(legGeo, oakMat, 'leg_br', legX, legY, -legZ);

  // Apron frame under center top
  const apronY = H - TOP_THICK - APRON_H / 2;
  const apronFrontLen = legX * 2;
  const apronSideLen = legZ * 2;

  const apronFBGeo = new THREE.BoxGeometry(apronFrontLen, APRON_H, APRON_T);
  addMesh(apronFBGeo, oakDarkMat, 'apron_front', 0, apronY, legZ);
  addMesh(apronFBGeo, oakDarkMat, 'apron_back', 0, apronY, -legZ);

  const apronLRGeo = new THREE.BoxGeometry(APRON_T, APRON_H, apronSideLen);
  addMesh(apronLRGeo, oakDarkMat, 'apron_left', -legX, apronY, 0);
  addMesh(apronLRGeo, oakDarkMat, 'apron_right', legX, apronY, 0);

  // Drop-leaf support cleats and diagonal struts
  const cleatW = LEAF_W * 0.65;
  const cleatH = 0.014;
  const cleatD = 0.018;
  const cleatY = H - TOP_THICK - cleatH / 2;
  const cleatX = CENTER_W / 2 + LEAF_GAP + cleatW / 2 + 0.01;
  const cleatGeo = new THREE.BoxGeometry(cleatW, cleatH, cleatD);

  addMesh(cleatGeo, oakDarkMat, 'left_cleat_front', -cleatX, cleatY, legZ);
  addMesh(cleatGeo, oakDarkMat, 'left_cleat_back', -cleatX, cleatY, -legZ);
  addMesh(cleatGeo, oakDarkMat, 'right_cleat_front', cleatX, cleatY, legZ);
  addMesh(cleatGeo, oakDarkMat, 'right_cleat_back', cleatX, cleatY, -legZ);

  // Diagonal struts from leg/apron to underside of leaf cleats
  const strutStartX = legX + LEG_R * 0.5;
  const strutStartY = H - TOP_THICK - APRON_H - 0.015;
  const strutEndX = CENTER_W / 2 + LEAF_GAP + cleatW * 0.72;
  const strutEndY = H - TOP_THICK - cleatH * 0.5;

  const dx = strutEndX - strutStartX;
  const dy = strutEndY - strutStartY;
  const strutLen = Math.sqrt(dx * dx + dy * dy);
  const strutAngle = Math.atan2(dy, dx);
  const strutMidX = (strutStartX + strutEndX) / 2;
  const strutMidY = (strutStartY + strutEndY) / 2;

  const strutGeo = new THREE.BoxGeometry(strutLen, 0.014, 0.016);
  addMesh(strutGeo, oakDarkMat, 'left_strut_front', -strutMidX, strutMidY, legZ, 0, 0, -strutAngle);
  addMesh(strutGeo, oakDarkMat, 'left_strut_back', -strutMidX, strutMidY, -legZ, 0, 0, -strutAngle);
  addMesh(strutGeo, oakDarkMat, 'right_strut_front', strutMidX, strutMidY, legZ, 0, 0, strutAngle);
  addMesh(strutGeo, oakDarkMat, 'right_strut_back', strutMidX, strutMidY, -legZ, 0, 0, strutAngle);

  return group;
}
