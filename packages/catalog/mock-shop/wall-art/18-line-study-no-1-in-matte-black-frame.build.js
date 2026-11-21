function build(THREE) {
  const W = 0.56;
  const H = 0.72;
  const D = 0.032;

  const FRAME_W = 0.024;
  const MAT_W = 0.032;
  const BACK_T = 0.004;
  const PAPER_Z = -D / 2 + BACK_T + 0.001;
  const MAT_Z = PAPER_Z + 0.002;
  const LINE_Z = PAPER_Z + 0.0012;

  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.55,
    metalness: 0.08,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x2b2825,
    roughness: 0.85,
    metalness: 0.0,
  });

  const passePartoutMat = new THREE.MeshStandardMaterial({
    color: 0xf7f7f5,
    roughness: 0.9,
    metalness: 0.0,
  });

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xede5d2,
    roughness: 0.92,
    metalness: 0.0,
  });

  const inkBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1e201f,
    roughness: 0.85,
    metalness: 0.0,
  });

  const inkSageMat = new THREE.MeshStandardMaterial({
    color: 0x6f837e,
    roughness: 0.85,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rz !== 0) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Frame bars
  const hBarGeo = new THREE.BoxGeometry(W, FRAME_W, D);
  const vBarGeo = new THREE.BoxGeometry(FRAME_W, H - FRAME_W * 2, D);

  addMesh(hBarGeo, frameMat, "frame_top", 0, H - FRAME_W / 2, 0);
  addMesh(hBarGeo, frameMat, "frame_bottom", 0, FRAME_W / 2, 0);
  addMesh(vBarGeo, frameMat, "frame_left", -W / 2 + FRAME_W / 2, H / 2, 0);
  addMesh(vBarGeo, frameMat, "frame_right", W / 2 - FRAME_W / 2, H / 2, 0);

  // Backing board (back lies at z = -D / 2)
  const innerW = W - FRAME_W * 2;
  const innerH = H - FRAME_W * 2;
  const backGeo = new THREE.BoxGeometry(innerW, innerH, BACK_T);
  addMesh(backGeo, backMat, "backing_board", 0, H / 2, -D / 2 + BACK_T / 2);

  // Cream artwork paper
  const paperW = innerW - MAT_W * 2 + 0.004;
  const paperH = innerH - MAT_W * 2 + 0.004;
  const paperGeo = new THREE.BoxGeometry(paperW, paperH, 0.0015);
  addMesh(paperGeo, paperMat, "artwork_paper", 0, H / 2, PAPER_Z);

  // White mat / passe-partout (4 strips)
  const matHGeo = new THREE.BoxGeometry(innerW, MAT_W, 0.002);
  const matVGeo = new THREE.BoxGeometry(MAT_W, innerH - MAT_W * 2, 0.002);

  addMesh(matHGeo, passePartoutMat, "mat_top", 0, H - FRAME_W - MAT_W / 2, MAT_Z);
  addMesh(matHGeo, passePartoutMat, "mat_bottom", 0, FRAME_W + MAT_W / 2, MAT_Z);
  addMesh(matVGeo, passePartoutMat, "mat_left", -innerW / 2 + MAT_W / 2, H / 2, MAT_Z);
  addMesh(matVGeo, passePartoutMat, "mat_right", innerW / 2 - MAT_W / 2, H / 2, MAT_Z);

  // Artwork lines (centered on H / 2)
  const cy = H / 2 + 0.01;
  const lineT = 0.0012;
  const lineW = 0.0026;

  function addLine(name, mat, x, y, len, angleRad, zOffset = 0) {
    const geo = new THREE.BoxGeometry(lineW, len, lineT);
    addMesh(geo, mat, name, x, cy + y, LINE_Z + zOffset, angleRad);
  }

  // Left vertical bundle
  addLine("line_v_left_1", inkBlackMat, -0.102, 0.0, 0.285, 0.045, 0.0001);
  addLine("line_v_left_2", inkSageMat, -0.094, 0.0, 0.282, 0.012, 0.0002);
  addLine("line_v_left_3", inkBlackMat, -0.082, 0.0, 0.285, -0.018, 0.0003);
  addLine("line_v_left_4", inkBlackMat, -0.072, 0.0, 0.284, 0.015, 0.0004);
  addLine("line_v_left_5", inkSageMat, -0.062, 0.0, 0.282, 0.042, 0.0005);

  // Right vertical bundle
  addLine("line_v_right_1", inkSageMat, 0.062, 0.0, 0.282, -0.008, 0.0001);
  addLine("line_v_right_2", inkBlackMat, 0.076, 0.0, 0.285, -0.014, 0.0002);
  addLine("line_v_right_3", inkSageMat, 0.086, 0.0, 0.284, 0.025, 0.0003);
  addLine("line_v_right_4", inkBlackMat, 0.098, 0.0, 0.286, -0.032, 0.0004);
  addLine("line_v_right_5", inkBlackMat, 0.112, 0.0, 0.285, 0.048, 0.0005);

  // Top horizontal bundle
  addLine("line_h_top_1", inkBlackMat, 0.0, 0.118, 0.288, Math.PI / 2 + 0.008, 0.0006);
  addLine("line_h_top_2", inkSageMat, 0.0, 0.110, 0.286, Math.PI / 2 - 0.025, 0.0007);
  addLine("line_h_top_3", inkBlackMat, 0.0, 0.100, 0.288, Math.PI / 2 - 0.042, 0.0008);
  addLine("line_h_top_4", inkBlackMat, 0.0, 0.088, 0.290, Math.PI / 2 + 0.135, 0.0009);
  addLine("line_h_top_5", inkBlackMat, 0.0, 0.068, 0.288, Math.PI / 2 + 0.035, 0.0010);
  addLine("line_h_top_6", inkSageMat, 0.0, 0.058, 0.286, Math.PI / 2 + 0.022, 0.0011);
  addLine("line_h_top_7", inkBlackMat, 0.0, 0.048, 0.288, Math.PI / 2 + 0.045, 0.0012);

  // Bottom horizontal bundle
  addLine("line_h_bot_1", inkSageMat, 0.0, -0.062, 0.288, Math.PI / 2 + 0.075, 0.0006);
  addLine("line_h_bot_2", inkBlackMat, 0.0, -0.072, 0.288, Math.PI / 2 + 0.045, 0.0007);
  addLine("line_h_bot_3", inkSageMat, 0.0, -0.082, 0.286, Math.PI / 2 + 0.012, 0.0008);
  addLine("line_h_bot_4", inkBlackMat, 0.0, -0.092, 0.288, Math.PI / 2 - 0.032, 0.0009);
  addLine("line_h_bot_5", inkBlackMat, 0.0, -0.106, 0.290, Math.PI / 2 - 0.048, 0.0010);

  // Prominent diagonal line
  addLine("line_diagonal_main", inkBlackMat, 0.0, 0.002, 0.355, 0.72, 0.0013);

  return group;
}
