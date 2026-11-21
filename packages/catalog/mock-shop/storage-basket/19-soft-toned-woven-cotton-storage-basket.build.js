function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.34;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.29;
  const NUM_BANDS = 6;
  const NUM_SEGMENTS = 6;
  const TUBE_R = 0.025;
  const BASE_H = 0.022;
  const BAND_STEP = (HEIGHT - TUBE_R * 2) / (NUM_BANDS - 1);

  const matCream = new THREE.MeshStandardMaterial({ color: 0xded5c5, roughness: 0.92, metalness: 0.0 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x7c8c62, roughness: 0.92, metalness: 0.0 });
  const matTerracotta = new THREE.MeshStandardMaterial({ color: 0xc87d55, roughness: 0.92, metalness: 0.0 });
  const matLavender = new THREE.MeshStandardMaterial({ color: 0xc5bdd0, roughness: 0.92, metalness: 0.0 });
  const matTeal = new THREE.MeshStandardMaterial({ color: 0x538488, roughness: 0.92, metalness: 0.0 });

  const bandColors = [
    [matTeal, matCream],
    [matTerracotta, matLavender],
    [matGreen, matCream],
    [matTeal, matCream],
    [matTerracotta, matLavender],
    [matGreen, matCream]
  ];

  // Woven base disc
  const baseGeo = new THREE.CylinderGeometry(RADIUS * 0.93, RADIUS * 0.88, BASE_H, 32);
  const baseMesh = new THREE.Mesh(baseGeo, matCream);
  baseMesh.name = 'basket_base';
  baseMesh.position.y = BASE_H / 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const segArc = (Math.PI * 2) / NUM_SEGMENTS;
  // Slight overlap on arc so segments meet cleanly without gaps
  const torusGeoCache = [];

  for (let b = 0; b < NUM_BANDS; b++) {
    const t = b / (NUM_BANDS - 1);
    // Subtle taper: slightly narrower at the very bottom, nearly straight sides
    const bandRadius = b === 0 ? RADIUS * 0.94 : RADIUS * (0.98 + 0.02 * t);
    const bandY = TUBE_R + b * BAND_STEP;

    const geo = new THREE.TorusGeometry(bandRadius - TUBE_R * 0.5, TUBE_R, 12, 16, segArc + 0.02);
    torusGeoCache.push(geo);

    const pair = bandColors[b];
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      const mat = pair[s % 2];
      const segMesh = new THREE.Mesh(geo, mat);
      segMesh.name = `basket_band_${b}_seg_${s}`;
      segMesh.rotation.order = 'YXZ';
      segMesh.rotation.x = Math.PI / 2;
      segMesh.rotation.y = s * segArc;
      segMesh.position.y = bandY;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      group.add(segMesh);
    }
  }

  return group;
}
