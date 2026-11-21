function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.52;
  const TOP_R = 0.25;
  const TOP_H = 0.032;
  const COL_R = 0.11;
  const BASE_R = 0.18;
  const BASE_H = 0.008;
  const GLIDE_H = 0.002;
  const GLIDE_R = 0.012;

  const COL_H = TOTAL_H - TOP_H - BASE_H - GLIDE_H;
  const BASE_Y = GLIDE_H;
  const COL_Y = BASE_Y + BASE_H;
  const TOP_Y = COL_Y + COL_H;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.65,
    metalness: 0.02
  });

  const metalBaseMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    roughness: 0.35,
    metalness: 0.85
  });

  const darkHardwareMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e30,
    roughness: 0.4,
    metalness: 0.8
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0
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

  // 4 felt/rubber floor glides under the base plate
  const glideGeo = new THREE.CylinderGeometry(GLIDE_R, GLIDE_R, GLIDE_H, 16);
  const glideOffset = BASE_R * 0.78;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    addMesh(
      glideGeo,
      glideMat,
      `floor_glide_${i + 1}`,
      Math.cos(angle) * glideOffset,
      GLIDE_H / 2,
      Math.sin(angle) * glideOffset
    );
  }

  // Brushed metal base plate
  const baseGeo = new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32);
  addMesh(baseGeo, metalBaseMat, 'base_plate', 0, BASE_Y + BASE_H / 2, 0);

  // Subtle chamfered rim on top edge of base plate
  const rimGeo = new THREE.TorusGeometry(BASE_R - 0.002, 0.002, 8, 32);
  const rimMesh = addMesh(rimGeo, metalBaseMat, 'base_chamfer_ring', 0, BASE_Y + BASE_H, 0);
  rimMesh.rotation.x = Math.PI / 2;

  // Cylindrical wood pedestal column
  const colGeo = new THREE.CylinderGeometry(COL_R, COL_R, COL_H, 32);
  addMesh(colGeo, woodMat, 'column_pedestal', 0, COL_Y + COL_H / 2, 0);

  // Round wood tabletop
  const topGeo = new THREE.CylinderGeometry(TOP_R, TOP_R, TOP_H, 32);
  addMesh(topGeo, woodMat, 'tabletop', 0, TOP_Y + TOP_H / 2, 0);

  // 4 small dark metal mounting brackets & bolts under the tabletop
  const bracketGeo = new THREE.BoxGeometry(0.016, 0.008, 0.018);
  const boltGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 12);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const bx = Math.cos(angle) * (COL_R + 0.004);
    const bz = Math.sin(angle) * (COL_R + 0.004);

    const bracket = addMesh(
      bracketGeo,
      darkHardwareMat,
      `mounting_bracket_${i + 1}`,
      bx,
      TOP_Y - 0.004,
      bz
    );
    bracket.rotation.y = -angle;

    addMesh(
      boltGeo,
      darkHardwareMat,
      `bracket_bolt_${i + 1}`,
      Math.cos(angle) * (COL_R + 0.007),
      TOP_Y - 0.009,
      Math.sin(angle) * (COL_R + 0.007)
    );
  }

  return group;
}
