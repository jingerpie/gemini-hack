function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.095;          // Total height
  const R = 0.043;          // Outer radius of body
  const FOOT_R = 0.037;     // Foot radius at base
  const FOOT_H = 0.007;     // Height of unglazed stoneware foot
  const WALL = 0.005;       // Wall thickness
  const INNER_R = R - WALL;
  const BASE_THICK = 0.008; // Bottom thickness inside mug
  const HANDLE_W = 0.034;   // Handle protrusion from body
  const HANDLE_T = 0.0065;  // Handle tube radius

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xebe5d8,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });

  const stonewareMat = new THREE.MeshStandardMaterial({
    color: 0xc2af96,
    roughness: 0.85,
    metalness: 0.0,
  });

  const stampMat = new THREE.MeshStandardMaterial({
    color: 0xd6c8b4,
    roughness: 0.45,
    metalness: 0.0,
  });

  // 1. Unglazed stoneware foot
  const footPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(FOOT_R, 0),
    new THREE.Vector2(FOOT_R + 0.002, FOOT_H * 0.5),
    new THREE.Vector2(R - 0.001, FOOT_H),
    new THREE.Vector2(0, FOOT_H),
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, 32);
  const footMesh = new THREE.Mesh(footGeo, stonewareMat);
  footMesh.name = 'mug_foot';
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  group.add(footMesh);

  // 2. Glazed ceramic body (outer wall, rounded rim, inner cavity)
  const bodyPoints = [
    new THREE.Vector2(R - 0.001, FOOT_H),
    new THREE.Vector2(R, FOOT_H + 0.004),
    new THREE.Vector2(R, H - 0.003),
    new THREE.Vector2(R - 0.0015, H - 0.0005),
    new THREE.Vector2(R - WALL * 0.5, H),
    new THREE.Vector2(INNER_R + 0.0015, H - 0.0005),
    new THREE.Vector2(INNER_R, H - 0.003),
    new THREE.Vector2(INNER_R, BASE_THICK + 0.004),
    new THREE.Vector2(INNER_R - 0.004, BASE_THICK),
    new THREE.Vector2(0, BASE_THICK),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
  bodyMesh.name = 'mug_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 3. Curved handle on +X side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R - 0.003, H * 0.80, 0),
    new THREE.Vector3(R + HANDLE_W * 0.55, H * 0.85, 0),
    new THREE.Vector3(R + HANDLE_W, H * 0.62, 0),
    new THREE.Vector3(R + HANDLE_W * 0.82, H * 0.36, 0),
    new THREE.Vector3(R - 0.003, H * 0.19, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 28, HANDLE_T, 14, false);
  const handleMesh = new THREE.Mesh(handleGeo, glazeMat);
  handleMesh.name = 'mug_handle';
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  // 4. Thumb rest tab on top of handle
  const thumbGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.0045, 16);
  const thumbMesh = new THREE.Mesh(thumbGeo, glazeMat);
  thumbMesh.name = 'handle_thumb_rest';
  thumbMesh.position.set(R + HANDLE_W * 0.42, H * 0.89, 0);
  thumbMesh.scale.set(1.25, 1, 0.85);
  thumbMesh.castShadow = true;
  thumbMesh.receiveShadow = true;
  group.add(thumbMesh);

  // 5. Embossed floral band around lower body
  const FLOWER_COUNT = 12;
  const FLOWER_Y = FOOT_H + 0.013;
  const flowerGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.002, 10);
  flowerGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < FLOWER_COUNT; i++) {
    const angle = (i / FLOWER_COUNT) * Math.PI * 2;
    // Skip flower directly under handle attachment
    if (Math.abs(Math.sin(angle)) < 0.25 && Math.cos(angle) > 0.8) continue;

    const flowerMesh = new THREE.Mesh(flowerGeo, stampMat);
    flowerMesh.name = `floral_stamp_${i + 1}`;
    flowerMesh.position.set(
      Math.cos(angle) * (R - 0.0003),
      FLOWER_Y,
      Math.sin(angle) * (R - 0.0003)
    );
    flowerMesh.rotation.y = -angle + Math.PI / 2;
    flowerMesh.castShadow = true;
    flowerMesh.receiveShadow = true;
    group.add(flowerMesh);
  }

  return group;
}
