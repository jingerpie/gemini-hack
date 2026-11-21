function build(THREE) {
  const group = new THREE.Group();

  const W = 0.46;
  const H = 0.46;
  const D = 0.16;
  const BEVEL = 0.055;
  const CORE_D = D - BEVEL * 2;
  const HALF_W = W / 2 - BEVEL;
  const HALF_H = H / 2 - BEVEL;
  const PINCH = 0.014;
  const CENTER_Y = H / 2;

  // Materials
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x1b422b,
    roughness: 0.88,
    metalness: 0.04,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc4a052,
    roughness: 0.42,
    metalness: 0.45,
  });

  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x8e2420,
    roughness: 0.75,
    metalness: 0.05,
  });

  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xc98a2c,
    roughness: 0.65,
    metalness: 0.15,
  });

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb85224,
    roughness: 0.72,
    metalness: 0.05,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xdfd3bc,
    roughness: 0.78,
    metalness: 0.04,
  });

  // 1. Pillow body (plump rounded square with slightly pinched edges)
  const pillowShape = new THREE.Shape();
  pillowShape.moveTo(-HALF_W, -HALF_H);
  pillowShape.quadraticCurveTo(0, -HALF_H + PINCH, HALF_W, -HALF_H);
  pillowShape.quadraticCurveTo(HALF_W - PINCH, 0, HALF_W, HALF_H);
  pillowShape.quadraticCurveTo(0, HALF_H - PINCH, -HALF_W, HALF_H);
  pillowShape.quadraticCurveTo(-HALF_W + PINCH, 0, -HALF_W, -HALF_H);

  const pillowGeo = new THREE.ExtrudeGeometry(pillowShape, {
    depth: CORE_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 10,
    curveSegments: 16,
  });
  pillowGeo.center();

  const pillowBody = new THREE.Mesh(pillowGeo, velvetMat);
  pillowBody.name = 'pillow_body';
  pillowBody.position.set(0, CENTER_Y, 0);
  pillowBody.castShadow = true;
  pillowBody.receiveShadow = true;
  group.add(pillowBody);

  // 2. Gilded corded trim around the perimeter
  const trimW = W / 2 - 0.004;
  const trimH = H / 2 - 0.004;
  const trimPinch = 0.016;
  const trimPoints = [
    new THREE.Vector3(-trimW, CENTER_Y - trimH, 0),
    new THREE.Vector3(0, CENTER_Y - trimH + trimPinch, 0),
    new THREE.Vector3(trimW, CENTER_Y - trimH, 0),
    new THREE.Vector3(trimW - trimPinch, CENTER_Y, 0),
    new THREE.Vector3(trimW, CENTER_Y + trimH, 0),
    new THREE.Vector3(0, CENTER_Y + trimH - trimPinch, 0),
    new THREE.Vector3(-trimW, CENTER_Y + trimH, 0),
    new THREE.Vector3(-trimW + trimPinch, CENTER_Y, 0),
  ];
  const trimCurve = new THREE.CatmullRomCurve3(trimPoints, true, 'catmullrom', 0.5);
  const trimGeo = new THREE.TubeGeometry(trimCurve, 64, 0.009, 10, true);
  const trimMesh = new THREE.Mesh(trimGeo, goldTrimMat);
  trimMesh.name = 'gilded_cord_trim';
  trimMesh.castShadow = true;
  trimMesh.receiveShadow = true;
  group.add(trimMesh);

  // 3. Embroidered front motif (+Z face)
  const frontZ = D / 2 - 0.002;

  // Central medallion
  const centerCoreGeo = new THREE.SphereGeometry(0.014, 16, 12);
  centerCoreGeo.scale(1, 1, 0.35);
  const centerCore = new THREE.Mesh(centerCoreGeo, creamMat);
  centerCore.name = 'embroidery_center_core';
  centerCore.position.set(0, CENTER_Y, frontZ + 0.002);
  centerCore.castShadow = true;
  centerCore.receiveShadow = true;
  group.add(centerCore);

  const centerRingGeo = new THREE.TorusGeometry(0.026, 0.008, 8, 20);
  centerRingGeo.scale(1, 1, 0.45);
  const centerRing = new THREE.Mesh(centerRingGeo, crimsonMat);
  centerRing.name = 'embroidery_center_ring';
  centerRing.position.set(0, CENTER_Y, frontZ);
  centerRing.castShadow = true;
  centerRing.receiveShadow = true;
  group.add(centerRing);

  // 4 cardinal floral leaves (top, bottom, left, right)
  const leafGeo = new THREE.SphereGeometry(0.028, 14, 10);
  leafGeo.scale(0.55, 1.35, 0.25);

  const cardinalOffsets = [
    { name: 'embroidery_leaf_top', x: 0, y: 0.085, rz: 0, mat: terracottaMat },
    { name: 'embroidery_leaf_bottom', x: 0, y: -0.085, rz: Math.PI, mat: terracottaMat },
    { name: 'embroidery_leaf_left', x: -0.085, y: 0, rz: Math.PI / 2, mat: ochreMat },
    { name: 'embroidery_leaf_right', x: 0.085, y: 0, rz: -Math.PI / 2, mat: ochreMat },
  ];

  for (let i = 0; i < cardinalOffsets.length; i++) {
    const item = cardinalOffsets[i];
    const leaf = new THREE.Mesh(leafGeo, item.mat);
    leaf.name = item.name;
    leaf.position.set(item.x, CENTER_Y + item.y, frontZ - 0.003);
    leaf.rotation.z = item.rz;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  // 4 diagonal inner rosettes
  const rosetteGeo = new THREE.SphereGeometry(0.022, 14, 10);
  rosetteGeo.scale(1, 1, 0.28);

  const diagOffsets = [
    { name: 'embroidery_rosette_tl', x: -0.055, y: 0.055 },
    { name: 'embroidery_rosette_tr', x: 0.055, y: 0.055 },
    { name: 'embroidery_rosette_bl', x: -0.055, y: -0.055 },
    { name: 'embroidery_rosette_br', x: 0.055, y: -0.055 },
  ];

  for (let i = 0; i < diagOffsets.length; i++) {
    const item = diagOffsets[i];
    const rosette = new THREE.Mesh(rosetteGeo, ochreMat);
    rosette.name = item.name;
    rosette.position.set(item.x, CENTER_Y + item.y, frontZ - 0.002);
    rosette.castShadow = true;
    rosette.receiveShadow = true;
    group.add(rosette);
  }

  // 4 corner floral flourishes
  const cornerGeo = new THREE.SphereGeometry(0.024, 14, 10);
  cornerGeo.scale(0.7, 1.2, 0.25);

  const cornerOffsets = [
    { name: 'embroidery_corner_tl', x: -0.135, y: 0.135, rz: Math.PI / 4 },
    { name: 'embroidery_corner_tr', x: 0.135, y: 0.135, rz: -Math.PI / 4 },
    { name: 'embroidery_corner_bl', x: -0.135, y: -0.135, rz: (3 * Math.PI) / 4 },
    { name: 'embroidery_corner_br', x: 0.135, y: -0.135, rz: -(3 * Math.PI) / 4 },
  ];

  for (let i = 0; i < cornerOffsets.length; i++) {
    const item = cornerOffsets[i];
    const corner = new THREE.Mesh(cornerGeo, crimsonMat);
    corner.name = item.name;
    corner.position.set(item.x, CENTER_Y + item.y, frontZ - 0.012);
    corner.rotation.z = item.rz;
    corner.castShadow = true;
    corner.receiveShadow = true;
    group.add(corner);
  }

  return group;
}
