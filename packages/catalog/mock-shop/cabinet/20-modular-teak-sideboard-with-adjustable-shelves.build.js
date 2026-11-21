function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.80;
  const H = 0.72;
  const D = 0.45;
  const T = 0.024; // Panel thickness
  const PLINTH_H = 0.06;
  const PLINTH_INSET_X = 0.06;
  const PLINTH_INSET_Z = 0.04;

  const BODY_H = H - PLINTH_H;
  const INNER_W = W - 2 * T;
  const BAY_W = (INNER_W - 2 * T) / 3;

  const LOWER_H = (BODY_H - 3 * T) * 0.62;
  const UPPER_H = (BODY_H - 3 * T) * 0.38;

  const MID_DIV_Y = PLINTH_H + T + LOWER_H + T / 2;

  // Materials
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3f,
    roughness: 0.58,
    metalness: 0.02,
  });

  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: 0x734a27,
    roughness: 0.65,
    metalness: 0.02,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x4d3018,
    roughness: 0.7,
    metalness: 0.05,
  });

  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Plinth base
  const plinthW = W - 2 * PLINTH_INSET_X;
  const plinthD = D - 2 * PLINTH_INSET_Z;
  addMesh(
    new THREE.BoxGeometry(plinthW, PLINTH_H, plinthD),
    teakMat,
    'plinth_base',
    0,
    PLINTH_H / 2,
    0
  );

  // 2. Main cabinet outer shell
  addMesh(
    new THREE.BoxGeometry(W, T, D),
    teakMat,
    'bottom_panel',
    0,
    PLINTH_H + T / 2,
    0
  );

  addMesh(
    new THREE.BoxGeometry(W, T, D),
    teakMat,
    'top_panel',
    0,
    H - T / 2,
    0
  );

  const sideH = BODY_H - 2 * T;
  const sideY = PLINTH_H + T + sideH / 2;
  addMesh(
    new THREE.BoxGeometry(T, sideH, D),
    teakMat,
    'left_side_panel',
    -W / 2 + T / 2,
    sideY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(T, sideH, D),
    teakMat,
    'right_side_panel',
    W / 2 - T / 2,
    sideY,
    0
  );

  addMesh(
    new THREE.BoxGeometry(INNER_W, sideH, T * 0.6),
    darkTeakMat,
    'back_panel',
    0,
    sideY,
    -D / 2 + T * 0.3
  );

  // 3. Internal dividers
  const innerD = D - T * 0.6 - 0.015;
  const innerZ = -D / 2 + T * 0.6 + innerD / 2;

  addMesh(
    new THREE.BoxGeometry(INNER_W, T, innerD),
    teakMat,
    'middle_horizontal_divider',
    0,
    MID_DIV_Y,
    innerZ
  );

  const divX = BAY_W / 2 + T / 2;
  addMesh(
    new THREE.BoxGeometry(T, sideH, innerD),
    teakMat,
    'left_vertical_divider',
    -divX,
    sideY,
    innerZ
  );

  addMesh(
    new THREE.BoxGeometry(T, sideH, innerD),
    teakMat,
    'right_vertical_divider',
    divX,
    sideY,
    innerZ
  );

  // 4. Adjustable shelves in upper left and upper center bays
  const adjShelfY = MID_DIV_Y + T / 2 + UPPER_H / 2;
  const adjShelfD = innerD - 0.01;
  const adjShelfZ = innerZ - 0.005;

  addMesh(
    new THREE.BoxGeometry(BAY_W, T * 0.75, adjShelfD),
    teakMat,
    'left_adjustable_shelf',
    -(BAY_W + T),
    adjShelfY,
    adjShelfZ
  );

  addMesh(
    new THREE.BoxGeometry(BAY_W, T * 0.75, adjShelfD),
    teakMat,
    'center_adjustable_shelf',
    0,
    adjShelfY,
    adjShelfZ
  );

  // 5. Doors (3 bays in lower tier)
  const doorGap = 0.004;
  const doorW = BAY_W - doorGap;
  const doorH = LOWER_H - doorGap;
  const doorY = PLINTH_H + T + LOWER_H / 2;
  const doorZ = D / 2 - T * 0.55;
  const frameBorder = 0.032;
  const frameDepth = 0.018;

  // Helper to create a framed door using ExtrudeGeometry
  function createDoorFrameGeo(w, h, border, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();

    const hole = new THREE.Path();
    const iw = w / 2 - border;
    const ih = h / 2 - border;
    hole.moveTo(-iw, -ih);
    hole.lineTo(iw, -ih);
    hole.lineTo(iw, ih);
    hole.lineTo(-iw, ih);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }

  const doorFrameGeo = createDoorFrameGeo(doorW, doorH, frameBorder, frameDepth);
  const bayCentersX = [-(BAY_W + T), 0, BAY_W + T];
  const doorNames = ['left', 'center', 'right'];

  const innerDoorW = doorW - 2 * frameBorder;
  const innerDoorH = doorH - 2 * frameBorder;
  const slatW = 0.016;
  const slatD = 0.012;

  for (let i = 0; i < 3; i++) {
    const cx = bayCentersX[i];
    const dName = doorNames[i];

    // Door frame
    addMesh(
      doorFrameGeo,
      teakMat,
      `door_${dName}_frame`,
      cx,
      doorY,
      doorZ
    );

    // Recessed backing panel behind slats
    addMesh(
      new THREE.BoxGeometry(innerDoorW, innerDoorH, 0.008),
      darkTeakMat,
      `door_${dName}_backing`,
      cx,
      doorY,
      doorZ - 0.004
    );

    // Vertical slats
    if (i === 1) {
      // Center door: slats on left half, solid panel on right half
      const numSlats = 4;
      const slatAreaW = innerDoorW * 0.48;
      const step = slatAreaW / numSlats;
      for (let s = 0; s < numSlats; s++) {
        const sx = cx - innerDoorW / 2 + step * (s + 0.5);
        addMesh(
          new THREE.BoxGeometry(slatW, innerDoorH, slatD),
          teakMat,
          `door_center_slat_${s + 1}`,
          sx,
          doorY,
          doorZ + 0.002
        );
      }
      // Solid right half
      const solidW = innerDoorW * 0.52;
      addMesh(
        new THREE.BoxGeometry(solidW, innerDoorH, slatD),
        teakMat,
        'door_center_solid_half',
        cx + innerDoorW / 2 - solidW / 2,
        doorY,
        doorZ + 0.002
      );
    } else {
      // Left and right doors: full width slats
      const numSlats = 7;
      const step = innerDoorW / numSlats;
      for (let s = 0; s < numSlats; s++) {
        const sx = cx - innerDoorW / 2 + step * (s + 0.5);
        addMesh(
          new THREE.BoxGeometry(slatW, innerDoorH, slatD),
          teakMat,
          `door_${dName}_slat_${s + 1}`,
          sx,
          doorY,
          doorZ + 0.002
        );
      }
    }

    // Small vertical recessed handle
    const handleOnRight = i === 0;
    const handleX = handleOnRight
      ? cx + doorW / 2 - frameBorder / 2
      : cx - doorW / 2 + frameBorder / 2;
    addMesh(
      new THREE.BoxGeometry(0.008, 0.055, 0.006),
      handleMat,
      `door_${dName}_handle`,
      handleX,
      doorY,
      doorZ + frameDepth / 2 + 0.001
    );
  }

  return group;
}
