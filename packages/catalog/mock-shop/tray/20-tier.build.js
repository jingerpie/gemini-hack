function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.28;
  const D = 0.19;
  const TRAY_H = 0.036;
  const WALL = 0.011;
  const BASE_T = 0.006;
  const LINER_T = 0.004;
  const NOTCH_W = 0.044;
  const NOTCH_D = 0.006;
  const ROLL_R = 0.011;
  const ROLL_COUNT = 5;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d28,
    roughness: 0.55,
    metalness: 0.04,
  });

  const linerMat = new THREE.MeshStandardMaterial({
    color: 0xeae3d5,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Helper to create one tray
  function createTray(prefix) {
    const tray = new THREE.Group();

    const innerW = W - WALL * 2;
    const innerD = D - WALL * 2;
    const wallH = TRAY_H - BASE_T;

    // Wooden base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(W, BASE_T, D),
      woodMat
    );
    base.position.set(0, BASE_T / 2, 0);
    base.name = `${prefix}_wood_base`;
    tray.add(base);

    // Back wall (-Z)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(W, wallH, WALL),
      woodMat
    );
    backWall.position.set(0, BASE_T + wallH / 2, -D / 2 + WALL / 2);
    backWall.name = `${prefix}_wood_back`;
    tray.add(backWall);

    // Left wall (-X)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL, wallH, innerD),
      woodMat
    );
    leftWall.position.set(-W / 2 + WALL / 2, BASE_T + wallH / 2, 0);
    leftWall.name = `${prefix}_wood_left`;
    tray.add(leftWall);

    // Right wall (+X)
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL, wallH, innerD),
      woodMat
    );
    rightWall.position.set(W / 2 - WALL / 2, BASE_T + wallH / 2, 0);
    rightWall.name = `${prefix}_wood_right`;
    tray.add(rightWall);

    // Front wall (+Z) with center finger-pull notch
    const frontShape = new THREE.Shape();
    const hw = W / 2;
    const hnw = NOTCH_W / 2;
    frontShape.moveTo(-hw, 0);
    frontShape.lineTo(hw, 0);
    frontShape.lineTo(hw, wallH);
    frontShape.lineTo(hnw, wallH);
    frontShape.bezierCurveTo(
      hnw * 0.6, wallH,
      hnw * 0.5, wallH - NOTCH_D,
      0, wallH - NOTCH_D
    );
    frontShape.bezierCurveTo(
      -hnw * 0.5, wallH - NOTCH_D,
      -hnw * 0.6, wallH,
      -hnw, wallH
    );
    frontShape.lineTo(-hw, wallH);
    frontShape.closePath();

    const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
      depth: WALL,
      bevelEnabled: false,
      curveSegments: 12,
    });
    const frontWall = new THREE.Mesh(frontGeo, woodMat);
    frontWall.position.set(0, BASE_T, D / 2 - WALL);
    frontWall.name = `${prefix}_wood_front`;
    tray.add(frontWall);

    // Fabric liner floor
    const linerFloor = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, LINER_T, innerD),
      linerMat
    );
    linerFloor.position.set(0, BASE_T + LINER_T / 2, 0);
    linerFloor.name = `${prefix}_liner_floor`;
    tray.add(linerFloor);

    // Fabric divider between back compartment and ring rolls
    const rollsTotalD = ROLL_COUNT * ROLL_R * 2;
    const dividerZ = D / 2 - WALL - rollsTotalD - LINER_T / 2;
    const dividerH = wallH - 0.004;
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, dividerH, LINER_T),
      linerMat
    );
    divider.position.set(0, BASE_T + LINER_T + dividerH / 2, dividerZ);
    divider.name = `${prefix}_liner_divider`;
    tray.add(divider);

    // Ring rolls (5 padded cylinders along X)
    const rollGeo = new THREE.CylinderGeometry(ROLL_R, ROLL_R, innerW, 16);
    rollGeo.rotateZ(Math.PI / 2);
    const firstRollZ = dividerZ + LINER_T / 2 + ROLL_R;

    for (let i = 0; i < ROLL_COUNT; i++) {
      const roll = new THREE.Mesh(rollGeo, linerMat);
      roll.position.set(
        0,
        BASE_T + LINER_T + ROLL_R * 0.85,
        firstRollZ + i * (ROLL_R * 2)
      );
      roll.name = `${prefix}_ring_roll_${i}`;
      tray.add(roll);
    }

    return tray;
  }

  // Bottom tray
  const bottomTray = createTray("bottom");
  group.add(bottomTray);

  // Top tray stacked on bottom tray with slight offset
  const topTray = createTray("top");
  topTray.position.set(0.004, TRAY_H, -0.004);
  topTray.rotation.y = 0.05;
  group.add(topTray);

  // Enable shadows on all meshes
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}
