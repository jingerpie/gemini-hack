function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (in meters)
  const W = 1.40;          // Overall width (closed) along X
  const D = 0.90;          // Overall depth along Z
  const H = 0.75;          // Overall height along Y
  const TOP_T = 0.026;     // Tabletop thickness
  const CORNER_R = 0.14;   // Tabletop corner radius
  const SEAM_GAP = 0.002;  // Center extension seam gap
  const APRON_H = 0.055;   // Apron rail height
  const APRON_T = 0.024;   // Apron rail thickness
  const INSET_X = 0.11;    // Leg/apron inset from tabletop X edge
  const INSET_Z = 0.09;    // Leg/apron inset from tabletop Z edge
  const LEG_R_TOP = 0.028; // Leg top radius
  const LEG_R_BOT = 0.024; // Leg bottom radius
  const GLIDE_H = 0.004;   // Floor glide height

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8b9a6,
    roughness: 0.62,
    metalness: 0.02,
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb3a28e,
    roughness: 0.7,
    metalness: 0.02,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e,
    roughness: 0.45,
    metalness: 0.65,
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop (two halves meeting at center seam x = 0)
  const bevelSize = 0.003;
  const bevelThick = 0.003;
  const extrudeDepth = TOP_T - bevelThick * 2;
  const halfW = W / 2 - SEAM_GAP / 2 - bevelSize;
  const halfD = D / 2 - bevelSize;
  const r = CORNER_R - bevelSize;

  // Left half shape (in XY plane, extruded along Z, then rotated to XZ)
  const leftShape = new THREE.Shape();
  leftShape.moveTo(0, -halfD);
  leftShape.lineTo(-halfW + r, -halfD);
  leftShape.absarc(-halfW + r, -halfD + r, r, -Math.PI / 2, -Math.PI, true);
  leftShape.lineTo(-halfW, halfD - r);
  leftShape.absarc(-halfW + r, halfD - r, r, Math.PI, Math.PI / 2, true);
  leftShape.lineTo(0, halfD);
  leftShape.closePath();

  const extrudeSettings = {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: bevelThick,
    bevelSize: bevelSize,
    bevelSegments: 2,
    curveSegments: 16,
  };

  const leftTopGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
  leftTopGeo.rotateX(Math.PI / 2);
  addMesh(
    leftTopGeo,
    woodMat,
    'tabletop_left',
    -SEAM_GAP / 2,
    H - bevelThick,
    0
  );

  // Right half shape
  const rightShape = new THREE.Shape();
  rightShape.moveTo(0, -halfD);
  rightShape.lineTo(halfW - r, -halfD);
  rightShape.absarc(halfW - r, -halfD + r, r, -Math.PI / 2, 0, false);
  rightShape.lineTo(halfW, halfD - r);
  rightShape.absarc(halfW - r, halfD - r, r, 0, Math.PI / 2, false);
  rightShape.lineTo(0, halfD);
  rightShape.closePath();

  const rightTopGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
  rightTopGeo.rotateX(Math.PI / 2);
  addMesh(
    rightTopGeo,
    woodMat,
    'tabletop_right',
    SEAM_GAP / 2,
    H - bevelThick,
    0
  );

  // 2. Legs & Floor Glides
  const legX = W / 2 - INSET_X;
  const legZ = D / 2 - INSET_Z;
  const legH = H - TOP_T - GLIDE_H;
  const legGeo = new THREE.CylinderGeometry(LEG_R_TOP, LEG_R_BOT, legH, 24);
  const glideGeo = new THREE.CylinderGeometry(LEG_R_BOT * 0.92, LEG_R_BOT * 0.92, GLIDE_H, 16);

  const legPositions = [
    ['front_left', -legX, legZ],
    ['front_right', legX, legZ],
    ['back_left', -legX, -legZ],
    ['back_right', legX, -legZ],
  ];

  for (const [label, lx, lz] of legPositions) {
    addMesh(legGeo, woodMat, `leg_${label}`, lx, GLIDE_H + legH / 2, lz);
    addMesh(glideGeo, glideMat, `glide_${label}`, lx, GLIDE_H / 2, lz);
  }

  // 3. Apron Rails
  const apronY = H - TOP_T - APRON_H / 2;
  const spanX = legX * 2 - LEG_R_TOP;
  const spanZ = legZ * 2 - LEG_R_TOP;

  const frontBackApronGeo = new THREE.BoxGeometry(spanX, APRON_H, APRON_T);
  addMesh(frontBackApronGeo, woodMat, 'apron_front', 0, apronY, legZ);
  addMesh(frontBackApronGeo, woodMat, 'apron_back', 0, apronY, -legZ);

  const sideApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, spanZ);
  addMesh(sideApronGeo, woodMat, 'apron_left', -legX, apronY, 0);
  addMesh(sideApronGeo, woodMat, 'apron_right', legX, apronY, 0);

  // 4. Corner Mounting Blocks
  const blockSize = 0.045;
  const blockGeo = new THREE.BoxGeometry(blockSize, APRON_H * 0.8, blockSize);
  const blockOffsetX = legX - APRON_T / 2 - blockSize / 2;
  const blockOffsetZ = legZ - APRON_T / 2 - blockSize / 2;

  for (const [label, bx, bz] of [
    ['front_left', -blockOffsetX, blockOffsetZ],
    ['front_right', blockOffsetX, blockOffsetZ],
    ['back_left', -blockOffsetX, -blockOffsetZ],
    ['back_right', blockOffsetX, -blockOffsetZ],
  ]) {
    addMesh(blockGeo, woodDarkMat, `corner_block_${label}`, bx, apronY, bz);
  }

  // 5. Under-table Extension Slide Rails
  const slideLen = spanX * 0.85;
  const slideGeo = new THREE.BoxGeometry(slideLen, 0.022, 0.028);
  const slideY = H - TOP_T - 0.011;
  addMesh(slideGeo, metalMat, 'extension_slide_front', 0, slideY, legZ * 0.45);
  addMesh(slideGeo, metalMat, 'extension_slide_back', 0, slideY, -legZ * 0.45);

  return group;
}
