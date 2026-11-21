function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.46;
  const D = 0.46;
  const H = 0.44;
  const FOOT_H = 0.012;
  const FOOT_W = 0.055;
  const FOOT_INSET = 0.025;
  const LID_H = 0.055;
  const BASE_H = H - FOOT_H - LID_H;
  const CORNER_R = 0.018;
  const BEVEL = 0.008;
  const RIM_H = 0.014;
  const RIM_T = 0.022;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc9beae,
    roughness: 0.88,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7a6552,
    roughness: 0.65,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x5c4a3a,
    roughness: 0.55,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    roughness: 0.3,
    metalness: 0.85,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);
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

  // 1. Four low-profile corner feet
  const footGeo = new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_W);
  const fx = W / 2 - FOOT_INSET - FOOT_W / 2;
  const fz = D / 2 - FOOT_INSET - FOOT_W / 2;
  addMesh(footGeo, footMat, "foot_fl", -fx, FOOT_H / 2, fz);
  addMesh(footGeo, footMat, "foot_fr", fx, FOOT_H / 2, fz);
  addMesh(footGeo, footMat, "foot_bl", -fx, FOOT_H / 2, -fz);
  addMesh(footGeo, footMat, "foot_br", fx, FOOT_H / 2, -fz);

  // 2. Upholstered base body (extruded rounded rectangle with soft bevel)
  const baseShape = makeRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 8,
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, fabricMat, "base_body", 0, FOOT_H + BEVEL, 0);

  // 3. Internal wood rim strips (just beneath the lid seam)
  const rimY = FOOT_H + BASE_H - RIM_H / 2;
  const rimFBGeo = new THREE.BoxGeometry(W - 0.04, RIM_H, RIM_T);
  const rimLRGeo = new THREE.BoxGeometry(RIM_T, RIM_H, D - 0.04 - RIM_T * 2);
  addMesh(rimFBGeo, woodMat, "wood_rim_front", 0, rimY, D / 2 - 0.02 - RIM_T / 2);
  addMesh(rimFBGeo, woodMat, "wood_rim_back", 0, rimY, -D / 2 + 0.02 + RIM_T / 2);
  addMesh(rimLRGeo, woodMat, "wood_rim_left", -W / 2 + 0.02 + RIM_T / 2, rimY, 0);
  addMesh(rimLRGeo, woodMat, "wood_rim_right", W / 2 - 0.02 - RIM_T / 2, rimY, 0);

  // 4. Hinged upholstered lid (closed pose)
  const lidShape = makeRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, CORNER_R);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: LID_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 8,
  });
  lidGeo.rotateX(-Math.PI / 2);
  addMesh(lidGeo, fabricMat, "lid_body", 0, FOOT_H + BASE_H + BEVEL, 0);

  // 5. Subtle crowned top pad on the lid
  const padShape = makeRoundedRectShape(W - 0.03, D - 0.03, CORNER_R * 0.8);
  const padGeo = new THREE.ExtrudeGeometry(padShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 6,
  });
  padGeo.rotateX(-Math.PI / 2);
  addMesh(padGeo, fabricMat, "lid_top_pad", 0, H - 0.004, 0);

  // 6. Two small rear hinges at the back seam (-Z)
  const hingeGeo = new THREE.BoxGeometry(0.032, 0.008, 0.012);
  const hingeY = FOOT_H + BASE_H;
  const hingeZ = -D / 2 + 0.008;
  addMesh(hingeGeo, metalMat, "hinge_left", -W * 0.28, hingeY, hingeZ);
  addMesh(hingeGeo, metalMat, "hinge_right", W * 0.28, hingeY, hingeZ);

  return group;
}
