function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.30;
  const H = 0.55;
  const D = 0.016;
  const STEM_R = 0.0032;
  const LEAF_THICK = 0.0022;

  // Materials
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb06a3b,
    metalness: 0.8,
    roughness: 0.35,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x8a5230,
    metalness: 0.8,
    roughness: 0.4,
  });

  const extrudeSettings = {
    depth: LEAF_THICK,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 2,
    curveSegments: 8,
  };

  // Helper to create a 2D broad fern leaflet shape positioned and rotated in the XY plane
  function createLeafShape2D(cx, cy, angle, length, width) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tx = (u, v) => cx + u * cos - v * sin;
    const ty = (u, v) => cy + u * sin + v * cos;

    const shape = new THREE.Shape();
    shape.moveTo(tx(0, 0), ty(0, 0));
    shape.quadraticCurveTo(
      tx(0.18 * length, 0.55 * width),
      ty(0.18 * length, 0.55 * width),
      tx(0.55 * length, 0.42 * width),
      ty(0.55 * length, 0.42 * width)
    );
    shape.quadraticCurveTo(
      tx(0.82 * length, 0.25 * width),
      ty(0.82 * length, 0.25 * width),
      tx(length, 0),
      ty(length, 0)
    );
    shape.quadraticCurveTo(
      tx(0.82 * length, -0.25 * width),
      ty(0.82 * length, -0.25 * width),
      tx(0.55 * length, -0.42 * width),
      ty(0.55 * length, -0.42 * width)
    );
    shape.quadraticCurveTo(
      tx(0.18 * length, -0.55 * width),
      ty(0.18 * length, -0.55 * width),
      tx(0, 0),
      ty(0, 0)
    );
    return shape;
  }

  // Base weld collar where the 3 stems meet
  const collarGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.032, 12);
  const collar = new THREE.Mesh(collarGeo, stemMat);
  collar.name = 'stem_base_collar';
  collar.position.set(0, 0.016, 0);
  collar.castShadow = true;
  collar.receiveShadow = true;
  group.add(collar);

  // Helper to build a frond (stem + 10 pairs of broad leaflets + 1 terminal leaflet = 12 meshes)
  function createFrond(namePrefix, points, leafStartT, leafEndT, pairCount, baseLength, baseWidth) {
    const curve = new THREE.CatmullRomCurve3(points);
    const stemGeo = new THREE.TubeGeometry(curve, 28, STEM_R, 8, false);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.name = `${namePrefix}_stem`;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    for (let i = 0; i < pairCount; i++) {
      const frac = i / (pairCount - 1);
      const t = leafStartT + frac * (leafEndT - leafStartT);
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const stemAngle = Math.atan2(tangent.y, tangent.x);

      // Leaflets taper smoothly toward the tip
      const len = baseLength * (1.0 - 0.55 * frac);
      const wid = baseWidth * (1.0 - 0.45 * frac);

      // Angle sweeps from ~72 deg at base to ~48 deg near tip
      const spreadAngle = 1.25 - 0.42 * frac;

      const shapeL = createLeafShape2D(pos.x, pos.y, stemAngle + spreadAngle, len, wid);
      const shapeR = createLeafShape2D(pos.x, pos.y, stemAngle - spreadAngle, len, wid);

      const pairGeo = new THREE.ExtrudeGeometry([shapeL, shapeR], extrudeSettings);
      pairGeo.translate(0, 0, -LEAF_THICK / 2);

      const pairMesh = new THREE.Mesh(pairGeo, copperMat);
      pairMesh.name = `${namePrefix}_leaf_pair_${i + 1}`;
      pairMesh.castShadow = true;
      pairMesh.receiveShadow = true;
      group.add(pairMesh);
    }

    // Terminal tip leaflet
    const tipPos = curve.getPointAt(1.0);
    const tipTan = curve.getTangentAt(1.0).normalize();
    const tipAngle = Math.atan2(tipTan.y, tipTan.x);
    const tipShape = createLeafShape2D(
      tipPos.x,
      tipPos.y,
      tipAngle,
      baseLength * 0.55,
      baseWidth * 0.55
    );
    const tipGeo = new THREE.ExtrudeGeometry(tipShape, extrudeSettings);
    tipGeo.translate(0, 0, -LEAF_THICK / 2);

    const tipLeaf = new THREE.Mesh(tipGeo, copperMat);
    tipLeaf.name = `${namePrefix}_leaf_tip`;
    tipLeaf.castShadow = true;
    tipLeaf.receiveShadow = true;
    group.add(tipLeaf);
  }

  // 1. Center-top tall frond
  createFrond(
    'center_frond',
    [
      new THREE.Vector3(0, 0.005, 0),
      new THREE.Vector3(-0.008, 0.14, 0),
      new THREE.Vector3(-0.004, 0.28, 0),
      new THREE.Vector3(0.032, 0.41, 0),
      new THREE.Vector3(0.072, 0.51, 0),
    ],
    0.42,
    0.93,
    10,
    0.068,
    0.022
  );

  // 2. Left frond
  createFrond(
    'left_frond',
    [
      new THREE.Vector3(-0.003, 0.005, 0),
      new THREE.Vector3(-0.018, 0.09, 0),
      new THREE.Vector3(-0.056, 0.18, 0),
      new THREE.Vector3(-0.098, 0.26, 0),
      new THREE.Vector3(-0.132, 0.34, 0),
    ],
    0.38,
    0.92,
    10,
    0.056,
    0.019
  );

  // 3. Right frond
  createFrond(
    'right_frond',
    [
      new THREE.Vector3(0.003, 0.005, 0),
      new THREE.Vector3(0.018, 0.09, 0),
      new THREE.Vector3(0.058, 0.18, 0),
      new THREE.Vector3(0.100, 0.27, 0),
      new THREE.Vector3(0.135, 0.35, 0),
    ],
    0.38,
    0.92,
    10,
    0.056,
    0.019
  );

  // Normalize bounding box to exact W x H, centered on X and Z, resting at Y = 0
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const scaleX = W / size.x;
  const scaleY = H / size.y;
  const scaleZ = D / Math.max(size.z, 0.001);

  group.scale.set(scaleX, scaleY, scaleZ);
  group.position.set(
    -center.x * scaleX,
    -box.min.y * scaleY,
    -center.z * scaleZ
  );

  return group;
}
