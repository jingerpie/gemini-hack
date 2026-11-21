function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters) - Tenkeyless Wireless Keyboard
  const W = 0.36;
  const D = 0.135;
  const H = 0.022;
  const DECK_THICK = 0.008;
  const TILT = 0.065; // ~3.7 deg ergonomic tilt
  const CORNER_R = 0.008;

  const UNIT = 0.0184;
  const KEY_GAP = 0.002;
  const KEY_W = UNIT - KEY_GAP;
  const KEY_D = UNIT - KEY_GAP;
  const KEY_H = 0.0035;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.35,
    metalness: 0.75
  });
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xe6e7e9,
    roughness: 0.65,
    metalness: 0.05
  });
  const darkAccentMat = new THREE.MeshStandardMaterial({
    color: 0x33363a,
    roughness: 0.5,
    metalness: 0.2
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x55585c,
    roughness: 0.85,
    metalness: 0.0
  });

  // Helper to create rounded rectangle shape
  function makeRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
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

  // Tilted deck assembly
  const deckGroup = new THREE.Group();
  const frontFootH = 0.002;
  const pivotY = frontFootH + (D / 2) * Math.sin(TILT);
  deckGroup.position.set(0, pivotY, 0);
  deckGroup.rotation.x = TILT;
  group.add(deckGroup);

  // Main aluminum chassis
  const bodyShape = makeRoundedRectShape(W, D, CORNER_R);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: DECK_THICK,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 3
  });
  bodyGeo.rotateX(Math.PI / 2);
  const chassis = new THREE.Mesh(bodyGeo, bodyMat);
  chassis.name = 'keyboard_chassis';
  chassis.position.y = DECK_THICK;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  deckGroup.add(chassis);

  // Raised rear bar along -Z edge
  const rearBarD = 0.012;
  const rearBarH = 0.0055;
  const rearBarShape = makeRoundedRectShape(W - 0.004, rearBarD, 0.005);
  const rearBarGeo = new THREE.ExtrudeGeometry(rearBarShape, {
    depth: rearBarH,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2
  });
  rearBarGeo.rotateX(Math.PI / 2);
  const rearBar = new THREE.Mesh(rearBarGeo, bodyMat);
  rearBar.name = 'rear_ridge_bar';
  rearBar.position.set(0, DECK_THICK + rearBarH, -D / 2 + rearBarD / 2 + 0.001);
  rearBar.castShadow = true;
  rearBar.receiveShadow = true;
  deckGroup.add(rearBar);

  // Center USB-C / sensor slot on rear bar
  const slotGeo = new THREE.BoxGeometry(0.01, 0.002, 0.004);
  const centerSlot = new THREE.Mesh(slotGeo, darkAccentMat);
  centerSlot.name = 'rear_center_slot';
  centerSlot.position.set(0, DECK_THICK + rearBarH + 0.0005, -D / 2 + rearBarD / 2 + 0.001);
  centerSlot.castShadow = true;
  centerSlot.receiveShadow = true;
  deckGroup.add(centerSlot);

  // Left and right subtle accents on rear bar
  const accentGeo = new THREE.BoxGeometry(0.022, 0.0015, 0.0045);
  const accentX = W / 2 - 0.032;
  [-accentX, accentX].forEach((xPos, idx) => {
    const accent = new THREE.Mesh(accentGeo, bodyMat);
    accent.name = idx === 0 ? 'rear_accent_left' : 'rear_accent_right';
    accent.position.set(xPos, DECK_THICK + rearBarH + 0.0008, -D / 2 + rearBarD / 2 + 0.001);
    accent.castShadow = true;
    accent.receiveShadow = true;
    deckGroup.add(accent);
  });

  // Rubber feet touching y = 0
  const footGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 16);
  const footZFront = D / 2 - 0.015;
  const footZBack = -D / 2 + 0.015;
  const footX = W / 2 - 0.025;

  const frontFootY = pivotY - footZFront * Math.sin(TILT);
  const backFootY = pivotY - footZBack * Math.sin(TILT);

  [
    { x: -footX, z: footZFront, h: frontFootY, name: 'foot_front_left' },
    { x: footX, z: footZFront, h: frontFootY, name: 'foot_front_right' },
    { x: -footX, z: footZBack, h: backFootY, name: 'foot_back_left' },
    { x: footX, z: footZBack, h: backFootY, name: 'foot_back_right' }
  ].forEach((f) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.name = f.name;
    foot.scale.set(1, f.h, 1);
    foot.position.set(f.x, f.h / 2, f.z);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  // Shared keycap geometry (1u x 1u, scaled in X for wider keys)
  const keyGeo = new THREE.BoxGeometry(KEY_W, KEY_H, KEY_D);
  const startX = -0.34 / 2;
  const startZ = -D / 2 + 0.018 + UNIT / 2;
  const keyY = DECK_THICK + KEY_H / 2 + 0.0005;

  let keyIndex = 0;
  function addRow(rowIdx, widths, xOffsetUnits = 0) {
    let cursorU = xOffsetUnits;
    const z = startZ + rowIdx * UNIT;
    widths.forEach((u) => {
      const w = u * UNIT - KEY_GAP;
      const key = new THREE.Mesh(keyGeo, keyMat);
      key.name = `key_${++keyIndex}`;
      key.scale.set(w / KEY_W, 1, 1);
      key.position.set(startX + (cursorU + u / 2) * UNIT, keyY, z);
      key.castShadow = true;
      key.receiveShadow = true;
      deckGroup.add(key);
      cursorU += u;
    });
  }

  // Row 0: Function row (Esc, F1-F11, Eject + PrtSc, ScrLk, Pause)
  addRow(0, [1.2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8]);
  addRow(0, [1, 1, 1], 15.4);

  // Row 1: Number row + Ins, Home, PgUp
  addRow(1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]);
  addRow(1, [1, 1, 1], 15.4);

  // Row 2: QWERTY row + Del, End, PgDn
  addRow(2, [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5]);
  addRow(2, [1, 1, 1], 15.4);

  // Row 3: Home row
  addRow(3, [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25]);

  // Row 4: Shift row + Up arrow
  addRow(4, [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75]);
  addRow(4, [1], 16.4);

  // Row 5: Bottom modifier row + Spacebar + Left/Down/Right arrows
  addRow(5, [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]);
  addRow(5, [1, 1, 1], 15.4);

  return group;
}
