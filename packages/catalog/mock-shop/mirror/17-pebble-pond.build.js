function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 0.56;
  const H = 0.72;
  const D = 0.028;

  const RX = W / 2;
  const RY = H / 2;
  const FRAME_WIDTH = 0.068;
  const INNER_RX = RX - FRAME_WIDTH;
  const INNER_RY = RY - FRAME_WIDTH;

  const WOOD_D = 0.018;
  const FRAME_D = 0.008;
  const BEVEL = 0.002;
  const CENTER_Y = RY;
  const BACK_Z = -D / 2;

  // Materials
  const mintMat = new THREE.MeshStandardMaterial({
    color: 0xa6dbca,
    roughness: 0.55,
    metalness: 0.02,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd8be98,
    roughness: 0.65,
    metalness: 0.0,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const darkBackingMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.85,
    metalness: 0.0,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Helper to add mesh with shadows
  function addMesh(geo, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Wood backing (birch plywood edge visible from the side)
  const woodShape = new THREE.Shape();
  woodShape.absellipse(0, 0, RX, RY, 0, Math.PI * 2, false, 0);
  const woodGeo = new THREE.ExtrudeGeometry(woodShape, {
    depth: WOOD_D,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(woodGeo, woodMat, 'wood_backing', 0, CENTER_Y, BACK_Z);

  // 2. Dark mirror backing board (recessed behind glass)
  const backBoardShape = new THREE.Shape();
  backBoardShape.absellipse(0, 0, INNER_RX + 0.005, INNER_RY + 0.005, 0, Math.PI * 2, false, 0);
  const backBoardGeo = new THREE.ExtrudeGeometry(backBoardShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(backBoardGeo, darkBackingMat, 'mirror_backing_board', 0, CENTER_Y, BACK_Z + WOOD_D - 0.001);

  // 3. Mirror glass
  const glassShape = new THREE.Shape();
  glassShape.absellipse(0, 0, INNER_RX + 0.002, INNER_RY + 0.002, 0, Math.PI * 2, false, 0);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(glassGeo, mirrorMat, 'mirror_glass', 0, CENTER_Y, BACK_Z + WOOD_D + 0.001);

  // 4. Mint green front frame with oval cutout
  const frameShape = new THREE.Shape();
  frameShape.absellipse(0, 0, RX - BEVEL, RY - BEVEL, 0, Math.PI * 2, false, 0);
  const frameHole = new THREE.Path();
  frameHole.absellipse(0, 0, INNER_RX, INNER_RY, 0, Math.PI * 2, true, 0);
  frameShape.holes.push(frameHole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 32,
  });
  addMesh(frameGeo, mintMat, 'mint_frame', 0, CENTER_Y, BACK_Z + WOOD_D);

  // 5. Inner bevel ring around mirror glass
  const lipShape = new THREE.Shape();
  lipShape.absellipse(0, 0, INNER_RX + 0.002, INNER_RY + 0.002, 0, Math.PI * 2, false, 0);
  const lipHole = new THREE.Path();
  lipHole.absellipse(0, 0, INNER_RX - 0.001, INNER_RY - 0.001, 0, Math.PI * 2, true, 0);
  lipShape.holes.push(lipHole);
  const lipGeo = new THREE.ExtrudeGeometry(lipShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 32,
  });
  addMesh(lipGeo, mintMat, 'inner_bevel_ring', 0, CENTER_Y, BACK_Z + WOOD_D + 0.003);

  // 6-8. Three embossed wavy lines at bottom center of mint frame
  const waveZ = BACK_Z + WOOD_D + FRAME_D + BEVEL;
  const waveBaseY = FRAME_WIDTH * 0.48;
  const waveNames = ['wave_ripple_top', 'wave_ripple_mid', 'wave_ripple_bot'];
  const waveOffsets = [0.007, 0.0, -0.007];

  for (let w = 0; w < 3; w++) {
    const pts = [];
    const segs = 16;
    const waveWidth = 0.044;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const wx = (t - 0.5) * waveWidth;
      const wy = Math.sin(t * Math.PI * 5) * 0.0018;
      pts.push(new THREE.Vector3(wx, wy, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.0009, 6, false);
    addMesh(tubeGeo, mintMat, waveNames[w], 0, waveBaseY + waveOffsets[w], waveZ);
  }

  // 9-12. Four flush wall-protector felt pads on the back
  const padGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.001, 16);
  padGeo.rotateX(Math.PI / 2);
  const padZ = BACK_Z + 0.0005;

  addMesh(padGeo, feltMat, 'back_pad_top', 0, CENTER_Y + RY * 0.72, padZ);
  addMesh(padGeo, feltMat, 'back_pad_bottom', 0, CENTER_Y - RY * 0.72, padZ);
  addMesh(padGeo, feltMat, 'back_pad_left', -RX * 0.65, CENTER_Y, padZ);
  addMesh(padGeo, feltMat, 'back_pad_right', RX * 0.65, CENTER_Y, padZ);

  return group;
}
