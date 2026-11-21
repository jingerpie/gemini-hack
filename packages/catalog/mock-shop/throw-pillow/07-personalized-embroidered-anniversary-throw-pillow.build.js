function build(THREE) {
  'use strict';
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const H = 0.44;
  const D = 0.14;
  const WREATH_R = 0.125;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xdfc5ba,
    roughness: 0.9,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xd4b6aa,
    roughness: 0.85,
    metalness: 0.0
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x6b4c35,
    roughness: 0.8,
    metalness: 0.0
  });

  const darkBrownMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c24,
    roughness: 0.82,
    metalness: 0.0
  });

  const goldTanMat = new THREE.MeshStandardMaterial({
    color: 0xb8925a,
    roughness: 0.78,
    metalness: 0.0
  });

  const taupeMat = new THREE.MeshStandardMaterial({
    color: 0x8e8071,
    roughness: 0.82,
    metalness: 0.0
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5f2eb,
    roughness: 0.75,
    metalness: 0.0
  });

  // 1. Pillow body (single soft rounded cushion with pinched square corners)
  const bodyGeo = new THREE.SphereGeometry(1, 32, 24);
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const sx = x * (1 + 0.24 * y * y) * (W * 0.44);
    const sy = y * (1 + 0.24 * x * x) * (H * 0.44);
    const edgePinch = 1 - 0.18 * (x * x + y * y);
    const sz = z * Math.max(0.2, edgePinch) * (D * 0.5);

    pos.setXYZ(i, sx, sy, sz);
  }
  bodyGeo.computeVertexNormals();
  bodyGeo.computeBoundingBox();
  const minY = bodyGeo.boundingBox.min.y;
  const centerY = -minY;
  bodyGeo.translate(0, centerY, 0);

  const pillowBody = new THREE.Mesh(bodyGeo, fabricMat);
  pillowBody.name = 'pillow_body';
  pillowBody.castShadow = true;
  pillowBody.receiveShadow = true;
  group.add(pillowBody);

  // 2. Subtle perimeter piping seam
  const pipingPoints = [];
  const pipeSteps = 32;
  for (let i = 0; i < pipeSteps; i++) {
    const a = (i / pipeSteps) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    const px = cx * (1 + 0.24 * cy * cy) * (W * 0.44);
    const py = cy * (1 + 0.24 * cx * cx) * (H * 0.44) + centerY;
    pipingPoints.push(new THREE.Vector3(px, py, 0));
  }
  const pipingCurve = new THREE.CatmullRomCurve3(pipingPoints, true);
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 32, 0.004, 8, true);
  const pillowPiping = new THREE.Mesh(pipingGeo, pipingMat);
  pillowPiping.name = 'pillow_piping';
  pillowPiping.castShadow = true;
  pillowPiping.receiveShadow = true;
  group.add(pillowPiping);

  // Helper to get front surface Z at (x, y)
  function frontZ(x, y) {
    const nx = x / (W * 0.44);
    const ny = (y - centerY) / (H * 0.44);
    const r2 = Math.min(0.95, nx * nx + ny * ny);
    const zBase = Math.sqrt(1 - r2) * (D * 0.5);
    return zBase * (1 - 0.18 * r2);
  }

  // 3. Embroidered wreath stem ring lying on front face
  const stemPoints = [];
  const stemSteps = 32;
  for (let i = 0; i < stemSteps; i++) {
    const a = (i / stemSteps) * Math.PI * 2;
    const sx = Math.cos(a) * WREATH_R;
    const sy = centerY + Math.sin(a) * WREATH_R;
    stemPoints.push(new THREE.Vector3(sx, sy, frontZ(sx, sy) + 0.0015));
  }
  const stemCurve = new THREE.CatmullRomCurve3(stemPoints, true);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 32, 0.0018, 6, true);
  const wreathStem = new THREE.Mesh(stemGeo, stemMat);
  wreathStem.name = 'wreath_stem';
  wreathStem.castShadow = true;
  wreathStem.receiveShadow = true;
  group.add(wreathStem);

  // 4. Embroidered leaves & buds lying flat on the front curve
  const leafGeo = new THREE.SphereGeometry(1, 10, 8);
  leafGeo.scale(0.016, 0.0075, 0.002);

  const leafConfigs = [
    { angle: 0.15, mat: taupeMat, out: 1 },
    { angle: 0.85, mat: darkBrownMat, out: -1 },
    { angle: 1.35, mat: goldTanMat, out: 1 },
    { angle: 1.9, mat: whiteMat, out: 1 },
    { angle: 2.35, mat: darkBrownMat, out: -1 },
    { angle: 2.85, mat: taupeMat, out: 1 },
    { angle: 3.3, mat: goldTanMat, out: -1 },
    { angle: 4.15, mat: darkBrownMat, out: 1 },
    { angle: 4.75, mat: whiteMat, out: -1 },
    { angle: 5.25, mat: goldTanMat, out: 1 },
    { angle: 5.75, mat: darkBrownMat, out: -1 }
  ];

  leafConfigs.forEach((cfg, idx) => {
    const lx = Math.cos(cfg.angle) * (WREATH_R + cfg.out * 0.013);
    const ly = centerY + Math.sin(cfg.angle) * (WREATH_R + cfg.out * 0.013);
    const lz = frontZ(lx, ly) + 0.002;

    const leaf = new THREE.Mesh(leafGeo, cfg.mat);
    leaf.name = 'wreath_leaf_' + (idx + 1);
    leaf.position.set(lx, ly, lz);
    leaf.rotation.z = cfg.angle + (cfg.out > 0 ? 0.55 : -0.55);
    leaf.rotation.y = -lx * 1.4;
    leaf.rotation.x = (ly - centerY) * 1.4;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  });

  // 5. Two embroidered flowers (top-right and bottom-left)
  const flowerAngles = [0.55, 3.68];
  const flowerNames = ['top_right', 'bottom_left'];
  const petalRingGeo = new THREE.TorusGeometry(0.012, 0.0055, 8, 16);
  petalRingGeo.scale(1, 1, 0.35);
  const centerGeo = new THREE.SphereGeometry(0.006, 10, 8);
  centerGeo.scale(1, 1, 0.35);

  flowerAngles.forEach((ang, idx) => {
    const fx = Math.cos(ang) * WREATH_R;
    const fy = centerY + Math.sin(ang) * WREATH_R;
    const fz = frontZ(fx, fy) + 0.0025;

    const petals = new THREE.Mesh(petalRingGeo, darkBrownMat);
    petals.name = 'flower_' + flowerNames[idx] + '_petals';
    petals.position.set(fx, fy, fz);
    petals.rotation.y = -fx * 1.4;
    petals.rotation.x = (fy - centerY) * 1.4;
    petals.castShadow = true;
    petals.receiveShadow = true;
    group.add(petals);

    const center = new THREE.Mesh(centerGeo, whiteMat);
    center.name = 'flower_' + flowerNames[idx] + '_center';
    center.position.set(fx, fy, fz + 0.0015);
    center.rotation.y = -fx * 1.4;
    center.rotation.x = (fy - centerY) * 1.4;
    center.castShadow = true;
    center.receiveShadow = true;
    group.add(center);
  });

  return group;
}
