function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.34;
  const MIRROR_W = 0.20;
  const MIRROR_H = 0.28;
  const FRAME_D = 0.016;
  const FRAME_T = 0.005;
  const BASE_W = 0.15;
  const BASE_D = 0.11;
  const BASE_H = 0.005;
  const PAD_H = 0.0015;
  const STEM_W = 0.024;
  const STEM_T = 0.005;
  const TILT = -0.18;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x9a8f85,
    metalness: 0.65,
    roughness: 0.38
  });

  const innerBezelMat = new THREE.MeshStandardMaterial({
    color: 0x2e2a27,
    metalness: 0.3,
    roughness: 0.6
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    metalness: 0.0,
    roughness: 0.9
  });

  function makeMesh(geom, mat, name) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const cr = Math.min(r, hw, hh);
    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.absarc(hw - cr, -hh + cr, cr, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hh - cr);
    shape.absarc(hw - cr, hh - cr, cr, 0, Math.PI / 2, false);
    shape.lineTo(-hw + cr, hh);
    shape.absarc(-hw + cr, hh - cr, cr, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hh + cr);
    shape.absarc(-hw + cr, -hh + cr, cr, Math.PI, Math.PI * 1.5, false);
    return shape;
  }

  // Base pads (4 corners)
  const padGeo = new THREE.CylinderGeometry(0.006, 0.006, PAD_H, 16);
  const padOffsetX = BASE_W / 2 - 0.015;
  const padOffsetZ = BASE_D / 2 - 0.015;
  const padPositions = [
    [-padOffsetX, PAD_H / 2, padOffsetZ, 'base_pad_fl'],
    [padOffsetX, PAD_H / 2, padOffsetZ, 'base_pad_fr'],
    [-padOffsetX, PAD_H / 2, -padOffsetZ, 'base_pad_bl'],
    [padOffsetX, PAD_H / 2, -padOffsetZ, 'base_pad_br']
  ];
  for (let i = 0; i < padPositions.length; i++) {
    const p = padPositions[i];
    const pad = makeMesh(padGeo, padMat, p[3]);
    pad.position.set(p[0], p[1], p[2]);
    group.add(pad);
  }

  // Base plate
  const baseShape = createRoundedRectShape(BASE_W, BASE_D, 0.008);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 16
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = makeMesh(baseGeo, frameMat, 'base_plate');
  baseMesh.position.set(0, PAD_H + BASE_H, 0);
  group.add(baseMesh);

  // Mirror head group
  const mirrorHead = new THREE.Group();
  const mirrorCenterY = H - (MIRROR_H / 2) * Math.cos(TILT);
  const mirrorCenterZ = 0.008;
  mirrorHead.position.set(0, mirrorCenterY, mirrorCenterZ);
  mirrorHead.rotation.x = TILT;
  group.add(mirrorHead);

  // Outer frame (stadium/pill shape with cutout)
  const outerShape = createRoundedRectShape(MIRROR_W, MIRROR_H, MIRROR_W / 2);
  const innerW = MIRROR_W - FRAME_T * 2;
  const innerH = MIRROR_H - FRAME_T * 2;
  const innerHole = createRoundedRectShape(innerW, innerH, innerW / 2);
  outerShape.holes.push(innerHole);

  const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_D,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 32
  });
  frameGeo.translate(0, 0, -FRAME_D / 2);
  const frameMesh = makeMesh(frameGeo, frameMat, 'mirror_frame_outer');
  mirrorHead.add(frameMesh);

  // Back plate
  const backShape = createRoundedRectShape(MIRROR_W - 0.002, MIRROR_H - 0.002, (MIRROR_W - 0.002) / 2);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.004,
    bevelEnabled: false,
    curveSegments: 32
  });
  backGeo.translate(0, 0, -FRAME_D / 2);
  const backMesh = makeMesh(backGeo, frameMat, 'mirror_back_plate');
  mirrorHead.add(backMesh);

  // Inner dark bezel
  const bezelShape = createRoundedRectShape(innerW, innerH, innerW / 2);
  const glassW = innerW - 0.003;
  const glassH = innerH - 0.003;
  const bezelHole = createRoundedRectShape(glassW, glassH, glassW / 2);
  bezelShape.holes.push(bezelHole);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 32
  });
  bezelGeo.translate(0, 0, FRAME_D / 2 - 0.0045);
  const bezelMesh = makeMesh(bezelGeo, innerBezelMat, 'mirror_inner_bezel');
  mirrorHead.add(bezelMesh);

  // Mirror glass
  const glassShape = createRoundedRectShape(glassW, glassH, glassW / 2);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 32
  });
  glassGeo.translate(0, 0, FRAME_D / 2 - 0.0035);
  const glassMesh = makeMesh(glassGeo, mirrorMat, 'mirror_glass');
  mirrorHead.add(glassMesh);

  // Support stem connecting base to back of mirror
  const stemBaseZ = -BASE_D / 2 + 0.022;
  const stemBaseY = PAD_H + BASE_H;
  const attachY = mirrorCenterY - 0.095;
  const attachZ = mirrorCenterZ - (FRAME_D / 2) * Math.cos(TILT) + 0.095 * Math.sin(-TILT);

  const dx = attachZ - stemBaseZ;
  const dy = attachY - stemBaseY;
  const stemLen = Math.sqrt(dx * dx + dy * dy);
  const stemAngle = Math.atan2(dx, dy);

  const stemGeo = new THREE.BoxGeometry(STEM_W, stemLen, STEM_T);
  const stemMesh = makeMesh(stemGeo, frameMat, 'stem_arm');
  stemMesh.position.set(0, stemBaseY + dy / 2, stemBaseZ + dx / 2);
  stemMesh.rotation.x = stemAngle;
  group.add(stemMesh);

  // Stem base foot/bend
  const stemFootGeo = new THREE.CylinderGeometry(STEM_T / 2, STEM_T / 2, STEM_W, 12);
  stemFootGeo.rotateZ(Math.PI / 2);
  const stemFootMesh = makeMesh(stemFootGeo, frameMat, 'stem_base_joint');
  stemFootMesh.position.set(0, stemBaseY, stemBaseZ);
  group.add(stemFootMesh);

  // Pivot bracket on back of mirror
  const bracketGeo = new THREE.BoxGeometry(STEM_W + 0.006, 0.022, 0.014);
  const bracketMesh = makeMesh(bracketGeo, frameMat, 'pivot_bracket');
  bracketMesh.position.set(0, -0.095, -FRAME_D / 2 - 0.005);
  mirrorHead.add(bracketMesh);

  // Pivot pins
  const pinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 12);
  pinGeo.rotateZ(Math.PI / 2);
  const pinLeft = makeMesh(pinGeo, frameMat, 'pivot_pin_left');
  pinLeft.position.set(-(STEM_W + 0.006) / 2 - 0.001, -0.095, -FRAME_D / 2 - 0.005);
  mirrorHead.add(pinLeft);

  const pinRight = makeMesh(pinGeo, frameMat, 'pivot_pin_right');
  pinRight.position.set((STEM_W + 0.006) / 2 + 0.001, -0.095, -FRAME_D / 2 - 0.005);
  mirrorHead.add(pinRight);

  return group;
}
