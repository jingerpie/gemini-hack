function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - Queen upholstered platform bed
  const W = 1.72;
  const D = 2.24;
  const H = 1.15;

  const PLINTH_H = 0.055;
  const PLINTH_INSET = 0.03;

  const RAIL_H = 0.26;
  const RAIL_T = 0.10;
  const RAIL_Y = PLINTH_H;

  const HB_D = 0.11;
  const HB_CHANNEL_COUNT = 6;
  const HB_CHANNEL_GAP = 0.008;
  const HB_CHANNEL_D = 0.035;

  const SLAT_Y = PLINTH_H + 0.17;
  const SLAT_COUNT = 10;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede6,
    roughness: 0.88,
    metalness: 0.0
  });

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xa67c52,
    roughness: 0.65,
    metalness: 0.05
  });

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.6,
    metalness: 0.0
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.5,
    metalness: 0.55
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Recessed Oak Plinth
  const plinthW = W - PLINTH_INSET * 2;
  const plinthD = D - HB_D - PLINTH_INSET;
  const plinthZ = -D / 2 + HB_D + plinthD / 2;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    oakMat,
    'wood_plinth',
    0,
    PLINTH_H / 2,
    plinthZ
  );

  // 2. Headboard Back Core
  const hbCoreD = HB_D - HB_CHANNEL_D;
  const hbZ = -D / 2 + hbCoreD / 2;
  addMesh(
    new THREE.BoxGeometry(W, H, hbCoreD),
    fabricMat,
    'headboard_back',
    0,
    H / 2,
    hbZ
  );

  // 3. Headboard Vertical Channels (6 padded panels)
  const channelW = (W - HB_CHANNEL_GAP * (HB_CHANNEL_COUNT - 1)) / HB_CHANNEL_COUNT;
  const channelZ = -D / 2 + hbCoreD + HB_CHANNEL_D / 2;
  const channelGeo = new THREE.BoxGeometry(channelW, H - 0.005, HB_CHANNEL_D);
  for (let i = 0; i < HB_CHANNEL_COUNT; i++) {
    const cx = -W / 2 + channelW / 2 + i * (channelW + HB_CHANNEL_GAP);
    addMesh(
      channelGeo,
      fabricMat,
      `headboard_channel_${i + 1}`,
      cx,
      (H - 0.005) / 2,
      channelZ
    );
  }

  // 4. Upholstered Side Rails & Footboard
  const sideRailD = D - HB_D - RAIL_T;
  const sideRailZ = -D / 2 + HB_D + sideRailD / 2;
  const sideRailGeo = new THREE.BoxGeometry(RAIL_T, RAIL_H, sideRailD);

  addMesh(
    sideRailGeo,
    fabricMat,
    'side_rail_left',
    -W / 2 + RAIL_T / 2,
    RAIL_Y + RAIL_H / 2,
    sideRailZ
  );

  addMesh(
    sideRailGeo,
    fabricMat,
    'side_rail_right',
    W / 2 - RAIL_T / 2,
    RAIL_Y + RAIL_H / 2,
    sideRailZ
  );

  addMesh(
    new THREE.BoxGeometry(W, RAIL_H, RAIL_T),
    fabricMat,
    'footboard',
    0,
    RAIL_Y + RAIL_H / 2,
    D / 2 - RAIL_T / 2
  );

  // 5. Interior Black Metal Frame
  const innerW = W - RAIL_T * 2;
  const innerD = D - HB_D - RAIL_T;
  const innerZ = -D / 2 + HB_D + innerD / 2;
  const barT = 0.03;
  const barH = 0.04;

  addMesh(
    new THREE.BoxGeometry(barT, barH, innerD),
    metalMat,
    'metal_frame_left',
    -innerW / 2 + barT / 2,
    SLAT_Y,
    innerZ
  );

  addMesh(
    new THREE.BoxGeometry(barT, barH, innerD),
    metalMat,
    'metal_frame_right',
    innerW / 2 - barT / 2,
    SLAT_Y,
    innerZ
  );

  addMesh(
    new THREE.BoxGeometry(barT, barH, innerD),
    metalMat,
    'metal_frame_center',
    0,
    SLAT_Y,
    innerZ
  );

  addMesh(
    new THREE.BoxGeometry(innerW, barH, barT),
    metalMat,
    'metal_frame_back',
    0,
    SLAT_Y,
    -D / 2 + HB_D + barT / 2
  );

  // 6. Wooden Bed Slats (left & right halves)
  const slatSpan = innerW / 2 - barT * 1.5;
  const slatW = 0.065;
  const slatH = 0.012;
  const slatGeo = new THREE.BoxGeometry(slatSpan, slatH, slatW);
  const slatStartZ = -D / 2 + HB_D + 0.09;
  const slatEndZ = D / 2 - RAIL_T - 0.09;
  const slatStep = (slatEndZ - slatStartZ) / (SLAT_COUNT - 1);

  for (let i = 0; i < SLAT_COUNT; i++) {
    const sz = slatStartZ + i * slatStep;
    addMesh(
      slatGeo,
      slatMat,
      `slat_left_${i + 1}`,
      -innerW / 4 - barT / 4,
      SLAT_Y + barH / 2 + slatH / 2,
      sz
    );
    addMesh(
      slatGeo,
      slatMat,
      `slat_right_${i + 1}`,
      innerW / 4 + barT / 4,
      SLAT_Y + barH / 2 + slatH / 2,
      sz
    );
  }

  return group;
}
