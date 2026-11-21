function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const U = 0.019; // Standard 1U keycap pitch (19mm)
  const KEY_GAP = 0.002;
  const KEY_H = 0.009;
  const CASE_H = 0.022;
  const CASE_PAD = 0.008;

  // Main TKL Keyboard dimensions (18.25U wide x 6.25U deep)
  const MAIN_W = 18.25 * U + CASE_PAD * 2;
  const MAIN_D = 6.25 * U + CASE_PAD * 2;

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x2e3033,
    roughness: 0.45,
    metalness: 0.25,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e20,
    roughness: 0.5,
    metalness: 0.5,
  });
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0eb,
    roughness: 0.4,
    metalness: 0.05,
  });
  const darkKeyMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    roughness: 0.45,
    metalness: 0.05,
  });
  const blueKeyMat = new THREE.MeshStandardMaterial({
    color: 0x4aa8d8,
    roughness: 0.35,
    metalness: 0.05,
  });
  const redKeyMat = new THREE.MeshStandardMaterial({
    color: 0xd94136,
    roughness: 0.35,
    metalness: 0.05,
  });
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0xebebeb,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Shared unit key geometry (scaled per key width)
  const unitKeyGeo = new THREE.BoxGeometry(1, KEY_H, U - KEY_GAP);

  function addKey(parent, x, z, uWidth, mat, name) {
    const w = uWidth * U - KEY_GAP;
    const mesh = new THREE.Mesh(unitKeyGeo, mat);
    mesh.scale.set(w, 1, 1);
    mesh.position.set(x, CASE_H + KEY_H * 0.5 - 0.001, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
  }

  function createCase(w, d, name) {
    const cGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(w, CASE_H, d);
    const base = new THREE.Mesh(baseGeo, caseMat);
    base.position.y = CASE_H * 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    base.name = name + '_case';
    cGroup.add(base);

    const plateGeo = new THREE.BoxGeometry(w - CASE_PAD * 1.2, 0.002, d - CASE_PAD * 1.2);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = CASE_H - 0.0005;
    plate.castShadow = true;
    plate.receiveShadow = true;
    plate.name = name + '_plate';
    cGroup.add(plate);

    return cGroup;
  }

  // 1. Main TKL Keyboard
  const mainGroup = createCase(MAIN_W, MAIN_D, 'main_keyboard');
  const startX = -MAIN_W * 0.5 + CASE_PAD;
  const startZ = -MAIN_D * 0.5 + CASE_PAD;

  // Helper to place a row of keys
  function addRow(rowIdx, zOffset, specs) {
    let cursorU = 0;
    specs.forEach((spec, idx) => {
      const [uW, mat, gapAfter = 0] = spec;
      const centerX = startX + (cursorU + uW * 0.5) * U;
      const centerZ = startZ + (rowIdx + 0.5 + zOffset) * U;
      addKey(mainGroup, centerX, centerZ, uW, mat, `key_r${rowIdx}_${idx}`);
      cursorU += uW + gapAfter;
    });
  }

  // Row 0: Function Row (Esc, F1-F12, PrtSc/ScrLk/Pause)
  addRow(0, 0, [
    [1, redKeyMat, 0.5],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat, 0.25],
    [1, blueKeyMat], [1, blueKeyMat], [1, blueKeyMat], [1, blueKeyMat, 0.25],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat, 0.25],
    [1, darkKeyMat], [1, darkKeyMat], [1, darkKeyMat],
  ]);

  // Row 1: Number Row + Nav top
  addRow(1, 0.25, [
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [2, darkKeyMat, 0.25],
    [1, darkKeyMat], [1, darkKeyMat], [1, darkKeyMat],
  ]);

  // Row 2: QWERTY + Nav bottom
  addRow(2, 0.25, [
    [1.5, darkKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1.5, whiteKeyMat, 0.25],
    [1, darkKeyMat], [1, darkKeyMat], [1, darkKeyMat],
  ]);

  // Row 3: ASDF + Enter
  addRow(3, 0.25, [
    [1.75, darkKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [2.25, blueKeyMat],
  ]);

  // Row 4: ZXCV + Up Arrow
  addRow(4, 0.25, [
    [2.25, darkKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
    [1, whiteKeyMat], [2.75, darkKeyMat, 1.25],
    [1, whiteKeyMat],
  ]);

  // Row 5: Bottom Row + Left/Down/Right Arrows
  addRow(5, 0.25, [
    [1.25, darkKeyMat], [1.25, darkKeyMat], [1.25, darkKeyMat],
    [6.25, whiteKeyMat],
    [1.25, darkKeyMat], [1.25, darkKeyMat], [1.25, darkKeyMat], [1.25, darkKeyMat, 0.25],
    [1, whiteKeyMat], [1, whiteKeyMat], [1, whiteKeyMat],
  ]);

  // 2. Top-Left Module (2 stacked wide white keys)
  const mod1W = 2.5 * U + CASE_PAD * 2;
  const mod1D = 2 * U + CASE_PAD * 2;
  const mod1 = createCase(mod1W, mod1D, 'module_top_left');
  addKey(mod1, 0, -0.5 * U, 2.5, whiteKeyMat, 'mod1_key_top');
  addKey(mod1, 0, 0.5 * U, 2.5, whiteKeyMat, 'mod1_key_bottom');
  mod1.position.set(-MAIN_W * 0.5 - mod1W * 0.5 - 0.02, 0, -MAIN_D * 0.5 + mod1D * 0.5 + 0.01);

  // 3. Bottom-Left Module (2 stacked keys + 1 red key)
  const mod2W = 2.5 * U + CASE_PAD * 2;
  const mod2D = 2 * U + CASE_PAD * 2;
  const mod2 = createCase(mod2W, mod2D, 'module_bottom_left');
  addKey(mod2, -0.5 * U, -0.5 * U, 1.5, whiteKeyMat, 'mod2_key_tl');
  addKey(mod2, -0.5 * U, 0.5 * U, 1.5, whiteKeyMat, 'mod2_key_bl');
  addKey(mod2, 0.75 * U, 0.5 * U, 1, redKeyMat, 'mod2_key_br');
  mod2.position.set(-MAIN_W * 0.5 - mod2W * 0.5 - 0.02, 0, MAIN_D * 0.5 - mod2D * 0.5 - 0.01);

  // 4. Bottom-Right Module (Rotary Knob + 2x3 key grid)
  const mod3W = 4.5 * U + CASE_PAD * 2;
  const mod3D = 2 * U + CASE_PAD * 2;
  const mod3 = createCase(mod3W, mod3D, 'module_bottom_right');
  const knobGeo = new THREE.CylinderGeometry(0.65 * U, 0.65 * U, KEY_H * 1.1, 24);
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.set(-1.5 * U, CASE_H + KEY_H * 0.55 - 0.001, 0);
  knob.castShadow = true;
  knob.receiveShadow = true;
  knob.name = 'mod3_knob';
  mod3.add(knob);

  addKey(mod3, 0.25 * U, -0.5 * U, 1, blueKeyMat, 'mod3_key_1');
  addKey(mod3, 1.25 * U, -0.5 * U, 1, blueKeyMat, 'mod3_key_2');
  addKey(mod3, 2.25 * U, -0.5 * U, 1, whiteKeyMat, 'mod3_key_3');
  addKey(mod3, 0.25 * U, 0.5 * U, 1, whiteKeyMat, 'mod3_key_4');
  addKey(mod3, 1.25 * U, 0.5 * U, 1, whiteKeyMat, 'mod3_key_5');
  addKey(mod3, 2.25 * U, 0.5 * U, 1, whiteKeyMat, 'mod3_key_6');
  mod3.position.set(MAIN_W * 0.5 - mod3W * 0.5 - 0.02, 0, MAIN_D * 0.5 + mod3D * 0.5 + 0.02);

  group.add(mainGroup, mod1, mod2, mod3);

  // Center the entire assembly on X=0, Z=0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;

  return group;
}
