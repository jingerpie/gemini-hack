function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.6;
  const H = 1.8;
  const D = 0.04;
  const CLIP_W = 0.036;
  const CLIP_H = 0.06;
  const CLIP_D = 0.02;
  const TOP_Y = H - CLIP_H * 0.5;
  const SWAG_DIP = 0.08;
  const WIRE_R = 0.004;
  const STRAND_COUNT = 7;
  const STRAND_SPAN = 1.08;
  const STRAND_BOT_Y = 0.28;
  const BULBS_PER_STRAND = 3;
  const BULB_R = 0.012;

  const ADAPTER_W = 0.11;
  const ADAPTER_H = 0.05;
  const ADAPTER_D = 0.036;
  const PUCK_R = 0.042;
  const PUCK_H = 0.024;

  // Materials
  const wireMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8dee6,
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    clearcoat: 0.6,
  });

  const clipMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6ecf2,
    roughness: 0.2,
    metalness: 0.05,
    transparent: true,
    opacity: 0.75,
  });

  const whitePlasticMat = new THREE.MeshStandardMaterial({
    color: 0xf0f2f5,
    roughness: 0.35,
    metalness: 0.05,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffe066,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  const addMesh = (mesh, name) => {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Helper for catenary-like swag height
  const getSwagY = (x) => {
    const t = x / (W * 0.5);
    return TOP_Y - SWAG_DIP * (1 - t * t);
  };

  // Top horizontal swag wire
  const swagPoints = [];
  const swagSegments = 16;
  for (let i = 0; i <= swagSegments; i++) {
    const x = -W * 0.5 + (W * i) / swagSegments;
    swagPoints.push(new THREE.Vector3(x, getSwagY(x), 0));
  }
  const swagCurve = new THREE.CatmullRomCurve3(swagPoints);
  const swagGeo = new THREE.TubeGeometry(swagCurve, 24, WIRE_R, 8, false);
  addMesh(new THREE.Mesh(swagGeo, wireMat), "top_swag_wire");

  // Wall mounting clips
  const clipGeo = new THREE.BoxGeometry(CLIP_W, CLIP_H, CLIP_D);
  const clipLeft = new THREE.Mesh(clipGeo, clipMat);
  clipLeft.position.set(-W * 0.5, TOP_Y, -D * 0.5 + CLIP_D * 0.5);
  addMesh(clipLeft, "wall_clip_left");

  const clipRight = new THREE.Mesh(clipGeo, clipMat);
  clipRight.position.set(W * 0.5, TOP_Y, -D * 0.5 + CLIP_D * 0.5);
  addMesh(clipRight, "wall_clip_right");

  // Vertical curtain strands and emit_ bulbs
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 12, 10);
  for (let i = 0; i < STRAND_COUNT; i++) {
    const x = -STRAND_SPAN * 0.5 + (STRAND_SPAN * i) / (STRAND_COUNT - 1);
    const topY = getSwagY(x);
    const strandH = topY - STRAND_BOT_Y;

    const strandGeo = new THREE.CylinderGeometry(WIRE_R * 0.75, WIRE_R * 0.75, strandH, 8);
    const strandMesh = new THREE.Mesh(strandGeo, wireMat);
    strandMesh.position.set(x, STRAND_BOT_Y + strandH * 0.5, 0);
    addMesh(strandMesh, `drop_wire_${i + 1}`);

    for (let j = 0; j < BULBS_PER_STRAND; j++) {
      const frac = j / (BULBS_PER_STRAND - 1);
      const bulbY = STRAND_BOT_Y + 0.04 + frac * (strandH - 0.14);
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      const sideOffset = j % 2 === 0 ? 0.01 : -0.01;
      bulbMesh.position.set(x + sideOffset, bulbY, BULB_R * 0.6);
      addMesh(bulbMesh, `emit_bulb_${i + 1}_${j + 1}`);
    }
  }

  // Left power cord from left clip down to power adapter
  const leftCordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.5, TOP_Y, 0),
    new THREE.Vector3(-W * 0.5 - 0.02, TOP_Y * 0.65, 0),
    new THREE.Vector3(-W * 0.5 - 0.01, 0.25, 0),
    new THREE.Vector3(-W * 0.35, ADAPTER_H * 0.5, 0),
    new THREE.Vector3(-0.12, ADAPTER_H * 0.5, 0),
  ]);
  const leftCordGeo = new THREE.TubeGeometry(leftCordCurve, 24, WIRE_R, 8, false);
  addMesh(new THREE.Mesh(leftCordGeo, wireMat), "power_cord_left");

  // Right cord from right clip down to controller puck
  const rightCordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W * 0.5, TOP_Y, 0),
    new THREE.Vector3(W * 0.5 + 0.02, TOP_Y * 0.65, 0),
    new THREE.Vector3(W * 0.5 + 0.01, 0.25, 0),
    new THREE.Vector3(W * 0.38, PUCK_H * 0.5, 0),
    new THREE.Vector3(0.22, PUCK_H * 0.5, 0),
  ]);
  const rightCordGeo = new THREE.TubeGeometry(rightCordCurve, 24, WIRE_R, 8, false);
  addMesh(new THREE.Mesh(rightCordGeo, wireMat), "power_cord_right");

  // Power adapter at bottom
  const adapterGeo = new THREE.BoxGeometry(ADAPTER_W, ADAPTER_H, ADAPTER_D);
  const adapterMesh = new THREE.Mesh(adapterGeo, whitePlasticMat);
  adapterMesh.position.set(-0.07, ADAPTER_H * 0.5, 0);
  addMesh(adapterMesh, "power_adapter");

  // Controller puck at bottom
  const puckGeo = new THREE.CylinderGeometry(PUCK_R, PUCK_R, PUCK_H, 24);
  const puckMesh = new THREE.Mesh(puckGeo, whitePlasticMat);
  puckMesh.rotation.x = Math.PI * 0.5;
  puckMesh.position.set(0.18, PUCK_R, 0);
  addMesh(puckMesh, "controller_puck");

  return group;
}
