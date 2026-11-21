function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.36;
  const D = 0.26;
  const FOOT_H = 0.003;
  const BASE_H = 0.021;
  const LID_W = 0.356;
  const LID_H = 0.235;
  const LID_T = 0.007;
  const HINGE_Z = -D / 2 + 0.028; // Rear exhaust shelf extends behind hinges
  const HINGE_Y = FOOT_H + BASE_H;
  const OPEN_ANGLE = (105 * Math.PI) / 180; // 105 deg from closed -> 15 deg tilted back

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2d32,
    roughness: 0.45,
    metalness: 0.55
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x737982,
    roughness: 0.3,
    metalness: 0.8
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    roughness: 0.75,
    metalness: 0.15
  });
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0x31353b,
    roughness: 0.35,
    metalness: 0.4
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x101822,
    emissive: 0x243b55,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1
  });

  function addMesh(geo, mat, name, parent = group) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Rubber feet (4 corners, touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.009, 0.01, FOOT_H, 16);
  const footPositions = [
    [-W / 2 + 0.025, FOOT_H / 2, D / 2 - 0.025],
    [W / 2 - 0.025, FOOT_H / 2, D / 2 - 0.025],
    [-W / 2 + 0.025, FOOT_H / 2, -D / 2 + 0.025],
    [W / 2 - 0.025, FOOT_H / 2, -D / 2 + 0.025]
  ];
  footPositions.forEach((pos, idx) => {
    const foot = addMesh(footGeo, darkMat, `rubber_foot_${idx + 1}`);
    foot.position.set(pos[0], pos[1], pos[2]);
  });

  // Main base chassis
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  const base = addMesh(baseGeo, bodyMat, 'base_chassis');
  base.position.set(0, FOOT_H + BASE_H / 2, 0);

  // Rear exhaust trim (left and right silver-trimmed vents)
  const ventTrimGeo = new THREE.BoxGeometry(0.085, BASE_H * 0.75, 0.012);
  const ventCoreGeo = new THREE.BoxGeometry(0.075, BASE_H * 0.52, 0.014);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const xPos = side * (W / 2 - 0.055);
    const trim = addMesh(ventTrimGeo, trimMat, `rear_vent_trim_${label}`);
    trim.position.set(xPos, FOOT_H + BASE_H / 2, -D / 2 - 0.002);

    const core = addMesh(ventCoreGeo, darkMat, `rear_vent_grille_${label}`);
    core.position.set(xPos, FOOT_H + BASE_H / 2, -D / 2 - 0.003);
  });

  // Keyboard deck recess
  const kbW = W - 0.045;
  const kbD = 0.11;
  const kbGeo = new THREE.BoxGeometry(kbW, 0.003, kbD);
  const kbDeck = addMesh(kbGeo, darkMat, 'keyboard_deck');
  kbDeck.position.set(0, FOOT_H + BASE_H + 0.0005, -0.025);

  // Trackpad
  const tpW = 0.115;
  const tpD = 0.072;
  const tpGeo = new THREE.BoxGeometry(tpW, 0.0015, tpD);
  const trackpad = addMesh(tpGeo, trackpadMat, 'trackpad');
  trackpad.position.set(-0.01, FOOT_H + BASE_H + 0.0005, D / 2 - 0.052);

  // Hinges (left and right)
  const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const hinge = addMesh(hingeGeo, darkMat, `hinge_${label}`);
    hinge.position.set(side * (LID_W / 2 - 0.045), HINGE_Y, HINGE_Z);
  });

  // Lid pivot group (rotates open from closed position)
  const lidPivot = new THREE.Group();
  lidPivot.name = 'lid_pivot';
  lidPivot.position.set(0, HINGE_Y, HINGE_Z);
  // Closed lid lies along +Z; rotating around X by -OPEN_ANGLE opens it toward -Z
  // Wait: +Y is up, +Z is front. Rotating around X by -90 deg moves +Z to +Y.
  // So -OPEN_ANGLE (-105 deg) tilts it 15 deg back toward -Z, with the screen facing +Z!
  lidPivot.rotation.x = -(Math.PI / 2) - (OPEN_ANGLE - Math.PI / 2);
  // Let's verify: if lid is built along +Y in lidPivot local space, then at rotation.x = 0 it is vertical (90 deg).
  // To be at 105 deg (tilted 15 deg back toward -Z), rotation.x = -(15 * Math.PI / 180).
  lidPivot.rotation.x = -(OPEN_ANGLE - Math.PI / 2);
  group.add(lidPivot);

  // Lid shell
  const lidGeo = new THREE.BoxGeometry(LID_W, LID_H, LID_T);
  const lid = addMesh(lidGeo, bodyMat, 'display_lid', lidPivot);
  lid.position.set(0, LID_H / 2 + 0.004, 0);

  // Lit screen (facing +Z in lidPivot)
  const bezel = 0.01;
  const screenGeo = new THREE.BoxGeometry(LID_W - bezel * 2, LID_H - bezel * 2.2, 0.0015);
  const screen = addMesh(screenGeo, screenMat, 'emit_screen', lidPivot);
  screen.position.set(0, LID_H / 2 + 0.006, LID_T / 2 + 0.0002);

  // Subtle geometric accent lines on back of lid (-Z)
  const accentGeo1 = new THREE.BoxGeometry(0.0025, LID_H * 0.72, 0.001);
  const accent1 = addMesh(accentGeo1, darkMat, 'lid_accent_line_1', lidPivot);
  accent1.position.set(LID_W * 0.26, LID_H * 0.52, -LID_T / 2 - 0.0003);
  accent1.rotation.z = 0.22;

  const accentGeo2 = new THREE.BoxGeometry(0.002, LID_H * 0.45, 0.001);
  const accent2 = addMesh(accentGeo2, darkMat, 'lid_accent_line_2', lidPivot);
  accent2.position.set(LID_W * 0.34, LID_H * 0.62, -LID_T / 2 - 0.0003);
  accent2.rotation.z = 0.22;

  return group;
}
