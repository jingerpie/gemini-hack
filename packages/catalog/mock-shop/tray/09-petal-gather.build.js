function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;        // Total width (X)
  const D = 0.28;        // Total depth (Z)
  const H = 0.032;       // Total height (Y)
  const BASE_H = 0.012;  // Thickness of the flat tray floor
  const RIM_W = 0.028;   // Width of the scalloped rim
  const SCALLOP_AMP = 0.008; // Outward bulge of each scallop
  const N_X = 11;        // Number of scallops along long edges
  const N_Z = 7;         // Number of scallops along short edges
  const SUN_R = 0.032;   // Radius of the carved sun circle
  const RAY_LEN = 0.026; // Length of sun rays
  const N_RAYS = 16;     // Number of sun rays

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a26,
    roughness: 0.48,
    metalness: 0.04,
  });

  const carvedWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2812,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Helper to create a rounded rectangle path
  function createRoundedRectPath(w, d, r) {
    const path = new THREE.Path();
    const hw = w / 2;
    const hd = d / 2;
    path.moveTo(-hw + r, -hd);
    path.lineTo(hw - r, -hd);
    path.quadraticCurveTo(hw, -hd, hw, -hd + r);
    path.lineTo(hw, hd - r);
    path.quadraticCurveTo(hw, hd, hw - r, hd);
    path.lineTo(-hw + r, hd);
    path.quadraticCurveTo(-hw, hd, -hw, hd - r);
    path.lineTo(-hw, -hd + r);
    path.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return path;
  }

  // 1. Flat tray base
  const baseW = W - RIM_W * 0.8;
  const baseD = D - RIM_W * 0.8;
  const baseShape = new THREE.Shape(createRoundedRectPath(baseW, baseD, 0.02).getPoints());
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: false,
    curveSegments: 16,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, woodMat);
  baseMesh.name = 'tray_base';
  baseMesh.position.y = 0;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Scalloped outer rim
  const rimShape = new THREE.Shape();
  const hw = W / 2 - SCALLOP_AMP;
  const hd = D / 2 - SCALLOP_AMP;
  const cornerR = 0.018;

  // Start at top-left after corner
  rimShape.moveTo(-hw + cornerR, hd);

  // Top edge (+Y in 2D -> -Z in 3D)
  const stepX = (2 * (hw - cornerR)) / N_X;
  for (let i = 0; i < N_X; i++) {
    const x0 = -hw + cornerR + i * stepX;
    const x1 = x0 + stepX;
    const xm = (x0 + x1) / 2;
    rimShape.quadraticCurveTo(xm, hd + SCALLOP_AMP * 1.6, x1, hd);
  }

  // Top-right corner
  rimShape.quadraticCurveTo(hw + SCALLOP_AMP, hd + SCALLOP_AMP, hw, hd - cornerR);

  // Right edge (+X)
  const stepZ = (2 * (hd - cornerR)) / N_Z;
  for (let i = 0; i < N_Z; i++) {
    const y0 = hd - cornerR - i * stepZ;
    const y1 = y0 - stepZ;
    const ym = (y0 + y1) / 2;
    rimShape.quadraticCurveTo(hw + SCALLOP_AMP * 1.6, ym, hw, y1);
  }

  // Bottom-right corner
  rimShape.quadraticCurveTo(hw + SCALLOP_AMP, -hd - SCALLOP_AMP, hw - cornerR, -hd);

  // Bottom edge (-Y in 2D -> +Z in 3D)
  for (let i = 0; i < N_X; i++) {
    const x0 = hw - cornerR - i * stepX;
    const x1 = x0 - stepX;
    const xm = (x0 + x1) / 2;
    rimShape.quadraticCurveTo(xm, -hd - SCALLOP_AMP * 1.6, x1, -hd);
  }

  // Bottom-left corner
  rimShape.quadraticCurveTo(-hw - SCALLOP_AMP, -hd - SCALLOP_AMP, -hw, -hd + cornerR);

  // Left edge (-X)
  for (let i = 0; i < N_Z; i++) {
    const y0 = -hd + cornerR + i * stepZ;
    const y1 = y0 + stepZ;
    const ym = (y0 + y1) / 2;
    rimShape.quadraticCurveTo(-hw - SCALLOP_AMP * 1.6, ym, -hw, y1);
  }

  // Top-left corner
  rimShape.quadraticCurveTo(-hw - SCALLOP_AMP, hd + SCALLOP_AMP, -hw + cornerR, hd);

  // Inner cutout hole
  const innerW = W - RIM_W * 2;
  const innerD = D - RIM_W * 2;
  rimShape.holes.push(createRoundedRectPath(innerW, innerD, 0.016));

  const bevelSize = 0.004;
  const rimDepth = H - BASE_H * 0.5 - bevelSize * 2;
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: rimDepth,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments: 3,
    curveSegments: 12,
  });
  rimGeo.rotateX(-Math.PI / 2);

  const rimMesh = new THREE.Mesh(rimGeo, woodMat);
  rimMesh.name = 'tray_rim';
  rimMesh.position.y = BASE_H * 0.5 + bevelSize;
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 3. Carved sun motif in center
  const sunRingGeo = new THREE.TorusGeometry(SUN_R, 0.0014, 8, 32);
  sunRingGeo.rotateX(Math.PI / 2);
  const sunRing = new THREE.Mesh(sunRingGeo, carvedWoodMat);
  sunRing.name = 'sun_center_ring';
  sunRing.position.y = BASE_H;
  sunRing.castShadow = true;
  sunRing.receiveShadow = true;
  group.add(sunRing);

  // Wavy sun rays
  for (let i = 0; i < N_RAYS; i++) {
    const angle = (i / N_RAYS) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpX = -sin;
    const perpZ = cos;

    const rStart = SUN_R + 0.003;
    const rMid1 = rStart + RAY_LEN * 0.33;
    const rMid2 = rStart + RAY_LEN * 0.66;
    const rEnd = rStart + RAY_LEN;
    const wave = 0.0035;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cos * rStart, BASE_H, sin * rStart),
      new THREE.Vector3(cos * rMid1 + perpX * wave, BASE_H, sin * rMid1 + perpZ * wave),
      new THREE.Vector3(cos * rMid2 - perpX * wave, BASE_H, sin * rMid2 - perpZ * wave),
      new THREE.Vector3(cos * rEnd, BASE_H, sin * rEnd),
    ]);

    const rayGeo = new THREE.TubeGeometry(curve, 10, 0.0011, 6, false);
    const rayMesh = new THREE.Mesh(rayGeo, carvedWoodMat);
    rayMesh.name = `sun_ray_${i + 1}`;
    rayMesh.castShadow = true;
    rayMesh.receiveShadow = true;
    group.add(rayMesh);
  }

  return group;
}
