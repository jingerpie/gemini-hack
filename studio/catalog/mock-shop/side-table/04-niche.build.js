function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.45;
  const D = 0.45;
  const H = 0.48;
  const T = 0.022;
  const PLINTH_H = 0.048;
  const PLINTH_INSET = 0.035;
  const NUM_FINGERS = 7;

  const BODY_H = H - PLINTH_H;
  const INNER_W = W - 2 * T;
  const INNER_H = BODY_H - 2 * T;
  const FINGER_LEN = D / NUM_FINGERS;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc8a87e,
    roughness: 0.6,
    metalness: 0.02,
  });

  const oakEndGrainMat = new THREE.MeshStandardMaterial({
    color: 0xb69367,
    roughness: 0.68,
    metalness: 0.02,
  });

  function addBox(w, h, d, x, y, z, mat, name) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  }

  // Recessed plinth base
  const plinthW = W - 2 * PLINTH_INSET;
  const plinthD = D - 2 * PLINTH_INSET;
  addBox(plinthW, PLINTH_H, plinthD, 0, PLINTH_H / 2, 0, oakMat, 'plinth_base');

  // Main cabinet panels
  addBox(INNER_W, T, D, 0, H - T / 2, 0, oakMat, 'top_panel');
  addBox(INNER_W, T, D, 0, PLINTH_H + T / 2, 0, oakMat, 'bottom_panel');
  addBox(T, INNER_H, D, -W / 2 + T / 2, PLINTH_H + T + INNER_H / 2, 0, oakMat, 'left_panel');
  addBox(T, INNER_H, D, W / 2 - T / 2, PLINTH_H + T + INNER_H / 2, 0, oakMat, 'right_panel');
  addBox(INNER_W, INNER_H, T, 0, PLINTH_H + T + INNER_H / 2, -D / 2 + T / 2, oakMat, 'back_panel');

  // Finger-jointed corner edges
  const corners = [
    { x: -W / 2 + T / 2, y: H - T / 2, label: 'top_left' },
    { x: W / 2 - T / 2, y: H - T / 2, label: 'top_right' },
    { x: -W / 2 + T / 2, y: PLINTH_H + T / 2, label: 'bottom_left' },
    { x: W / 2 - T / 2, y: PLINTH_H + T / 2, label: 'bottom_right' },
  ];

  for (let c = 0; c < corners.length; c++) {
    const corner = corners[c];
    for (let i = 0; i < NUM_FINGERS; i++) {
      const z = -D / 2 + FINGER_LEN / 2 + i * FINGER_LEN;
      const mat = i % 2 === 0 ? oakMat : oakEndGrainMat;
      addBox(T, T, FINGER_LEN, corner.x, corner.y, z, mat, `${corner.label}_finger_${i + 1}`);
    }
  }

  return group;
}
