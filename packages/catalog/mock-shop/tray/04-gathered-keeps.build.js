function build(THREE) {
  const W = 0.30;
  const D = 0.20;
  const H = 0.048;
  const WALL_T = 0.010;
  const BASE_T = 0.008;

  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.55,
    metalness: 0.0,
  });

  const carvingMat = new THREE.MeshStandardMaterial({
    color: 0x452912,
    roughness: 0.68,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx || ry || rz) {
      mesh.rotation.set(rx || 0, ry || 0, rz || 0);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Base panel
  const baseGeo = new THREE.BoxGeometry(W - WALL_T * 2 + 0.002, BASE_T, D - WALL_T * 2 + 0.002);
  addMesh(baseGeo, woodMat, 'tray_base', 0, BASE_T / 2, 0);

  // Front (+Z) and Back (-Z) walls
  const fbWallGeo = new THREE.BoxGeometry(W - WALL_T * 2, H, WALL_T);
  addMesh(fbWallGeo, woodMat, 'wall_front', 0, H / 2, D / 2 - WALL_T / 2);
  addMesh(fbWallGeo, woodMat, 'wall_back', 0, H / 2, -D / 2 + WALL_T / 2);

  // Left (-X) and Right (+X) walls with handle cutouts
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-D / 2, 0);
  sideShape.lineTo(D / 2, 0);
  sideShape.lineTo(D / 2, H);
  sideShape.lineTo(-D / 2, H);
  sideShape.closePath();

  const handleW = 0.072;
  const handleH = 0.015;
  const handleY = H * 0.56;
  const handleR = handleH / 2;
  const handleHalfStraight = handleW / 2 - handleR;

  const handleHole = new THREE.Path();
  handleHole.moveTo(-handleHalfStraight, handleY - handleR);
  handleHole.lineTo(handleHalfStraight, handleY - handleR);
  handleHole.absarc(handleHalfStraight, handleY, handleR, -Math.PI / 2, Math.PI / 2, false);
  handleHole.lineTo(-handleHalfStraight, handleY + handleR);
  handleHole.absarc(-handleHalfStraight, handleY, handleR, Math.PI / 2, (3 * Math.PI) / 2, false);
  sideShape.holes.push(handleHole);

  const sideWallGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: WALL_T,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 12,
  });

  // Rotate so shape's X maps to Z, shape's Y maps to Y, and extrusion depth maps to +X
  addMesh(sideWallGeo, woodMat, 'wall_left', -W / 2, 0, 0, 0, -Math.PI / 2, 0);
  addMesh(sideWallGeo, woodMat, 'wall_right', W / 2 - WALL_T, 0, 0, 0, -Math.PI / 2, 0);

  // Decorative diamond carving (outer)
  function makeDiamondRing(outerRx, outerRz, thickness) {
    const shape = new THREE.Shape();
    shape.moveTo(0, outerRz);
    shape.lineTo(outerRx, 0);
    shape.lineTo(0, -outerRz);
    shape.lineTo(-outerRx, 0);
    shape.closePath();

    const innerRx = outerRx - thickness;
    const innerRz = outerRz - thickness * (outerRz / outerRx);
    const hole = new THREE.Path();
    hole.moveTo(0, innerRz);
    hole.lineTo(-innerRx, 0);
    hole.lineTo(0, -innerRz);
    hole.lineTo(innerRx, 0);
    hole.closePath();
    shape.holes.push(hole);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.0012,
      bevelEnabled: false,
    });
  }

  const outerDiamondGeo = makeDiamondRing(0.112, 0.072, 0.003);
  addMesh(outerDiamondGeo, carvingMat, 'carving_diamond_outer', 0, BASE_T - 0.0002, 0, -Math.PI / 2, 0, 0);

  const innerDiamondGeo = makeDiamondRing(0.098, 0.062, 0.0025);
  addMesh(innerDiamondGeo, carvingMat, 'carving_diamond_inner', 0, BASE_T - 0.0002, 0, -Math.PI / 2, 0, 0);

  // Center 5-pointed star carving
  const starShape = new THREE.Shape();
  const starOuterR = 0.035;
  const starInnerR = 0.013;
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? starOuterR : starInnerR;
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const sx = Math.cos(angle) * r;
    const sy = Math.sin(angle) * r;
    if (i === 0) {
      starShape.moveTo(sx, sy);
    } else {
      starShape.lineTo(sx, sy);
    }
  }
  starShape.closePath();

  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.0014,
    bevelEnabled: false,
  });
  addMesh(starGeo, carvingMat, 'carving_star', 0, BASE_T - 0.0002, 0, -Math.PI / 2, 0, 0);

  return group;
}
