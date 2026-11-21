function build(THREE) {
  const group = new THREE.Group();

  // Overall dimensions (meters)
  const W = 0.21;
  const H = 0.30;
  const BACK_D = 0.014;
  const PAPER_D = 0.0012;
  const MAX_RELIEF = 0.006;
  const TOTAL_D = BACK_D + MAX_RELIEF + PAPER_D;

  // Z-plane references (back lies flat at z = -TOTAL_D / 2)
  const Z_BACK = -TOTAL_D / 2;
  const Z_BOARD_CENTER = Z_BACK + BACK_D / 2;
  const Z_FRONT = Z_BACK + BACK_D;

  // Artwork margins
  const MARGIN_X = 0.015;
  const ART_LEFT = -W / 2 + MARGIN_X;
  const ART_RIGHT = W / 2 - MARGIN_X;

  // Materials
  const backingMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede1,
    roughness: 0.88,
    metalness: 0.0,
  });

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0x9cbab9,
    roughness: 0.85,
    metalness: 0.0,
  });

  const spacerMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd1,
    roughness: 0.9,
    metalness: 0.0,
  });

  // 1. Backing board
  const backingGeo = new THREE.BoxGeometry(W, H, BACK_D);
  const backingMesh = new THREE.Mesh(backingGeo, backingMat);
  backingMesh.name = 'backing_board';
  backingMesh.position.set(0, H / 2, Z_BOARD_CENTER);
  backingMesh.castShadow = true;
  backingMesh.receiveShadow = true;
  group.add(backingMesh);

  // Helper to create a curved cut-paper band between two quadratic/bezier curves
  function createBandMesh(name, pointsTop, pointsBottom, zOffset, thickness) {
    const shape = new THREE.Shape();
    shape.moveTo(pointsTop[0][0], pointsTop[0][1]);
    for (let i = 1; i < pointsTop.length; i += 2) {
      if (i + 1 < pointsTop.length) {
        shape.quadraticCurveTo(
          pointsTop[i][0], pointsTop[i][1],
          pointsTop[i + 1][0], pointsTop[i + 1][1]
        );
      } else {
        shape.lineTo(pointsTop[i][0], pointsTop[i][1]);
      }
    }
    shape.lineTo(pointsBottom[0][0], pointsBottom[0][1]);
    for (let i = 1; i < pointsBottom.length; i += 2) {
      if (i + 1 < pointsBottom.length) {
        shape.quadraticCurveTo(
          pointsBottom[i][0], pointsBottom[i][1],
          pointsBottom[i + 1][0], pointsBottom[i + 1][1]
        );
      } else {
        shape.lineTo(pointsBottom[i][0], pointsBottom[i][1]);
      }
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 24,
    });
    const mesh = new THREE.Mesh(geo, paperMat);
    mesh.name = name;
    mesh.position.set(0, 0, Z_FRONT + zOffset);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to add a hidden foam spacer behind raised strips so no part floats
  function addSpacer(name, x, y, w, h, zOffset) {
    if (zOffset <= 0.0001) return;
    const geo = new THREE.BoxGeometry(w, h, zOffset);
    const mesh = new THREE.Mesh(geo, spacerMat);
    mesh.name = name;
    mesh.position.set(x, y, Z_FRONT + zOffset / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 2. Bottom-most large curved base piece
  createBandMesh(
    'strip_bottom_base',
    [
      [ART_LEFT, 0.092],
      [-0.01, 0.068],
      [ART_RIGHT, 0.036],
    ],
    [
      [ART_RIGHT, 0.015],
      [0, 0.015],
      [ART_LEFT, 0.015],
    ],
    0.0,
    PAPER_D
  );

  // 3. Lower-mid flaring band
  const zLowerMid = 0.0018;
  createBandMesh(
    'strip_lower_mid',
    [
      [ART_LEFT, 0.115],
      [0.01, 0.092],
      [ART_RIGHT, 0.102],
    ],
    [
      [ART_RIGHT, 0.043],
      [0.005, 0.058],
      [ART_LEFT, 0.096],
    ],
    zLowerMid,
    PAPER_D
  );
  addSpacer('spacer_lower_mid', 0, 0.082, 0.14, 0.018, zLowerMid);

  // 4. Middle upward-curving band
  const zMidWave = 0.0028;
  createBandMesh(
    'strip_mid_wave',
    [
      [ART_LEFT, 0.140],
      [0.015, 0.132],
      [ART_RIGHT, 0.155],
    ],
    [
      [ART_RIGHT, 0.132],
      [0.015, 0.105],
      [ART_LEFT, 0.122],
    ],
    zMidWave,
    PAPER_D
  );
  addSpacer('spacer_mid_wave', 0, 0.128, 0.14, 0.012, zMidWave);

  // 5. Upper-mid left wedge
  const zUpperMid = 0.0014;
  createBandMesh(
    'strip_upper_mid_left',
    [
      [ART_LEFT, 0.192],
      [-0.015, 0.165],
      [ART_RIGHT, 0.160],
    ],
    [
      [ART_RIGHT, 0.146],
      [-0.01, 0.138],
      [ART_LEFT, 0.143],
    ],
    zUpperMid,
    PAPER_D
  );
  addSpacer('spacer_upper_mid_left', -0.02, 0.158, 0.11, 0.014, zUpperMid);

  // 6. Folded/curled tab on the right side
  const zFoldedTab = 0.0042;
  createBandMesh(
    'strip_folded_tab',
    [
      [0.032, 0.165],
      [0.062, 0.185],
      [ART_RIGHT, 0.188],
    ],
    [
      [ART_RIGHT, 0.165],
      [0.062, 0.160],
      [0.032, 0.152],
    ],
    zFoldedTab,
    PAPER_D
  );
  addSpacer('spacer_folded_tab', 0.062, 0.168, 0.04, 0.012, zFoldedTab);

  // 7. Top-most sweeping arc
  const zTopArc = 0.0032;
  createBandMesh(
    'strip_top_arc',
    [
      [ART_LEFT, 0.220],
      [0.0, 0.198],
      [ART_RIGHT, 0.220],
    ],
    [
      [ART_RIGHT, 0.190],
      [0.0, 0.168],
      [ART_LEFT, 0.198],
    ],
    zTopArc,
    PAPER_D
  );
  addSpacer('spacer_top_arc', 0, 0.194, 0.14, 0.014, zTopArc);

  return group;
}
