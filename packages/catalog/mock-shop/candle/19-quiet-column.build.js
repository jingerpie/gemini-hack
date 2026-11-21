function build(THREE) {
  const group = new THREE.Group();

  const TOTAL_H = 0.10;
  const BODY_H = 0.083;
  const BODY_R = 0.028;
  const FLUTE_AMP = 0.0014;
  const N_FLUTES = 32;

  const BAND_H = 0.022;
  const BAND_Y = 0.024;
  const BAND_R = BODY_R + FLUTE_AMP + 0.0004;

  const WICK_R = 0.0011;
  const WICK_H = 0.0065;
  const WICK_Y = BODY_H - 0.0005;

  const FLAME_R = 0.0032;
  const FLAME_H = 0.012;
  const FLAME_Y = TOTAL_H - FLAME_H;

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf2ebd9,
    roughness: 0.65,
    metalness: 0.0
  });

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd0,
    roughness: 0.92,
    metalness: 0.0
  });

  const wickMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c0,
    roughness: 0.95,
    metalness: 0.0
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff8c1a,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0
  });

  // Fluted candle body
  const shape = new THREE.Shape();
  const steps = N_FLUTES * 4;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = BODY_R + FLUTE_AMP * Math.cos(N_FLUTES * theta);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: BODY_H,
    bevelEnabled: false,
    curveSegments: 1
  });
  bodyGeo.rotateX(-Math.PI / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, waxMat);
  bodyMesh.name = 'candle_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Paper wrap band
  const bandGeo = new THREE.CylinderGeometry(BAND_R, BAND_R, BAND_H, 32);
  const bandMesh = new THREE.Mesh(bandGeo, paperMat);
  bandMesh.name = 'paper_band';
  bandMesh.position.y = BAND_Y;
  bandMesh.castShadow = true;
  bandMesh.receiveShadow = true;
  group.add(bandMesh);

  // Wick
  const wickGeo = new THREE.CylinderGeometry(WICK_R * 0.85, WICK_R, WICK_H, 10);
  const wickMesh = new THREE.Mesh(wickGeo, wickMat);
  wickMesh.name = 'wick';
  wickMesh.position.y = WICK_Y + WICK_H / 2;
  wickMesh.castShadow = true;
  wickMesh.receiveShadow = true;
  group.add(wickMesh);

  // Lit flame (teardrop via LatheGeometry)
  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.15),
    new THREE.Vector2(FLAME_R, FLAME_H * 0.35),
    new THREE.Vector2(FLAME_R * 0.75, FLAME_H * 0.6),
    new THREE.Vector2(FLAME_R * 0.3, FLAME_H * 0.85),
    new THREE.Vector2(0, FLAME_H)
  ];
  const flameGeo = new THREE.LatheGeometry(flamePoints, 16);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'emit_flame';
  flameMesh.position.y = FLAME_Y;
  flameMesh.castShadow = true;
  flameMesh.receiveShadow = true;
  group.add(flameMesh);

  return group;
}
