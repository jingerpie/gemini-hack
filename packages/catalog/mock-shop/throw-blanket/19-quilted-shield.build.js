function build(THREE) {
  const group = new THREE.Group();

  const W = 0.50;
  const D = 0.60;
  const H = 0.14;
  const LAYER_COUNT = 4;
  const LAYER_H = H / LAYER_COUNT;
  const BEVEL = 0.012;
  const CORNER_R = 0.035;

  const matMain = new THREE.MeshStandardMaterial({
    color: 0x5d6166,
    roughness: 0.88,
    metalness: 0.02,
  });

  const matBinding = new THREE.MeshStandardMaterial({
    color: 0x4b4f54,
    roughness: 0.92,
    metalness: 0.02,
  });

  const matStitch = new THREE.MeshStandardMaterial({
    color: 0x52565b,
    roughness: 0.9,
    metalness: 0.01,
  });

  function makeRoundedRectShape(w, d, r) {
    const hw = w / 2;
    const hd = d / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

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

  // 1. Main stacked folded layers
  for (let i = 0; i < LAYER_COUNT; i++) {
    const shrink = i * 0.008;
    const lw = W - shrink - BEVEL * 2;
    const ld = D - shrink - BEVEL * 2;
    const lh = LAYER_H - BEVEL * 2;

    const shape = makeRoundedRectShape(lw, ld, CORNER_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: lh,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);

    const yPos = i * LAYER_H + BEVEL;
    addMesh(geo, matMain, `blanket_layer_${i + 1}`, 0, yPos, 0);
  }

  // 2. Rounded U-bend folds connecting layers on alternating sides
  const foldRadius = LAYER_H * 0.52;
  const foldGeoSide = new THREE.CapsuleGeometry(foldRadius, D * 0.84, 8, 16);
  foldGeoSide.rotateX(Math.PI / 2);

  addMesh(foldGeoSide, matMain, 'fold_bend_left_lower', -W / 2 + foldRadius * 0.55, LAYER_H * 1.0, 0);
  addMesh(foldGeoSide, matMain, 'fold_bend_right_mid', W / 2 - foldRadius * 0.55, LAYER_H * 2.0, 0);
  addMesh(foldGeoSide, matMain, 'fold_bend_left_upper', -W / 2 + foldRadius * 0.55, LAYER_H * 3.0, 0);

  const foldGeoFront = new THREE.CapsuleGeometry(foldRadius, W * 0.82, 8, 16);
  foldGeoFront.rotateZ(Math.PI / 2);
  addMesh(foldGeoFront, matMain, 'fold_bend_front_lower', 0, LAYER_H * 1.0, D / 2 - foldRadius * 0.55);
  addMesh(foldGeoFront, matMain, 'fold_bend_front_upper', 0, LAYER_H * 3.0, D / 2 - foldRadius * 0.55);

  // 3. Top folded corner flap (as seen in the photo)
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-W * 0.22, -D * 0.16);
  flapShape.lineTo(W * 0.22, -D * 0.16);
  flapShape.quadraticCurveTo(W * 0.24, -D * 0.16, W * 0.22, -D * 0.12);
  flapShape.lineTo(0.02, D * 0.16);
  flapShape.quadraticCurveTo(0.0, D * 0.18, -0.02, D * 0.16);
  flapShape.lineTo(-W * 0.22, -D * 0.12);
  flapShape.quadraticCurveTo(-W * 0.24, -D * 0.16, -W * 0.22, -D * 0.16);

  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 10,
  });
  flapGeo.rotateX(-Math.PI / 2);
  addMesh(flapGeo, matMain, 'top_folded_flap', -0.02, H + 0.002, 0.04, 0.03, 0.25, -0.02);

  // 4. Stitched binding trim along the top flap & front edge
  const bindingGeoFront = new THREE.CapsuleGeometry(0.006, W * 0.86, 6, 12);
  bindingGeoFront.rotateZ(Math.PI / 2);
  addMesh(bindingGeoFront, matBinding, 'binding_trim_front', 0, H - 0.006, D / 2 - 0.015);

  const bindingGeoRight = new THREE.CapsuleGeometry(0.006, D * 0.86, 6, 12);
  bindingGeoRight.rotateX(Math.PI / 2);
  addMesh(bindingGeoRight, matBinding, 'binding_trim_right', W / 2 - 0.015, H - 0.006, 0);

  // 5. Subtle quilting ribs on the top surface
  const ribCount = 5;
  for (let i = 0; i < ribCount; i++) {
    const zOffset = -D * 0.32 + i * (D * 0.16);
    const ribGeo = new THREE.CapsuleGeometry(0.003, W * 0.78, 4, 10);
    ribGeo.rotateZ(Math.PI / 2);
    addMesh(ribGeo, matStitch, `quilting_rib_${i + 1}`, 0, H - 0.001, zOffset);
  }

  return group;
}
