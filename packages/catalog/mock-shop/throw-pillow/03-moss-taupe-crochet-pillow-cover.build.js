function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.46;
  const H = 0.46;
  const D = 0.16;
  const BEVEL = 0.05;
  const CORE_W = W - 2 * BEVEL;
  const CORE_H = H - 2 * BEVEL;
  const CORE_D = D - 2 * BEVEL;
  const CORNER_R = 0.04;

  // Materials
  const yarnMat = new THREE.MeshStandardMaterial({
    color: 0x978d7e, // Moss taupe
    roughness: 0.92,
    metalness: 0.0,
  });

  const yarnDarkMat = new THREE.MeshStandardMaterial({
    color: 0x857b6d, // Slightly deeper taupe for stitch contrast
    roughness: 0.94,
    metalness: 0.0,
  });

  // 1. Plump pillow core using rounded ExtrudeGeometry
  const shape = new THREE.Shape();
  const hw = CORE_W / 2;
  const hh = CORE_H / 2;
  shape.moveTo(-hw + CORNER_R, -hh);
  shape.lineTo(hw - CORNER_R, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + CORNER_R);
  shape.lineTo(hw, hh - CORNER_R);
  shape.quadraticCurveTo(hw, hh, hw - CORNER_R, hh);
  shape.lineTo(-hw + CORNER_R, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - CORNER_R);
  shape.lineTo(-hw, -hh + CORNER_R);
  shape.quadraticCurveTo(-hw, -hh, -hw + CORNER_R, -hh);

  const coreGeo = new THREE.ExtrudeGeometry(shape, {
    depth: CORE_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 10,
  });
  coreGeo.translate(0, 0, -CORE_D / 2);

  const coreMesh = new THREE.Mesh(coreGeo, yarnMat);
  coreMesh.name = 'pillow_core';
  coreMesh.position.set(0, H / 2, 0);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // 2. Chunky crochet stitch rows on the front (+Z) face
  const ROW_COUNT = 8;
  const STRAND_RADIUS = 0.012;
  const FRONT_Z = D / 2 - 0.006;

  for (let r = 0; r < ROW_COUNT; r++) {
    const t = (r + 0.5) / ROW_COUNT;
    const yBase = H * (0.12 + 0.76 * t);
    const pts = [];
    const segs = 12;

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = (u - 0.5) * (W - 0.09);
      // Slight wave to mimic chunky crochet loops
      const waveY = Math.sin(u * Math.PI * 6 + r * Math.PI * 0.5) * 0.008;
      // Follow the pillow's front curvature
      const edgeTaper = Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.018;
      const z = FRONT_Z - edgeTaper + Math.cos(u * Math.PI * 6 + r * 0.8) * 0.004;
      pts.push(new THREE.Vector3(x, yBase + waveY, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, STRAND_RADIUS, 8, false);
    const strandMesh = new THREE.Mesh(tubeGeo, r % 2 === 0 ? yarnDarkMat : yarnMat);
    strandMesh.name = `crochet_row_${r + 1}`;
    strandMesh.castShadow = true;
    strandMesh.receiveShadow = true;
    group.add(strandMesh);
  }

  return group;
}
