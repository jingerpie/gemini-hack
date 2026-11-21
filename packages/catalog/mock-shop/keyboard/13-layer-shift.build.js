function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters, real-world 75% compact keyboard)
  const W = 0.320;
  const D = 0.136;
  const H_FRONT = 0.018;
  const H_BACK = 0.030;
  const TILT_ANGLE = Math.atan2(H_BACK - H_FRONT, D); // ~5.04 deg typing angle
  const FOOT_H = 0.002;
  const BEZEL_X = 0.014;
  const BEZEL_Z = 0.010;
  const UNIT = 0.01905; // Standard 19.05mm key pitch
  const KEY_GAP = 0.0016;
  const KEY_H = 0.009;
  const WELL_DEPTH = 0.005;

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe9,
    roughness: 0.45,
    metalness: 0.05
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x262626,
    roughness: 0.7,
    metalness: 0.2
  });
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.4,
    metalness: 0.02
  });
  const escMat = new THREE.MeshStandardMaterial({
    color: 0xe6be32,
    roughness: 0.38,
    metalness: 0.05
  });
  const darkDetailMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.6,
    metalness: 0.3
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.9,
    metalness: 0.0
  });

  // Helper to configure shadow and name
  function addMesh(parent, geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Rubber feet on the bottom (touching y = 0)
  const footGeo = new THREE.CylinderGeometry(0.007, 0.007, FOOT_H, 16);
  const footX = W / 2 - 0.025;
  const footZFront = D / 2 - 0.020;
  const footZBack = -D / 2 + 0.020;
  addMesh(group, footGeo, footMat, 'foot_front_left', -footX, FOOT_H / 2, footZFront);
  addMesh(group, footGeo, footMat, 'foot_front_right', footX, FOOT_H / 2, footZFront);
  addMesh(group, footGeo, footMat, 'foot_back_left', -footX, FOOT_H / 2, footZBack);
  addMesh(group, footGeo, footMat, 'foot_back_right', footX, FOOT_H / 2, footZBack);

  // Tilted chassis group sitting on top of the feet
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, FOOT_H + H_FRONT / 2, 0);
  bodyGroup.rotation.x = TILT_ANGLE;
  group.add(bodyGroup);

  // Main outer chassis (ExtrudeGeometry with rounded corners in XZ, or BoxGeometry)
  // Using ExtrudeGeometry for a clean rounded-rectangle silhouette
  const r = 0.008;
  const hw = W / 2;
  const hd = D / 2;
  const caseShape = new THREE.Shape();
  caseShape.moveTo(-hw + r, -hd);
  caseShape.lineTo(hw - r, -hd);
  caseShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  caseShape.lineTo(hw, hd - r);
  caseShape.quadraticCurveTo(hw, hd, hw - r, hd);
  caseShape.lineTo(-hw + r, hd);
  caseShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  caseShape.lineTo(-hw, -hd + r);
  caseShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
    depth: H_FRONT,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 3
  });
  caseGeo.rotateX(Math.PI / 2);
  addMesh(bodyGroup, caseGeo, caseMat, 'keyboard_chassis', 0, H_FRONT / 2, 0);

  // Dark inner switch plate
  const plateW = W - BEZEL_X * 2;
  const plateD = D - BEZEL_Z * 2;
  const plateGeo = new THREE.BoxGeometry(plateW, 0.002, plateD);
  addMesh(bodyGroup, plateGeo, plateMat, 'switch_plate', 0, H_FRONT / 2 - WELL_DEPTH + 0.005, 0);

  // Back edge USB-C port and mode switches (-Z side)
  const usbcGeo = new THREE.BoxGeometry(0.011, 0.004, 0.003);
  addMesh(bodyGroup, usbcGeo, darkDetailMat, 'usbc_port', 0, 0, -D / 2 - 0.0005);

  const switchBtnGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12);
  switchBtnGeo.rotateX(Math.PI / 2);
  addMesh(bodyGroup, switchBtnGeo, caseMat, 'mode_switch_1', W / 2 - 0.055, 0, -D / 2 - 0.0008);
  addMesh(bodyGroup, switchBtnGeo, caseMat, 'mode_switch_2', W / 2 - 0.042, 0, -D / 2 - 0.0008);
  addMesh(bodyGroup, switchBtnGeo, caseMat, 'mode_switch_3', W / 2 - 0.029, 0, -D / 2 - 0.0008);

  // Shared 1u keycap geometry (slightly tapered top)
  const keyBaseSize = UNIT - KEY_GAP;
  const keyGeo = new THREE.CylinderGeometry(
    keyBaseSize * 0.42,
    keyBaseSize * 0.50,
    KEY_H,
    4
  );
  keyGeo.rotateY(Math.PI / 4);
  // Scale to make it square in XZ
  keyGeo.scale(1.414, 1, 1.414);

  // 75% Layout definition: [width_in_units, is_esc_or_gap]
  // Positive width = key, negative width = empty gap
  const rows = [
    // Row 0: F-row
    [1, -0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // Row 1: Number row
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    // Row 2: QWERTY
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1],
    // Row 3: ASDF
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1],
    // Row 4: ZXCV
    [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, -1],
    // Row 5: Bottom row
    [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1]
  ];

  const totalUnitsX = 15.5;
  const startX = -(totalUnitsX * UNIT) / 2;
  const startZ = -(rows.length * UNIT) / 2 + UNIT / 2;
  const keyY = H_FRONT / 2 + KEY_H / 2 - 0.001;

  let keyIndex = 0;
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    let curX = startX;
    const zPos = startZ + rIdx * UNIT;
    const row = rows[rIdx];

    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const u = row[cIdx];
      if (u < 0) {
        curX += Math.abs(u) * UNIT;
        continue;
      }

      const keyCenterX = curX + (u * UNIT) / 2;
      const isEsc = rIdx === 0 && cIdx === 0;
      const mat = isEsc ? escMat : keyMat;
      const name = isEsc ? 'key_esc' : `key_r${rIdx}_c${cIdx}_${keyIndex}`;

      const keyMesh = addMesh(bodyGroup, keyGeo, mat, name, keyCenterX, keyY, zPos);
      // Scale X for wider keys (Spacebar, Shift, Enter, Backspace, etc.)
      if (u !== 1) {
        const targetW = u * UNIT - KEY_GAP;
        keyMesh.scale.x = targetW / keyBaseSize;
      }

      curX += u * UNIT;
      keyIndex++;
    }
  }

  return group;
}
