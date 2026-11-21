function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 2.0;          // Table length (X)
  const D = 0.95;         // Table width/depth (Z)
  const H = 0.75;         // Total height (Y)
  const LEG_W = 0.055;    // Square leg width
  const FOOT_H = 0.008;   // Bottom foot pad height
  const SLAT_H = 0.024;   // Wooden slat thickness
  const APRON_H = 0.04;   // Metal apron height
  const APRON_T = 0.025;  // Metal apron thickness
  const NUM_SLATS = 7;    // Number of longitudinal wooden slats
  const SLAT_GAP = 0.008; // Gap between slats

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8a17a,
    roughness: 0.65,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x4e4c49,
    roughness: 0.42,
    metalness: 0.75,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.85,
    metalness: 0.05,
  });

  const addMesh = (geom, mat, name, x, y, z) => {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Legs and foot pads
  const legH = H - SLAT_H - FOOT_H;
  const legGeo = new THREE.BoxGeometry(LEG_W, legH, LEG_W);
  const footGeo = new THREE.BoxGeometry(LEG_W * 0.94, FOOT_H, LEG_W * 0.94);

  const legOffsetX = W / 2 - LEG_W / 2;
  const legOffsetZ = D / 2 - LEG_W / 2;
  const legCorners = [
    { name: 'front_left', x: -legOffsetX, z: legOffsetZ },
    { name: 'front_right', x: legOffsetX, z: legOffsetZ },
    { name: 'back_left', x: -legOffsetX, z: -legOffsetZ },
    { name: 'back_right', x: legOffsetX, z: -legOffsetZ },
  ];

  for (const c of legCorners) {
    addMesh(footGeo, footMat, `foot_pad_${c.name}`, c.x, FOOT_H / 2, c.z);
    addMesh(legGeo, metalMat, `leg_${c.name}`, c.x, FOOT_H + legH / 2, c.z);
  }

  // Metal apron frame under tabletop
  const apronY = H - SLAT_H - APRON_H / 2;
  const longApronLen = W - LEG_W * 2;
  const shortApronLen = D - LEG_W * 2;

  const longApronGeo = new THREE.BoxGeometry(longApronLen, APRON_H, APRON_T);
  const shortApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, shortApronLen);

  const apronZ = D / 2 - LEG_W / 2;
  const apronX = W / 2 - LEG_W / 2;

  addMesh(longApronGeo, metalMat, 'apron_front', 0, apronY, apronZ);
  addMesh(longApronGeo, metalMat, 'apron_back', 0, apronY, -apronZ);
  addMesh(shortApronGeo, metalMat, 'apron_left', -apronX, apronY, 0);
  addMesh(shortApronGeo, metalMat, 'apron_right', apronX, apronY, 0);

  // Under-slat support crossbars
  const crossbarGeo = new THREE.BoxGeometry(APRON_T, APRON_H * 0.75, shortApronLen);
  const crossbarY = H - SLAT_H - (APRON_H * 0.75) / 2;
  addMesh(crossbarGeo, metalMat, 'support_crossbar_left', -W / 6, crossbarY, 0);
  addMesh(crossbarGeo, metalMat, 'support_crossbar_right', W / 6, crossbarY, 0);

  // Wooden tabletop slats
  const slatW = (D - (NUM_SLATS - 1) * SLAT_GAP) / NUM_SLATS;
  const slatGeo = new THREE.BoxGeometry(W, SLAT_H, slatW);
  const slatY = H - SLAT_H / 2;

  for (let i = 0; i < NUM_SLATS; i++) {
    const z = -D / 2 + slatW / 2 + i * (slatW + SLAT_GAP);
    addMesh(slatGeo, woodMat, `tabletop_slat_${i + 1}`, 0, slatY, z);
  }

  return group;
}
