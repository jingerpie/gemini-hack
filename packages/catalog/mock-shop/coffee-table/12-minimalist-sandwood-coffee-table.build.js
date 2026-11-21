function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const D = 0.65;
  const H = 0.38;
  const TOP_T = 0.028;
  const TOP_R = 0.055;
  const BEVEL = 0.003;

  const LEG_T = 0.028;
  const LEG_INSET_X = 0.065;
  const LEG_INSET_Z = 0.04;
  const LEG_D = D - LEG_INSET_Z * 2;
  const GLIDE_H = 0.003;
  const GLIDE_R = 0.014;
  const LEG_H = H - TOP_T - GLIDE_H;

  const SHELF_T = 0.024;
  const SHELF_Y = 0.19;
  const SHELF_W = W - LEG_INSET_X * 2 - LEG_T * 2;
  const SHELF_D = LEG_D - 0.01;

  const CLEAT_T = 0.018;
  const CLEAT_H = 0.022;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8a06e,
    roughness: 0.62,
    metalness: 0.02,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2c2723,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Rounded-rectangle table top
  const hw = W / 2 - BEVEL;
  const hd = D / 2 - BEVEL;
  const r = TOP_R - BEVEL;
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

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 16,
  });
  topGeo.rotateX(-Math.PI / 2);
  addMesh(topGeo, woodMat, "table_top", 0, H - TOP_T + BEVEL, 0);

  // 2. Left and right vertical slab legs
  const legX = W / 2 - LEG_INSET_X - LEG_T / 2;
  const legY = GLIDE_H + LEG_H / 2;
  const legGeo = new THREE.BoxGeometry(LEG_T, LEG_H, LEG_D);
  addMesh(legGeo, woodMat, "left_leg_panel", -legX, legY, 0);
  addMesh(legGeo, woodMat, "right_leg_panel", legX, legY, 0);

  // 3. Lower shelf spanning between the legs
  const shelfGeo = new THREE.BoxGeometry(SHELF_W, SHELF_T, SHELF_D);
  addMesh(shelfGeo, woodMat, "lower_shelf", 0, SHELF_Y, 0);

  // 4. Under-top support cleats
  const topCleatLRGeo = new THREE.BoxGeometry(CLEAT_T, CLEAT_H, LEG_D - 0.04);
  const innerLegX = legX - LEG_T / 2 - CLEAT_T / 2;
  const topCleatY = H - TOP_T - CLEAT_H / 2;
  addMesh(topCleatLRGeo, woodMat, "top_cleat_left", -innerLegX, topCleatY, 0);
  addMesh(topCleatLRGeo, woodMat, "top_cleat_right", innerLegX, topCleatY, 0);

  const topCleatFBGeo = new THREE.BoxGeometry(SHELF_W - CLEAT_T * 2, CLEAT_H, CLEAT_T);
  const cleatZ = LEG_D / 2 - 0.04;
  addMesh(topCleatFBGeo, woodMat, "top_cleat_front", 0, topCleatY, cleatZ);
  addMesh(topCleatFBGeo, woodMat, "top_cleat_back", 0, topCleatY, -cleatZ);

  // 5. Under-shelf support cleats
  const shelfCleatGeo = new THREE.BoxGeometry(CLEAT_T, CLEAT_H, SHELF_D - 0.04);
  const shelfCleatY = SHELF_Y - SHELF_T / 2 - CLEAT_H / 2;
  addMesh(shelfCleatGeo, woodMat, "shelf_cleat_left", -innerLegX, shelfCleatY, 0);
  addMesh(shelfCleatGeo, woodMat, "shelf_cleat_right", innerLegX, shelfCleatY, 0);

  // 6. Floor glides under the leg panels (touching y = 0)
  const glideGeo = new THREE.CylinderGeometry(GLIDE_R, GLIDE_R, GLIDE_H, 16);
  const glideZ = LEG_D / 2 - 0.045;
  const glideY = GLIDE_H / 2;
  addMesh(glideGeo, glideMat, "glide_fl", -legX, glideY, glideZ);
  addMesh(glideGeo, glideMat, "glide_fr", legX, glideY, glideZ);
  addMesh(glideGeo, glideMat, "glide_bl", -legX, glideY, -glideZ);
  addMesh(glideGeo, glideMat, "glide_br", legX, glideY, -glideZ);

  return group;
}
