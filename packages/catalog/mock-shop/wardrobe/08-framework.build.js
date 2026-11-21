function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.80;
  const H = 2.00;
  const D = 0.58;
  const PANEL_T = 0.022;
  const DOOR_T = 0.020;
  const PLINTH_H = 0.085;
  const GAP = 0.004;
  const FASTENER_R = 0.007;
  const FASTENER_H = 0.004;

  // Materials
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xc8c4ba,
    roughness: 0.72,
    metalness: 0.02
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc18b59,
    roughness: 0.58,
    metalness: 0.02
  });

  const handleRecessMat = new THREE.MeshStandardMaterial({
    color: 0x7c5331,
    roughness: 0.65,
    metalness: 0.02
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xebe9e2,
    roughness: 0.65,
    metalness: 0.02
  });

  const fastenerMat = new THREE.MeshStandardMaterial({
    color: 0x353533,
    roughness: 0.45,
    metalness: 0.35
  });

  const addMesh = (geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Side panels (full height, full depth)
  const sideGeo = new THREE.BoxGeometry(PANEL_T, H, D);
  addMesh(sideGeo, sideMat, 'left_side_panel', -W / 2 + PANEL_T / 2, H / 2, 0);
  addMesh(sideGeo, sideMat, 'right_side_panel', W / 2 - PANEL_T / 2, H / 2, 0);

  // Inner width between side panels
  const innerW = W - 2 * PANEL_T;

  // Top panel
  const topGeo = new THREE.BoxGeometry(innerW, PANEL_T, D);
  addMesh(topGeo, woodMat, 'top_panel', 0, H - PANEL_T / 2, 0);

  // Back panel
  const backGeo = new THREE.BoxGeometry(innerW, H - PANEL_T, PANEL_T);
  addMesh(backGeo, sideMat, 'back_panel', 0, (H - PANEL_T) / 2, -D / 2 + PANEL_T / 2);

  // Bottom plinth (recessed slightly at the front)
  const plinthD = D - DOOR_T - 0.01;
  const plinthGeo = new THREE.BoxGeometry(innerW, PLINTH_H, plinthD);
  addMesh(plinthGeo, plinthMat, 'front_plinth', 0, PLINTH_H / 2, -D / 2 + plinthD / 2 + PANEL_T * 0.5);

  // Bottom shelf/rail above plinth
  const bottomRailGeo = new THREE.BoxGeometry(innerW, PANEL_T, D - PANEL_T);
  addMesh(bottomRailGeo, woodMat, 'bottom_rail', 0, PLINTH_H + PANEL_T / 2, PANEL_T / 2);

  // Doors
  const doorH = H - PLINTH_H - 2 * PANEL_T - GAP * 2;
  const doorW = (innerW - GAP * 3) / 2;
  const doorY = PLINTH_H + PANEL_T + GAP + doorH / 2;
  const doorZ = D / 2 - DOOR_T / 2;

  const doorGeo = new THREE.BoxGeometry(doorW, doorH, DOOR_T);
  addMesh(doorGeo, woodMat, 'left_door', -doorW / 2 - GAP / 2, doorY, doorZ);
  addMesh(doorGeo, woodMat, 'right_door', doorW / 2 + GAP / 2, doorY, doorZ);

  // Recessed pill-shaped handle detail in the center between doors
  const handleGeo = new THREE.CapsuleGeometry(0.022, 0.065, 8, 16);
  addMesh(handleGeo, handleRecessMat, 'handle_recess', 0, doorY + 0.04, doorZ + DOOR_T / 2 - 0.008);

  // Modular side fasteners (3 columns x 5 rows per side = 30 meshes)
  const fastenerGeo = new THREE.CylinderGeometry(FASTENER_R, FASTENER_R, FASTENER_H, 16);
  const colZ = [-D * 0.36, 0, D * 0.36];
  const rowY = [0.12, 0.56, 1.00, 1.44, 1.92];

  for (let r = 0; r < rowY.length; r++) {
    for (let c = 0; c < colZ.length; c++) {
      addMesh(
        fastenerGeo,
        fastenerMat,
        `left_fastener_r${r}_c${c}`,
        -W / 2 - FASTENER_H / 2 + 0.001,
        rowY[r],
        colZ[c],
        0,
        0,
        Math.PI / 2
      );
      addMesh(
        fastenerGeo,
        fastenerMat,
        `right_fastener_r${r}_c${c}`,
        W / 2 + FASTENER_H / 2 - 0.001,
        rowY[r],
        colZ[c],
        0,
        0,
        Math.PI / 2
      );
    }
  }

  return group;
}
