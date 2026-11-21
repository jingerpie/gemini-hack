function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.00;
  const D = 1.00;
  const H = 0.75;

  const TOP_THICK = 0.042;
  const TOP_BEVEL = 0.012;
  const CORNER_R = 0.12;

  const LEG_OFFSET_X = W / 2 - 0.36;
  const LEG_SPAN_Z = D - 0.24;
  const LEG_TUBE = 0.044;
  const GLIDE_H = 0.004;

  const APRON_H = 0.036;
  const APRON_W = 0.032;
  const APRON_SPAN_Z = LEG_SPAN_Z - LEG_TUBE;
  const APRON_LEN_X = LEG_OFFSET_X * 2;

  const TOP_Y = H - TOP_THICK;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb8926a,
    roughness: 0.52,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8e8b86,
    roughness: 0.36,
    metalness: 0.72
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2927,
    roughness: 0.85,
    metalness: 0.05
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop (rounded rectangle with beveled edge)
  const hw = W / 2 - TOP_BEVEL;
  const hd = D / 2 - TOP_BEVEL;
  const r = CORNER_R - TOP_BEVEL;

  const topShape = new THREE.Shape();
  topShape.moveTo(-hw + r, -hd);
  topShape.lineTo(hw - r, -hd);
  topShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  topShape.lineTo(hw, hd - r);
  topShape.quadraticCurveTo(hw, hd, hw - r, hd);
  topShape.lineTo(-hw + r, hd);
  topShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  topShape.lineTo(-hw, -hd + r);
  topShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const extrudeDepth = TOP_THICK - TOP_BEVEL * 2;
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: TOP_BEVEL,
    bevelSize: TOP_BEVEL,
    bevelSegments: 2,
    curveSegments: 16
  });
  // Rotate so extrusion is along +Y, and center vertically in its thickness
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, woodMat, 'tabletop_wood', 0, H - TOP_BEVEL, 0);

  // 2. Under-tabletop apron frame
  const apronY = TOP_Y - APRON_H / 2;
  const beamGeo = new THREE.BoxGeometry(APRON_LEN_X, APRON_H, APRON_W);
  addMesh(beamGeo, metalMat, 'apron_beam_front', 0, apronY, APRON_SPAN_Z / 2);
  addMesh(beamGeo, metalMat, 'apron_beam_back', 0, apronY, -APRON_SPAN_Z / 2);

  const crossGeo = new THREE.BoxGeometry(APRON_W, APRON_H, APRON_SPAN_Z - APRON_W);
  addMesh(crossGeo, metalMat, 'apron_cross_left', -LEG_OFFSET_X + LEG_TUBE / 2, apronY, 0);
  addMesh(crossGeo, metalMat, 'apron_cross_right', LEG_OFFSET_X - LEG_TUBE / 2, apronY, 0);
  addMesh(crossGeo, metalMat, 'apron_cross_center', 0, apronY, 0);

  // 3. Sled Legs (Left & Right)
  const legPostH = TOP_Y - GLIDE_H - LEG_TUBE * 2;
  const legPostY = GLIDE_H + LEG_TUBE + legPostH / 2;
  const legBottomY = GLIDE_H + LEG_TUBE / 2;
  const legTopY = TOP_Y - LEG_TUBE / 2;
  const legZ = LEG_SPAN_Z / 2 - LEG_TUBE / 2;

  const postGeo = new THREE.BoxGeometry(LEG_TUBE, legPostH, LEG_TUBE);
  const horizGeo = new THREE.BoxGeometry(LEG_TUBE, LEG_TUBE, LEG_SPAN_Z);
  const glideGeo = new THREE.BoxGeometry(LEG_TUBE * 0.9, GLIDE_H, LEG_TUBE * 1.4);

  const sides = [
    { name: 'left', x: -LEG_OFFSET_X },
    { name: 'right', x: LEG_OFFSET_X }
  ];

  for (let i = 0; i < sides.length; i++) {
    const s = sides[i];
    addMesh(postGeo, metalMat, 'leg_' + s.name + '_front', s.x, legPostY, legZ);
    addMesh(postGeo, metalMat, 'leg_' + s.name + '_back', s.x, legPostY, -legZ);
    addMesh(horizGeo, metalMat, 'leg_' + s.name + '_bottom', s.x, legBottomY, 0);
    addMesh(horizGeo, metalMat, 'leg_' + s.name + '_top', s.x, legTopY, 0);

    addMesh(glideGeo, glideMat, 'glide_' + s.name + '_front', s.x, GLIDE_H / 2, legZ);
    addMesh(glideGeo, glideMat, 'glide_' + s.name + '_back', s.x, GLIDE_H / 2, -legZ);
  }

  return group;
}
