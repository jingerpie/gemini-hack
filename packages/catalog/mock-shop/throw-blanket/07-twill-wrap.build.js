function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.44;
  const D = 0.56;
  const H = 0.14;

  const BASE_H = 0.065;
  const MID_H = 0.032;
  const BEVEL = 0.022;
  const HEM_THICK = 0.008;
  const HEM_WIDTH = 0.022;

  // Materials
  const twillMat = new THREE.MeshStandardMaterial({
    color: 0x45bfa6,
    roughness: 0.85,
    metalness: 0.02,
  });

  const twillHemMat = new THREE.MeshStandardMaterial({
    color: 0x3bb098,
    roughness: 0.88,
    metalness: 0.02,
  });

  const twillInnerMat = new THREE.MeshStandardMaterial({
    color: 0x52cbb2,
    roughness: 0.82,
    metalness: 0.02,
  });

  function makeRoundedRectShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw * 0.45, hd * 0.45);
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

  // 1. Base folded blanket body (bottom-center at y = 0)
  const baseShape = makeRoundedRectShape(W - BEVEL * 2, D - BEVEL * 2, 0.035);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 6,
    curveSegments: 12,
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, twillMat, "base_fold_body", [0, BEVEL, 0]);

  // 2. Soft rounded side fold rolls along the base perimeter
  const rollRadius = 0.018;
  const sideRollGeo = new THREE.CapsuleGeometry(rollRadius, D - 0.08, 6, 16);
  addMesh(sideRollGeo, twillMat, "base_fold_roll_left", [-W / 2 + 0.012, BASE_H * 0.5, 0], [Math.PI / 2, 0, 0]);
  addMesh(sideRollGeo, twillMat, "base_fold_roll_right", [W / 2 - 0.012, BASE_H * 0.5, 0], [Math.PI / 2, 0, 0]);

  const frontRollGeo = new THREE.CapsuleGeometry(rollRadius, W - 0.08, 6, 16);
  addMesh(frontRollGeo, twillMat, "base_fold_roll_front", [0, BASE_H * 0.5, D / 2 - 0.012], [0, 0, Math.PI / 2]);
  addMesh(frontRollGeo, twillMat, "base_fold_roll_back", [0, BASE_H * 0.5, -D / 2 + 0.012], [0, 0, Math.PI / 2]);

  // 3. Layered fold creases on the sides to show stacked fabric thickness
  const creaseGeoSide = new THREE.CapsuleGeometry(0.008, D - 0.09, 4, 12);
  addMesh(creaseGeoSide, twillHemMat, "lower_fold_crease_left", [-W / 2 + 0.006, BASE_H * 0.35, 0], [Math.PI / 2, 0, 0]);
  addMesh(creaseGeoSide, twillHemMat, "lower_fold_crease_right", [W / 2 - 0.006, BASE_H * 0.35, 0], [Math.PI / 2, 0, 0]);

  // 4. Middle folded layer resting on top of the base
  const midW = W * 0.92;
  const midD = D * 0.90;
  const midBevel = 0.012;
  const midShape = makeRoundedRectShape(midW - midBevel * 2, midD - midBevel * 2, 0.025);
  const midGeo = new THREE.ExtrudeGeometry(midShape, {
    depth: MID_H - midBevel * 2,
    bevelEnabled: true,
    bevelThickness: midBevel,
    bevelSize: midBevel,
    bevelSegments: 5,
    curveSegments: 10,
  });
  midGeo.rotateX(-Math.PI / 2);
  const midY = BASE_H - 0.008;
  addMesh(midGeo, twillMat, "mid_layer_body", [-0.01, midY + midBevel, -0.015]);

  // 5. Stitched hem along the front and right edges of the middle layer
  const midTopY = midY + MID_H;
  const hemFrontGeo = new THREE.CapsuleGeometry(HEM_THICK, midW - 0.04, 4, 12);
  addMesh(hemFrontGeo, twillHemMat, "mid_layer_hem_front", [-0.01, midTopY - 0.004, -0.015 + midD / 2 - HEM_WIDTH * 0.5], [0, 0, Math.PI / 2]);

  const hemRightGeo = new THREE.CapsuleGeometry(HEM_THICK, midD - 0.04, 4, 12);
  addMesh(hemRightGeo, twillHemMat, "mid_layer_hem_right", [-0.01 + midW / 2 - HEM_WIDTH * 0.5, midTopY - 0.004, -0.015], [Math.PI / 2, 0, 0]);

  // 6. Top folded-back triangular corner flap
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.15, -0.18);
  flapShape.lineTo(0.16, -0.10);
  flapShape.quadraticCurveTo(0.18, -0.09, 0.16, -0.07);
  flapShape.lineTo(-0.02, 0.13);
  flapShape.quadraticCurveTo(-0.04, 0.15, -0.06, 0.12);
  flapShape.lineTo(-0.17, -0.15);
  flapShape.quadraticCurveTo(-0.18, -0.18, -0.15, -0.18);

  const flapBevel = 0.008;
  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: flapBevel,
    bevelSize: flapBevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  flapGeo.rotateX(-Math.PI / 2);
  const flapY = midTopY + 0.004;
  addMesh(flapGeo, twillInnerMat, "top_flap_triangle", [0.02, flapY, -0.02], [0.03, 0, -0.02]);

  // 7. Stitched hem borders on the two exposed edges of the triangular flap
  const flapHemLeftGeo = new THREE.CapsuleGeometry(0.006, 0.27, 4, 12);
  addMesh(flapHemLeftGeo, twillHemMat, "top_flap_hem_left", [-0.09, flapY + 0.018, -0.03], [Math.PI / 2, 0, -0.42]);

  const flapHemRightGeo = new THREE.CapsuleGeometry(0.006, 0.25, 4, 12);
  addMesh(flapHemRightGeo, twillHemMat, "top_flap_hem_right", [0.075, flapY + 0.018, 0.015], [Math.PI / 2, 0, 0.72]);

  // 8. Soft diagonal fold crease along the top edge of the triangular flap
  const flapCreaseGeo = new THREE.CapsuleGeometry(0.012, 0.31, 6, 14);
  addMesh(flapCreaseGeo, twillMat, "top_flap_fold_crease", [0.005, flapY + 0.012, -0.14], [Math.PI / 2, 0, -1.32]);

  // 9. Outer hem trim along the base right/back edge
  const outerHemGeo = new THREE.CapsuleGeometry(0.006, D - 0.08, 4, 12);
  addMesh(outerHemGeo, twillHemMat, "outer_base_hem_right", [W / 2 - 0.025, BASE_H - 0.004, 0], [Math.PI / 2, 0, 0]);

  return group;
}
