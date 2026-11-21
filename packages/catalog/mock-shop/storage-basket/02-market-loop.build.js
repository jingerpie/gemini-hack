function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.32;
  const D = 0.20;
  const H = 0.22;
  const BODY_H = 0.14;
  const BASE_THICK = 0.008;
  const WALL_THICK = 0.007;

  const BOTTOM_W = 0.27;
  const BOTTOM_D = 0.16;
  const BOTTOM_R = 0.055;
  const TOP_R = 0.075;

  const HANDLE_SPAN = 0.13;
  const HANDLE_R = 0.0065;
  const HANDLE_ANCHOR_R = 0.009;
  const HANDLE_ANCHOR_H = 0.018;

  // Materials
  const reedMat = new THREE.MeshStandardMaterial({
    color: 0xe8d9be,
    roughness: 0.82,
    metalness: 0.0,
  });

  const reedAccentMat = new THREE.MeshStandardMaterial({
    color: 0xdccaa8,
    roughness: 0.85,
    metalness: 0.0,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xeadcc2,
    roughness: 0.78,
    metalness: 0.0,
  });

  // Helper: create rounded rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw - 0.001, hd - 0.001);
    shape.moveTo(-hw + cr, -hd);
    shape.lineTo(hw - cr, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    shape.lineTo(hw, hd - cr);
    shape.quadraticCurveTo(hw, hd, hw - cr, hd);
    shape.lineTo(-hw + cr, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    shape.lineTo(-hw, -hd + cr);
    shape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return shape;
  }

  // Helper: sample points around a rounded rectangle in XZ plane at height y
  function sampleRoundedRectPoints(w, d, r, y) {
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw - 0.001, hd - 0.001);
    const pts = [];
    const corners = [
      { cx: hw - cr, cz: hd - cr, startAngle: 0 },
      { cx: -hw + cr, cz: hd - cr, startAngle: Math.PI / 2 },
      { cx: -hw + cr, cz: -hd + cr, startAngle: Math.PI },
      { cx: hw - cr, cz: -hd + cr, startAngle: (3 * Math.PI) / 2 },
    ];
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      for (let j = 0; j <= 3; j++) {
        const a = c.startAngle + (j / 3) * (Math.PI / 2);
        pts.push(new THREE.Vector3(c.cx + Math.cos(a) * cr, y, c.cz + Math.sin(a) * cr));
      }
    }
    return pts;
  }

  // 1. Basket Base
  const baseShape = createRoundedRectShape(BOTTOM_W, BOTTOM_D, BOTTOM_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_THICK,
    bevelEnabled: false,
    curveSegments: 16,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, reedAccentMat);
  baseMesh.name = 'basket_base';
  baseMesh.position.y = 0;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Inner Core Wall (solid backing so weave has depth)
  const coreLevels = 7;
  const coreShape = createRoundedRectShape(
    (BOTTOM_W + W) / 2 - WALL_THICK * 0.8,
    (BOTTOM_D + D) / 2 - WALL_THICK * 0.8,
    (BOTTOM_R + TOP_R) / 2
  );
  const coreHole = createRoundedRectShape(
    (BOTTOM_W + W) / 2 - WALL_THICK * 2.2,
    (BOTTOM_D + D) / 2 - WALL_THICK * 2.2,
    (BOTTOM_R + TOP_R) / 2 - WALL_THICK
  );
  coreShape.holes.push(coreHole);
  const coreGeo = new THREE.ExtrudeGeometry(coreShape, {
    depth: BODY_H - BASE_THICK - 0.008,
    bevelEnabled: false,
    curveSegments: 16,
  });
  coreGeo.rotateX(-Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, reedAccentMat);
  coreMesh.name = 'basket_inner_core';
  coreMesh.position.y = BASE_THICK;
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // 3. Horizontal Woven Bands
  const numBands = 7;
  const bandRadius = 0.0045;
  for (let i = 0; i < numBands; i++) {
    const t = (i + 0.5) / numBands;
    const y = BASE_THICK + t * (BODY_H - BASE_THICK - 0.008);
    const bw = BOTTOM_W + t * (W - BOTTOM_W) - bandRadius * 2;
    const bd = BOTTOM_D + t * (D - BOTTOM_D) - bandRadius * 2;
    const br = BOTTOM_R + t * (TOP_R - BOTTOM_R);

    const pts = sampleRoundedRectPoints(bw, bd, br, y);
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const bandGeo = new THREE.TubeGeometry(curve, 48, bandRadius, 8, true);
    const bandMesh = new THREE.Mesh(bandGeo, i % 2 === 0 ? reedMat : reedAccentMat);
    bandMesh.name = `weave_band_${i}`;
    bandMesh.castShadow = true;
    bandMesh.receiveShadow = true;
    group.add(bandMesh);
  }

  // 4. Top Rim Binding
  const rimRadius = 0.0075;
  const rimY = BODY_H - rimRadius;
  const rimPts = sampleRoundedRectPoints(W - rimRadius * 2, D - rimRadius * 2, TOP_R, rimY);
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 56, rimRadius, 12, true);
  const rimMesh = new THREE.Mesh(rimGeo, reedMat);
  rimMesh.name = 'rim_band';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 5. Vertical Woven Ribs around perimeter
  const numRibs = 12;
  const ribRadius = 0.0032;
  const bottomPts = sampleRoundedRectPoints(BOTTOM_W - 0.006, BOTTOM_D - 0.006, BOTTOM_R, BASE_THICK);
  const topPts = sampleRoundedRectPoints(W - 0.012, D - 0.012, TOP_R, BODY_H - 0.006);
  const step = Math.floor(bottomPts.length / numRibs);

  for (let i = 0; i < numRibs; i++) {
    const idx = (i * step) % bottomPts.length;
    const pBot = bottomPts[idx];
    const pTop = topPts[idx];
    const pMid = new THREE.Vector3().lerpVectors(pBot, pTop, 0.5);
    const ribCurve = new THREE.CatmullRomCurve3([pBot, pMid, pTop]);
    const ribGeo = new THREE.TubeGeometry(ribCurve, 8, ribRadius, 6, false);
    const ribMesh = new THREE.Mesh(ribGeo, reedMat);
    ribMesh.name = `vertical_rib_${i}`;
    ribMesh.castShadow = true;
    ribMesh.receiveShadow = true;
    group.add(ribMesh);
  }

  // 6. Front and Back Arched Handles
  const handleZ = D / 2 - rimRadius * 1.2;
  const handleHalfSpan = HANDLE_SPAN / 2;
  const handlePeakY = H - HANDLE_R;

  function createHandle(sideSign, name) {
    const z = sideSign * handleZ;
    const pts = [
      new THREE.Vector3(-handleHalfSpan, BODY_H - 0.022, z),
      new THREE.Vector3(-handleHalfSpan, BODY_H + 0.005, z),
      new THREE.Vector3(-handleHalfSpan * 0.72, BODY_H + (handlePeakY - BODY_H) * 0.65, z),
      new THREE.Vector3(0, handlePeakY, z),
      new THREE.Vector3(handleHalfSpan * 0.72, BODY_H + (handlePeakY - BODY_H) * 0.65, z),
      new THREE.Vector3(handleHalfSpan, BODY_H + 0.005, z),
      new THREE.Vector3(handleHalfSpan, BODY_H - 0.022, z),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 32, HANDLE_R, 12, false);
    const mesh = new THREE.Mesh(geo, handleMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  group.add(createHandle(1, 'handle_front'));
  group.add(createHandle(-1, 'handle_back'));

  // 7. Handle Anchor Collars
  const anchorGeo = new THREE.CylinderGeometry(HANDLE_ANCHOR_R, HANDLE_ANCHOR_R, HANDLE_ANCHOR_H, 12);
  const anchorPositions = [
    { x: -handleHalfSpan, z: handleZ, name: 'handle_anchor_fl' },
    { x: handleHalfSpan, z: handleZ, name: 'handle_anchor_fr' },
    { x: -handleHalfSpan, z: -handleZ, name: 'handle_anchor_bl' },
    { x: handleHalfSpan, z: -handleZ, name: 'handle_anchor_br' },
  ];

  for (let i = 0; i < anchorPositions.length; i++) {
    const pos = anchorPositions[i];
    const anchorMesh = new THREE.Mesh(anchorGeo, reedAccentMat);
    anchorMesh.name = pos.name;
    anchorMesh.position.set(pos.x, BODY_H - HANDLE_ANCHOR_H * 0.35, pos.z);
    anchorMesh.castShadow = true;
    anchorMesh.receiveShadow = true;
    group.add(anchorMesh);
  }

  return group;
}
