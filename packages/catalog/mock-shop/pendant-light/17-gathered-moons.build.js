function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.65;
  const D = 0.65;
  const TOTAL_H = 0.90;

  const CANOPY_R = 0.065;
  const CANOPY_H = 0.025;
  const ROD_R = 0.008;
  const HUB_R = 0.022;
  const HUB_H = 0.095;
  const HUB_Y = 0.30;

  const ARM_R = 0.007;
  const CUP_R = 0.020;
  const CUP_H = 0.014;

  const R_LARGE = 0.060;
  const R_MED = 0.052;
  const R_SMALL = 0.044;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.32,
    metalness: 0.88,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f5f0,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffdf9e,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  function addGlobeUnit(name, x, y, z, radius, cupDirY = 0, cupDirX = 0, cupDirZ = 0) {
    addMesh(
      new THREE.SphereGeometry(radius, 24, 18),
      glassMat,
      `globe_${name}`,
      x, y, z
    );
    addMesh(
      new THREE.SphereGeometry(radius * 0.45, 12, 10),
      emitMat,
      `emit_bulb_${name}`,
      x, y, z
    );
    // Brass socket cup at the base of the globe
    const cupDist = radius - 0.004;
    const cx = x + cupDirX * cupDist;
    const cy = y + cupDirY * cupDist;
    const cz = z + cupDirZ * cupDist;
    let rx = 0, rz = 0;
    if (cupDirX !== 0) rz = cupDirX > 0 ? -Math.PI / 2 : Math.PI / 2;
    else if (cupDirZ !== 0) rx = cupDirZ > 0 ? Math.PI / 2 : -Math.PI / 2;
    else if (cupDirY > 0) rx = Math.PI;

    addMesh(
      new THREE.CylinderGeometry(CUP_R, CUP_R * 0.7, CUP_H, 16),
      brassMat,
      `socket_cup_${name}`,
      cx, cy, cz,
      rx, 0, rz
    );
  }

  // 1. Ceiling canopy
  addMesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 28),
    brassMat,
    'ceiling_canopy',
    0, TOTAL_H - CANOPY_H / 2, 0
  );

  // 2. Downrod from canopy to central hub
  const rodBottom = HUB_Y + HUB_H / 2;
  const rodTop = TOTAL_H - CANOPY_H;
  const rodLen = rodTop - rodBottom;
  addMesh(
    new THREE.CylinderGeometry(ROD_R, ROD_R, rodLen, 16),
    brassMat,
    'downrod',
    0, rodBottom + rodLen / 2, 0
  );

  // 3. Central hub
  addMesh(
    new THREE.CylinderGeometry(HUB_R, HUB_R, HUB_H, 24),
    brassMat,
    'central_hub',
    0, HUB_Y, 0
  );

  // 4. Bottom stem & bottom globe (touches y = 0)
  const bottomGlobeY = R_LARGE;
  const bottomStemTop = HUB_Y - HUB_H / 2;
  const bottomStemBottom = bottomGlobeY + R_LARGE - 0.004;
  const bottomStemLen = bottomStemTop - bottomStemBottom;
  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, bottomStemLen, 12),
    brassMat,
    'bottom_stem',
    0, bottomStemBottom + bottomStemLen / 2, 0
  );
  addGlobeUnit('bottom', 0, bottomGlobeY, 0, R_LARGE, 1, 0, 0);

  // 5. Top center globe mounted just above the hub on the downrod
  const topGlobeY = HUB_Y + HUB_H / 2 + 0.085;
  addGlobeUnit('top_center', 0, topGlobeY, 0, R_LARGE, -1, 0, 0);

  // 6. Four main horizontal arms (+/-X and +/-Z) reaching exact 0.65m width & depth
  const outerCenter = W / 2 - R_MED; // 0.325 - 0.052 = 0.273
  const armLen = outerCenter - HUB_R * 0.5;

  // +X arm & globe
  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, armLen, 12),
    brassMat,
    'arm_right',
    HUB_R * 0.5 + armLen / 2, HUB_Y, 0,
    0, 0, Math.PI / 2
  );
  addGlobeUnit('right', outerCenter, HUB_Y, 0, R_MED, 0, -1, 0);

  // -X arm & globe
  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, armLen, 12),
    brassMat,
    'arm_left',
    -(HUB_R * 0.5 + armLen / 2), HUB_Y, 0,
    0, 0, Math.PI / 2
  );
  addGlobeUnit('left', -outerCenter, HUB_Y, 0, R_MED, 0, 1, 0);

  // +Z arm & globe
  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, armLen, 12),
    brassMat,
    'arm_front',
    0, HUB_Y, HUB_R * 0.5 + armLen / 2,
    Math.PI / 2, 0, 0
  );
  addGlobeUnit('front', 0, HUB_Y, outerCenter, R_MED, 0, 0, -1);

  // -Z arm & globe
  addMesh(
    new THREE.CylinderGeometry(ARM_R, ARM_R, armLen, 12),
    brassMat,
    'arm_back',
    0, HUB_Y, -(HUB_R * 0.5 + armLen / 2),
    Math.PI / 2, 0, 0
  );
  addGlobeUnit('back', 0, HUB_Y, -outerCenter, R_MED, 0, 0, 1);

  // 7. Diagonal arms with vertical stems for the clustered "Gathered Moons" look
  const diagDist = 0.175;
  const diagAngles = [
    { name: 'fl', angle: Math.PI / 4, upH: 0.13, downH: 0.09 },
    { name: 'fr', angle: (3 * Math.PI) / 4, upH: 0.10, downH: 0.11 },
    { name: 'bl', angle: -Math.PI / 4, upH: 0.11, downH: 0.10 },
    { name: 'br', angle: (-3 * Math.PI) / 4, upH: 0.13, downH: 0.09 },
  ];

  diagAngles.forEach((d) => {
    const dx = Math.cos(d.angle) * diagDist;
    const dz = Math.sin(d.angle) * diagDist;

    // Diagonal horizontal arm
    addMesh(
      new THREE.CylinderGeometry(ARM_R, ARM_R, diagDist, 10),
      brassMat,
      `arm_${d.name}`,
      dx / 2, HUB_Y, dz / 2,
      0, -d.angle, Math.PI / 2
    );

    // Vertical stem going up and down at the end of the diagonal arm
    const stemTotal = d.upH + d.downH;
    const stemCenterY = HUB_Y + (d.upH - d.downH) / 2;
    addMesh(
      new THREE.CylinderGeometry(ARM_R, ARM_R, stemTotal, 10),
      brassMat,
      `vstem_${d.name}`,
      dx, stemCenterY, dz
    );

    // Upper small globe
    addGlobeUnit(`${d.name}_up`, dx, HUB_Y + d.upH + R_SMALL - 0.004, dz, R_SMALL, -1, 0, 0);
  });

  return group;
}
