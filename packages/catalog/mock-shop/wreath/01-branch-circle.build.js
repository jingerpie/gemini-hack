function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.35;
  const RADIUS = DIAMETER / 2;
  const TUBE_R = 0.022;
  const RING_R = RADIUS - TUBE_R;

  const woodDark = new THREE.MeshStandardMaterial({
    color: 0x6b4c2e,
    roughness: 0.88,
    metalness: 0.0
  });
  const woodMid = new THREE.MeshStandardMaterial({
    color: 0x7d5a38,
    roughness: 0.85,
    metalness: 0.0
  });
  const woodLight = new THREE.MeshStandardMaterial({
    color: 0x967047,
    roughness: 0.82,
    metalness: 0.0
  });
  const driedGold = new THREE.MeshStandardMaterial({
    color: 0xc29b59,
    roughness: 0.9,
    metalness: 0.0
  });
  const driedTan = new THREE.MeshStandardMaterial({
    color: 0xa88248,
    roughness: 0.9,
    metalness: 0.0
  });
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0x9e733b,
    roughness: 0.85,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Core thin twig rings
  const coreGeo1 = new THREE.TorusGeometry(RING_R, 0.0055, 8, 32);
  addMesh(coreGeo1, woodDark, 'twig_core_1', [0, RADIUS, -0.004]);

  const coreGeo2 = new THREE.TorusGeometry(RING_R + 0.003, 0.0045, 8, 32);
  addMesh(coreGeo2, woodMid, 'twig_core_2', [0, RADIUS, 0.004], [0.03, -0.02, 0]);

  // Woven helical grapevine twigs around the ring
  const twigMats = [woodLight, woodDark, woodMid, woodLight, woodDark, woodMid, woodLight, woodDark];
  const numTwigs = 8;
  const ptsPerTwig = 32;

  for (let t = 0; t < numTwigs; t++) {
    const pts = [];
    const phase = (t / numTwigs) * Math.PI * 2;
    const twists = 5 + (t % 3);
    const waveR = TUBE_R * (0.58 + (t % 3) * 0.12);
    const twigThick = 0.0032 + (t % 2) * 0.0012;

    for (let i = 0; i < ptsPerTwig; i++) {
      const u = (i / ptsPerTwig) * Math.PI * 2;
      const v = u * twists + phase;
      const r = RING_R + Math.cos(v) * waveR;
      const x = Math.cos(u) * r;
      const y = RADIUS + Math.sin(u) * r;
      const z = Math.sin(v) * (waveR * 0.72);
      pts.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, twigThick, 6, true);
    addMesh(tubeGeo, twigMats[t], `woven_twig_${t + 1}`);
  }

  // Ribbon tie on the right side (+X)
  const tieX = RING_R;
  const tieY = RADIUS;
  const tieZ = 0.008;

  const wrapGeo = new THREE.TorusGeometry(TUBE_R * 0.95, 0.006, 8, 16);
  addMesh(wrapGeo, ribbonMat, 'ribbon_wrap', [tieX, tieY, tieZ - 0.005], [Math.PI / 2, 0.15, 0]);

  const knotGeo = new THREE.SphereGeometry(0.011, 10, 10);
  addMesh(knotGeo, ribbonMat, 'ribbon_knot', [tieX + 0.012, tieY - 0.002, tieZ + 0.012]);

  const tailGeo1 = new THREE.BoxGeometry(0.012, 0.065, 0.003);
  addMesh(tailGeo1, ribbonMat, 'ribbon_tail_left', [tieX + 0.01, tieY - 0.036, tieZ + 0.012], [0.05, 0, 0.08]);

  const tailGeo2 = new THREE.BoxGeometry(0.011, 0.058, 0.003);
  addMesh(tailGeo2, ribbonMat, 'ribbon_tail_right', [tieX + 0.022, tieY - 0.032, tieZ + 0.008], [0.08, -0.1, 0.25]);

  // Upper dried floral/grass fan (curving up along the right side)
  const upperStalks = [
    { type: 'wheat', len: 0.085, r: 0.005, pos: [tieX - 0.015, tieY + 0.055, tieZ + 0.006], rot: [0, 0, 0.35], mat: driedGold },
    { type: 'wheat', len: 0.075, r: 0.0045, pos: [tieX - 0.032, tieY + 0.082, tieZ + 0.004], rot: [0, 0, 0.55], mat: driedTan },
    { type: 'bunny', len: 0.022, r: 0.0065, pos: [tieX + 0.005, tieY + 0.048, tieZ + 0.01], rot: [0, 0, 0.15], mat: driedGold },
    { type: 'bunny', len: 0.020, r: 0.006, pos: [tieX - 0.008, tieY + 0.072, tieZ + 0.008], rot: [0, 0, 0.3], mat: driedTan },
    { type: 'pod', len: 0.005, r: 0.005, pos: [tieX - 0.002, tieY + 0.095, tieZ + 0.006], rot: [0, 0, 0], mat: driedTan },
    { type: 'pod', len: 0.005, r: 0.0045, pos: [tieX - 0.022, tieY + 0.105, tieZ + 0.005], rot: [0, 0, 0], mat: driedGold }
  ];

  upperStalks.forEach((s, idx) => {
    let geo;
    if (s.type === 'wheat') {
      geo = new THREE.ConeGeometry(s.r, s.len, 8);
    } else if (s.type === 'bunny') {
      geo = new THREE.CapsuleGeometry(s.r, s.len, 6, 8);
    } else {
      geo = new THREE.SphereGeometry(s.r, 8, 8);
    }
    addMesh(geo, s.mat, `upper_dried_${s.type}_${idx + 1}`, s.pos, s.rot);
  });

  // Lower dried floral/grass fan (curving down along the right side)
  const lowerStalks = [
    { type: 'wheat', len: 0.085, r: 0.005, pos: [tieX - 0.018, tieY - 0.058, tieZ + 0.006], rot: [0, 0, Math.PI - 0.38], mat: driedGold },
    { type: 'wheat', len: 0.075, r: 0.0045, pos: [tieX - 0.036, tieY - 0.084, tieZ + 0.004], rot: [0, 0, Math.PI - 0.58], mat: driedTan },
    { type: 'bunny', len: 0.022, r: 0.0065, pos: [tieX - 0.002, tieY - 0.052, tieZ + 0.01], rot: [0, 0, -0.2], mat: driedGold },
    { type: 'bunny', len: 0.020, r: 0.006, pos: [tieX - 0.016, tieY - 0.076, tieZ + 0.008], rot: [0, 0, -0.35], mat: driedTan },
    { type: 'pod', len: 0.005, r: 0.005, pos: [tieX - 0.008, tieY - 0.098, tieZ + 0.006], rot: [0, 0, 0], mat: driedTan },
    { type: 'pod', len: 0.005, r: 0.0045, pos: [tieX - 0.028, tieY - 0.106, tieZ + 0.005], rot: [0, 0, 0], mat: driedGold }
  ];

  lowerStalks.forEach((s, idx) => {
    let geo;
    if (s.type === 'wheat') {
      geo = new THREE.ConeGeometry(s.r, s.len, 8);
    } else if (s.type === 'bunny') {
      geo = new THREE.CapsuleGeometry(s.r, s.len, 6, 8);
    } else {
      geo = new THREE.SphereGeometry(s.r, 8, 8);
    }
    addMesh(geo, s.mat, `lower_dried_${s.type}_${idx + 1}`, s.pos, s.rot);
  });

  return group;
}
