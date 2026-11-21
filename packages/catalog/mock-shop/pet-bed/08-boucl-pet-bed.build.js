function build(THREE) {
  const group = new THREE.Group();

  const W = 0.96;
  const D = 0.74;
  const H = 0.32;
  const BASE_H = 0.024;
  const SEAT_H = 0.14;
  const FRONT_LIP_H = 0.165;

  const boucleMat = new THREE.MeshStandardMaterial({
    color: 0xebe6dc,
    roughness: 0.92,
    metalness: 0.0,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xdfd8cc,
    roughness: 0.95,
    metalness: 0.0,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1a1918,
    roughness: 0.65,
    metalness: 0.1,
  });

  function addMesh(geo, mat, name, pos, rot, scale) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed dark plinth base (touching y = 0)
  const plinthGeo = new THREE.CylinderGeometry(1, 1, BASE_H, 32);
  addMesh(
    plinthGeo,
    baseMat,
    'base_plinth',
    [0, BASE_H / 2, 0],
    null,
    [W * 0.43, 1, D * 0.41]
  );

  // 2. Plinth upper shadow-gap collar
  const collarGeo = new THREE.CylinderGeometry(1, 1, 0.012, 32);
  addMesh(
    collarGeo,
    baseMat,
    'plinth_collar',
    [0, BASE_H + 0.004, 0],
    null,
    [W * 0.41, 1, D * 0.39]
  );

  // 3. Lower upholstered shell (rounded oval base)
  const lowerShellGeo = new THREE.SphereGeometry(1, 32, 20);
  addMesh(
    lowerShellGeo,
    boucleMat,
    'lower_upholstered_shell',
    [0, BASE_H + 0.065, 0],
    null,
    [W * 0.48, 0.075, D * 0.48]
  );

  // 4. Inner seat deck support
  const deckGeo = new THREE.CylinderGeometry(1, 1, 0.06, 32);
  addMesh(
    deckGeo,
    boucleMat,
    'seat_deck_core',
    [0, BASE_H + 0.055, 0.01],
    null,
    [W * 0.38, 1, D * 0.36]
  );

  // 5. Plush oval seat cushion
  const cushionGeo = new THREE.SphereGeometry(1, 32, 20);
  addMesh(
    cushionGeo,
    boucleMat,
    'seat_cushion',
    [0, SEAT_H - 0.015, 0.02],
    null,
    [W * 0.34, 0.055, D * 0.33]
  );

  // 6. Back & side bolster (wraps from front-left around -Z to front-right)
  const backCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.36, FRONT_LIP_H + 0.01, D * 0.22),
    new THREE.Vector3(-W * 0.40, H * 0.68, D * 0.02),
    new THREE.Vector3(-W * 0.32, H * 0.74, -D * 0.28),
    new THREE.Vector3(0, H * 0.76, -D * 0.36),
    new THREE.Vector3(W * 0.32, H * 0.74, -D * 0.28),
    new THREE.Vector3(W * 0.40, H * 0.68, D * 0.02),
    new THREE.Vector3(W * 0.36, FRONT_LIP_H + 0.01, D * 0.22),
  ]);
  const backBolsterGeo = new THREE.TubeGeometry(backCurve, 32, 0.115, 20, false);
  addMesh(backBolsterGeo, boucleMat, 'back_and_side_bolster', [0, 0, 0]);

  // 7. Front entry lip bolster (dips low at +Z)
  const frontCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.37, FRONT_LIP_H + 0.005, D * 0.20),
    new THREE.Vector3(-W * 0.22, FRONT_LIP_H - 0.035, D * 0.34),
    new THREE.Vector3(0, FRONT_LIP_H - 0.045, D * 0.38),
    new THREE.Vector3(W * 0.22, FRONT_LIP_H - 0.035, D * 0.34),
    new THREE.Vector3(W * 0.37, FRONT_LIP_H + 0.005, D * 0.20),
  ]);
  const frontBolsterGeo = new THREE.TubeGeometry(frontCurve, 28, 0.092, 18, false);
  addMesh(frontBolsterGeo, boucleMat, 'front_entry_bolster', [0, 0, 0]);

  // 8. Left bolster cap (smooth transition at front-left)
  const capGeo = new THREE.SphereGeometry(0.102, 20, 16);
  addMesh(
    capGeo,
    boucleMat,
    'left_bolster_transition',
    [-W * 0.365, FRONT_LIP_H + 0.008, D * 0.21],
    null,
    [1.05, 0.92, 1.05]
  );

  // 9. Right bolster cap (smooth transition at front-right)
  addMesh(
    capGeo,
    boucleMat,
    'right_bolster_transition',
    [W * 0.365, FRONT_LIP_H + 0.008, D * 0.21],
    null,
    [1.05, 0.92, 1.05]
  );

  // 10. Front horizontal seam piping
  const frontSeamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.43, FRONT_LIP_H + 0.015, D * 0.16),
    new THREE.Vector3(-W * 0.25, FRONT_LIP_H - 0.015, D * 0.39),
    new THREE.Vector3(0, FRONT_LIP_H - 0.025, D * 0.455),
    new THREE.Vector3(W * 0.25, FRONT_LIP_H - 0.015, D * 0.39),
    new THREE.Vector3(W * 0.43, FRONT_LIP_H + 0.015, D * 0.16),
  ]);
  const frontSeamGeo = new THREE.TubeGeometry(frontSeamCurve, 28, 0.0045, 8, false);
  addMesh(frontSeamGeo, seamMat, 'front_seam_piping', [0, 0, 0]);

  // 11. Left inner vertical-ish bolster seam
  const leftInnerSeamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.24, SEAT_H, -D * 0.16),
    new THREE.Vector3(-W * 0.25, H * 0.72, -D * 0.20),
    new THREE.Vector3(-W * 0.27, H * 0.98, -D * 0.26),
  ]);
  const innerSeamGeoL = new THREE.TubeGeometry(leftInnerSeamCurve, 12, 0.004, 8, false);
  addMesh(innerSeamGeoL, seamMat, 'left_inner_seam', [0, 0, 0]);

  // 12. Right inner vertical-ish bolster seam
  const rightInnerSeamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W * 0.24, SEAT_H, -D * 0.16),
    new THREE.Vector3(W * 0.25, H * 0.72, -D * 0.20),
    new THREE.Vector3(W * 0.27, H * 0.98, -D * 0.26),
  ]);
  const innerSeamGeoR = new THREE.TubeGeometry(rightInnerSeamCurve, 12, 0.004, 8, false);
  addMesh(innerSeamGeoR, seamMat, 'right_inner_seam', [0, 0, 0]);

  return group;
}
