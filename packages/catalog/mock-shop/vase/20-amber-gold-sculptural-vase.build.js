function build(THREE) {
  const group = new THREE.Group();

  const H = 0.22;
  const BASE_R = 0.048;
  const MAX_R = 0.092;
  const RIM_R = 0.064;
  const WALL_T = 0.005;
  const BASE_H = 0.014;
  const RADIAL_SEGS = 32;

  const amberGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc86e12,
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: 0.84,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  });

  const amberBaseMat = new THREE.MeshPhysicalMaterial({
    color: 0x9b4608,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  // 1. Thick solid glass base
  const baseGeo = new THREE.CylinderGeometry(BASE_R * 1.02, BASE_R * 0.96, BASE_H, RADIAL_SEGS);
  const baseMesh = new THREE.Mesh(baseGeo, amberBaseMat);
  baseMesh.position.y = BASE_H * 0.5;
  baseMesh.name = "vase_solid_base";
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Sculptural outer & inner body via LatheGeometry with organic deformation
  const profilePoints = [
    new THREE.Vector2(BASE_R * 0.96, 0.0),
    new THREE.Vector2(BASE_R * 1.06, BASE_H),
    new THREE.Vector2(MAX_R * 0.72, H * 0.22),
    new THREE.Vector2(MAX_R * 0.94, H * 0.42),
    new THREE.Vector2(MAX_R * 0.98, H * 0.62),
    new THREE.Vector2(MAX_R * 0.84, H * 0.82),
    new THREE.Vector2(RIM_R, H),
    new THREE.Vector2(RIM_R - WALL_T, H),
    new THREE.Vector2(MAX_R * 0.84 - WALL_T, H * 0.82),
    new THREE.Vector2(MAX_R * 0.98 - WALL_T, H * 0.62),
    new THREE.Vector2(MAX_R * 0.94 - WALL_T, H * 0.42),
    new THREE.Vector2(MAX_R * 0.72 - WALL_T, H * 0.22),
    new THREE.Vector2(BASE_R * 0.92 - WALL_T, BASE_H),
    new THREE.Vector2(0.0, BASE_H),
  ];

  const bodyGeo = new THREE.LatheGeometry(profilePoints, RADIAL_SEGS);
  const pos = bodyGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const r = Math.hypot(x, z);
    if (r < 0.0001) continue;

    const angle = Math.atan2(z, x);
    const t = Math.max(0, Math.min(1, y / H));

    // Organic diagonal folds/ripples on the sides
    const fold1 = Math.sin(angle * 2.0 + t * 4.2) * 0.011 * Math.sin(t * Math.PI);
    const fold2 = Math.cos(angle * 3.0 - t * 3.1) * 0.007 * Math.sin(t * Math.PI);

    // Subtle asymmetry matching the sculptural silhouette
    const bulgeLeft = Math.exp(-Math.pow((angle - Math.PI * 0.85) / 0.7, 2)) * 0.014 * Math.sin(t * Math.PI * 0.9);
    const bulgeRight = Math.exp(-Math.pow((angle + Math.PI * 0.15) / 0.8, 2)) * 0.012 * Math.sin(t * Math.PI * 0.85);

    const newR = r + fold1 + fold2 + bulgeLeft + bulgeRight;
    const scale = newR / r;

    // Wavy rim with distinctive front (+Z) dip
    let newY = y;
    if (t > 0.75) {
      const rimFactor = (t - 0.75) / 0.25;
      const frontDip = Math.exp(-Math.pow((angle - Math.PI * 0.5) / 0.45, 2)) * -0.022;
      const backWave = Math.sin(angle * 2.0) * 0.005;
      newY += (frontDip + backWave) * rimFactor * rimFactor;
    }

    pos.setXYZ(i, x * scale, newY, z * scale);
  }

  bodyGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeo, amberGlassMat);
  bodyMesh.name = "vase_sculptural_body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 3. Subtle inner bottom pool for realistic glass thickness
  const innerPoolGeo = new THREE.CylinderGeometry(BASE_R * 0.85, BASE_R * 0.85, 0.004, RADIAL_SEGS);
  const innerPoolMesh = new THREE.Mesh(innerPoolGeo, amberBaseMat);
  innerPoolMesh.position.y = BASE_H + 0.002;
  innerPoolMesh.name = "vase_inner_bottom";
  innerPoolMesh.castShadow = true;
  innerPoolMesh.receiveShadow = true;
  group.add(innerPoolMesh);

  return group;
}
