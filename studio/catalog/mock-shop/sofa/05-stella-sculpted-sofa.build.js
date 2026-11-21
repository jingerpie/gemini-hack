function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 2.05;
  const D = 0.96;
  const H = 0.78;
  const PLINTH_H = 0.025;
  const BASE_H = 0.22;
  const CUSHION_H = 0.19;
  const SHELL_THICK = 0.14;

  // Materials
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xeae2d6,
    roughness: 0.9,
    metalness: 0.0
  });

  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0xb8a998,
    roughness: 0.88,
    metalness: 0.0
  });

  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x4a4643,
    roughness: 0.75,
    metalness: 0.05
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x262321,
    roughness: 0.6,
    metalness: 0.1
  });

  // Helper: rounded rectangle THREE.Shape centered at (0, 0)
  function createRoundedRectShape(width, depth, radius) {
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

  // 1. Recessed bottom plinth
  const plinthShape = createRoundedRectShape(W - 0.24, D - 0.18, 0.16);
  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: PLINTH_H,
    bevelEnabled: false,
    curveSegments: 16
  });
  plinthGeo.rotateX(-Math.PI / 2);
  addMesh(plinthGeo, plinthMat, "plinth_base", 0, 0, 0.02);

  // 2. Lower upholstered taupe base
  const baseW = W - SHELL_THICK * 2 + 0.04;
  const baseD = D - SHELL_THICK - 0.04;
  const baseShape = createRoundedRectShape(baseW, baseD, 0.16);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 0.06,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 8,
    curveSegments: 16
  });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, taupeMat, "lower_base", 0, PLINTH_H + 0.025, 0.04);

  // 3. Two seat cushions + piping
  const innerW = baseW - 0.04;
  const cushionW = innerW / 2 - 0.015;
  const cushionD = baseD - 0.04;
  const cushionY = PLINTH_H + BASE_H - 0.01;

  [-1, 1].forEach((side) => {
    const sideName = side < 0 ? "left" : "right";
    const cx = side * (cushionW / 2 + 0.012);
    const cz = 0.05;

    const cShape = createRoundedRectShape(cushionW - 0.08, cushionD - 0.08, 0.14);
    const cGeo = new THREE.ExtrudeGeometry(cShape, {
      depth: CUSHION_H - 0.09,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 10,
      curveSegments: 16
    });
    cGeo.rotateX(-Math.PI / 2);
    addMesh(cGeo, creamMat, `seat_cushion_${sideName}`, cx, cushionY + 0.045, cz);

    // Cushion piping around the middle-upper perimeter
    const pw = (cushionW - 0.005) / 2;
    const pd = (cushionD - 0.005) / 2;
    const pr = 0.16;
    const pipingPts = [
      new THREE.Vector3(-pw + pr, 0, -pd),
      new THREE.Vector3(pw - pr, 0, -pd),
      new THREE.Vector3(pw, 0, -pd + pr),
      new THREE.Vector3(pw, 0, pd - pr),
      new THREE.Vector3(pw - pr, 0, pd),
      new THREE.Vector3(-pw + pr, 0, pd),
      new THREE.Vector3(-pw, 0, pd - pr),
      new THREE.Vector3(-pw, 0, -pd + pr)
    ];
    const pipingCurve = new THREE.CatmullRomCurve3(pipingPts, true);
    const pipingGeo = new THREE.TubeGeometry(pipingCurve, 48, 0.0055, 8, true);
    addMesh(pipingGeo, charcoalMat, `cushion_piping_${sideName}`, cx, cushionY + CUSHION_H * 0.56, cz);
  });

  // 4. Smooth continuous rounded tub shell (cream fabric all around)
  const shellBevel = 0.055;
  const halfW = W / 2 - shellBevel;
  const backY = D / 2 - shellBevel;
  const frontY = D / 2 - 0.12;
  const rCap = SHELL_THICK / 2;

  const shellShape = new THREE.Shape();
  shellShape.moveTo(-halfW, -frontY);
  shellShape.splineThru([
    new THREE.Vector2(-halfW, 0),
    new THREE.Vector2(-halfW * 0.85, backY * 0.72),
    new THREE.Vector2(0, backY),
    new THREE.Vector2(halfW * 0.85, backY * 0.72),
    new THREE.Vector2(halfW, 0),
    new THREE.Vector2(halfW, -frontY)
  ]);
  shellShape.quadraticCurveTo(halfW, -frontY - rCap, halfW - rCap, -frontY - rCap);
  shellShape.quadraticCurveTo(halfW - SHELL_THICK, -frontY - rCap, halfW - SHELL_THICK, -frontY);
  shellShape.splineThru([
    new THREE.Vector2(halfW - SHELL_THICK, 0),
    new THREE.Vector2((halfW - SHELL_THICK) * 0.85, (backY - SHELL_THICK) * 0.72),
    new THREE.Vector2(0, backY - SHELL_THICK),
    new THREE.Vector2(-(halfW - SHELL_THICK) * 0.85, (backY - SHELL_THICK) * 0.72),
    new THREE.Vector2(-halfW + SHELL_THICK, 0),
    new THREE.Vector2(-halfW + SHELL_THICK, -frontY)
  ]);
  shellShape.quadraticCurveTo(-halfW + SHELL_THICK, -frontY - rCap, -halfW + rCap, -frontY - rCap);
  shellShape.quadraticCurveTo(-halfW, -frontY - rCap, -halfW, -frontY);

  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: H - PLINTH_H - shellBevel * 2,
    bevelEnabled: true,
    bevelThickness: shellBevel,
    bevelSize: shellBevel,
    bevelSegments: 10,
    curveSegments: 32
  });
  shellGeo.rotateX(-Math.PI / 2);
  addMesh(shellGeo, creamMat, "backrest_shell", 0, PLINTH_H + shellBevel, 0);

  // 5. Top piping along the wrap-around shell rim
  const rimPts = [
    new THREE.Vector3(-halfW + rCap * 0.4, H - 0.012, frontY),
    new THREE.Vector3(-halfW + rCap * 0.4, H - 0.012, 0),
    new THREE.Vector3(-halfW * 0.85, H - 0.012, -backY * 0.72),
    new THREE.Vector3(0, H - 0.012, -backY),
    new THREE.Vector3(halfW * 0.85, H - 0.012, -backY * 0.72),
    new THREE.Vector3(halfW - rCap * 0.4, H - 0.012, 0),
    new THREE.Vector3(halfW - rCap * 0.4, H - 0.012, frontY)
  ];
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, false);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 48, 0.0055, 8, false);
  addMesh(rimGeo, charcoalMat, "shell_top_piping", 0, 0, 0);

  return group;
}
