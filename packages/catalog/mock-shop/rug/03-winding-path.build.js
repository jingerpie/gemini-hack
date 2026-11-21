function build(THREE) {
  const group = new THREE.Group();

  const W = 1.20;
  const D = 1.80;
  const BASE_H = 0.010;
  const PILE_H = 0.012;
  const EDGE_W = 0.018;
  const EDGE_H = 0.013;

  const matBase = new THREE.MeshStandardMaterial({
    color: 0xb88218,
    roughness: 0.92,
    metalness: 0.0,
  });

  const matLightWoven = new THREE.MeshStandardMaterial({
    color: 0xc29e59,
    roughness: 0.95,
    metalness: 0.0,
  });

  const matTufted = new THREE.MeshStandardMaterial({
    color: 0xc7901c,
    roughness: 0.88,
    metalness: 0.0,
  });

  const matEdge = new THREE.MeshStandardMaterial({
    color: 0xa67312,
    roughness: 0.90,
    metalness: 0.0,
  });

  // 1. Main woven base
  const baseGeo = new THREE.BoxGeometry(W - EDGE_W, BASE_H, D - EDGE_W);
  const baseMesh = new THREE.Mesh(baseGeo, matBase);
  baseMesh.position.set(0, BASE_H / 2, 0);
  baseMesh.name = 'rug_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Central lighter flat-woven accent patch
  const centerPatchGeo = new THREE.BoxGeometry(W * 0.52, 0.002, D * 0.58);
  const centerPatch = new THREE.Mesh(centerPatchGeo, matLightWoven);
  centerPatch.position.set(0, BASE_H + 0.0005, 0);
  centerPatch.name = 'center_woven_patch';
  centerPatch.castShadow = true;
  centerPatch.receiveShadow = true;
  group.add(centerPatch);

  // 3. Perimeter bound edges
  const edgeFrontBackGeo = new THREE.BoxGeometry(W, EDGE_H, EDGE_W);
  const edgeFront = new THREE.Mesh(edgeFrontBackGeo, matEdge);
  edgeFront.position.set(0, EDGE_H / 2, D / 2 - EDGE_W / 2);
  edgeFront.name = 'edge_front';
  edgeFront.castShadow = true;
  edgeFront.receiveShadow = true;
  group.add(edgeFront);

  const edgeBack = new THREE.Mesh(edgeFrontBackGeo, matEdge);
  edgeBack.position.set(0, EDGE_H / 2, -D / 2 + EDGE_W / 2);
  edgeBack.name = 'edge_back';
  edgeBack.castShadow = true;
  edgeBack.receiveShadow = true;
  group.add(edgeBack);

  const edgeLeftRightGeo = new THREE.BoxGeometry(EDGE_W, EDGE_H, D - EDGE_W * 2);
  const edgeLeft = new THREE.Mesh(edgeLeftRightGeo, matEdge);
  edgeLeft.position.set(-W / 2 + EDGE_W / 2, EDGE_H / 2, 0);
  edgeLeft.name = 'edge_left';
  edgeLeft.castShadow = true;
  edgeLeft.receiveShadow = true;
  group.add(edgeLeft);

  const edgeRight = new THREE.Mesh(edgeLeftRightGeo, matEdge);
  edgeRight.position.set(W / 2 - EDGE_W / 2, EDGE_H / 2, 0);
  edgeRight.name = 'edge_right';
  edgeRight.castShadow = true;
  edgeRight.receiveShadow = true;
  group.add(edgeRight);

  // Helper to create a U-shaped tufted arch band
  function createArchBand(innerR, thickness, legLen) {
    const outerR = innerR + thickness;
    const shape = new THREE.Shape();
    shape.moveTo(outerR, -legLen);
    shape.lineTo(outerR, 0);
    shape.absarc(0, 0, outerR, 0, Math.PI, false);
    shape.lineTo(-outerR, -legLen);
    shape.lineTo(-innerR, -legLen);
    shape.lineTo(-innerR, 0);
    shape.absarc(0, 0, innerR, Math.PI, 0, true);
    shape.lineTo(innerR, -legLen);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: PILE_H,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 20,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  const bandThick = 0.064;
  const bandGap = 0.026;
  const archRadii = [
    0.105,
    0.105 + bandThick + bandGap,
    0.105 + (bandThick + bandGap) * 2,
  ];

  // 4. Bottom (+Z) nested arches
  archRadii.forEach((r, i) => {
    const legLen = 0.265;
    const mesh = new THREE.Mesh(createArchBand(r, bandThick, legLen), matTufted);
    mesh.position.set(-0.135, BASE_H - 0.002, D / 2 - EDGE_W - legLen);
    mesh.name = `tufted_arch_bottom_${i + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 5. Top (-Z) nested arches
  archRadii.forEach((r, i) => {
    const legLen = 0.218;
    const mesh = new THREE.Mesh(createArchBand(r, bandThick, legLen), matTufted);
    mesh.rotation.y = Math.PI;
    mesh.position.set(0.135, BASE_H - 0.002, -D / 2 + EDGE_W + legLen);
    mesh.name = `tufted_arch_top_${i + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 6. Left (-X) nested arches
  archRadii.forEach((r, i) => {
    const legLen = 0.18;
    const mesh = new THREE.Mesh(createArchBand(r, bandThick, legLen), matTufted);
    mesh.rotation.y = -Math.PI / 2;
    mesh.position.set(-W / 2 + EDGE_W + legLen, BASE_H - 0.002, -0.172);
    mesh.name = `tufted_arch_left_${i + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 7. Right (+X) nested arches
  archRadii.forEach((r, i) => {
    const legLen = 0.18;
    const mesh = new THREE.Mesh(createArchBand(r, bandThick, legLen), matTufted);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(W / 2 - EDGE_W - legLen, BASE_H - 0.002, 0.172);
    mesh.name = `tufted_arch_right_${i + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 8. Central winding S-curve raised path
  function createWindingStrip(xOffset, zStart, zEnd, curveAmp) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOffset, 0, zStart),
      new THREE.Vector3(xOffset + curveAmp, 0, zStart * 0.45),
      new THREE.Vector3(xOffset - curveAmp, 0, zEnd * 0.45),
      new THREE.Vector3(xOffset, 0, zEnd),
    ]);
    const pts = curve.getPoints(24);
    const halfW = bandThick * 0.45;
    const shape = new THREE.Shape();
    shape.moveTo(pts[0].x - halfW, -pts[0].z);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x - halfW, -pts[i].z);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      shape.lineTo(pts[i].x + halfW, -pts[i].z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: PILE_H,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  const windingLeft = new THREE.Mesh(
    createWindingStrip(-0.06, -D * 0.42, D * 0.42, 0.105),
    matTufted
  );
  windingLeft.position.set(0, BASE_H - 0.002, 0);
  windingLeft.name = 'tufted_winding_path_1';
  windingLeft.castShadow = true;
  windingLeft.receiveShadow = true;
  group.add(windingLeft);

  const windingRight = new THREE.Mesh(
    createWindingStrip(0.06, -D * 0.42, D * 0.42, 0.105),
    matTufted
  );
  windingRight.position.set(0, BASE_H - 0.002, 0);
  windingRight.name = 'tufted_winding_path_2';
  windingRight.castShadow = true;
  windingRight.receiveShadow = true;
  group.add(windingRight);

  return group;
}
