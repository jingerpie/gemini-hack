function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const H = 0.46;
  const D = 0.16;
  const CENTER_Y = H / 2;
  const BEVEL = 0.065;
  const CORE_DEPTH = D - 2 * BEVEL;
  const FRONT_Z = D / 2;

  // Materials
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xe8dfd1,
    roughness: 0.9,
    metalness: 0.0
  });

  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xb6895b,
    roughness: 0.78,
    metalness: 0.0
  });

  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0x8a7e72,
    roughness: 0.8,
    metalness: 0.0
  });

  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xcbb292,
    roughness: 0.8,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Single soft rounded pillow body using ExtrudeGeometry with large bevel
  const halfW = W / 2 - BEVEL;
  const halfH = H / 2 - BEVEL;
  const r = 0.025;
  const pillowShape = new THREE.Shape();
  pillowShape.moveTo(-halfW + r, -halfH);
  pillowShape.lineTo(halfW - r, -halfH);
  pillowShape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  pillowShape.lineTo(halfW, halfH - r);
  pillowShape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  pillowShape.lineTo(-halfW + r, halfH);
  pillowShape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  pillowShape.lineTo(-halfW, -halfH + r);
  pillowShape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);

  const pillowGeo = new THREE.ExtrudeGeometry(pillowShape, {
    depth: CORE_DEPTH,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 1,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    curveSegments: 12
  });
  pillowGeo.translate(0, 0, -CORE_DEPTH / 2);
  addMesh(pillowGeo, linenMat, 'pillow_body', [0, CENTER_Y, 0]);

  // Helper to create thin flat embroidered shapes lying directly on the front face
  function makeFlatShapeGeo(shape, thickness) {
    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 12
    });
  }

  const embZ = FRONT_Z + 0.0004;

  // Central vertical damask stem
  const stemShape = new THREE.Shape();
  stemShape.moveTo(-0.006, -0.13);
  stemShape.quadraticCurveTo(-0.009, 0, -0.005, 0.11);
  stemShape.lineTo(0.005, 0.11);
  stemShape.quadraticCurveTo(0.009, 0, 0.006, -0.13);
  stemShape.closePath();
  addMesh(makeFlatShapeGeo(stemShape, 0.0018), taupeMat, 'embroidery_center_stem', [0, CENTER_Y, embZ]);

  // Top floral crown medallion
  const crownShape = new THREE.Shape();
  crownShape.moveTo(0, 0.105);
  crownShape.quadraticCurveTo(-0.055, 0.125, -0.045, 0.155);
  crownShape.quadraticCurveTo(-0.02, 0.168, 0, 0.158);
  crownShape.quadraticCurveTo(0.02, 0.168, 0.045, 0.155);
  crownShape.quadraticCurveTo(0.055, 0.125, 0, 0.105);
  addMesh(makeFlatShapeGeo(crownShape, 0.002), sandMat, 'embroidery_top_crown', [0, CENTER_Y, embZ]);

  // Top crown inner accent
  const crownInnerShape = new THREE.Shape();
  crownInnerShape.moveTo(0, 0.112);
  crownInnerShape.quadraticCurveTo(-0.032, 0.128, -0.024, 0.146);
  crownInnerShape.quadraticCurveTo(0, 0.152, 0.024, 0.146);
  crownInnerShape.quadraticCurveTo(0.032, 0.128, 0, 0.112);
  addMesh(makeFlatShapeGeo(crownInnerShape, 0.0024), ochreMat, 'embroidery_top_crown_accent', [0, CENTER_Y, embZ]);

  // Symmetrical upper scrolling acanthus leaves
  function makeUpperScroll(sign) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.01);
    s.quadraticCurveTo(sign * 0.05, 0.02, sign * 0.105, 0.065);
    s.quadraticCurveTo(sign * 0.135, 0.095, sign * 0.145, 0.13);
    s.quadraticCurveTo(sign * 0.12, 0.115, sign * 0.095, 0.085);
    s.quadraticCurveTo(sign * 0.045, 0.045, 0, 0.015);
    s.closePath();
    return s;
  }
  addMesh(makeFlatShapeGeo(makeUpperScroll(-1), 0.002), ochreMat, 'embroidery_upper_scroll_left', [0, CENTER_Y, embZ]);
  addMesh(makeFlatShapeGeo(makeUpperScroll(1), 0.002), ochreMat, 'embroidery_upper_scroll_right', [0, CENTER_Y, embZ]);

  // Symmetrical lower scrolling acanthus leaves
  function makeLowerScroll(sign) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.115);
    s.quadraticCurveTo(sign * 0.055, -0.09, sign * 0.115, -0.045);
    s.quadraticCurveTo(sign * 0.145, -0.02, sign * 0.13, 0.01);
    s.quadraticCurveTo(sign * 0.105, -0.015, sign * 0.085, -0.035);
    s.quadraticCurveTo(sign * 0.045, -0.07, 0, -0.095);
    s.closePath();
    return s;
  }
  addMesh(makeFlatShapeGeo(makeLowerScroll(-1), 0.002), taupeMat, 'embroidery_lower_scroll_left', [0, CENTER_Y, embZ]);
  addMesh(makeFlatShapeGeo(makeLowerScroll(1), 0.002), taupeMat, 'embroidery_lower_scroll_right', [0, CENTER_Y, embZ]);

  // Bottom base flourishes
  function makeBaseScroll(sign) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.135);
    s.quadraticCurveTo(sign * 0.05, -0.155, sign * 0.11, -0.135);
    s.quadraticCurveTo(sign * 0.095, -0.12, sign * 0.06, -0.125);
    s.quadraticCurveTo(sign * 0.025, -0.13, 0, -0.12);
    s.closePath();
    return s;
  }
  addMesh(makeFlatShapeGeo(makeBaseScroll(-1), 0.0018), ochreMat, 'embroidery_base_scroll_left', [0, CENTER_Y, embZ]);
  addMesh(makeFlatShapeGeo(makeBaseScroll(1), 0.0018), ochreMat, 'embroidery_base_scroll_right', [0, CENTER_Y, embZ]);

  // Central calyx accent
  const calyxShape = new THREE.Shape();
  calyxShape.moveTo(0, -0.035);
  calyxShape.quadraticCurveTo(-0.022, -0.01, 0, 0.025);
  calyxShape.quadraticCurveTo(0.022, -0.01, 0, -0.035);
  addMesh(makeFlatShapeGeo(calyxShape, 0.0025), sandMat, 'embroidery_center_calyx', [0, CENTER_Y, embZ]);

  return group;
}
