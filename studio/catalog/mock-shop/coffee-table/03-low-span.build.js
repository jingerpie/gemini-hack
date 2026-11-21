function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.12;          // Overall width
  const D = 1.00;          // Overall depth
  const H = 0.34;          // Overall height
  const TOP_T = 0.055;     // Tabletop thickness
  const LEG_T = 0.045;     // Side slab thickness
  const GLIDE_H = 0.003;   // Floor glide height
  const BEVEL = 0.010;     // Soft edge bevel radius
  const CORNER_R = 0.018;  // Corner rounding radius
  const REVEAL_H = 0.003;  // Shadow-gap reveal height

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x988e82,
    roughness: 0.78,
    metalness: 0.02,
  });

  const revealMat = new THREE.MeshStandardMaterial({
    color: 0x6b6258,
    roughness: 0.88,
    metalness: 0.02,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2825,
    roughness: 0.95,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function roundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const cr = Math.min(r, hw, hh);
    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    shape.lineTo(hw, hh - cr);
    shape.quadraticCurveTo(hw, hh, hw - cr, hh);
    shape.lineTo(-hw + cr, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    shape.lineTo(-hw, -hh + cr);
    shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
    return shape;
  }

  // 1. Tabletop (extruded vertically along Y)
  const topShape = roundedRectShape(W - BEVEL * 2, D - BEVEL * 2, CORNER_R);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  // Rotate so extrusion depth is along +Y, centered at Y=0
  topGeo.rotateX(-Math.PI / 2);
  topGeo.translate(0, -(TOP_T - BEVEL * 2) / 2, 0);
  const topCenterY = H - TOP_T / 2;
  addMesh(topGeo, oakMat, 'tabletop_main', 0, topCenterY, 0);

  // 2. Side slab legs (left & right)
  const legH = H - TOP_T - GLIDE_H;
  const legShape = roundedRectShape(D - BEVEL * 2, legH - BEVEL * 2, CORNER_R * 0.7);
  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_T - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  // Rotate so leg thickness is along X, depth along Z, height along Y
  legGeo.rotateY(Math.PI / 2);
  legGeo.translate(-(LEG_T - BEVEL * 2) / 2, 0, 0);

  const legCenterY = GLIDE_H + legH / 2;
  const legX = W / 2 - LEG_T / 2;
  addMesh(legGeo, oakMat, 'left_leg_slab', -legX, legCenterY, 0);
  addMesh(legGeo, oakMat, 'right_leg_slab', legX, legCenterY, 0);

  // 3. Subtle shadow-gap reveal strips where legs meet tabletop
  const revealGeo = new THREE.BoxGeometry(LEG_T - 0.004, REVEAL_H, D - 0.012);
  const revealY = H - TOP_T - REVEAL_H / 2 + 0.001;
  addMesh(revealGeo, revealMat, 'left_reveal_strip', -legX, revealY, 0);
  addMesh(revealGeo, revealMat, 'right_reveal_strip', legX, revealY, 0);

  // 4. Underside structural cleats / cross braces
  const braceSpan = W - LEG_T * 2;
  const braceH = 0.022;
  const braceD = 0.040;
  const braceGeo = new THREE.BoxGeometry(braceSpan, braceH, braceD);
  const braceY = H - TOP_T - braceH / 2 + 0.002;
  const braceZ = D / 2 - 0.14;
  addMesh(braceGeo, oakMat, 'underside_cross_brace_front', 0, braceY, braceZ);
  addMesh(braceGeo, oakMat, 'underside_cross_brace_back', 0, braceY, -braceZ);

  const centerBraceGeo = new THREE.BoxGeometry(braceD, braceH, braceZ * 2 - braceD);
  addMesh(centerBraceGeo, oakMat, 'underside_center_brace', 0, braceY, 0);

  // 5. Floor glides under side slabs (6 total, touching y = 0)
  const glideGeo = new THREE.CylinderGeometry(0.014, 0.014, GLIDE_H, 16);
  const glideY = GLIDE_H / 2;
  const glideZOffset = D / 2 - 0.06;
  const glideCoords = [
    ['floor_glide_fl', -legX, glideZOffset],
    ['floor_glide_ml', -legX, 0],
    ['floor_glide_bl', -legX, -glideZOffset],
    ['floor_glide_fr', legX, glideZOffset],
    ['floor_glide_mr', legX, 0],
    ['floor_glide_br', legX, -glideZOffset],
  ];
  for (const [name, gx, gz] of glideCoords) {
    addMesh(glideGeo, glideMat, name, gx, glideY, gz);
  }

  return group;
}
