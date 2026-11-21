function build(THREE) {
  const group = new THREE.Group();

  const H = 0.24;
  const R = 0.06;
  const BASE_PAD_H = 0.005;
  const BASE_PAD_R = 0.051;
  const METAL_H = 0.118;
  const SHADE_H = H - BASE_PAD_H - METAL_H;
  const SEAM_H = 0.002;

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8c4be,
    roughness: 0.28,
    metalness: 0.85,
  });

  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x221d18,
    roughness: 0.9,
    metalness: 0.1,
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff2dc,
    emissive: 0xffc470,
    emissiveIntensity: 0.7,
    roughness: 0.45,
    metalness: 0.0,
  });

  const addMesh = (geo, mat, name, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Bottom rubber pad
  const padGeo = new THREE.CylinderGeometry(BASE_PAD_R, BASE_PAD_R * 0.96, BASE_PAD_H, 32);
  addMesh(padGeo, rubberMat, 'base_rubber_pad', 0, BASE_PAD_H / 2, 0);

  // Lower metal body (LatheGeometry for subtle bottom chamfer)
  const metalPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.004, 0),
    new THREE.Vector2(R, 0.004),
    new THREE.Vector2(R, METAL_H),
    new THREE.Vector2(R - 0.003, METAL_H),
    new THREE.Vector2(0, METAL_H),
  ];
  const metalGeo = new THREE.LatheGeometry(metalPoints, 32);
  addMesh(metalGeo, metalMat, 'metal_speaker_body', 0, BASE_PAD_H, 0);

  // Subtle recessed seam ring between metal body and diffuser
  const seamGeo = new THREE.CylinderGeometry(R - 0.001, R - 0.001, SEAM_H, 32);
  addMesh(seamGeo, rubberMat, 'body_shade_seam', 0, BASE_PAD_H + METAL_H, 0);

  // Speaker grille perforation dots (3 staggered rows around circumference)
  const dotGeo = new THREE.CylinderGeometry(0.0014, 0.0014, 0.0015, 8);
  dotGeo.rotateX(Math.PI / 2);

  const rows = [
    { y: BASE_PAD_H + 0.022, count: 10, offset: 0 },
    { y: BASE_PAD_H + 0.031, count: 10, offset: Math.PI / 10 },
    { y: BASE_PAD_H + 0.040, count: 10, offset: 0 },
  ];

  rows.forEach((row, rIdx) => {
    for (let i = 0; i < row.count; i++) {
      const angle = (i / row.count) * Math.PI * 2 + row.offset;
      const x = Math.sin(angle) * (R - 0.0002);
      const z = Math.cos(angle) * (R - 0.0002);
      const dot = addMesh(
        dotGeo,
        holeMat,
        `speaker_grille_hole_${rIdx}_${i}`,
        x,
        row.y,
        z
      );
      dot.rotation.y = angle;
    }
  });

  // Upper glowing diffuser shade (LatheGeometry with smooth rounded dome top)
  const shadePoints = [];
  const straightH = SHADE_H - R * 0.72;
  shadePoints.push(new THREE.Vector2(0, 0));
  shadePoints.push(new THREE.Vector2(R - 0.001, 0));
  shadePoints.push(new THREE.Vector2(R, 0.002));
  shadePoints.push(new THREE.Vector2(R, straightH));

  const domeSteps = 12;
  const domeH = SHADE_H - straightH;
  for (let i = 1; i <= domeSteps; i++) {
    const t = (i / domeSteps) * (Math.PI / 2);
    const rx = Math.cos(t) * R;
    const ry = straightH + Math.sin(t) * domeH;
    shadePoints.push(new THREE.Vector2(rx, ry));
  }

  const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);
  addMesh(shadeGeo, shadeMat, 'glowing_diffuser_shade', 0, BASE_PAD_H + METAL_H, 0);

  return group;
}
