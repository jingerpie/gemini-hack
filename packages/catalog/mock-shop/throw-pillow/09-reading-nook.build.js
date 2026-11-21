function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const W = 0.40;
  const H = 0.40;
  const D = 0.15;
  const BEVEL_THICKNESS = 0.065;
  const BEVEL_SIZE = 0.05;
  const EXTRUDE_DEPTH = D - 2 * BEVEL_THICKNESS; // 0.02
  const PIPE_R = 0.0055;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf2ead7,
    roughness: 0.9,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xa85242,
    roughness: 0.78,
    metalness: 0.0,
  });

  const foxMat = new THREE.MeshStandardMaterial({
    color: 0xd96b27,
    roughness: 0.8,
    metalness: 0.0,
  });

  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xe8b038,
    roughness: 0.7,
    metalness: 0.0,
  });

  const bookMat = new THREE.MeshStandardMaterial({
    color: 0x6b9e78,
    roughness: 0.8,
    metalness: 0.0,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x6e4730,
    roughness: 0.8,
    metalness: 0.0,
  });

  // 1. Pillow body (rounded square with slightly pinched sides)
  const hw = W / 2 - BEVEL_SIZE; // 0.15
  const hh = H / 2 - BEVEL_SIZE; // 0.15
  const pinch = 0.012;
  const cr = 0.022; // corner radius

  const shape = new THREE.Shape();
  shape.moveTo(-hw + cr, -hh);
  shape.quadraticCurveTo(0, -hh + pinch, hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.quadraticCurveTo(hw - pinch, 0, hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.quadraticCurveTo(0, hh - pinch, -hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.quadraticCurveTo(-hw + pinch, 0, -hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_THICKNESS,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 8,
    curveSegments: 16,
  });
  bodyGeo.center();

  const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
  bodyMesh.name = 'pillow_body';
  bodyMesh.position.set(0, H / 2, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Terracotta piping around the perimeter seam
  const pw = W / 2 - PIPE_R;
  const ph = H / 2 - PIPE_R;
  const pPinch = 0.012;
  const pipePoints = [
    new THREE.Vector3(-pw + 0.02, -ph, 0),
    new THREE.Vector3(0, -ph + pPinch, 0),
    new THREE.Vector3(pw - 0.02, -ph, 0),
    new THREE.Vector3(pw, -ph + 0.02, 0),
    new THREE.Vector3(pw - pPinch, 0, 0),
    new THREE.Vector3(pw, ph - 0.02, 0),
    new THREE.Vector3(pw - 0.02, ph, 0),
    new THREE.Vector3(0, ph - pPinch, 0),
    new THREE.Vector3(-pw + 0.02, ph, 0),
    new THREE.Vector3(-pw, ph - 0.02, 0),
    new THREE.Vector3(-pw + pPinch, 0, 0),
    new THREE.Vector3(-pw, -ph + 0.02, 0),
  ];
  const pipeCurve = new THREE.CatmullRomCurve3(pipePoints, true, 'catmullrom', 0.35);
  const pipeGeo = new THREE.TubeGeometry(pipeCurve, 64, PIPE_R, 8, true);
  const pipeMesh = new THREE.Mesh(pipeGeo, pipingMat);
  pipeMesh.name = 'pillow_piping';
  pipeMesh.position.set(0, H / 2, 0);
  pipeMesh.castShadow = true;
  pipeMesh.receiveShadow = true;
  group.add(pipeMesh);

  // 3. Subtle front motif (lamp, fox, book) flush on +Z face
  const frontZ = D / 2 - 0.002;
  const cy = H / 2;

  // Lamp shade
  const shadeGeo = new THREE.CylinderGeometry(0.012, 0.022, 0.026, 12);
  shadeGeo.scale(1, 1, 0.15);
  const shadeMesh = new THREE.Mesh(shadeGeo, lampMat);
  shadeMesh.name = 'motif_lamp_shade';
  shadeMesh.position.set(-0.042, cy + 0.036, frontZ);
  shadeMesh.castShadow = true;
  shadeMesh.receiveShadow = true;
  group.add(shadeMesh);

  // Lamp stand
  const standGeo = new THREE.CapsuleGeometry(0.0025, 0.05, 4, 8);
  standGeo.scale(1, 1, 0.4);
  const standMesh = new THREE.Mesh(standGeo, stemMat);
  standMesh.name = 'motif_lamp_stand';
  standMesh.position.set(-0.042, cy - 0.002, frontZ);
  standMesh.castShadow = true;
  standMesh.receiveShadow = true;
  group.add(standMesh);

  // Fox body
  const foxBodyGeo = new THREE.SphereGeometry(0.024, 16, 12);
  foxBodyGeo.scale(0.9, 1.2, 0.15);
  const foxBodyMesh = new THREE.Mesh(foxBodyGeo, foxMat);
  foxBodyMesh.name = 'motif_fox_body';
  foxBodyMesh.position.set(0.022, cy - 0.018, frontZ);
  foxBodyMesh.castShadow = true;
  foxBodyMesh.receiveShadow = true;
  group.add(foxBodyMesh);

  // Fox head
  const foxHeadGeo = new THREE.SphereGeometry(0.017, 16, 12);
  foxHeadGeo.scale(1.05, 0.9, 0.18);
  const foxHeadMesh = new THREE.Mesh(foxHeadGeo, foxMat);
  foxHeadMesh.name = 'motif_fox_head';
  foxHeadMesh.position.set(0.016, cy + 0.016, frontZ + 0.001);
  foxHeadMesh.castShadow = true;
  foxHeadMesh.receiveShadow = true;
  group.add(foxHeadMesh);

  // Fox tail
  const foxTailGeo = new THREE.CapsuleGeometry(0.01, 0.028, 6, 10);
  foxTailGeo.scale(1, 1, 0.2);
  const foxTailMesh = new THREE.Mesh(foxTailGeo, foxMat);
  foxTailMesh.name = 'motif_fox_tail';
  foxTailMesh.position.set(0.052, cy - 0.015, frontZ);
  foxTailMesh.rotation.z = -0.35;
  foxTailMesh.castShadow = true;
  foxTailMesh.receiveShadow = true;
  group.add(foxTailMesh);

  // Green book held by fox
  const bookGeo = new THREE.CapsuleGeometry(0.012, 0.016, 4, 8);
  bookGeo.scale(1.2, 0.9, 0.2);
  const bookMesh = new THREE.Mesh(bookGeo, bookMat);
  bookMesh.name = 'motif_book';
  bookMesh.position.set(-0.002, cy - 0.012, frontZ + 0.002);
  bookMesh.rotation.z = 0.25;
  bookMesh.castShadow = true;
  bookMesh.receiveShadow = true;
  group.add(bookMesh);

  return group;
}
