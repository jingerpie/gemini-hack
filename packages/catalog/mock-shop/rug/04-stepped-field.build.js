function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - 80 x 150 cm including fringes
  const W = 0.80;
  const FRINGE_L = 0.05;
  const FRINGE_OVERLAP = 0.005;
  const D = 1.50 - 2 * (FRINGE_L - FRINGE_OVERLAP); // 1.41 m
  const THICK = 0.010;
  const LAYER_H = 0.002;
  const LAYER_Y = THICK - 0.0005;

  const sx = W / 1.60;
  const sz = D / 2.20;

  // Materials (matte woven wool/cotton)
  const matTeal = new THREE.MeshStandardMaterial({
    color: 0x155d62,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matOchre = new THREE.MeshStandardMaterial({
    color: 0xc88e1d,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matOrange = new THREE.MeshStandardMaterial({
    color: 0xc45322,
    roughness: 0.9,
    metalness: 0.0,
  });
  const matBrown = new THREE.MeshStandardMaterial({
    color: 0x5e3e27,
    roughness: 0.92,
    metalness: 0.0,
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

  // 1. Main rug base
  const baseGeo = new THREE.BoxGeometry(W, THICK, D);
  addMesh(baseGeo, matTeal, "rug_base", 0, THICK / 2, 0);

  // 2. End bands (ochre edge bands + burnt orange inner stripes)
  const bandD = 0.035 * sz;
  const endBandGeo = new THREE.BoxGeometry(W, LAYER_H, bandD);
  addMesh(endBandGeo, matOchre, "band_ochre_front", 0, LAYER_Y, D / 2 - bandD / 2);
  addMesh(endBandGeo, matOchre, "band_ochre_back", 0, LAYER_Y, -D / 2 + bandD / 2);

  const stripeGeo = new THREE.BoxGeometry(W - 0.08 * sx, LAYER_H, bandD);
  addMesh(stripeGeo, matOrange, "band_orange_front", 0, LAYER_Y, D / 2 - 0.095 * sz);
  addMesh(stripeGeo, matOrange, "band_orange_back", 0, LAYER_Y, -D / 2 + 0.095 * sz);

  // 3. Fringes at +Z and -Z using ExtrudeGeometry comb profile
  const fringeShape = new THREE.Shape();
  const teeth = 28;
  const toothW = W / teeth;
  fringeShape.moveTo(-W / 2, 0);
  for (let i = 0; i < teeth; i++) {
    const x0 = -W / 2 + i * toothW;
    fringeShape.lineTo(x0 + toothW * 0.15, 0);
    fringeShape.lineTo(x0 + toothW * 0.25, FRINGE_L);
    fringeShape.lineTo(x0 + toothW * 0.65, FRINGE_L);
    fringeShape.lineTo(x0 + toothW * 0.75, 0);
  }
  fringeShape.lineTo(W / 2, 0);
  fringeShape.lineTo(W / 2, -0.008);
  fringeShape.lineTo(-W / 2, -0.008);
  fringeShape.closePath();

  const fringeGeo = new THREE.ExtrudeGeometry(fringeShape, {
    depth: 0.004,
    bevelEnabled: false,
  });
  fringeGeo.rotateX(Math.PI / 2);

  addMesh(fringeGeo, matCream, "fringe_front", 0, 0.005, D / 2 - FRINGE_OVERLAP);
  const fringeBack = addMesh(fringeGeo, matCream, "fringe_back", 0, 0.005, -D / 2 + FRINGE_OVERLAP);
  fringeBack.rotation.y = Math.PI;

  // 4. Center column cream zigzag borders
  function makeZigzag(xSign) {
    const shape = new THREE.Shape();
    const zSpan = D - 0.34 * sz;
    const zStart = -zSpan / 2;
    const segs = 6;
    const dz = zSpan / segs;
    const xIn = 0.13 * sx * xSign;
    const xOut = 0.23 * sx * xSign;
    const thickX = 0.055 * sx * xSign;

    shape.moveTo(xIn, zStart);
    for (let i = 0; i < segs; i++) {
      const zMid = zStart + (i + 0.5) * dz;
      const zNext = zStart + (i + 1) * dz;
      const xTarget = i % 2 === 0 ? xOut : xIn;
      shape.lineTo(xTarget, zMid);
      shape.lineTo(i % 2 === 0 ? xIn : xOut, zNext);
    }
    for (let i = segs; i > 0; i--) {
      const zMid = zStart + (i - 0.5) * dz;
      const zPrev = zStart + (i - 1) * dz;
      const xTarget = (i - 1) % 2 === 0 ? xOut : xIn;
      shape.lineTo((i - 1) % 2 === 0 ? xIn + thickX : xOut + thickX, zStart + i * dz);
      shape.lineTo(xTarget + thickX, zMid);
      shape.lineTo(((i - 1) % 2 === 0 ? xIn : xOut) + thickX, zPrev);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: LAYER_H,
      bevelEnabled: false,
    });
    geo.rotateX(Math.PI / 2);
    return geo;
  }

  addMesh(makeZigzag(-1), matCream, "center_cream_left", 0, LAYER_Y + LAYER_H, 0);
  addMesh(makeZigzag(1), matCream, "center_cream_right", 0, LAYER_Y + LAYER_H, 0);

  // 5. Diamond motifs (3 rows along Z)
  const zPositions = [-0.58 * sz, 0, 0.58 * sz];
  const xColumns = [
    { name: "left", x: -0.50 * sx },
    { name: "right", x: 0.50 * sx },
  ];

  const brownDiaGeo = new THREE.BoxGeometry(0.32 * sx, LAYER_H, 0.32 * sx);
  const orangeDiaGeo = new THREE.BoxGeometry(0.21 * sx, LAYER_H, 0.21 * sx);
  const ochreDiaGeo = new THREE.BoxGeometry(0.11 * sx, LAYER_H, 0.11 * sx);

  const centerBrownGeo = new THREE.BoxGeometry(0.26 * sx, LAYER_H, 0.26 * sx);
  const centerOrangeGeo = new THREE.BoxGeometry(0.14 * sx, LAYER_H, 0.14 * sx);

  for (let i = 0; i < zPositions.length; i++) {
    const zp = zPositions[i];
    const idx = i + 1;

    // Center column diamonds
    addMesh(centerBrownGeo, matBrown, "center_brown_" + idx, 0, LAYER_Y, zp, 0, Math.PI / 4, 0);
    addMesh(centerOrangeGeo, matOrange, "center_orange_" + idx, 0, LAYER_Y + 0.0005, zp, 0, Math.PI / 4, 0);

    // Left and right column diamonds
    for (let c = 0; c < xColumns.length; c++) {
      const col = xColumns[c];
      addMesh(brownDiaGeo, matBrown, col.name + "_brown_" + idx, col.x, LAYER_Y, zp, 0, Math.PI / 4, 0);
      addMesh(orangeDiaGeo, matOrange, col.name + "_orange_" + idx, col.x, LAYER_Y + 0.0004, zp, 0, Math.PI / 4, 0);
      addMesh(ochreDiaGeo, matOchre, col.name + "_ochre_" + idx, col.x, LAYER_Y + 0.0008, zp, 0, Math.PI / 4, 0);
    }
  }

  // 6. Ochre accent dots between columns
  const dotGeo = new THREE.CylinderGeometry(0.055 * sx, 0.055 * sx, LAYER_H, 6);
  const dotZ = [-0.29 * sz, 0.29 * sz, 0.84 * sz];
  for (let i = 0; i < dotZ.length; i++) {
    addMesh(dotGeo, matOchre, "dot_left_" + (i + 1), -0.27 * sx, LAYER_Y, dotZ[i]);
    addMesh(dotGeo, matOchre, "dot_right_" + (i + 1), 0.27 * sx, LAYER_Y, dotZ[i]);
  }

  return group;
}
