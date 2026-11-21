function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;       // Total width (X)
  const D = 0.32;       // Total depth (Z)
  const H = 0.065;      // Total height (Y)
  const T = 0.012;      // Wall thickness
  const B_T = 0.008;    // Bottom panel thickness
  const RIM_H = 0.002;  // Exposed plywood top rim thickness

  const HANDLE_W = 0.11;
  const HANDLE_H = 0.024;
  const HANDLE_Y = H * 0.56;

  // Materials
  const dustyRoseMat = new THREE.MeshStandardMaterial({
    color: 0xc9968f,
    roughness: 0.65,
    metalness: 0.02
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xebe3d5,
    roughness: 0.6,
    metalness: 0.02
  });

  const plywoodMat = new THREE.MeshStandardMaterial({
    color: 0xd8c3a5,
    roughness: 0.55,
    metalness: 0.02
  });

  const pearGreenMat = new THREE.MeshStandardMaterial({
    color: 0x8ea06e,
    roughness: 0.65,
    metalness: 0.02
  });

  const pearYellowMat = new THREE.MeshStandardMaterial({
    color: 0xc4b878,
    roughness: 0.65,
    metalness: 0.02
  });

  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xd9c29c,
    roughness: 0.6,
    metalness: 0.05
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

  // 1. Bottom panel
  const bottomGeo = new THREE.BoxGeometry(W - T * 2, B_T, D - T * 2);
  addMesh(bottomGeo, creamMat, 'tray_bottom', 0, B_T / 2, 0);

  // 2. Front (+Z) and Back (-Z) walls
  const wallH = H - RIM_H;
  const fbWallGeo = new THREE.BoxGeometry(W, wallH, T);
  addMesh(fbWallGeo, dustyRoseMat, 'wall_front', 0, wallH / 2, D / 2 - T / 2);
  addMesh(fbWallGeo, dustyRoseMat, 'wall_back', 0, wallH / 2, -D / 2 + T / 2);

  // 3. Left (-X) and Right (+X) walls with pill-shaped handle cutouts
  const sideLen = D - T * 2;
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-sideLen / 2, 0);
  sideShape.lineTo(sideLen / 2, 0);
  sideShape.lineTo(sideLen / 2, wallH);
  sideShape.lineTo(-sideLen / 2, wallH);
  sideShape.closePath();

  // Pill-shaped handle hole
  const hw = HANDLE_W / 2;
  const hr = HANDLE_H / 2;
  const holePath = new THREE.Path();
  holePath.moveTo(-hw + hr, HANDLE_Y - hr);
  holePath.lineTo(hw - hr, HANDLE_Y - hr);
  holePath.absarc(hw - hr, HANDLE_Y, hr, -Math.PI / 2, Math.PI / 2, false);
  holePath.lineTo(-hw + hr, HANDLE_Y + hr);
  holePath.absarc(-hw + hr, HANDLE_Y, hr, Math.PI / 2, (3 * Math.PI) / 2, false);
  sideShape.holes.push(holePath);

  const sideExtrudeGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: T,
    bevelEnabled: false,
    curveSegments: 16
  });
  // Center extrusion along Z, then rotate to align with X-axis walls
  sideExtrudeGeo.translate(0, 0, -T / 2);

  addMesh(sideExtrudeGeo, dustyRoseMat, 'wall_left', -W / 2 + T / 2, 0, 0, 0, Math.PI / 2, 0);
  addMesh(sideExtrudeGeo, dustyRoseMat, 'wall_right', W / 2 - T / 2, 0, 0, 0, Math.PI / 2, 0);

  // 4. Exposed plywood top rims
  const fbRimGeo = new THREE.BoxGeometry(W, RIM_H, T);
  addMesh(fbRimGeo, plywoodMat, 'rim_front', 0, H - RIM_H / 2, D / 2 - T / 2);
  addMesh(fbRimGeo, plywoodMat, 'rim_back', 0, H - RIM_H / 2, -D / 2 + T / 2);

  const lrRimGeo = new THREE.BoxGeometry(T, RIM_H, sideLen);
  addMesh(lrRimGeo, plywoodMat, 'rim_left', -W / 2 + T / 2, H - RIM_H / 2, 0);
  addMesh(lrRimGeo, plywoodMat, 'rim_right', W / 2 - T / 2, H - RIM_H / 2, 0);

  // 5. Subtle decorative orchard motifs on the tray bed
  const motifY = B_T + 0.0005;
  const pearGeo = new THREE.CylinderGeometry(0.012, 0.022, 0.001, 20);
  addMesh(pearGeo, pearGreenMat, 'motif_pear_center', 0, motifY, 0.01, 0, 0.2, 0);
  addMesh(pearGeo, pearYellowMat, 'motif_pear_left', -0.055, motifY, 0.015, 0, -0.3, 0);
  addMesh(pearGeo, pearYellowMat, 'motif_pear_right', 0.055, motifY, 0.02, 0, 0.15, 0);

  const moonGeo = new THREE.TorusGeometry(0.014, 0.003, 8, 20, Math.PI * 1.25);
  addMesh(moonGeo, moonMat, 'motif_crescent_moon', 0.045, motifY, -0.045, Math.PI / 2, 0, 0.6);

  const leafGeo = new THREE.SphereGeometry(0.012, 12, 8);
  leafGeo.scale(1.6, 0.08, 0.7);
  addMesh(leafGeo, pearGreenMat, 'motif_leaf_left', -0.09, motifY, -0.035, 0, 0.5, 0);
  addMesh(leafGeo, pearGreenMat, 'motif_leaf_right', 0.11, motifY, -0.025, 0, -0.4, 0);

  return group;
}
