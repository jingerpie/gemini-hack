function build(THREE) {
  const group = new THREE.Group();

  const W = 0.54;
  const H = 0.70;
  const D = 0.032;
  const BORDER = 0.042;
  const BACK_Z = -D / 2;

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc59b45,
    metalness: 0.75,
    roughness: 0.32
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1,
    roughness: 0.05
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x2b2520,
    metalness: 0.05,
    roughness: 0.85
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx || ry || rz) mesh.rotation.set(rx || 0, ry || 0, rz || 0);
    if (sx !== undefined || sy !== undefined || sz !== undefined) {
      mesh.scale.set(sx !== undefined ? sx : 1, sy !== undefined ? sy : 1, sz !== undefined ? sz : 1);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Backing board (flat back at z = -D/2)
  const backThick = 0.008;
  addMesh(
    new THREE.BoxGeometry(W - 0.012, H - 0.012, backThick),
    backMat,
    'backing_board',
    0, H / 2, BACK_Z + backThick / 2
  );

  // Mirror glass
  const glassThick = 0.004;
  addMesh(
    new THREE.BoxGeometry(W - BORDER * 1.5, H - BORDER * 1.5, glassThick),
    mirrorMat,
    'mirror_glass',
    0, H / 2, BACK_Z + backThick + glassThick / 2
  );

  // Frame main bars (recessed channel base)
  const barD = 0.022;
  const barZ = BACK_Z + barD / 2;
  const innerH = H - BORDER * 2;

  addMesh(new THREE.BoxGeometry(W, BORDER, barD), goldMat, 'frame_top', 0, H - BORDER / 2, barZ);
  addMesh(new THREE.BoxGeometry(W, BORDER, barD), goldMat, 'frame_bottom', 0, BORDER / 2, barZ);
  addMesh(new THREE.BoxGeometry(BORDER, innerH, barD), goldMat, 'frame_left', -W / 2 + BORDER / 2, H / 2, barZ);
  addMesh(new THREE.BoxGeometry(BORDER, innerH, barD), goldMat, 'frame_right', W / 2 - BORDER / 2, H / 2, barZ);

  // Outer raised molding bead
  const outerBeadW = 0.011;
  const outerBeadD = 0.028;
  const outerBeadZ = BACK_Z + outerBeadD / 2;
  const outerInnerH = H - outerBeadW * 2;

  addMesh(new THREE.BoxGeometry(W, outerBeadW, outerBeadD), goldMat, 'frame_outer_top', 0, H - outerBeadW / 2, outerBeadZ);
  addMesh(new THREE.BoxGeometry(W, outerBeadW, outerBeadD), goldMat, 'frame_outer_bottom', 0, outerBeadW / 2, outerBeadZ);
  addMesh(new THREE.BoxGeometry(outerBeadW, outerInnerH, outerBeadD), goldMat, 'frame_outer_left', -W / 2 + outerBeadW / 2, H / 2, outerBeadZ);
  addMesh(new THREE.BoxGeometry(outerBeadW, outerInnerH, outerBeadD), goldMat, 'frame_outer_right', W / 2 - outerBeadW / 2, H / 2, outerBeadZ);

  // Inner raised lip next to glass
  const lipW = 0.009;
  const lipD = 0.026;
  const lipZ = BACK_Z + lipD / 2;
  const lipSpanW = W - BORDER * 2 + lipW * 2;
  const lipSpanH = H - BORDER * 2;

  addMesh(new THREE.BoxGeometry(lipSpanW, lipW, lipD), goldMat, 'frame_lip_top', 0, H - BORDER + lipW / 2, lipZ);
  addMesh(new THREE.BoxGeometry(lipSpanW, lipW, lipD), goldMat, 'frame_lip_bottom', 0, BORDER - lipW / 2, lipZ);
  addMesh(new THREE.BoxGeometry(lipW, lipSpanH, lipD), goldMat, 'frame_lip_left', -W / 2 + BORDER - lipW / 2, H / 2, lipZ);
  addMesh(new THREE.BoxGeometry(lipW, lipSpanH, lipD), goldMat, 'frame_lip_right', W / 2 - BORDER + lipW / 2, H / 2, lipZ);

  // Ribbon Crest at top center
  const crestY = H - 0.002;
  const crestZ = BACK_Z + 0.024;

  // Central knot
  addMesh(
    new THREE.SphereGeometry(0.014, 16, 12),
    goldMat,
    'crest_knot',
    0, crestY + 0.004, crestZ + 0.004,
    0, 0, 0,
    1.1, 0.9, 0.7
  );

  // Main side loops
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';

    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, crestY + 0.004, crestZ),
      new THREE.Vector3(side * 0.028, crestY + 0.022, crestZ + 0.005),
      new THREE.Vector3(side * 0.052, crestY + 0.012, crestZ + 0.002),
      new THREE.Vector3(side * 0.042, crestY - 0.008, crestZ + 0.003),
      new THREE.Vector3(side * 0.012, crestY - 0.002, crestZ + 0.002)
    ]);
    addMesh(
      new THREE.TubeGeometry(mainCurve, 20, 0.0075, 8, false),
      goldMat,
      `crest_main_loop_${label}`,
      0, 0, 0,
      0, 0, 0,
      1, 1, 0.55
    );

    // Upper crown loops
    const upperCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.006, crestY + 0.008, crestZ),
      new THREE.Vector3(side * 0.016, crestY + 0.042, crestZ + 0.003),
      new THREE.Vector3(side * 0.040, crestY + 0.036, crestZ + 0.001),
      new THREE.Vector3(side * 0.034, crestY + 0.014, crestZ + 0.002)
    ]);
    addMesh(
      new THREE.TubeGeometry(upperCurve, 18, 0.0065, 8, false),
      goldMat,
      `crest_upper_loop_${label}`,
      0, 0, 0,
      0, 0, 0,
      1, 1, 0.55
    );

    // Flowing ribbon tails
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.010, crestY - 0.002, crestZ + 0.003),
      new THREE.Vector3(side * 0.045, crestY - 0.008, crestZ + 0.005),
      new THREE.Vector3(side * 0.082, crestY - 0.014, crestZ + 0.002),
      new THREE.Vector3(side * 0.105, crestY - 0.022, crestZ - 0.002)
    ]);
    addMesh(
      new THREE.TubeGeometry(tailCurve, 16, 0.0055, 8, false),
      goldMat,
      `crest_tail_${label}`,
      0, 0, 0,
      0, 0, 0,
      1, 1, 0.45
    );
  }

  // Center top arch loop
  addMesh(
    new THREE.TorusGeometry(0.014, 0.0055, 8, 16, Math.PI),
    goldMat,
    'crest_center_arch',
    0, crestY + 0.032, crestZ,
    0, 0, 0,
    1, 1.1, 0.55
  );

  // Top hanging eyelets
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';
    addMesh(
      new THREE.TorusGeometry(0.009, 0.0022, 8, 16),
      goldMat,
      `hanging_ring_${label}`,
      side * (W / 2 - 0.048), H + 0.005, BACK_Z + 0.010
    );
  }

  return group;
}
