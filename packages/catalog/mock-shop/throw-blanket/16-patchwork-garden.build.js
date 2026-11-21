function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.88;
  const H = 1.12;
  const THICKNESS = 0.018;
  const ROD_W = 1.00;
  const ROD_R = 0.011;
  const SLEEVE_R = 0.017;
  const BORDER = 0.055;
  const SASHING = 0.018;
  const TILE_D = 0.005;

  const ROD_Y = H - SLEEVE_R;

  // Materials
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xdfa5a6, roughness: 0.88, metalness: 0.0 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf3efe0, roughness: 0.88, metalness: 0.0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf2df86, roughness: 0.88, metalness: 0.0 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x9ec0d6, roughness: 0.88, metalness: 0.0 });
  const sageMat = new THREE.MeshStandardMaterial({ color: 0x7e9a7b, roughness: 0.85, metalness: 0.0 });
  const coralMat = new THREE.MeshStandardMaterial({ color: 0xd97c7c, roughness: 0.85, metalness: 0.0 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xc8a27a, roughness: 0.55, metalness: 0.0 });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Wooden dowel rod at top
  const rodGeo = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 20);
  addMesh(rodGeo, woodMat, 'dowel_rod', 0, ROD_Y, 0, 0, 0, Math.PI / 2);

  // Top fabric sleeve wrapped around the rod
  const sleeveGeo = new THREE.CylinderGeometry(SLEEVE_R, SLEEVE_R, W, 20);
  addMesh(sleeveGeo, pinkMat, 'rod_sleeve', 0, ROD_Y, 0, 0, 0, Math.PI / 2);

  // Main quilt body (rounded rectangle via ExtrudeGeometry)
  const bodyH = H - SLEEVE_R;
  const r = 0.012;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + r, 0);
  shape.lineTo(W / 2 - r, 0);
  shape.quadraticCurveTo(W / 2, 0, W / 2, r);
  shape.lineTo(W / 2, bodyH - r);
  shape.quadraticCurveTo(W / 2, bodyH, W / 2 - r, bodyH);
  shape.lineTo(-W / 2 + r, bodyH);
  shape.quadraticCurveTo(-W / 2, bodyH, -W / 2, bodyH - r);
  shape.lineTo(-W / 2, r);
  shape.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  bodyGeo.translate(0, 0, -THICKNESS / 2);
  addMesh(bodyGeo, pinkMat, 'quilt_body', 0, 0, 0);

  // Grid layout for patchwork squares
  const innerW = W - 2 * BORDER;
  const innerH = bodyH - 2 * BORDER;
  const cols = 4;
  const rows = 5;
  const cellW = (innerW - (cols - 1) * SASHING) / cols;
  const cellH = (innerH - (rows - 1) * SASHING) / rows;
  const tileZ = THICKNESS / 2 + 0.004 + TILE_D / 2;

  const tileMatGrid = [
    [pinkMat, pinkMat, blueMat, yellowMat],
    [pinkMat, pinkMat, creamMat, pinkMat],
    [yellowMat, pinkMat, null, creamMat], // row 2: col 1 & 2 merged into wide tulip panel
    [pinkMat, blueMat, yellowMat, creamMat],
    [yellowMat, pinkMat, creamMat, pinkMat],
  ];

  const tileGeo = new THREE.BoxGeometry(cellW, cellH, TILE_D);
  const wideTileGeo = new THREE.BoxGeometry(cellW * 2 + SASHING, cellH, TILE_D);

  for (let row = 0; row < rows; row++) {
    const cy = BORDER + (rows - 1 - row) * (cellH + SASHING) + cellH / 2;
    for (let col = 0; col < cols; col++) {
      const mat = tileMatGrid[row][col];
      if (!mat) continue;

      if (row === 2 && col === 1) {
        const cx = -innerW / 2 + col * (cellW + SASHING) + (cellW * 2 + SASHING) / 2;
        addMesh(wideTileGeo, mat, `patch_square_r${row}_c${col}`, cx, cy, tileZ);
      } else {
        const cx = -innerW / 2 + col * (cellW + SASHING) + cellW / 2;
        addMesh(tileGeo, mat, `patch_square_r${row}_c${col}`, cx, cy, tileZ);
      }
    }
  }

  // Applique floral accents on key squares
  const flowerGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.004, 16);
  const stemGeo = new THREE.BoxGeometry(0.008, 0.065, 0.003);
  const accentZ = tileZ + TILE_D / 2 + 0.002;

  const accents = [
    { r: 0, c: 0, mat: coralMat, name: 'tulip_top_left' },
    { r: 0, c: 1, mat: creamMat, name: 'daisy_top_mid' },
    { r: 1, c: 3, mat: coralMat, name: 'rose_upper_right' },
    { r: 2, c: 1.5, mat: coralMat, name: 'tulip_center_panel' },
    { r: 3, c: 0, mat: coralMat, name: 'daisy_lower_left' },
    { r: 4, c: 2, mat: coralMat, name: 'tulip_bottom_mid' },
    { r: 4, c: 3, mat: coralMat, name: 'rose_bottom_right' },
  ];

  for (const acc of accents) {
    const cy = BORDER + (rows - 1 - acc.r) * (cellH + SASHING) + cellH / 2;
    const cx = -innerW / 2 + acc.c * (cellW + SASHING) + cellW / 2;
    addMesh(stemGeo, sageMat, `${acc.name}_stem`, cx, cy - 0.02, accentZ);
    addMesh(flowerGeo, acc.mat, `${acc.name}_bloom`, cx, cy + 0.025, accentZ, Math.PI / 2, 0, 0);
  }

  return group;
}
