function build(THREE) {
  const group = new THREE.Group();

  // Overall dimensions (meters)
  const W = 0.30; // Exact overall width along X (30 cm)
  const H = 0.50; // Exact overall height along Y (50 cm)
  const D = 0.018; // Overall depth along Z

  const Z_BACK = -D / 2;
  const TEXTILE_W = 0.216;
  const TEXTILE_D = 0.008;
  const FRINGE_H = 0.065;
  const BODY_H = 0.345;
  const BODY_Y0 = FRINGE_H;
  const BODY_Y1 = BODY_Y0 + BODY_H; // 0.410

  const DOWEL_R = 0.008;
  const DOWEL_Y = BODY_Y1 - 0.005; // 0.405
  const DOWEL_Z = Z_BACK + DOWEL_R;

  const CORD_R = 0.002;
  const CORD_PEAK_Y = H - CORD_R; // 0.498, so top touches H = 0.50

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd9b991,
    roughness: 0.72,
    metalness: 0.0,
  });

  const turquoiseMat = new THREE.MeshStandardMaterial({
    color: 0x3eb8be,
    roughness: 0.92,
    metalness: 0.0,
  });

  const darkTealMat = new THREE.MeshStandardMaterial({
    color: 0x0b8698,
    roughness: 0.92,
    metalness: 0.0,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xece6da,
    roughness: 0.9,
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

  // 1. Wooden dowel
  const dowelGeo = new THREE.CylinderGeometry(DOWEL_R, DOWEL_R, W, 20);
  addMesh(dowelGeo, woodMat, "wooden_dowel", 0, DOWEL_Y, DOWEL_Z, 0, 0, Math.PI / 2);

  // 2. Hanging cord (triangle above dowel)
  const cordAttachX = TEXTILE_W / 2 + 0.004;
  const cordCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-cordAttachX, DOWEL_Y, DOWEL_Z),
      new THREE.Vector3(-cordAttachX * 0.5, (DOWEL_Y + CORD_PEAK_Y) * 0.5, DOWEL_Z),
      new THREE.Vector3(0, CORD_PEAK_Y, DOWEL_Z),
      new THREE.Vector3(cordAttachX * 0.5, (DOWEL_Y + CORD_PEAK_Y) * 0.5, DOWEL_Z),
      new THREE.Vector3(cordAttachX, DOWEL_Y, DOWEL_Z),
    ],
    false,
    "catmullrom",
    0.05
  );
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, CORD_R, 8, false);
  addMesh(cordGeo, creamMat, "hanging_cord", 0, 0, 0);

  // Cord wraps around dowel
  const wrapGeo = new THREE.TorusGeometry(DOWEL_R + CORD_R * 0.7, CORD_R, 8, 16);
  addMesh(wrapGeo, creamMat, "cord_wrap_left", -cordAttachX, DOWEL_Y, DOWEL_Z, 0, Math.PI / 2, 0);
  addMesh(wrapGeo, creamMat, "cord_wrap_right", cordAttachX, DOWEL_Y, DOWEL_Z, 0, Math.PI / 2, 0);

  // 3. Textile main body
  const bodyZ = Z_BACK + TEXTILE_D / 2;
  const bodyGeo = new THREE.BoxGeometry(TEXTILE_W, BODY_H, TEXTILE_D);
  addMesh(bodyGeo, turquoiseMat, "textile_body", 0, BODY_Y0 + BODY_H / 2, bodyZ);

  // Textile top sleeve wrapped around dowel
  const sleeveGeo = new THREE.CylinderGeometry(
    DOWEL_R + 0.0018,
    DOWEL_R + 0.0018,
    TEXTILE_W,
    16
  );
  addMesh(sleeveGeo, turquoiseMat, "textile_top_sleeve", 0, DOWEL_Y, DOWEL_Z, 0, 0, Math.PI / 2);

  // 4. Horizontal dark teal stripes (3 top, 3 middle, 3 bottom)
  const stripeH = 0.0045;
  const stripeD = 0.0012;
  const stripeZ = Z_BACK + TEXTILE_D + stripeD / 2;
  const stripeGeo = new THREE.BoxGeometry(TEXTILE_W, stripeH, stripeD);

  const topStripeBaseY = BODY_Y1 - 0.036;
  for (let i = 0; i < 3; i++) {
    addMesh(
      stripeGeo,
      darkTealMat,
      "top_stripe_" + (i + 1),
      0,
      topStripeBaseY - i * 0.0085,
      stripeZ
    );
  }

  const midStripeBaseY = BODY_Y0 + BODY_H * 0.5 + 0.0085;
  for (let i = 0; i < 3; i++) {
    addMesh(
      stripeGeo,
      darkTealMat,
      "middle_stripe_" + (i + 1),
      0,
      midStripeBaseY - i * 0.0085,
      stripeZ
    );
  }

  const botStripeBaseY = BODY_Y0 + 0.044;
  for (let i = 0; i < 3; i++) {
    addMesh(
      stripeGeo,
      darkTealMat,
      "bottom_stripe_" + (i + 1),
      0,
      botStripeBaseY - i * 0.0085,
      stripeZ
    );
  }

  // 5. Central stepped diamond motif (ExtrudeGeometry)
  const stepW = 0.015;
  const stepH = 0.022;
  // Half-widths from top to middle (5 tiers, symmetric bottom)
  const halfWidths = [1, 2, 3, 4, 5]; // in units of stepW
  const diamondShape = new THREE.Shape();

  // Start at top-left of topmost tier
  const topY = 4.5 * stepH;
  diamondShape.moveTo(-halfWidths[0] * stepW, topY);
  diamondShape.lineTo(halfWidths[0] * stepW, topY);

  // Right side going down
  for (let i = 0; i < 4; i++) {
    const yStep = (3.5 - i) * stepH;
    diamondShape.lineTo(halfWidths[i] * stepW, yStep);
    diamondShape.lineTo(halfWidths[i + 1] * stepW, yStep);
  }
  // Middle widest right edge
  diamondShape.lineTo(halfWidths[4] * stepW, -1.5 * stepH);
  // Right side narrowing down
  for (let i = 3; i >= 0; i--) {
    const yStep = (-1.5 - (3 - i)) * stepH;
    diamondShape.lineTo(halfWidths[i + 1] * stepW, yStep);
    diamondShape.lineTo(halfWidths[i] * stepW, yStep);
  }
  // Bottom edge
  const botY = -4.5 * stepH;
  diamondShape.lineTo(halfWidths[0] * stepW, botY);
  diamondShape.lineTo(-halfWidths[0] * stepW, botY);

  // Left side going up
  for (let i = 0; i < 4; i++) {
    const yStep = (-3.5 + i) * stepH;
    diamondShape.lineTo(-halfWidths[i] * stepW, yStep);
    diamondShape.lineTo(-halfWidths[i + 1] * stepW, yStep);
  }
  // Middle widest left edge
  diamondShape.lineTo(-halfWidths[4] * stepW, 1.5 * stepH);
  // Left side narrowing up
  for (let i = 3; i >= 0; i--) {
    const yStep = (1.5 + (3 - i)) * stepH;
    diamondShape.lineTo(-halfWidths[i + 1] * stepW, yStep);
    diamondShape.lineTo(-halfWidths[i] * stepW, yStep);
  }
  diamondShape.closePath();

  const diamondGeo = new THREE.ExtrudeGeometry(diamondShape, {
    depth: 0.0018,
    bevelEnabled: false,
  });
  addMesh(
    diamondGeo,
    darkTealMat,
    "stepped_diamond_motif",
    0,
    BODY_Y0 + BODY_H * 0.5,
    Z_BACK + TEXTILE_D + 0.0004
  );

  // 6. Bottom fringe (11 knots + 11 tassels)
  const fringeCount = 11;
  const fringeSpan = TEXTILE_W - 0.016;
  const knotR = 0.0045;
  const knotGeo = new THREE.SphereGeometry(knotR, 10, 8);
  const tasselH = FRINGE_H - knotR;
  const tasselGeo = new THREE.CylinderGeometry(0.0055, 0.007, tasselH, 8);

  for (let i = 0; i < fringeCount; i++) {
    const fx = -fringeSpan / 2 + (i / (fringeCount - 1)) * fringeSpan;
    addMesh(
      knotGeo,
      creamMat,
      "fringe_knot_" + (i + 1),
      fx,
      BODY_Y0 - knotR * 0.6,
      bodyZ
    );
    addMesh(
      tasselGeo,
      creamMat,
      "fringe_tassel_" + (i + 1),
      fx,
      tasselH / 2,
      bodyZ
    );
  }

  return group;
}
