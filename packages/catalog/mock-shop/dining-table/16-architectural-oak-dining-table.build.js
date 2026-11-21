function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.20;
  const D = 1.05;
  const H = 0.75;
  const TOP_T = 0.055;
  const GLIDE_H = 0.004;
  const LEG_H = H - TOP_T - GLIDE_H;
  const LEG_W = 0.32;
  const LEG_T = 0.065;
  const LEG_R = 0.028;
  const LEG_OFFSET_X = 0.76;
  const LEG_OFFSET_Z = 0.27;
  const LEG_ANGLE = 0.42; // ~24 deg in plan view
  const PLANK_COUNT = 5;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a67e,
    roughness: 0.58,
    metalness: 0.0
  });

  const oakAltMat = new THREE.MeshStandardMaterial({
    color: 0xc29f77,
    roughness: 0.60,
    metalness: 0.0
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x2b2927,
    roughness: 0.45,
    metalness: 0.75
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x1e1d1b,
    roughness: 0.9,
    metalness: 0.0
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

  // Tabletop planks (running along X)
  const plankD = D / PLANK_COUNT;
  const plankGeo = new THREE.BoxGeometry(W, TOP_T, plankD - 0.001);
  const topY = H - TOP_T / 2;
  for (let i = 0; i < PLANK_COUNT; i++) {
    const pz = -D / 2 + plankD / 2 + i * plankD;
    const mat = i % 2 === 0 ? oakMat : oakAltMat;
    addMesh(plankGeo, mat, `tabletop_plank_${i + 1}`, 0, topY, pz);
  }

  // Rounded-rectangle shape for slab legs
  const legShape = new THREE.Shape();
  const hw = LEG_W / 2;
  const ht = LEG_T / 2;
  const r = LEG_R;
  legShape.moveTo(-hw + r, -ht);
  legShape.lineTo(hw - r, -ht);
  legShape.absarc(hw - r, -ht + r, r, -Math.PI / 2, 0, false);
  legShape.lineTo(hw, ht - r);
  legShape.absarc(hw - r, ht - r, r, 0, Math.PI / 2, false);
  legShape.lineTo(-hw + r, ht);
  legShape.absarc(-hw + r, ht - r, r, Math.PI / 2, Math.PI, false);
  legShape.lineTo(-hw, -ht + r);
  legShape.absarc(-hw + r, -ht + r, r, Math.PI, Math.PI * 1.5, false);

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  legGeo.rotateX(-Math.PI / 2);

  const glideGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: GLIDE_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  glideGeo.rotateX(-Math.PI / 2);

  const plateGeo = new THREE.BoxGeometry(LEG_W * 0.82, 0.008, LEG_T * 0.85);

  const legConfigs = [
    { name: 'front_left',  x: -LEG_OFFSET_X, z:  LEG_OFFSET_Z, ry: Math.PI / 2 + LEG_ANGLE },
    { name: 'front_right', x:  LEG_OFFSET_X, z:  LEG_OFFSET_Z, ry: Math.PI / 2 - LEG_ANGLE },
    { name: 'back_left',   x: -LEG_OFFSET_X, z: -LEG_OFFSET_Z, ry: Math.PI / 2 - LEG_ANGLE },
    { name: 'back_right',  x:  LEG_OFFSET_X, z: -LEG_OFFSET_Z, ry: Math.PI / 2 + LEG_ANGLE }
  ];

  legConfigs.forEach((cfg) => {
    addMesh(glideGeo, glideMat, `leg_glide_${cfg.name}`, cfg.x, 0, cfg.z, 0, cfg.ry, 0);
    addMesh(legGeo, oakMat, `slab_leg_${cfg.name}`, cfg.x, GLIDE_H, cfg.z, 0, cfg.ry, 0);
    addMesh(plateGeo, steelMat, `leg_plate_${cfg.name}`, cfg.x, H - TOP_T - 0.004, cfg.z, 0, cfg.ry, 0);
  });

  // Under-frame stretchers (long rails along X, cross rails along Z)
  const railH = 0.032;
  const railT = 0.045;
  const railY = H - TOP_T - railH / 2;

  const longRailGeo = new THREE.BoxGeometry(LEG_OFFSET_X * 2, railH, railT);
  addMesh(longRailGeo, oakAltMat, 'stretcher_long_front', 0, railY, LEG_OFFSET_Z);
  addMesh(longRailGeo, oakAltMat, 'stretcher_long_back', 0, railY, -LEG_OFFSET_Z);

  const crossRailGeo = new THREE.BoxGeometry(railT, railH, LEG_OFFSET_Z * 2);
  addMesh(crossRailGeo, oakAltMat, 'stretcher_cross_left', -LEG_OFFSET_X, railY, 0);
  addMesh(crossRailGeo, oakAltMat, 'stretcher_cross_right', LEG_OFFSET_X, railY, 0);

  return group;
}
