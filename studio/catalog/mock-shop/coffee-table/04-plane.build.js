function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const BEVEL = 0.003;
  const W = 1.10 - BEVEL * 2; // Overall width = 1.10 m (110 cm)
  const D = 0.68;             // Overall depth
  const H = 0.38;             // Overall height
  const TOP_T = 0.036;        // Top thickness
  const TOP_R = 0.12;         // Top corner radius

  const SHELF_W = 0.98;       // Lower shelf width
  const SHELF_D = 0.58;       // Lower shelf depth
  const SHELF_T = 0.030;      // Lower shelf thickness
  const SHELF_R = 0.095;      // Lower shelf corner radius
  const SHELF_Y = 0.085;      // Bottom of lower shelf

  const LEG_T = 0.012;        // Metal bar thickness
  const LEG_W = 0.050;        // Metal bar width
  const INNER_LEG_X = 0.275;  // X offset for front/back vertical bars
  const INNER_LEG_Z = D / 2 - 0.060;
  const END_LEG_X = W / 2 - 0.036;
  const GLIDE_H = 0.004;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb68553,
    roughness: 0.58,
    metalness: 0.04,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x5c5955,
    roughness: 0.42,
    metalness: 0.68,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Helper to create a rounded-rectangle slab in XZ plane, bottom at y = 0
  function makeRoundedSlab(width, depth, thickness, radius) {
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw - 0.001, hd - 0.001);
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: thickness - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 2,
      curveSegments: 16,
    });
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, BEVEL, 0);
    return geom;
  }

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Table top
  const topGeom = makeRoundedSlab(W, D, TOP_T, TOP_R);
  addMesh(topGeom, woodMat, 'table_top', 0, H - TOP_T, 0);

  // 2. Lower shelf
  const shelfGeom = makeRoundedSlab(SHELF_W, SHELF_D, SHELF_T, SHELF_R);
  addMesh(shelfGeom, woodMat, 'lower_shelf', 0, SHELF_Y, 0);

  // 3. Left & right outer end legs
  const endLegH = H - TOP_T - GLIDE_H;
  const endLegGeom = new THREE.BoxGeometry(LEG_W, endLegH, LEG_T);
  addMesh(endLegGeom, metalMat, 'left_end_leg', -END_LEG_X, GLIDE_H + endLegH / 2, 0);
  addMesh(endLegGeom, metalMat, 'right_end_leg', END_LEG_X, GLIDE_H + endLegH / 2, 0);

  // 4. Horizontal bottom feet under end legs
  const footLen = 0.12;
  const footGeom = new THREE.BoxGeometry(footLen, LEG_T, LEG_W);
  addMesh(footGeom, metalMat, 'left_end_foot', -END_LEG_X + footLen / 2 - LEG_W / 2, GLIDE_H + LEG_T / 2, 0);
  addMesh(footGeom, metalMat, 'right_end_foot', END_LEG_X - footLen / 2 + LEG_W / 2, GLIDE_H + LEG_T / 2, 0);

  // 5. Four inner vertical legs (front-left, front-right, back-left, back-right)
  const innerLegH = H - TOP_T - GLIDE_H;
  const innerLegGeom = new THREE.BoxGeometry(LEG_T, innerLegH, LEG_W);
  addMesh(innerLegGeom, metalMat, 'front_left_leg', -INNER_LEG_X, GLIDE_H + innerLegH / 2, INNER_LEG_Z);
  addMesh(innerLegGeom, metalMat, 'front_right_leg', INNER_LEG_X, GLIDE_H + innerLegH / 2, INNER_LEG_Z);
  addMesh(innerLegGeom, metalMat, 'back_left_leg', -INNER_LEG_X, GLIDE_H + innerLegH / 2, -INNER_LEG_Z);
  addMesh(innerLegGeom, metalMat, 'back_right_leg', INNER_LEG_X, GLIDE_H + innerLegH / 2, -INNER_LEG_Z);

  // 6. Bottom rails connecting front and back inner legs
  const railLenZ = INNER_LEG_Z * 2 + LEG_W;
  const underRailGeom = new THREE.BoxGeometry(LEG_T, LEG_T, railLenZ);
  addMesh(underRailGeom, metalMat, 'left_under_rail', -INNER_LEG_X, GLIDE_H + LEG_T / 2, 0);
  addMesh(underRailGeom, metalMat, 'right_under_rail', INNER_LEG_X, GLIDE_H + LEG_T / 2, 0);

  // 7. Top support rails under the tabletop
  const topRailGeom = new THREE.BoxGeometry(LEG_T, LEG_T, railLenZ);
  addMesh(topRailGeom, metalMat, 'left_top_rail', -INNER_LEG_X, H - TOP_T - LEG_T / 2, 0);
  addMesh(topRailGeom, metalMat, 'right_top_rail', INNER_LEG_X, H - TOP_T - LEG_T / 2, 0);

  // 8. Floor glides under legs
  const glideGeom = new THREE.CylinderGeometry(0.012, 0.012, GLIDE_H, 12);
  addMesh(glideGeom, glideMat, 'glide_front_left', -INNER_LEG_X, GLIDE_H / 2, INNER_LEG_Z);
  addMesh(glideGeom, glideMat, 'glide_front_right', INNER_LEG_X, GLIDE_H / 2, INNER_LEG_Z);
  addMesh(glideGeom, glideMat, 'glide_back_left', -INNER_LEG_X, GLIDE_H / 2, -INNER_LEG_Z);
  addMesh(glideGeom, glideMat, 'glide_back_right', INNER_LEG_X, GLIDE_H / 2, -INNER_LEG_Z);

  return group;
}
