function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 1.20;
  const RADIUS = DIAMETER / 2; // 0.60 m
  const PILE_H = 0.015;
  const BACKING_H = 0.003;
  const BORDER_TUBE_R = 0.010;
  const BORDER_MAJOR_R = RADIUS - BORDER_TUBE_R; // 0.59 m -> outer edge at 0.60 m
  const MOTIF_H = 0.005;
  const MOTIF_Y = PILE_H - 0.0015;

  // Materials
  const creamPileMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    roughness: 0.95,
    metalness: 0.0,
  });

  const borderMat = new THREE.MeshStandardMaterial({
    color: 0xebe3d5,
    roughness: 0.92,
    metalness: 0.0,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.95,
    metalness: 0.0,
  });

  const taupeMotifMat = new THREE.MeshStandardMaterial({
    color: 0xb8a386,
    roughness: 0.95,
    metalness: 0.0,
  });

  // 1. Rug backing
  const backingGeo = new THREE.CylinderGeometry(
    RADIUS - BORDER_TUBE_R * 0.5,
    RADIUS - BORDER_TUBE_R * 0.5,
    BACKING_H,
    32
  );
  const backing = new THREE.Mesh(backingGeo, backingMat);
  backing.name = 'rug_backing';
  backing.position.y = BACKING_H / 2;
  backing.castShadow = true;
  backing.receiveShadow = true;
  group.add(backing);

  // 2. Main cream tufted pile base
  const pileGeo = new THREE.CylinderGeometry(
    BORDER_MAJOR_R,
    BORDER_MAJOR_R,
    PILE_H - 0.002,
    32
  );
  const pile = new THREE.Mesh(pileGeo, creamPileMat);
  pile.name = 'rug_pile_base';
  pile.position.y = 0.002 + (PILE_H - 0.002) / 2;
  pile.castShadow = true;
  pile.receiveShadow = true;
  group.add(pile);

  // 3. Outer stitched/piped border
  const borderGeo = new THREE.TorusGeometry(BORDER_MAJOR_R, BORDER_TUBE_R, 12, 32);
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.name = 'rug_border_piping';
  border.rotation.x = Math.PI / 2;
  border.position.y = BORDER_TUBE_R;
  border.castShadow = true;
  border.receiveShadow = true;
  group.add(border);

  // 4. Whip-stitch accents around the border
  const STITCH_COUNT = 24;
  const stitchGeo = new THREE.TorusGeometry(BORDER_TUBE_R + 0.0012, 0.0018, 6, 12);
  for (let i = 0; i < STITCH_COUNT; i++) {
    const angle = (i / STITCH_COUNT) * Math.PI * 2;
    const stitch = new THREE.Mesh(stitchGeo, creamPileMat);
    stitch.name = `border_stitch_${i + 1}`;
    stitch.position.set(
      Math.cos(angle) * BORDER_MAJOR_R,
      BORDER_TUBE_R,
      Math.sin(angle) * BORDER_MAJOR_R
    );
    stitch.rotation.y = -angle;
    stitch.castShadow = true;
    stitch.receiveShadow = true;
    group.add(stitch);
  }

  // 5. Crescent moon motif (extruded shape lying flat on top)
  const moonShape = new THREE.Shape();
  // Drawn in 2D (x, y) which maps to (x, -z) after -PI/2 X rotation
  moonShape.moveTo(-0.08, 0.24);
  moonShape.quadraticCurveTo(-0.42, 0.02, -0.22, -0.22);
  moonShape.quadraticCurveTo(-0.02, -0.34, 0.22, -0.18);
  moonShape.quadraticCurveTo(-0.06, -0.16, -0.16, 0.02);
  moonShape.quadraticCurveTo(-0.20, 0.14, -0.08, 0.24);

  const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
    depth: MOTIF_H,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 24,
  });
  const moon = new THREE.Mesh(moonGeo, taupeMotifMat);
  moon.name = 'crescent_moon';
  moon.rotation.x = -Math.PI / 2;
  moon.position.y = MOTIF_Y;
  moon.castShadow = true;
  moon.receiveShadow = true;
  group.add(moon);

  // 6. Three tufted dots on the upper-right / right side
  const dots = [
    { name: 'dot_upper', x: 0.12, z: -0.22, r: 0.044 },
    { name: 'dot_middle', x: 0.06, z: -0.04, r: 0.048 },
    { name: 'dot_right', x: 0.27, z: 0.00, r: 0.048 },
  ];

  dots.forEach((d) => {
    const dotGeo = new THREE.CylinderGeometry(d.r * 0.94, d.r, MOTIF_H + 0.001, 24);
    const dot = new THREE.Mesh(dotGeo, taupeMotifMat);
    dot.name = d.name;
    dot.position.set(d.x, MOTIF_Y + (MOTIF_H + 0.001) / 2, d.z);
    dot.castShadow = true;
    dot.receiveShadow = true;
    group.add(dot);
  });

  return group;
}
