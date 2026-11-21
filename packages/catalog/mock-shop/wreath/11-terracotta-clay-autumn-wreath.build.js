function build(THREE) {
  const OUTER_R = 0.25;
  const RING_R = 0.175;
  const TUBE_R = 0.032;
  const DEPTH = 0.085;

  const group = new THREE.Group();
  const wreath = new THREE.Group();
  group.add(wreath);

  // Materials
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb87352,
    roughness: 0.82,
    metalness: 0.02,
  });

  const terracottaLightMat = new THREE.MeshStandardMaterial({
    color: 0xc98463,
    roughness: 0.78,
    metalness: 0.02,
  });

  const sageMat = new THREE.MeshStandardMaterial({
    color: 0x6e7863,
    roughness: 0.85,
    metalness: 0.02,
  });

  const darkSlateMat = new THREE.MeshStandardMaterial({
    color: 0x3a3f45,
    roughness: 0.72,
    metalness: 0.05,
  });

  // Base torus ring (flattened on back)
  const ringGeo = new THREE.TorusGeometry(RING_R, TUBE_R, 14, 32);
  const ringMesh = new THREE.Mesh(ringGeo, terracottaMat);
  ringMesh.scale.set(1, 1, 0.45);
  ringMesh.position.z = -DEPTH * 0.28;
  ringMesh.name = 'wreath_base_ring';
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  wreath.add(ringMesh);

  // Oak leaf shape
  const leafLen = 0.125;
  const leafWid = 0.068;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(leafWid * 0.25, leafLen * 0.12, leafWid * 0.45, leafLen * 0.22);
  leafShape.quadraticCurveTo(leafWid * 0.2, leafLen * 0.30, leafWid * 0.65, leafLen * 0.42);
  leafShape.quadraticCurveTo(leafWid * 0.25, leafLen * 0.52, leafWid * 0.72, leafLen * 0.66);
  leafShape.quadraticCurveTo(leafWid * 0.28, leafLen * 0.76, leafWid * 0.42, leafLen * 0.88);
  leafShape.quadraticCurveTo(leafWid * 0.15, leafLen * 0.95, 0, leafLen);
  leafShape.quadraticCurveTo(-leafWid * 0.15, leafLen * 0.95, -leafWid * 0.42, leafLen * 0.88);
  leafShape.quadraticCurveTo(-leafWid * 0.28, leafLen * 0.76, -leafWid * 0.72, leafLen * 0.66);
  leafShape.quadraticCurveTo(-leafWid * 0.25, leafLen * 0.52, -leafWid * 0.65, leafLen * 0.42);
  leafShape.quadraticCurveTo(-leafWid * 0.2, leafLen * 0.30, -leafWid * 0.45, leafLen * 0.22);
  leafShape.quadraticCurveTo(-leafWid * 0.25, leafLen * 0.12, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.007,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 2,
  });

  // 16 overlapping oak leaves around the ring
  const leafCount = 16;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const radialOffset = (i % 2 === 0 ? 1 : -1) * 0.012;
    const r = RING_R + radialOffset;
    const mat = i % 3 === 0 ? terracottaLightMat : terracottaMat;
    const leaf = new THREE.Mesh(leafGeo, mat);
    leaf.name = `oak_leaf_${i + 1}`;
    leaf.position.set(
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      -0.012 + (i % 3) * 0.006
    );
    // Point tangent to the ring with slight outward tilt
    leaf.rotation.z = angle - Math.PI * 0.15 + (i % 2 === 0 ? 0.25 : -0.2);
    leaf.rotation.x = 0.22 * Math.sin(i * 1.7);
    leaf.rotation.y = 0.18 * Math.cos(i * 2.1);
    const s = 0.92 + (i % 3) * 0.06;
    leaf.scale.set(s, s, 1);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    wreath.add(leaf);
  }

  // 3 small terracotta pumpkins
  const pumpkinGeo = new THREE.SphereGeometry(0.028, 16, 12);
  const pumpkinAngles = [0.55, 2.95, 5.45];
  for (let i = 0; i < pumpkinAngles.length; i++) {
    const a = pumpkinAngles[i];
    const pumpkin = new THREE.Mesh(pumpkinGeo, terracottaLightMat);
    pumpkin.name = `terracotta_pumpkin_${i + 1}`;
    pumpkin.scale.set(1.05, 1.05, 0.72);
    pumpkin.position.set(
      Math.cos(a) * (RING_R + 0.008),
      Math.sin(a) * (RING_R + 0.008),
      0.014
    );
    pumpkin.rotation.z = a;
    pumpkin.castShadow = true;
    pumpkin.receiveShadow = true;
    wreath.add(pumpkin);
  }

  // 4 acorns (nut + cap = 8 meshes)
  const acornNutGeo = new THREE.SphereGeometry(0.014, 12, 10);
  const acornCapGeo = new THREE.SphereGeometry(0.0155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const acornAngles = [1.35, 2.35, 4.15, 5.95];
  for (let i = 0; i < acornAngles.length; i++) {
    const a = acornAngles[i];
    const acornGroup = new THREE.Group();
    acornGroup.position.set(
      Math.cos(a) * (RING_R + 0.005),
      Math.sin(a) * (RING_R + 0.005),
      0.016
    );
    acornGroup.rotation.z = a + Math.PI * 0.35;
    acornGroup.rotation.x = 0.35;

    const nut = new THREE.Mesh(acornNutGeo, terracottaLightMat);
    nut.name = `acorn_nut_${i + 1}`;
    nut.scale.set(0.85, 1.35, 0.85);
    nut.castShadow = true;
    nut.receiveShadow = true;
    acornGroup.add(nut);

    const cap = new THREE.Mesh(acornCapGeo, sageMat);
    cap.name = `acorn_cap_${i + 1}`;
    cap.position.y = 0.006;
    cap.castShadow = true;
    cap.receiveShadow = true;
    acornGroup.add(cap);

    wreath.add(acornGroup);
  }

  // 6 decorative berries (sage and dark slate)
  const berryGeo = new THREE.SphereGeometry(0.01, 10, 8);
  const berryAngles = [0.2, 1.05, 1.9, 3.45, 4.75, 5.15];
  for (let i = 0; i < berryAngles.length; i++) {
    const a = berryAngles[i];
    const mat = i % 2 === 0 ? sageMat : darkSlateMat;
    const berry = new THREE.Mesh(berryGeo, mat);
    berry.name = `decorative_berry_${i + 1}`;
    const r = RING_R + (i % 2 === 0 ? 0.022 : -0.018);
    berry.position.set(
      Math.cos(a) * r,
      Math.sin(a) * r,
      0.018
    );
    berry.castShadow = true;
    berry.receiveShadow = true;
    wreath.add(berry);
  }

  // Align origin to bottom-center (y = 0, centered on x = 0 and z = 0)
  const box = new THREE.Box3().setFromObject(wreath);
  const center = new THREE.Vector3();
  box.getCenter(center);
  wreath.position.set(-center.x, -box.min.y, -center.z);

  return group;
}
