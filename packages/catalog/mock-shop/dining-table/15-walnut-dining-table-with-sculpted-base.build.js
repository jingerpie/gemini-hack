function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.10;
  const D = 1.04;
  const H = 0.75;
  const TOP_THICK = 0.042;
  const TOP_RADIUS = 0.075;
  const TOP_BEVEL = 0.01;
  const LEG_H = H - TOP_THICK;
  const LEG_W = 0.17;
  const LEG_D = 0.13;
  const LEG_INSET_X = 0.15;
  const LEG_INSET_Z = 0.095;
  const APRON_H = 0.055;
  const APRON_THICK = 0.036;
  const GLIDE_H = 0.003;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x6e472b,
    roughness: 0.42,
    metalness: 0.04,
  });

  const walnutDarkMat = new THREE.MeshStandardMaterial({
    color: 0x593720,
    roughness: 0.48,
    metalness: 0.04,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x24201c,
    roughness: 0.9,
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

  // 1. Tabletop (extruded rounded rectangle with beveled edges)
  const topInnerW = W - TOP_BEVEL * 2;
  const topInnerD = D - TOP_BEVEL * 2;
  const hw = topInnerW / 2;
  const hd = topInnerD / 2;
  const r = TOP_RADIUS;

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
    depth: TOP_THICK - TOP_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: TOP_BEVEL,
    bevelSize: TOP_BEVEL,
    bevelSegments: 4,
    curveSegments: 16,
  });
  topGeo.rotateX(Math.PI / 2);
  addMesh(topGeo, walnutMat, "tabletop_slab", 0, H - TOP_BEVEL, 0);

  // 2. Sculpted Legs (4 rounded-plank legs)
  const legPosX = W / 2 - LEG_INSET_X - LEG_W / 2;
  const legPosZ = D / 2 - LEG_INSET_Z - LEG_D / 2;

  const legShape = new THREE.Shape();
  const lw = LEG_W / 2;
  const ld = LEG_D / 2;
  const lrOuter = 0.045;
  const lrInner = 0.018;

  legShape.moveTo(-lw + lrInner, -ld);
  legShape.lineTo(lw - lrOuter, -ld);
  legShape.quadraticCurveTo(lw, -ld, lw, -ld + lrOuter);
  legShape.lineTo(lw, ld - lrOuter);
  legShape.quadraticCurveTo(lw, ld, lw - lrOuter, ld);
  legShape.lineTo(-lw + lrInner, ld);
  legShape.quadraticCurveTo(-lw, ld, -lw, ld - lrInner);
  legShape.lineTo(-lw, -ld + lrInner);
  legShape.quadraticCurveTo(-lw, -ld, -lw + lrInner, -ld);

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_H - GLIDE_H,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 12,
  });
  legGeo.rotateX(-Math.PI / 2);

  const glideGeo = new THREE.CylinderGeometry(
    Math.min(LEG_W, LEG_D) * 0.35,
    Math.min(LEG_W, LEG_D) * 0.35,
    GLIDE_H,
    16
  );

  const legCorners = [
    { name: "front_right", sx: 1, sz: 1, ry: 0 },
    { name: "front_left", sx: -1, sz: 1, ry: Math.PI },
    { name: "back_right", sx: 1, sz: -1, ry: 0 },
    { name: "back_left", sx: -1, sz: -1, ry: Math.PI },
  ];

  legCorners.forEach((c) => {
    const lx = c.sx * legPosX;
    const lz = c.sz * legPosZ;
    addMesh(
      legGeo,
      walnutMat,
      `leg_${c.name}`,
      lx,
      GLIDE_H,
      lz,
      0,
      c.ry,
      0
    );
    addMesh(
      glideGeo,
      glideMat,
      `foot_glide_${c.name}`,
      lx,
      GLIDE_H / 2,
      lz
    );
  });

  // 3. Apron Rails (connecting the 4 legs under the tabletop)
  const apronY = LEG_H - APRON_H / 2;
  const frontApronLen = legPosX * 2 - LEG_W * 0.5;
  const sideApronLen = legPosZ * 2 - LEG_D * 0.5;

  const frontApronGeo = new THREE.BoxGeometry(frontApronLen, APRON_H, APRON_THICK);
  const sideApronGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideApronLen);

  addMesh(frontApronGeo, walnutDarkMat, "apron_front", 0, apronY, legPosZ);
  addMesh(frontApronGeo, walnutDarkMat, "apron_back", 0, apronY, -legPosZ);
  addMesh(sideApronGeo, walnutDarkMat, "apron_right", legPosX, apronY, 0);
  addMesh(sideApronGeo, walnutDarkMat, "apron_left", -legPosX, apronY, 0);

  // 4. Sculpted Arch Gussets (smoothly bridging legs to aprons)
  const gussetR = 0.055;
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(0, 0);
  gussetShape.lineTo(gussetR, 0);
  gussetShape.quadraticCurveTo(0, 0, 0, -gussetR);
  gussetShape.lineTo(0, 0);

  const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
    depth: APRON_THICK,
    bevelEnabled: false,
    curveSegments: 12,
  });
  gussetGeo.translate(0, 0, -APRON_THICK / 2);

  const gussetY = LEG_H - APRON_H;
  const gussetX = legPosX - LEG_W / 2;

  addMesh(gussetGeo, walnutMat, "gusset_front_right", gussetX, gussetY, legPosZ, 0, Math.PI, 0);
  addMesh(gussetGeo, walnutMat, "gusset_front_left", -gussetX, gussetY, legPosZ, 0, 0, 0);
  addMesh(gussetGeo, walnutMat, "gusset_back_right", gussetX, gussetY, -legPosZ, 0, Math.PI, 0);
  addMesh(gussetGeo, walnutMat, "gusset_back_left", -gussetX, gussetY, -legPosZ, 0, 0, 0);

  // 5. Underside Support Batten
  const battenGeo = new THREE.BoxGeometry(0.045, 0.024, sideApronLen * 0.9);
  addMesh(battenGeo, walnutDarkMat, "underside_batten_center", 0, LEG_H - 0.012, 0);

  return group;
}
