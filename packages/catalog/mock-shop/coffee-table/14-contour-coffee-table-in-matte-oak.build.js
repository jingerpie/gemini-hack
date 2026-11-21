function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.40;
  const D = 0.80;
  const H = 0.35;
  const TOP_THICK = 0.036;
  const TOP_RADIUS = 0.22;
  const BEVEL = 0.006;

  const LEG_H = H - TOP_THICK;
  const LEG_LEN = 0.48;
  const LEG_THICK = 0.048;
  const LEG_X_OFFSET = 0.38;
  const GLIDE_H = 0.004;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb98c58,
    roughness: 0.74,
    metalness: 0.02,
  });

  const darkOakMat = new THREE.MeshStandardMaterial({
    color: 0x9c7244,
    roughness: 0.78,
    metalness: 0.02,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622,
    roughness: 0.9,
    metalness: 0.05,
  });

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x4a4640,
    roughness: 0.45,
    metalness: 0.75,
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

  // Helper: rounded rectangle shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);

    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // 1. Tabletop (extruded rounded rectangle, laid flat)
  const topShape = createRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, TOP_RADIUS);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_THICK - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 24,
  });
  topGeo.rotateX(-Math.PI / 2);
  // ExtrudeGeometry after rotateX(-PI/2) goes from y = 0 to y = TOP_THICK - BEVEL*2, with bevel extending -BEVEL to +BEVEL
  addMesh(topGeo, oakMat, 'tabletop', 0, H - TOP_THICK + BEVEL, 0);

  // 2. Two sculptural slab legs (pill/rounded-rectangle profile in plan view)
  const legShape = createRoundedRectShape(LEG_THICK - 0.006, LEG_LEN - 0.006, (LEG_THICK - 0.006) / 2);
  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_H - GLIDE_H + 0.008, // slight overlap into tabletop
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 16,
  });
  legGeo.rotateX(-Math.PI / 2);

  addMesh(legGeo, oakMat, 'leg_left', -LEG_X_OFFSET, GLIDE_H + 0.003, 0);
  addMesh(legGeo, oakMat, 'leg_right', LEG_X_OFFSET, GLIDE_H + 0.003, 0);

  // 3. Recessed under-tabletop support cleats (along Z on top of each leg)
  const cleatGeo = new THREE.BoxGeometry(0.06, 0.022, LEG_LEN * 0.82);
  addMesh(cleatGeo, darkOakMat, 'support_cleat_left', -LEG_X_OFFSET, H - TOP_THICK - 0.011, 0);
  addMesh(cleatGeo, darkOakMat, 'support_cleat_right', LEG_X_OFFSET, H - TOP_THICK - 0.011, 0);

  // 4. Central recessed longitudinal stretcher rails (connecting left & right cleats)
  const railGeo = new THREE.BoxGeometry(LEG_X_OFFSET * 2 - LEG_THICK, 0.018, 0.04);
  addMesh(railGeo, darkOakMat, 'under_rail_front', 0, H - TOP_THICK - 0.009, 0.14);
  addMesh(railGeo, darkOakMat, 'under_rail_back', 0, H - TOP_THICK - 0.009, -0.14);

  // 5. Floor glides under each leg (touching y = 0)
  const glideGeo = new THREE.CylinderGeometry(0.016, 0.016, GLIDE_H, 16);
  const glideZ = LEG_LEN * 0.34;
  addMesh(glideGeo, glideMat, 'glide_left_front', -LEG_X_OFFSET, GLIDE_H / 2, glideZ);
  addMesh(glideGeo, glideMat, 'glide_left_back', -LEG_X_OFFSET, GLIDE_H / 2, -glideZ);
  addMesh(glideGeo, glideMat, 'glide_right_front', LEG_X_OFFSET, GLIDE_H / 2, glideZ);
  addMesh(glideGeo, glideMat, 'glide_right_back', LEG_X_OFFSET, GLIDE_H / 2, -glideZ);

  // 6. Concealed metal mounting brackets under tabletop
  const bracketGeo = new THREE.BoxGeometry(0.03, 0.004, 0.05);
  const bracketY = H - TOP_THICK - 0.002;
  addMesh(bracketGeo, hardwareMat, 'bracket_left_front', -LEG_X_OFFSET, bracketY, 0.14);
  addMesh(bracketGeo, hardwareMat, 'bracket_left_back', -LEG_X_OFFSET, bracketY, -0.14);
  addMesh(bracketGeo, hardwareMat, 'bracket_right_front', LEG_X_OFFSET, bracketY, 0.14);
  addMesh(bracketGeo, hardwareMat, 'bracket_right_back', LEG_X_OFFSET, bracketY, -0.14);

  return group;
}
