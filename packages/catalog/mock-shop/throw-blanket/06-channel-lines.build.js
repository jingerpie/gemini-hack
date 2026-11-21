function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.54;
  const H = 0.065;
  const CORNER_R = 0.024;
  const BEVEL = 0.009;
  const BASE_H = H - BEVEL * 2;
  const CHANNEL_COUNT = 10;

  // Materials
  const quiltMat = new THREE.MeshStandardMaterial({
    color: 0xf09b67,
    roughness: 0.88,
    metalness: 0.0,
  });

  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0xe68d58,
    roughness: 0.85,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xd97f4a,
    roughness: 0.92,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper for rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  // 1. Main folded quilt body
  const bodyShape = roundedRectShape(W - BEVEL * 2, D - BEVEL * 2, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  addMesh(bodyGeo, quiltMat, "quilt_folded_body", [0, BEVEL, 0]);

  // 2. Vertical quilted channel puffs on top surface
  const channelAreaW = W - 0.04;
  const channelW = channelAreaW / CHANNEL_COUNT;
  const channelLen = D - 0.05;
  const channelRadius = 0.0055;
  const topY = H - 0.002;

  for (let i = 0; i < CHANNEL_COUNT; i++) {
    const x = -channelAreaW / 2 + channelW * (i + 0.5);
    const puffGeo = new THREE.CapsuleGeometry(channelRadius, channelLen, 6, 12);
    puffGeo.rotateX(Math.PI / 2);
    puffGeo.scale(2.8, 0.55, 1.0);
    addMesh(puffGeo, quiltMat, `quilt_channel_${i + 1}`, [x, topY, 0]);
  }

  // 3. Recessed stitch lines between channels
  for (let i = 1; i < CHANNEL_COUNT; i++) {
    const x = -channelAreaW / 2 + channelW * i;
    const seamGeo = new THREE.CylinderGeometry(0.0012, 0.0012, channelLen, 6);
    seamGeo.rotateX(Math.PI / 2);
    addMesh(seamGeo, seamMat, `quilt_seam_${i}`, [x, topY + 0.0015, 0]);
  }

  // 4. Folded-over corner flap on upper-right (+X, -Z)
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.04, -0.02);
  flapShape.lineTo(0.14, -0.02);
  flapShape.quadraticCurveTo(0.17, -0.02, 0.17, 0.01);
  flapShape.lineTo(0.17, 0.17);
  flapShape.quadraticCurveTo(0.17, 0.20, 0.13, 0.18);
  flapShape.lineTo(-0.04, 0.02);
  flapShape.quadraticCurveTo(-0.05, 0.0, -0.04, -0.02);

  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 12,
  });
  flapGeo.rotateX(-Math.PI / 2);
  addMesh(flapGeo, quiltMat, "quilt_folded_flap", [0.02, H + 0.002, -0.04], [0, 0, -0.02]);

  // 5. Horizontal channel puffs on the folded flap
  for (let i = 0; i < 4; i++) {
    const zOff = -0.035 + i * 0.032;
    const len = 0.14 - i * 0.022;
    const xOff = 0.06 + i * 0.01;
    const flapPuffGeo = new THREE.CapsuleGeometry(0.004, len, 4, 10);
    flapPuffGeo.rotateZ(Math.PI / 2);
    flapPuffGeo.scale(1.0, 0.5, 2.2);
    addMesh(flapPuffGeo, quiltMat, `flap_channel_${i + 1}`, [xOff, H + 0.011, zOff]);
  }

  // 6. Bound edge piping along the right (+X) and back (-Z) edges
  const rightEdgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W / 2 - 0.008, H * 0.72, -D / 2 + CORNER_R),
    new THREE.Vector3(W / 2 - 0.005, H * 0.76, 0),
    new THREE.Vector3(W / 2 - 0.008, H * 0.72, D / 2 - CORNER_R),
  ]);
  const rightBindingGeo = new THREE.TubeGeometry(rightEdgeCurve, 16, 0.0055, 8, false);
  addMesh(rightBindingGeo, bindingMat, "quilt_right_binding");

  const backEdgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + CORNER_R, H * 0.72, -D / 2 + 0.008),
    new THREE.Vector3(0, H * 0.76, -D / 2 + 0.005),
    new THREE.Vector3(W / 2 - CORNER_R, H * 0.72, -D / 2 + 0.008),
  ]);
  const backBindingGeo = new THREE.TubeGeometry(backEdgeCurve, 16, 0.0055, 8, false);
  addMesh(backBindingGeo, bindingMat, "quilt_back_binding");

  // 7. Binding along the folded flap edge
  const flapBindingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, H + 0.007, -0.02),
    new THREE.Vector3(0.15, H + 0.007, -0.02),
    new THREE.Vector3(0.185, H + 0.007, -0.045),
    new THREE.Vector3(0.185, H + 0.007, -0.18),
  ]);
  const flapBindingGeo = new THREE.TubeGeometry(flapBindingCurve, 20, 0.005, 8, false);
  addMesh(flapBindingGeo, bindingMat, "flap_edge_binding");

  return group;
}
