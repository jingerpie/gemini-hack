function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const KEY_PITCH = 0.019;
  const KEY_SIZE = 0.0172;
  const KEY_H = 0.0085;
  const CASE_H = 0.018;
  const BEZEL = 0.006;
  const HALF_GAP = 0.036;
  const SPLIT_ANGLE = 0.12;
  const TILT_ANGLE = 0.06; // slight ergonomic typing tilt

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.55,
    metalness: 0.25,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x18191b,
    roughness: 0.7,
    metalness: 0.3,
  });
  const keyWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf0f1f3,
    roughness: 0.4,
    metalness: 0.05,
  });
  const keyDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b3e42,
    roughness: 0.45,
    metalness: 0.05,
  });
  const keyRedMat = new THREE.MeshStandardMaterial({
    color: 0xd13228,
    roughness: 0.4,
    metalness: 0.05,
  });
  const keyBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2c8ec4,
    roughness: 0.4,
    metalness: 0.05,
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xc92a22,
    roughness: 0.65,
    metalness: 0.05,
  });
  const connectorClearMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8eef2,
    roughness: 0.15,
    metalness: 0.0,
    transparent: true,
    opacity: 0.75,
    clearcoat: 0.8,
  });
  const connectorMetalMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec4,
    roughness: 0.25,
    metalness: 0.85,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x55585c,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Shared keycap geometries by width in units (u)
  const keyGeos = {};
  function getKeyGeo(units) {
    const key = units.toFixed(2);
    if (!keyGeos[key]) {
      const w = units * KEY_PITCH - (KEY_PITCH - KEY_SIZE);
      keyGeos[key] = new THREE.BoxGeometry(w, KEY_H, KEY_SIZE);
    }
    return keyGeos[key];
  }

  function addMesh(parent, geo, mat, name, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Build stepped case using ExtrudeGeometry
  // Local coords: x from 0 to ~6.5*KEY_PITCH, z from 0 to 5*KEY_PITCH
  function createCaseMesh(isLeft, name) {
    const shape = new THREE.Shape();
    const wFull = 6.2 * KEY_PITCH + BEZEL * 2;
    const dFull = 5 * KEY_PITCH + BEZEL * 2;

    if (isLeft) {
      // Left half: straight left edge, stepped right edge
      shape.moveTo(0, 0);
      shape.lineTo(wFull, 0);
      shape.lineTo(wFull, 1.2 * KEY_PITCH + BEZEL);
      shape.lineTo(wFull - 0.6 * KEY_PITCH, 1.2 * KEY_PITCH + BEZEL);
      shape.lineTo(wFull - 0.6 * KEY_PITCH, 3.0 * KEY_PITCH + BEZEL);
      shape.lineTo(wFull, 3.0 * KEY_PITCH + BEZEL);
      shape.lineTo(wFull, dFull);
      shape.lineTo(0, dFull);
      shape.closePath();
    } else {
      // Right half: stepped left edge, straight right edge
      const wR = 6.8 * KEY_PITCH + BEZEL * 2;
      shape.moveTo(0.6 * KEY_PITCH, 0);
      shape.lineTo(wR, 0);
      shape.lineTo(wR, dFull);
      shape.lineTo(0, dFull);
      shape.lineTo(0, 3.0 * KEY_PITCH + BEZEL);
      shape.lineTo(0.4 * KEY_PITCH, 3.0 * KEY_PITCH + BEZEL);
      shape.lineTo(0.4 * KEY_PITCH, 1.2 * KEY_PITCH + BEZEL);
      shape.lineTo(0, 1.2 * KEY_PITCH + BEZEL);
      shape.lineTo(0, 0.8 * KEY_PITCH);
      shape.lineTo(0.6 * KEY_PITCH, 0.8 * KEY_PITCH);
      shape.closePath();
    }

    const extrudeSettings = {
      depth: CASE_H,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate so extrusion is along +Y, and 2D shape lies in XZ plane
    geo.rotateX(-Math.PI / 2);
    // Center roughly in X and Z for local group
    const mesh = new THREE.Mesh(geo, caseMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Left Half
  const leftGroup = new THREE.Group();
  const leftW = 6.2 * KEY_PITCH + BEZEL * 2;
  const halfD = 5 * KEY_PITCH + BEZEL * 2;

  const leftCase = createCaseMesh(true, 'left_case');
  leftCase.position.set(-leftW / 2, 0, halfD / 2);
  leftGroup.add(leftCase);

  // Left keys layout: [units, material]
  const leftRows = [
    [
      [1, keyRedMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat], [1, keyWhiteMat],
    ],
    [
      [1.25, keyDarkMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat],
    ],
    [
      [1.5, keyDarkMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat],
    ],
    [
      [1.75, keyDarkMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat],
    ],
    [
      [1.25, keyDarkMat], [1, keyDarkMat], [1, keyDarkMat],
      [1, keyBlueMat], [1, keyBlueMat], [1, keyRedMat],
    ],
  ];

  const keyY = CASE_H + KEY_H / 2 + 0.001;
  leftRows.forEach((row, rIdx) => {
    let cursorX = -leftW / 2 + BEZEL + 0.002;
    const z = -halfD / 2 + BEZEL + (rIdx + 0.5) * KEY_PITCH;
    row.forEach(([u, mat], cIdx) => {
      const w = u * KEY_PITCH;
      addMesh(
        leftGroup,
        getKeyGeo(u),
        mat,
        `left_key_r${rIdx}_c${cIdx}`,
        cursorX + w / 2,
        keyY,
        z
      );
      cursorX += w;
    });
  });

  // Right Half
  const rightGroup = new THREE.Group();
  const rightW = 6.8 * KEY_PITCH + BEZEL * 2;

  const rightCase = createCaseMesh(false, 'right_case');
  rightCase.position.set(-rightW / 2, 0, halfD / 2);
  rightGroup.add(rightCase);

  const rightRows = [
    [
      [1, keyWhiteMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat], [1.75, keyDarkMat],
    ],
    [
      [1, keyWhiteMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1, keyWhiteMat], [1.5, keyWhiteMat],
    ],
    [
      [1, keyWhiteMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [2.0, keyBlueMat],
    ],
    [
      [1, keyWhiteMat], [1, keyWhiteMat], [1, keyWhiteMat],
      [1, keyWhiteMat], [1.25, keyDarkMat], [1.0, keyDarkMat],
    ],
    [
      [2.5, keyWhiteMat], [1, keyDarkMat], [1, keyDarkMat],
      [0.75, keyDarkMat], [0.75, keyDarkMat], [0.75, keyDarkMat],
    ],
  ];

  rightRows.forEach((row, rIdx) => {
    const rowOffset = rIdx === 0 ? 0.6 * KEY_PITCH : (rIdx === 1 || rIdx === 2 ? 0.4 * KEY_PITCH : 0.1 * KEY_PITCH);
    let cursorX = -rightW / 2 + BEZEL + rowOffset;
    const z = -halfD / 2 + BEZEL + (rIdx + 0.5) * KEY_PITCH;
    row.forEach(([u, mat], cIdx) => {
      const w = u * KEY_PITCH;
      addMesh(
        rightGroup,
        getKeyGeo(u),
        mat,
        `right_key_r${rIdx}_c${cIdx}`,
        cursorX + w / 2,
        keyY,
        z
      );
      cursorX += w;
    });
  });

  // 3 tiny indicator LEDs on top-right bezel of right half
  const ledGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.001, 10);
  for (let i = 0; i < 3; i++) {
    addMesh(
      rightGroup,
      ledGeo,
      ledMat,
      `right_led_${i}`,
      rightW / 2 - BEZEL - 0.018 + i * 0.006,
      CASE_H + 0.0012,
      -halfD / 2 + BEZEL * 0.45
    );
  }

  // Position & orient both halves
  const halfOffsetX = (leftW + rightW) / 4 + HALF_GAP / 2;
  const zShift = 0.025; // shift slightly forward so overall bounding box (with cable) is centered at z=0

  leftGroup.position.set(-halfOffsetX, 0.002, zShift);
  leftGroup.rotation.set(TILT_ANGLE, SPLIT_ANGLE, 0);
  group.add(leftGroup);

  rightGroup.position.set(halfOffsetX, 0.002, zShift);
  rightGroup.rotation.set(TILT_ANGLE, -SPLIT_ANGLE, 0);
  group.add(rightGroup);

  // Connecting USB-C cable between back (-Z) of left and right halves
  const leftPortLocal = new THREE.Vector3(0.025, CASE_H * 0.55, -halfD / 2 - 0.002);
  const rightPortLocal = new THREE.Vector3(-0.025, CASE_H * 0.55, -halfD / 2 - 0.002);

  leftGroup.updateMatrixWorld(true);
  rightGroup.updateMatrixWorld(true);

  const pStart = leftPortLocal.clone().applyMatrix4(leftGroup.matrixWorld);
  const pEnd = rightPortLocal.clone().applyMatrix4(rightGroup.matrixWorld);

  // Connectors
  const plugGeo = new THREE.BoxGeometry(0.011, 0.006, 0.014);
  const strainGeo = new THREE.CylinderGeometry(0.0032, 0.0038, 0.012, 12);
  strainGeo.rotateX(Math.PI / 2);

  const leftPlug = addMesh(group, plugGeo, connectorMetalMat, 'left_usb_plug', pStart.x, pStart.y, pStart.z - 0.005);
  leftPlug.rotation.y = SPLIT_ANGLE;
  const leftStrain = addMesh(group, strainGeo, connectorClearMat, 'left_usb_strain', pStart.x, pStart.y, pStart.z - 0.016);
  leftStrain.rotation.y = SPLIT_ANGLE;

  const rightPlug = addMesh(group, plugGeo, connectorMetalMat, 'right_usb_plug', pEnd.x, pEnd.y, pEnd.z - 0.005);
  rightPlug.rotation.y = -SPLIT_ANGLE;
  const rightStrain = addMesh(group, strainGeo, connectorClearMat, 'right_usb_strain', pEnd.x, pEnd.y, pEnd.z - 0.016);
  rightStrain.rotation.y = -SPLIT_ANGLE;

  // Red braided cable arch
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(pStart.x, pStart.y, pStart.z - 0.02),
    new THREE.Vector3(pStart.x * 0.75, pStart.y + 0.004, pStart.z - 0.055),
    new THREE.Vector3(0, pStart.y + 0.008, pStart.z - 0.078),
    new THREE.Vector3(pEnd.x * 0.75, pEnd.y + 0.004, pEnd.z - 0.055),
    new THREE.Vector3(pEnd.x, pEnd.y, pEnd.z - 0.02),
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 28, 0.0028, 12, false);
  addMesh(group, cableGeo, cableMat, 'split_bridge_cable', 0, 0, 0);

  return group;
}
