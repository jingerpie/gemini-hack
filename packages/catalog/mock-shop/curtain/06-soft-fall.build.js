function build(THREE) {
  const group = new THREE.Group();

  // Named dimensions (meters)
  const H = 2.40; // Overall height = 240 cm
  const CURTAIN_W = 1.40;
  const ROD_W = 1.90;
  const ROD_R = 0.009;
  const CAP_R = ROD_R * 1.35;
  const CAP_LEN = 0.016;
  const RING_R = 0.014;
  const RING_TUBE = 0.0025;
  const HOOK_H = 0.022;
  const HOOK_R = 0.0018;

  const WAVE_COUNT = 10;
  const WAVE_AMP = 0.028;
  const FABRIC_THICK = 0.007;
  const HEM_H = 0.075;
  const HEADER_H = 0.11;

  const ROD_Y = H - CAP_R;
  const CURTAIN_TOP_Y = ROD_Y - RING_R - HOOK_H + 0.008;
  const CURTAIN_BODY_H = CURTAIN_TOP_Y - HEM_H - HEADER_H;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a869,
    roughness: 0.35,
    metalness: 0.78
  });

  const sheerFabricMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6d6b8,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide
  });

  const trimFabricMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2a875,
    roughness: 0.82,
    metalness: 0.0,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide
  });

  // Build wavy ribbon shape in X-Y (extruded along Z, then rotated to stand along +Y)
  const samples = 80;
  const waveShape = new THREE.Shape();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -CURTAIN_W / 2 + t * CURTAIN_W;
    const z = WAVE_AMP * Math.cos(t * WAVE_COUNT * Math.PI * 2);
    if (i === 0) {
      waveShape.moveTo(x, z);
    } else {
      waveShape.lineTo(x, z);
    }
  }
  for (let i = samples; i >= 0; i--) {
    const t = i / samples;
    const x = -CURTAIN_W / 2 + t * CURTAIN_W;
    const z = WAVE_AMP * Math.cos(t * WAVE_COUNT * Math.PI * 2) - FABRIC_THICK;
    waveShape.lineTo(x, z);
  }
  waveShape.closePath();

  function makeCurtainSection(height, mat, name, yPos) {
    const geom = new THREE.ExtrudeGeometry(waveShape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 16
    });
    geom.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(0, yPos, 0);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Curtain sections
  group.add(makeCurtainSection(HEM_H, trimFabricMat, 'curtain_bottom_hem', 0));
  group.add(makeCurtainSection(CURTAIN_BODY_H, sheerFabricMat, 'curtain_body', HEM_H));
  group.add(makeCurtainSection(HEADER_H, trimFabricMat, 'curtain_top_header', HEM_H + CURTAIN_BODY_H));

  // Curtain rod
  const rodGeom = new THREE.CylinderGeometry(ROD_R, ROD_R, ROD_W, 16);
  rodGeom.rotateZ(Math.PI / 2);
  const rodMesh = new THREE.Mesh(rodGeom, brassMat);
  rodMesh.position.set(0, ROD_Y, 0);
  rodMesh.name = 'curtain_rod';
  rodMesh.castShadow = true;
  rodMesh.receiveShadow = true;
  group.add(rodMesh);

  // Rod end caps
  const capGeom = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_LEN, 16);
  capGeom.rotateZ(Math.PI / 2);

  const leftCap = new THREE.Mesh(capGeom, brassMat);
  leftCap.position.set(-ROD_W / 2 - CAP_LEN / 2, ROD_Y, 0);
  leftCap.name = 'rod_cap_left';
  leftCap.castShadow = true;
  leftCap.receiveShadow = true;
  group.add(leftCap);

  const rightCap = new THREE.Mesh(capGeom, brassMat);
  rightCap.position.set(ROD_W / 2 + CAP_LEN / 2, ROD_Y, 0);
  rightCap.name = 'rod_cap_right';
  rightCap.castShadow = true;
  rightCap.receiveShadow = true;
  group.add(rightCap);

  // Rings and hooks at wave crests
  const ringGeom = new THREE.TorusGeometry(RING_R, RING_TUBE, 8, 16);
  ringGeom.rotateY(Math.PI / 2);
  const hookGeom = new THREE.CylinderGeometry(HOOK_R, HOOK_R, HOOK_H, 8);

  for (let i = 0; i <= WAVE_COUNT; i++) {
    const t = i / WAVE_COUNT;
    const x = -CURTAIN_W / 2 + t * CURTAIN_W;

    const ring = new THREE.Mesh(ringGeom, brassMat);
    ring.position.set(x, ROD_Y, 0);
    ring.name = `curtain_ring_${i}`;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);

    const hook = new THREE.Mesh(hookGeom, brassMat);
    hook.position.set(x, ROD_Y - RING_R - HOOK_H / 2 + 0.002, 0);
    hook.name = `curtain_hook_${i}`;
    hook.castShadow = true;
    hook.receiveShadow = true;
    group.add(hook);
  }

  // Center bounding box on X=0, Z=0 with bottom at Y=0
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;

  return group;
}
