function build(THREE) {
  const group = new THREE.Group();

  const W = 0.45;
  const H = 0.45;
  const D = 0.04;
  const CENTER_Y = H / 2;

  const LOBES = 12;
  const R_OUTER_AVG = 0.211;
  const R_OUTER_AMP = 0.014; // max = 0.225 => diameter = 0.45
  const R_INNER_AVG = 0.152;
  const R_INNER_AMP = 0.008;

  const BACK_Z = -D / 2;
  const GLASS_THICKNESS = 0.004;
  const BACK_THICKNESS = 0.006;
  const FRAME_DEPTH = D - BACK_THICKNESS;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0b6c7c,
    roughness: 0.34,
    metalness: 0.05,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x1a2226,
    roughness: 0.85,
    metalness: 0.05,
  });

  // 1. Flat back plate (lies at z = -D/2)
  const backGeo = new THREE.CylinderGeometry(R_OUTER_AVG - 0.015, R_OUTER_AVG - 0.015, BACK_THICKNESS, 32);
  backGeo.rotateX(Math.PI / 2);
  const backPlate = new THREE.Mesh(backGeo, backMat);
  backPlate.name = 'back_plate';
  backPlate.position.set(0, CENTER_Y, BACK_Z + BACK_THICKNESS / 2);
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);

  // 2. Mirror glass disc (sits just in front of back plate, behind frame lip)
  const glassGeo = new THREE.CylinderGeometry(R_INNER_AVG + R_INNER_AMP + 0.006, R_INNER_AVG + R_INNER_AMP + 0.006, GLASS_THICKNESS, 32);
  glassGeo.rotateX(Math.PI / 2);
  const mirrorGlass = new THREE.Mesh(glassGeo, mirrorMat);
  mirrorGlass.name = 'mirror_glass';
  mirrorGlass.position.set(0, CENTER_Y, BACK_Z + BACK_THICKNESS + GLASS_THICKNESS / 2);
  mirrorGlass.castShadow = true;
  mirrorGlass.receiveShadow = true;
  group.add(mirrorGlass);

  // 3. Scalloped frame base (ExtrudeGeometry with 12-lobed outer & inner contours)
  const SEGMENTS = 144;
  const outerShape = new THREE.Shape();
  for (let i = 0; i <= SEGMENTS; i++) {
    const theta = (i / SEGMENTS) * Math.PI * 2;
    const r = R_OUTER_AVG + R_OUTER_AMP * Math.cos(LOBES * theta);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    if (i === 0) outerShape.moveTo(x, y);
    else outerShape.lineTo(x, y);
  }

  const innerHole = new THREE.Path();
  for (let i = 0; i <= SEGMENTS; i++) {
    const theta = -(i / SEGMENTS) * Math.PI * 2;
    const r = R_INNER_AVG + R_INNER_AMP * Math.cos(LOBES * theta);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    if (i === 0) innerHole.moveTo(x, y);
    else innerHole.lineTo(x, y);
  }
  outerShape.holes.push(innerHole);

  const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH * 0.65,
    bevelEnabled: true,
    bevelThickness: FRAME_DEPTH * 0.175,
    bevelSize: 0.006,
    bevelSegments: 4,
    curveSegments: 1,
  });

  const frameBase = new THREE.Mesh(frameGeo, frameMat);
  frameBase.name = 'frame_base';
  frameBase.position.set(0, CENTER_Y, BACK_Z + BACK_THICKNESS);
  frameBase.castShadow = true;
  frameBase.receiveShadow = true;
  group.add(frameBase);

  // 4. Radial fluted ribs between the 12 lobes
  const ribRadius = 0.0075;
  const ribLength = (R_OUTER_AVG - R_OUTER_AMP) - (R_INNER_AVG - R_INNER_AMP) - 0.006;
  const ribMidR = ((R_OUTER_AVG - R_OUTER_AMP) + (R_INNER_AVG - R_INNER_AMP)) / 2;
  const ribGeo = new THREE.CapsuleGeometry(ribRadius, ribLength, 4, 12);

  for (let i = 0; i < LOBES; i++) {
    const theta = ((i + 0.5) / LOBES) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeo, frameMat);
    rib.name = `frame_rib_${i + 1}`;
    rib.position.set(
      ribMidR * Math.cos(theta),
      CENTER_Y + ribMidR * Math.sin(theta),
      BACK_Z + D - ribRadius * 1.15
    );
    rib.rotation.z = theta - Math.PI / 2;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  // 5. Outer scalloped rim accents on each lobe crest
  const rimTubeR = 0.0065;
  const rimArcR = 0.028;
  const rimGeo = new THREE.TorusGeometry(rimArcR, rimTubeR, 10, 18, Math.PI * 0.72);

  for (let i = 0; i < LOBES; i++) {
    const theta = (i / LOBES) * Math.PI * 2;
    const lobePeakR = R_OUTER_AVG + R_OUTER_AMP - rimArcR - rimTubeR * 0.5;
    const rim = new THREE.Mesh(rimGeo, frameMat);
    rim.name = `frame_rim_${i + 1}`;
    rim.position.set(
      lobePeakR * Math.cos(theta),
      CENTER_Y + lobePeakR * Math.sin(theta),
      BACK_Z + D - rimTubeR * 1.2
    );
    rim.rotation.z = theta - Math.PI * 0.36;
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);
  }

  return group;
}
