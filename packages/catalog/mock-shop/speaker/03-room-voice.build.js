function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 0.155;
  const R = 0.065;
  const EDGE_R = 0.018;
  const BASE_H = 0.002;
  const TOP_PLATE_R = 0.047;
  const TOP_PLATE_H = 0.003;
  const TOP_RECESS_Y = H - 0.004;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xd8d7d3,
    roughness: 0.92,
    metalness: 0.0
  });

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xecebe8,
    roughness: 0.42,
    metalness: 0.02
  });

  const darkGapMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a38,
    roughness: 0.7,
    metalness: 0.05
  });

  const iconMat = new THREE.MeshStandardMaterial({
    color: 0xbab9b5,
    roughness: 0.5,
    metalness: 0.05
  });

  const baseRubberMat = new THREE.MeshStandardMaterial({
    color: 0xc5c4c0,
    roughness: 0.85,
    metalness: 0.0
  });

  const addMesh = (geo, mat, name, pos, rot) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. Main fabric-wrapped cylindrical body with rounded edges (LatheGeometry)
  const lathePts = [];
  const innerBaseR = R - EDGE_R;
  lathePts.push(new THREE.Vector2(0, BASE_H));
  lathePts.push(new THREE.Vector2(innerBaseR, BASE_H));

  // Bottom rounded corner
  const cornerSegs = 8;
  for (let i = 1; i <= cornerSegs; i++) {
    const a = -Math.PI / 2 + (i / cornerSegs) * (Math.PI / 2);
    const x = innerBaseR + Math.cos(a) * EDGE_R;
    const y = BASE_H + EDGE_R + Math.sin(a) * EDGE_R;
    lathePts.push(new THREE.Vector2(x, y));
  }

  // Straight side wall
  lathePts.push(new THREE.Vector2(R, H - EDGE_R));

  // Top rounded corner
  for (let i = 1; i <= cornerSegs; i++) {
    const a = (i / cornerSegs) * (Math.PI / 2);
    const x = innerBaseR + Math.cos(a) * EDGE_R;
    const y = H - EDGE_R + Math.sin(a) * EDGE_R;
    lathePts.push(new THREE.Vector2(x, y));
  }

  // Top rim stepping down into the control plate recess
  lathePts.push(new THREE.Vector2(TOP_PLATE_R + 0.002, H));
  lathePts.push(new THREE.Vector2(TOP_PLATE_R + 0.001, TOP_RECESS_Y));
  lathePts.push(new THREE.Vector2(0, TOP_RECESS_Y));

  const bodyGeo = new THREE.LatheGeometry(lathePts, 32);
  addMesh(bodyGeo, fabricMat, 'speaker_body');

  // 2. Bottom rubberized base pad touching y = 0
  const baseGeo = new THREE.CylinderGeometry(innerBaseR, innerBaseR, BASE_H + 0.001, 32);
  addMesh(baseGeo, baseRubberMat, 'bottom_base_pad', [0, (BASE_H + 0.001) / 2, 0]);

  // 3. Dark shadow gap ring around the top control plate
  const gapGeo = new THREE.TorusGeometry(TOP_PLATE_R + 0.0005, 0.0012, 8, 32);
  addMesh(gapGeo, darkGapMat, 'top_gap_ring', [0, TOP_RECESS_Y + 0.0015, 0], [Math.PI / 2, 0, 0]);

  // 4. Top circular control plate
  const plateGeo = new THREE.CylinderGeometry(TOP_PLATE_R, TOP_PLATE_R, TOP_PLATE_H, 32);
  const plateY = TOP_RECESS_Y + TOP_PLATE_H / 2;
  addMesh(plateGeo, plasticMat, 'top_control_plate', [0, plateY, 0]);

  const iconY = TOP_RECESS_Y + TOP_PLATE_H + 0.0003;

  // 5-7. Center Play/Pause icon
  const playShape = new THREE.Shape();
  playShape.moveTo(0, -0.003);
  playShape.lineTo(0.0045, 0);
  playShape.lineTo(0, 0.003);
  playShape.closePath();
  const playGeo = new THREE.ExtrudeGeometry(playShape, { depth: 0.0005, bevelEnabled: false });
  addMesh(playGeo, iconMat, 'icon_play_triangle', [-0.004, iconY, 0], [-Math.PI / 2, 0, 0]);

  const pauseBarGeo = new THREE.BoxGeometry(0.0012, 0.0006, 0.0055);
  addMesh(pauseBarGeo, iconMat, 'icon_pause_bar_1', [0.0022, iconY, 0]);
  addMesh(pauseBarGeo, iconMat, 'icon_pause_bar_2', [0.0048, iconY, 0]);

  // 8-9. Plus (+) icon on the -Z side of the top plate
  const plusR = 0.028;
  const plusHGeo = new THREE.BoxGeometry(0.006, 0.0006, 0.0012);
  const plusVGeo = new THREE.BoxGeometry(0.0012, 0.0006, 0.006);
  addMesh(plusHGeo, iconMat, 'icon_plus_h', [0, iconY, -plusR]);
  addMesh(plusVGeo, iconMat, 'icon_plus_v', [0, iconY, -plusR]);

  // 10. Minus (-) icon on the +Z side of the top plate
  addMesh(plusHGeo, iconMat, 'icon_minus', [0, iconY, plusR]);

  // 11-14. Assistant / mic dot cluster on the +X side
  const dotGeo = new THREE.CylinderGeometry(0.0009, 0.0009, 0.0006, 12);
  const dotClusterX = 0.028;
  const dotSpread = 0.0024;
  addMesh(dotGeo, iconMat, 'icon_assistant_dot_1', [dotClusterX - dotSpread, iconY, 0]);
  addMesh(dotGeo, iconMat, 'icon_assistant_dot_2', [dotClusterX + dotSpread, iconY, 0]);
  addMesh(dotGeo, iconMat, 'icon_assistant_dot_3', [dotClusterX, iconY, -dotSpread]);
  addMesh(dotGeo, iconMat, 'icon_assistant_dot_4', [dotClusterX, iconY, dotSpread]);

  // 15. Tiny mic LED indicator near the + icon
  const ledGeo = new THREE.CylinderGeometry(0.0007, 0.0007, 0.0006, 12);
  addMesh(ledGeo, darkGapMat, 'icon_mic_led', [0, iconY, -0.038]);

  // 16-17. Side mute switch on the lower front-right (+X, +Z)
  const switchAngle = Math.PI / 4;
  const switchY = 0.032;
  const switchDist = R - 0.0005;
  const sx = Math.sin(switchAngle) * switchDist;
  const sz = Math.cos(switchAngle) * switchDist;

  const housingGeo = new THREE.CapsuleGeometry(0.0038, 0.008, 6, 12);
  addMesh(
    housingGeo,
    plasticMat,
    'mute_switch_housing',
    [sx, switchY, sz],
    [0, switchAngle, 0]
  );

  const toggleDist = R + 0.0022;
  const tx = Math.sin(switchAngle) * toggleDist;
  const tz = Math.cos(switchAngle) * toggleDist;
  const toggleGeo = new THREE.BoxGeometry(0.0035, 0.004, 0.004);
  addMesh(
    toggleGeo,
    plasticMat,
    'mute_switch_toggle',
    [tx, switchY - 0.001, tz],
    [0, switchAngle, 0]
  );

  return group;
}
