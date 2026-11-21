function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.26;
  const H_WIDE = 0.088;
  const R_BASE = 0.043;
  const R_WIDE = 0.094;
  const R_TOP = 0.045;
  const WALL_T = 0.006;
  const PAD_H = 0.002;
  const SEGMENTS = 8;

  // Materials
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0x1e357a,
    roughness: 0.42,
    metalness: 0.05,
    flatShading: true
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x0a1126,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: true
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.9,
    metalness: 0.0
  });

  // Main faceted vase body (outer + rim + inner wall)
  const bodyPoints = [
    new THREE.Vector2(0, PAD_H),
    new THREE.Vector2(R_BASE, PAD_H),
    new THREE.Vector2(R_WIDE, H_WIDE),
    new THREE.Vector2(R_TOP, H),
    new THREE.Vector2(R_TOP - WALL_T, H),
    new THREE.Vector2(R_WIDE - WALL_T * 1.4, H_WIDE),
    new THREE.Vector2(R_BASE - WALL_T * 1.2, PAD_H + WALL_T * 2),
    new THREE.Vector2(0, PAD_H + WALL_T * 2)
  ];

  const bodyGeo = new THREE.LatheGeometry(bodyPoints, SEGMENTS);
  const vaseBody = new THREE.Mesh(bodyGeo, ceramicMat);
  vaseBody.name = 'vase_body';
  vaseBody.castShadow = true;
  vaseBody.receiveShadow = true;
  group.add(vaseBody);

  // Dark interior cavity liner for realistic depth
  const innerPoints = [
    new THREE.Vector2(0, PAD_H + WALL_T * 2.2),
    new THREE.Vector2(R_BASE - WALL_T * 1.3, PAD_H + WALL_T * 2.2),
    new THREE.Vector2(R_WIDE - WALL_T * 1.5, H_WIDE),
    new THREE.Vector2(R_TOP - WALL_T * 1.15, H - 0.012)
  ];
  const innerGeo = new THREE.LatheGeometry(innerPoints, SEGMENTS);
  const vaseInterior = new THREE.Mesh(innerGeo, interiorMat);
  vaseInterior.name = 'vase_interior';
  vaseInterior.castShadow = true;
  vaseInterior.receiveShadow = true;
  group.add(vaseInterior);

  // Bottom foot pad touching y = 0
  const padGeo = new THREE.CylinderGeometry(R_BASE * 0.92, R_BASE * 0.92, PAD_H, SEGMENTS);
  const vasePad = new THREE.Mesh(padGeo, padMat);
  vasePad.name = 'vase_base_pad';
  vasePad.position.y = PAD_H / 2;
  vasePad.castShadow = true;
  vasePad.receiveShadow = true;
  group.add(vasePad);

  return group;
}
