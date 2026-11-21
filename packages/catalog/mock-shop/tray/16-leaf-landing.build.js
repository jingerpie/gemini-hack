function build(THREE) {
  const group = new THREE.Group();

  const LENGTH = 0.22;
  const WIDTH = 0.14;
  const HEIGHT = 0.022;
  const WOOD_H = 0.015;
  const RIM_H = 0.007;
  const BASIN_H = 0.003;
  const STEM_LEN = 0.032;
  const BODY_LEN = LENGTH - STEM_LEN;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc89f76,
    roughness: 0.6,
    metalness: 0.02
  });

  const mintMat = new THREE.MeshPhysicalMaterial({
    color: 0x9ed8c0,
    roughness: 0.35,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3
  });

  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x8bc5ad,
    roughness: 0.45,
    metalness: 0.02
  });

  // Helper to create the outer leaf + stem shape in XY (later rotated to XZ)
  // Tip at y = +BODY_LEN/2, stem at y = -BODY_LEN/2 - STEM_LEN
  function createOuterLeafShape(scale) {
    const s = scale || 1.0;
    const w = (WIDTH / 2) * s;
    const bl = (BODY_LEN / 2) * s;
    const stL = STEM_LEN * s;
    const stW = 0.011 * s;

    const shape = new THREE.Shape();
    // Start at tip
    shape.moveTo(0, bl);
    // Right side curve down to stem base
    shape.bezierCurveTo(w * 0.85, bl * 0.72, w * 1.12, -bl * 0.15, stW, -bl * 0.92);
    // Right side of stem
    shape.quadraticCurveTo(stW * 0.95, -bl - stL * 0.5, stW * 0.75, -bl - stL * 0.9);
    // Stem tip rounded
    shape.quadraticCurveTo(0, -bl - stL * 1.08, -stW * 0.75, -bl - stL * 0.9);
    // Left side of stem
    shape.quadraticCurveTo(-stW * 0.95, -bl - stL * 0.5, -stW, -bl * 0.92);
    // Left side curve up to tip
    shape.bezierCurveTo(-w * 1.12, -bl * 0.15, -w * 0.85, bl * 0.72, 0, bl);

    return shape;
  }

  // Helper to create the inner basin hole shape (no stem)
  function createInnerLeafShape() {
    const w = (WIDTH / 2) * 0.80;
    const bl = (BODY_LEN / 2) * 0.82;

    const path = new THREE.Path();
    path.moveTo(0, bl);
    path.bezierCurveTo(w * 0.85, bl * 0.72, w * 1.08, -bl * 0.15, 0, -bl * 0.95);
    path.bezierCurveTo(-w * 1.08, -bl * 0.15, -w * 0.85, bl * 0.72, 0, bl);
    return path;
  }

  // 1. Wood base
  const woodShape = createOuterLeafShape(1.0);
  const woodGeo = new THREE.ExtrudeGeometry(woodShape, {
    depth: WOOD_H - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 4,
    curveSegments: 28
  });
  woodGeo.rotateX(-Math.PI / 2);
  const woodMesh = new THREE.Mesh(woodGeo, woodMat);
  woodMesh.name = 'wood_base';
  woodMesh.position.y = 0.002;
  group.add(woodMesh);

  // 2. Mint rim (outer shape with inner hole)
  const rimShape = createOuterLeafShape(1.0);
  rimShape.holes.push(createInnerLeafShape());
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RIM_H - 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0022,
    bevelSegments: 5,
    curveSegments: 28
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, mintMat);
  rimMesh.name = 'mint_rim';
  rimMesh.position.y = WOOD_H - 0.0005;
  group.add(rimMesh);

  // 3. Mint recessed basin floor
  const basinShape = new THREE.Shape();
  const bw = (WIDTH / 2) * 0.82;
  const bbl = (BODY_LEN / 2) * 0.84;
  basinShape.moveTo(0, bbl);
  basinShape.bezierCurveTo(bw * 0.85, bbl * 0.72, bw * 1.08, -bbl * 0.15, 0, -bbl * 0.95);
  basinShape.bezierCurveTo(-bw * 1.08, -bbl * 0.15, -bw * 0.85, bbl * 0.72, 0, bbl);

  const basinGeo = new THREE.ExtrudeGeometry(basinShape, {
    depth: BASIN_H,
    bevelEnabled: false,
    curveSegments: 24
  });
  basinGeo.rotateX(-Math.PI / 2);
  const basinMesh = new THREE.Mesh(basinGeo, mintMat);
  basinMesh.name = 'mint_basin';
  basinMesh.position.y = WOOD_H - 0.0005;
  group.add(basinMesh);

  const veinY = WOOD_H + BASIN_H - 0.0003;

  // 4. Central midrib vein
  const midribCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, veinY, BODY_LEN * 0.34),
    new THREE.Vector3(0, veinY, 0),
    new THREE.Vector3(0, veinY, -BODY_LEN * 0.32)
  ]);
  const midribGeo = new THREE.TubeGeometry(midribCurve, 20, 0.001, 8, false);
  const midribMesh = new THREE.Mesh(midribGeo, veinMat);
  midribMesh.name = 'vein_midrib';
  group.add(midribMesh);

  // 5. Lateral veins (3 pairs, slightly staggered)
  const lateralSpecs = [
    { name: 'vein_left_1', side: -1, zStart: 0.042, zEnd: 0.008, xEnd: -0.036, zMid: 0.028, xMid: -0.018 },
    { name: 'vein_right_1', side: 1, zStart: 0.036, zEnd: 0.002, xEnd: 0.038, zMid: 0.022, xMid: 0.019 },
    { name: 'vein_left_2', side: -1, zStart: 0.012, zEnd: -0.024, xEnd: -0.042, zMid: -0.004, xMid: -0.022 },
    { name: 'vein_right_2', side: 1, zStart: 0.004, zEnd: -0.032, xEnd: 0.040, zMid: -0.012, xMid: 0.021 },
    { name: 'vein_left_3', side: -1, zStart: -0.020, zEnd: -0.052, xEnd: -0.028, zMid: -0.036, xMid: -0.014 },
    { name: 'vein_right_3', side: 1, zStart: -0.028, zEnd: -0.058, xEnd: 0.024, zMid: -0.043, xMid: 0.012 }
  ];

  lateralSpecs.forEach((spec) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, veinY, spec.zStart),
      new THREE.Vector3(spec.xMid, veinY, spec.zMid),
      new THREE.Vector3(spec.xEnd, veinY, spec.zEnd)
    ]);
    const geo = new THREE.TubeGeometry(curve, 14, 0.0008, 8, false);
    const mesh = new THREE.Mesh(geo, veinMat);
    mesh.name = spec.name;
    group.add(mesh);
  });

  // Center bounding box on X=0, Z=0 and bottom at Y=0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x = -center.x;
  group.position.z = -center.z;
  group.position.y = -box.min.y;

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
