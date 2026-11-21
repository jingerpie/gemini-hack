function build(THREE) {
  const group = new THREE.Group();

  const H = 0.36;
  const BASE_R = 0.043;
  const MAX_R = 0.102;
  const NECK_R = 0.055;
  const RIM_R = 0.068;
  const WALL_T = 0.006;
  const RADIAL_SEGS = 32;

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1c,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.15,
    clearcoatRoughness: 0.45,
    side: THREE.FrontSide
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x111113,
    roughness: 0.65,
    metalness: 0.02,
    side: THREE.BackSide
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x121214,
    roughness: 0.85,
    metalness: 0.0
  });

  // Profile points for outer wall (from bottom center to rim)
  const outerProfile = [
    new THREE.Vector2(0.0, 0.002),
    new THREE.Vector2(BASE_R, 0.002),
    new THREE.Vector2(BASE_R * 1.12, H * 0.08),
    new THREE.Vector2(MAX_R * 0.72, H * 0.25),
    new THREE.Vector2(MAX_R * 0.94, H * 0.42),
    new THREE.Vector2(MAX_R * 0.96, H * 0.54),
    new THREE.Vector2(MAX_R * 0.78, H * 0.68),
    new THREE.Vector2(NECK_R, H * 0.82),
    new THREE.Vector2(NECK_R * 1.04, H * 0.90),
    new THREE.Vector2(RIM_R, H * 0.985)
  ];

  // Interpolate smooth profile with 36 vertical steps
  const curve = new THREE.SplineCurve(outerProfile);
  const sampledPoints = curve.getPoints(36);

  const outerGeo = new THREE.LatheGeometry(sampledPoints, RADIAL_SEGS);
  const pos = outerGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;

    const phi = Math.atan2(x, z); // 0 at +Z (front), PI/2 at +X (right)
    const yNorm = Math.max(0, Math.min(1, y / H));

    // Helical sculpted waves concentrated on the belly (yNorm ~ 0.15 to 0.85)
    const bellyMask = Math.sin(Math.PI * Math.max(0, Math.min(1, (yNorm - 0.08) / 0.80)));
    const wave = Math.sin(3.0 * phi + 7.5 * yNorm) * 0.014 * Math.pow(bellyMask, 1.3);

    const newR = r + wave;
    const scale = newR / r;

    // Undulating rim: V-dip at front (+Z) and back (-Z), peaks at left (-X) and right (+X)
    const rimMask = Math.pow(Math.max(0, (yNorm - 0.72) / 0.28), 1.6);
    const rimOffset = -Math.cos(2.0 * phi) * 0.022 * rimMask;

    pos.setXYZ(i, x * scale, y + rimOffset, z * scale);
  }

  outerGeo.computeVertexNormals();
  const vaseBody = new THREE.Mesh(outerGeo, ceramicMat);
  vaseBody.name = 'vase_body';
  vaseBody.castShadow = true;
  vaseBody.receiveShadow = true;
  group.add(vaseBody);

  // Inner wall for hollow top
  const innerPoints = sampledPoints.map((pt, idx) => {
    if (idx === 0) return new THREE.Vector2(0.0, 0.018);
    const r = Math.max(0.005, pt.x - WALL_T);
    const y = Math.max(0.018, pt.y);
    return new THREE.Vector2(r, y);
  });

  const innerGeo = new THREE.LatheGeometry(innerPoints, RADIAL_SEGS);
  const innerPos = innerGeo.attributes.position;

  for (let i = 0; i < innerPos.count; i++) {
    const x = innerPos.getX(i);
    const y = innerPos.getY(i);
    const z = innerPos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;

    const phi = Math.atan2(x, z);
    const yNorm = Math.max(0, Math.min(1, y / H));
    const rimMask = Math.pow(Math.max(0, (yNorm - 0.72) / 0.28), 1.6);
    const rimOffset = -Math.cos(2.0 * phi) * 0.022 * rimMask;

    innerPos.setY(i, y + rimOffset);
  }

  innerGeo.computeVertexNormals();
  const vaseInner = new THREE.Mesh(innerGeo, innerMat);
  vaseInner.name = 'vase_inner_wall';
  vaseInner.castShadow = true;
  vaseInner.receiveShadow = true;
  group.add(vaseInner);

  // Grounded base pad touching y = 0
  const baseGeo = new THREE.CylinderGeometry(BASE_R * 0.98, BASE_R * 0.95, 0.004, RADIAL_SEGS);
  const vaseBase = new THREE.Mesh(baseGeo, baseMat);
  vaseBase.name = 'vase_base_pad';
  vaseBase.position.y = 0.002;
  vaseBase.castShadow = true;
  vaseBase.receiveShadow = true;
  group.add(vaseBase);

  return group;
}
