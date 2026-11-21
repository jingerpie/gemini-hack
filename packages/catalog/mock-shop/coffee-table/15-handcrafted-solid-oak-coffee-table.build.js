function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 0.90;
  const H = 0.36;
  const TOP_T = 0.052;
  const TOP_R = 0.035;
  const BEVEL = 0.006;

  const PAD_H = 0.003;
  const LEG_H = H - TOP_T - PAD_H;
  const LEG_W = 0.25;
  const LEG_T = 0.054;
  const LEG_R = 0.026;

  const APRON_H = 0.022;
  const APRON_INSET = 0.05;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb58453,
    roughness: 0.56,
    metalness: 0.02,
  });

  const oakUnderMat = new THREE.MeshStandardMaterial({
    color: 0x9e6f42,
    roughness: 0.62,
    metalness: 0.02,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x3b332b,
    roughness: 0.92,
    metalness: 0.0,
  });

  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const rad = Math.min(r, hw, hd);
    shape.moveTo(-hw + rad, -hd);
    shape.lineTo(hw - rad, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + rad);
    shape.lineTo(hw, hd - rad);
    shape.quadraticCurveTo(hw, hd, hw - rad, hd);
    shape.lineTo(-hw + rad, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - rad);
    shape.lineTo(-hw, -hd + rad);
    shape.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);
    return shape;
  }

  function prep(mesh, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Tabletop
  const topShape = makeRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, TOP_R);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_T - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 16,
  });
  topGeo.rotateX(-Math.PI / 2);
  const topMesh = prep(new THREE.Mesh(topGeo, oakMat), "tabletop");
  topMesh.position.y = H - TOP_T + BEVEL;
  group.add(topMesh);

  // 2. Underside apron / frame
  const apronShape = makeRoundedRectShape(W - APRON_INSET, D - APRON_INSET, TOP_R * 0.7);
  const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
    depth: APRON_H,
    bevelEnabled: false,
    curveSegments: 12,
  });
  apronGeo.rotateX(-Math.PI / 2);
  const apronMesh = prep(new THREE.Mesh(apronGeo, oakUnderMat), "underside_apron");
  apronMesh.position.y = H - TOP_T - APRON_H + 0.002;
  group.add(apronMesh);

  // 3. Four angled slab legs + haunches + felt pads
  const legShape = makeRoundedRectShape(LEG_W, LEG_T, LEG_R);
  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_H,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 14,
  });
  legGeo.rotateX(-Math.PI / 2);

  const haunchGeo = new THREE.BoxGeometry(LEG_W * 0.86, APRON_H + 0.004, LEG_T * 0.85);
  const padGeo = new THREE.BoxGeometry(LEG_W * 0.85, PAD_H, LEG_T * 0.75);

  const cornerOffset = W / 2 - TOP_R - 0.015;
  const inwardShift = (LEG_W / 2 - LEG_R) * Math.SQRT1_2;

  const corners = [
    { name: "front_left", sx: -1, sz: 1, rotY: Math.PI / 4 },
    { name: "front_right", sx: 1, sz: 1, rotY: -Math.PI / 4 },
    { name: "back_left", sx: -1, sz: -1, rotY: -Math.PI / 4 },
    { name: "back_right", sx: 1, sz: -1, rotY: Math.PI / 4 },
  ];

  for (const c of corners) {
    const cx = c.sx * (cornerOffset - inwardShift);
    const cz = c.sz * (cornerOffset - inwardShift);

    const leg = prep(new THREE.Mesh(legGeo, oakMat), `leg_${c.name}`);
    leg.position.set(cx, PAD_H, cz);
    leg.rotation.y = c.rotY;
    group.add(leg);

    const haunch = prep(new THREE.Mesh(haunchGeo, oakUnderMat), `leg_haunch_${c.name}`);
    haunch.position.set(cx, H - TOP_T - APRON_H / 2, cz);
    haunch.rotation.y = c.rotY;
    group.add(haunch);

    const pad = prep(new THREE.Mesh(padGeo, feltMat), `felt_pad_${c.name}`);
    pad.position.set(cx, PAD_H / 2, cz);
    pad.rotation.y = c.rotY;
    group.add(pad);
  }

  return group;
}
