function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46; // X width
  const D = 0.34; // Z depth
  const H = 0.10; // Y height
  const WALL_T = 0.014;
  const BASE_T = 0.012;
  const RIM_R = 0.010;
  const RX = W / 2;
  const RZ = D / 2;

  // Materials
  const rattanMainMat = new THREE.MeshStandardMaterial({
    color: 0xc59758,
    roughness: 0.78,
    metalness: 0.02
  });
  const rattanLightMat = new THREE.MeshStandardMaterial({
    color: 0xd6ad72,
    roughness: 0.72,
    metalness: 0.02
  });
  const rattanDarkMat = new THREE.MeshStandardMaterial({
    color: 0xab7d42,
    roughness: 0.84,
    metalness: 0.02
  });

  function makeEllipseCurve(rx, rz, y, segments) {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, y, Math.sin(a) * rz));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }

  function addMesh(geom, mat, name) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base plate
  const baseShape = new THREE.Shape();
  baseShape.absellipse(0, 0, RX - WALL_T * 0.3, RZ - WALL_T * 0.3, 0, Math.PI * 2, false, 0);
  const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_T,
    bevelEnabled: false,
    curveSegments: 32
  });
  baseGeom.rotateX(-Math.PI / 2);
  const baseMesh = addMesh(baseGeom, rattanDarkMat, 'basket_base');
  baseMesh.position.y = 0.002;

  // 2. Main side wall
  const wallOuter = new THREE.Shape();
  wallOuter.absellipse(0, 0, RX - RIM_R * 0.25, RZ - RIM_R * 0.25, 0, Math.PI * 2, false, 0);
  const wallInner = new THREE.Path();
  wallInner.absellipse(0, 0, RX - WALL_T, RZ - WALL_T, 0, Math.PI * 2, true, 0);
  wallOuter.holes.push(wallInner);

  const wallH = H - RIM_R * 1.1;
  const wallGeom = new THREE.ExtrudeGeometry(wallOuter, {
    depth: wallH,
    bevelEnabled: false,
    curveSegments: 32
  });
  wallGeom.rotateX(-Math.PI / 2);
  const wallMesh = addMesh(wallGeom, rattanMainMat, 'basket_wall');
  wallMesh.position.y = RIM_R * 0.5;

  // 3. Top wrapped rim
  const topRimCurve = makeEllipseCurve(RX - WALL_T * 0.45, RZ - WALL_T * 0.45, H - RIM_R, 32);
  const topRimGeom = new THREE.TubeGeometry(topRimCurve, 32, RIM_R, 12, true);
  addMesh(topRimGeom, rattanLightMat, 'top_rim');

  // 4. Bottom rounded edge ring
  const botRimR = RIM_R * 0.65;
  const botRimCurve = makeEllipseCurve(RX - WALL_T * 0.5, RZ - WALL_T * 0.5, botRimR, 32);
  const botRimGeom = new THREE.TubeGeometry(botRimCurve, 32, botRimR, 10, true);
  addMesh(botRimGeom, rattanDarkMat, 'bottom_rim');

  // 5. Horizontal outer weave bands
  const numBands = 6;
  const bandStartY = botRimR * 2.1;
  const bandEndY = H - RIM_R * 2.2;
  for (let i = 0; i < numBands; i++) {
    const t = i / (numBands - 1);
    const y = bandStartY + t * (bandEndY - bandStartY);
    const bandCurve = makeEllipseCurve(RX - RIM_R * 0.2, RZ - RIM_R * 0.2, y, 32);
    const bandGeom = new THREE.TubeGeometry(bandCurve, 32, 0.0032, 8, true);
    addMesh(bandGeom, i % 2 === 0 ? rattanLightMat : rattanMainMat, `weave_band_${i}`);
  }

  // 6. Interior floor concentric weave rings
  const numFloorRings = 5;
  for (let i = 0; i < numFloorRings; i++) {
    const scale = (i + 1) / (numFloorRings + 0.6);
    const ringCurve = makeEllipseCurve(
      (RX - WALL_T * 1.2) * scale,
      (RZ - WALL_T * 1.2) * scale,
      BASE_T + 0.0025,
      28
    );
    const ringGeom = new THREE.TubeGeometry(ringCurve, 28, 0.003, 8, true);
    addMesh(ringGeom, i % 2 === 0 ? rattanLightMat : rattanMainMat, `floor_ring_${i}`);
  }

  // 7. Vertical weave ribs around the outside wall
  const numRibs = 12;
  const ribH = wallH * 0.92;
  const ribGeom = new THREE.CylinderGeometry(0.003, 0.003, ribH, 6);
  for (let i = 0; i < numRibs; i++) {
    const angle = (i / numRibs) * Math.PI * 2;
    const x = Math.cos(angle) * (RX - RIM_R * 0.18);
    const z = Math.sin(angle) * (RZ - RIM_R * 0.18);
    const ribMesh = addMesh(ribGeom, rattanDarkMat, `vertical_rib_${i}`);
    ribMesh.position.set(x, RIM_R * 0.5 + wallH * 0.5, z);
  }

  return group;
}
