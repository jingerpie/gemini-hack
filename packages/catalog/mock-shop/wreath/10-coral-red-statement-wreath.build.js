function build(THREE) {
  const group = new THREE.Group();

  const W = 0.60;
  const H = 0.60;
  const D = 0.14;
  const RING_R = 0.19;
  const TUBE_R = 0.045;
  const CENTER_Y = H / 2;
  const BACK_Z = -D / 2;

  const matBase = new THREE.MeshStandardMaterial({
    color: 0xb84233,
    roughness: 0.85,
    metalness: 0.02,
  });

  const matCup = new THREE.MeshStandardMaterial({
    color: 0xc94a38,
    roughness: 0.78,
    metalness: 0.02,
  });

  const matFan = new THREE.MeshStandardMaterial({
    color: 0xd66352,
    roughness: 0.82,
    metalness: 0.02,
  });

  // 1. Base wreath ring
  const baseGeo = new THREE.TorusGeometry(RING_R, TUBE_R, 16, 32);
  const baseMesh = new THREE.Mesh(baseGeo, matBase);
  baseMesh.name = 'wreath_base_ring';
  baseMesh.scale.set(1, 1, 0.7);
  baseMesh.position.set(0, CENTER_Y, BACK_Z + TUBE_R * 0.7);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Coral trumpet/cup pods (12 meshes)
  const cupPoints = [
    new THREE.Vector2(0.004, 0.0),
    new THREE.Vector2(0.007, 0.015),
    new THREE.Vector2(0.014, 0.032),
    new THREE.Vector2(0.022, 0.045),
    new THREE.Vector2(0.019, 0.045),
    new THREE.Vector2(0.006, 0.020),
    new THREE.Vector2(0.0, 0.015),
  ];
  const cupGeo = new THREE.LatheGeometry(cupPoints, 16);

  const cupCount = 12;
  for (let i = 0; i < cupCount; i++) {
    const angle = (i / cupCount) * Math.PI * 2 + 0.25;
    const radialOffset = RING_R + Math.sin(i * 2.3) * 0.025;
    const x = Math.cos(angle) * radialOffset;
    const y = CENTER_Y + Math.sin(angle) * radialOffset;
    const z = BACK_Z + TUBE_R * 0.9 + (i % 3) * 0.012;

    const cup = new THREE.Mesh(cupGeo, matCup);
    cup.name = `coral_cup_${i + 1}`;
    const s = 0.85 + (i % 3) * 0.15;
    cup.scale.set(s, s, s);
    cup.position.set(x, y, z);

    // Orient cup outward and toward +Z
    cup.rotation.x = Math.PI / 2 + Math.sin(angle) * 0.35;
    cup.rotation.z = -angle + Math.PI / 2;
    cup.rotation.y = Math.cos(i * 1.7) * 0.3;

    cup.castShadow = true;
    cup.receiveShadow = true;
    group.add(cup);
  }

  // 3. Coral sea-fan elements (10 meshes)
  const fanShape = new THREE.Shape();
  fanShape.moveTo(0, 0);
  fanShape.quadraticCurveTo(0.035, 0.025, 0.045, 0.055);
  fanShape.quadraticCurveTo(0.022, 0.072, 0.0, 0.068);
  fanShape.quadraticCurveTo(-0.022, 0.072, -0.045, 0.055);
  fanShape.quadraticCurveTo(-0.035, 0.025, 0, 0);

  const fanGeo = new THREE.ExtrudeGeometry(fanShape, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 10,
  });

  const fanCount = 10;
  for (let i = 0; i < fanCount; i++) {
    const angle = (i / fanCount) * Math.PI * 2 + 0.55;
    const radialOffset = RING_R + Math.cos(i * 1.9) * 0.028;
    const x = Math.cos(angle) * radialOffset;
    const y = CENTER_Y + Math.sin(angle) * radialOffset;
    const z = BACK_Z + TUBE_R * 0.85 + (i % 2) * 0.015;

    const fan = new THREE.Mesh(fanGeo, matFan);
    fan.name = `coral_fan_${i + 1}`;
    const s = 0.8 + (i % 3) * 0.14;
    fan.scale.set(s, s, s);
    fan.position.set(x, y, z);

    fan.rotation.z = angle - Math.PI / 2 + Math.sin(i * 2.1) * 0.3;
    fan.rotation.x = 0.45 + (i % 3) * 0.15;
    fan.rotation.y = Math.cos(i * 1.3) * 0.25;

    fan.castShadow = true;
    fan.receiveShadow = true;
    group.add(fan);
  }

  // 4. Branching coral twigs (12 meshes)
  const branchCount = 12;
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2;
    const r0 = RING_R - 0.01;
    const r1 = RING_R + 0.045;
    const r2 = RING_R + 0.085;
    const r3 = RING_R + 0.105;

    const spread = (i % 2 === 0 ? 1 : -1) * 0.22;
    const p0 = new THREE.Vector3(
      Math.cos(angle) * r0,
      CENTER_Y + Math.sin(angle) * r0,
      BACK_Z + TUBE_R * 0.7
    );
    const p1 = new THREE.Vector3(
      Math.cos(angle + spread * 0.3) * r1,
      CENTER_Y + Math.sin(angle + spread * 0.3) * r1,
      BACK_Z + TUBE_R * 1.1
    );
    const p2 = new THREE.Vector3(
      Math.cos(angle + spread * 0.7) * r2,
      CENTER_Y + Math.sin(angle + spread * 0.7) * r2,
      BACK_Z + TUBE_R * 1.35
    );
    const p3 = new THREE.Vector3(
      Math.cos(angle + spread) * r3,
      CENTER_Y + Math.sin(angle + spread) * r3,
      BACK_Z + TUBE_R * 1.15
    );

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const branchGeo = new THREE.TubeGeometry(curve, 12, 0.0075, 8, false);
    const branch = new THREE.Mesh(branchGeo, matBase);
    branch.name = `coral_branch_${i + 1}`;
    branch.castShadow = true;
    branch.receiveShadow = true;
    group.add(branch);
  }

  return group;
}
