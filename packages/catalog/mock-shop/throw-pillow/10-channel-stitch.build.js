function build(THREE) {
  const group = new THREE.Group();

  const W = 0.56;
  const H = 0.36;
  const D = 0.14;
  const BEVEL_SIZE = 0.045;
  const BEVEL_THICKNESS = D * 0.42;
  const CORE_DEPTH = D - 2 * BEVEL_THICKNESS;
  const STITCH_COUNT = 9;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc8b8a4,
    roughness: 0.9,
    metalness: 0.0
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0xa69580,
    roughness: 0.95,
    metalness: 0.0
  });

  // Single rounded rectangular lumbar cushion body
  const shapeW = W - 2 * BEVEL_SIZE;
  const shapeH = H - 2 * BEVEL_SIZE;
  const cornerR = 0.02;
  const hw = shapeW * 0.5;
  const hh = shapeH * 0.5;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + cornerR, -hh);
  shape.lineTo(hw - cornerR, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cornerR);
  shape.lineTo(hw, hh - cornerR);
  shape.quadraticCurveTo(hw, hh, hw - cornerR, hh);
  shape.lineTo(-hw + cornerR, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cornerR);
  shape.lineTo(-hw, -hh + cornerR);
  shape.quadraticCurveTo(-hw, -hh, -hw + cornerR, -hh);

  const cushionGeo = new THREE.ExtrudeGeometry(shape, {
    depth: CORE_DEPTH,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: BEVEL_SIZE,
    bevelThickness: BEVEL_THICKNESS,
    curveSegments: 12
  });

  const cushion = new THREE.Mesh(cushionGeo, fabricMat);
  cushion.name = 'lumbar_cushion_body';
  cushion.position.set(0, H * 0.5, -CORE_DEPTH * 0.5);
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  group.add(cushion);

  // Horizontal channel-stitched groove lines on the front face
  const stitchStartY = BEVEL_SIZE + 0.015;
  const stitchEndY = H - BEVEL_SIZE - 0.015;
  const stitchStepY = (stitchEndY - stitchStartY) / (STITCH_COUNT - 1);
  const stitchLen = shapeW;
  const stitchGeo = new THREE.BoxGeometry(stitchLen, 0.003, 0.002);

  for (let i = 0; i < STITCH_COUNT; i++) {
    const y = stitchStartY + i * stitchStepY;
    const stitch = new THREE.Mesh(stitchGeo, stitchMat);
    stitch.name = `channel_stitch_${i + 1}`;
    stitch.position.set(0, y, D * 0.5);
    stitch.castShadow = true;
    stitch.receiveShadow = true;
    group.add(stitch);
  }

  return group;
}
