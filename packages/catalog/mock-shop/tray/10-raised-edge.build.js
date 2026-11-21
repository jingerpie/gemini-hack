function build(THREE) {
  const group = new THREE.Group();

  const W = 0.30;
  const D = 0.20;
  const H = 0.024;
  const BASE_H = 0.008;
  const RIM_H = H - BASE_H;
  const RIM_THICK = 0.014;
  const CORNER_R = 0.022;
  const BEVEL = 0.0025;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4e29,
    roughness: 0.45,
    metalness: 0.02
  });

  const innerWoodMat = new THREE.MeshStandardMaterial({
    color: 0x724624,
    roughness: 0.48,
    metalness: 0.02
  });

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw, hd);
    shape.moveTo(-hw + cr, -hd);
    shape.lineTo(hw - cr, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    shape.lineTo(hw, hd - cr);
    shape.quadraticCurveTo(hw, hd, hw - cr, hd);
    shape.lineTo(-hw + cr, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    shape.lineTo(-hw, -hd + cr);
    shape.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return shape;
  }

  function createRoundedRectPath(w, d, r) {
    const path = new THREE.Path();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw, hd);
    path.moveTo(-hw + cr, -hd);
    path.lineTo(hw - cr, -hd);
    path.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    path.lineTo(hw, hd - cr);
    path.quadraticCurveTo(hw, hd, hw - cr, hd);
    path.lineTo(-hw + cr, hd);
    path.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    path.lineTo(-hw, -hd + cr);
    path.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return path;
  }

  // Base slab
  const baseShape = createRoundedRectShape(W - 2 * BEVEL, D - 2 * BEVEL, CORNER_R - BEVEL);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, innerWoodMat);
  baseMesh.name = "tray_base";
  baseMesh.position.y = BEVEL;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Raised rim
  const rimShape = createRoundedRectShape(W - 2 * BEVEL, D - 2 * BEVEL, CORNER_R - BEVEL);
  const innerW = W - 2 * RIM_THICK;
  const innerD = D - 2 * RIM_THICK;
  const innerR = Math.max(0.004, CORNER_R - RIM_THICK);
  const holePath = createRoundedRectPath(innerW + 2 * BEVEL, innerD + 2 * BEVEL, innerR + BEVEL);
  rimShape.holes.push(holePath);

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RIM_H - BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 16
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, woodMat);
  rimMesh.name = "tray_rim";
  rimMesh.position.y = BASE_H;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Subtle inner cove step at the base-rim junction
  const coveShape = createRoundedRectShape(innerW + 0.004, innerD + 0.004, innerR + 0.002);
  const coveHole = createRoundedRectPath(innerW - 0.002, innerD - 0.002, Math.max(0.002, innerR - 0.001));
  coveShape.holes.push(coveHole);
  const coveGeo = new THREE.ExtrudeGeometry(coveShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 16
  });
  coveGeo.rotateX(-Math.PI / 2);
  const coveMesh = new THREE.Mesh(coveGeo, innerWoodMat);
  coveMesh.name = "tray_inner_cove";
  coveMesh.position.y = BASE_H;
  coveMesh.castShadow = true;
  coveMesh.receiveShadow = true;
  group.add(coveMesh);

  return group;
}
