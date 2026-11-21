function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const H = 0.45;
  const D = 0.14;
  const CORNER_R = 0.035;
  const BEVEL = 0.06;
  const PIPING_R = 0.0055;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xf4f3ef,
    roughness: 0.92,
    metalness: 0.0,
  });

  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x1e8b8d,
    roughness: 0.75,
    metalness: 0.0,
  });

  const plumMat = new THREE.MeshStandardMaterial({
    color: 0x52263f,
    roughness: 0.75,
    metalness: 0.0,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xe8c443,
    roughness: 0.75,
    metalness: 0.0,
  });

  const coralMat = new THREE.MeshStandardMaterial({
    color: 0xe07a5f,
    roughness: 0.75,
    metalness: 0.0,
  });

  const dogCoatMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebd1,
    roughness: 0.85,
    metalness: 0.0,
  });

  const addMesh = (geo, mat, name, pos, rot, scale) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Pillow body: rounded-square ExtrudeGeometry with generous bevel for soft edges
  const halfW = W / 2 - BEVEL;
  const halfH = H / 2 - BEVEL;
  const r = CORNER_R;

  const shape = new THREE.Shape();
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);

  const coreDepth = Math.max(0.01, D - BEVEL * 2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: coreDepth,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 1,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    curveSegments: 16,
  });
  bodyGeo.center();

  const centerY = H / 2;
  addMesh(bodyGeo, fabricMat, 'pillow_body', [0, centerY, 0]);

  // Perimeter piping seam hugging the exact rounded-rectangle contour
  const outerHalfW = W / 2 - 0.002;
  const outerHalfH = H / 2 - 0.002;
  const outerR = CORNER_R + BEVEL - 0.002;
  const pipingPts = [];
  const cornerSegs = 6;
  const corners = [
    { cx: outerHalfW - outerR, cy: outerHalfH - outerR, start: 0 },
    { cx: -outerHalfW + outerR, cy: outerHalfH - outerR, start: Math.PI / 2 },
    { cx: -outerHalfW + outerR, cy: -outerHalfH + outerR, start: Math.PI },
    { cx: outerHalfW - outerR, cy: -outerHalfH + outerR, start: (3 * Math.PI) / 2 },
  ];
  for (const c of corners) {
    for (let i = 0; i <= cornerSegs; i++) {
      const a = c.start + (i / cornerSegs) * (Math.PI / 2);
      pipingPts.push(
        new THREE.Vector3(
          c.cx + Math.cos(a) * outerR,
          centerY + c.cy + Math.sin(a) * outerR,
          0
        )
      );
    }
  }
  const pipingCurve = new THREE.CatmullRomCurve3(pipingPts, true);
  const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, PIPING_R, 10, true);
  addMesh(pipingGeo, fabricMat, 'pillow_piping');

  // Front graphic emblem (+Z face)
  const frontZ = D / 2 + 0.001;

  // Outer teal oval ring
  const outerRingGeo = new THREE.TorusGeometry(0.135, 0.004, 8, 32);
  addMesh(outerRingGeo, tealMat, 'emblem_outer_ring', [0, centerY, frontZ], null, [0.92, 1.15, 0.2]);

  // Inner plum oval ring
  const innerRingGeo = new THREE.TorusGeometry(0.125, 0.0035, 8, 32);
  addMesh(innerRingGeo, plumMat, 'emblem_inner_ring', [0, centerY, frontZ], null, [0.92, 1.15, 0.2]);

  // Top & bottom banner pills
  const bannerGeo = new THREE.CapsuleGeometry(0.018, 0.09, 6, 16);
  addMesh(bannerGeo, yellowMat, 'emblem_top_banner', [0, centerY + 0.138, frontZ + 0.001], [0, 0, Math.PI / 2], [1, 1, 0.12]);
  addMesh(bannerGeo, coralMat, 'emblem_bottom_banner', [0, centerY - 0.138, frontZ + 0.001], [0, 0, Math.PI / 2], [1, 1, 0.12]);

  // Dog head silhouette
  const headGeo = new THREE.SphereGeometry(0.068, 24, 16);
  addMesh(headGeo, dogCoatMat, 'dog_head', [0, centerY + 0.015, frontZ + 0.001], null, [1.0, 1.05, 0.08]);

  // Dog floppy ears
  const earGeo = new THREE.CapsuleGeometry(0.022, 0.055, 6, 12);
  addMesh(earGeo, dogCoatMat, 'dog_ear_left', [-0.072, centerY + 0.015, frontZ + 0.001], [0, 0, -0.25], [1, 1, 0.12]);
  addMesh(earGeo, dogCoatMat, 'dog_ear_right', [0.072, centerY + 0.015, frontZ + 0.001], [0, 0, 0.25], [1, 1, 0.12]);

  // Dog nose
  const noseGeo = new THREE.SphereGeometry(0.016, 16, 12);
  addMesh(noseGeo, plumMat, 'dog_nose', [0, centerY - 0.002, frontZ + 0.005], null, [1.25, 0.85, 0.18]);

  // Dog tongue
  const tongueGeo = new THREE.CapsuleGeometry(0.013, 0.018, 6, 12);
  addMesh(tongueGeo, coralMat, 'dog_tongue', [0, centerY - 0.036, frontZ + 0.004], null, [1.0, 1.0, 0.15]);

  // Dog eyes
  const eyeGeo = new THREE.SphereGeometry(0.008, 12, 10);
  addMesh(eyeGeo, plumMat, 'dog_eye_left', [-0.028, centerY + 0.032, frontZ + 0.005], null, [1, 1, 0.2]);
  addMesh(eyeGeo, plumMat, 'dog_eye_right', [0.028, centerY + 0.032, frontZ + 0.005], null, [1, 1, 0.2]);

  return group;
}
