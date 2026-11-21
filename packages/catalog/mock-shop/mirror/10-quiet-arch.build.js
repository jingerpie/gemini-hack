function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.50;
  const W = 0.37;
  const D = 0.024;
  const FRAME_W = 0.026;
  const R_OUT = W / 2;
  const R_IN = R_OUT - FRAME_W;
  const ARCH_Y = H - R_OUT;
  const SEAM_GAP = 0.0012;
  const GLASS_THICK = 0.004;
  const BACK_THICK = 0.004;
  const Z_BACK = -D / 2;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xb88b58,
    roughness: 0.65,
    metalness: 0.02,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x4a3c31,
    roughness: 0.85,
    metalness: 0.0,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.8,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Mirror glass (arched shape)
  const glassShape = new THREE.Shape();
  glassShape.moveTo(-R_IN, FRAME_W);
  glassShape.lineTo(R_IN, FRAME_W);
  glassShape.lineTo(R_IN, ARCH_Y);
  glassShape.absarc(0, ARCH_Y, R_IN, 0, Math.PI, false);
  glassShape.closePath();

  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: GLASS_THICK,
    bevelEnabled: false,
    curveSegments: 32,
  });
  const glassMesh = addMesh(glassGeo, mirrorMat, 'mirror_glass');
  glassMesh.position.z = Z_BACK + BACK_THICK;

  // 2. Backing board (flat at z = -D/2)
  const backShape = new THREE.Shape();
  backShape.moveTo(-R_OUT + 0.004, 0.004);
  backShape.lineTo(R_OUT - 0.004, 0.004);
  backShape.lineTo(R_OUT - 0.004, ARCH_Y);
  backShape.absarc(0, ARCH_Y, R_OUT - 0.004, 0, Math.PI, false);
  backShape.closePath();

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: BACK_THICK,
    bevelEnabled: false,
    curveSegments: 32,
  });
  const backMesh = addMesh(backGeo, backingMat, 'backing_board');
  backMesh.position.z = Z_BACK;

  // 3. Bottom frame rail (mitered ends)
  const bottomShape = new THREE.Shape();
  bottomShape.moveTo(-R_OUT + SEAM_GAP * 0.5, 0);
  bottomShape.lineTo(R_OUT - SEAM_GAP * 0.5, 0);
  bottomShape.lineTo(R_IN - SEAM_GAP * 0.5, FRAME_W);
  bottomShape.lineTo(-R_IN + SEAM_GAP * 0.5, FRAME_W);
  bottomShape.closePath();

  const bottomGeo = new THREE.ExtrudeGeometry(bottomShape, {
    depth: D,
    bevelEnabled: false,
  });
  const bottomMesh = addMesh(bottomGeo, oakMat, 'frame_bottom');
  bottomMesh.position.z = Z_BACK;

  // 4. Left vertical stile (mitered bottom, flat top at springline)
  const leftShape = new THREE.Shape();
  leftShape.moveTo(-R_OUT, SEAM_GAP * 0.5);
  leftShape.lineTo(-R_IN, FRAME_W + SEAM_GAP * 0.5);
  leftShape.lineTo(-R_IN, ARCH_Y - SEAM_GAP * 0.5);
  leftShape.lineTo(-R_OUT, ARCH_Y - SEAM_GAP * 0.5);
  leftShape.closePath();

  const leftGeo = new THREE.ExtrudeGeometry(leftShape, {
    depth: D,
    bevelEnabled: false,
  });
  const leftMesh = addMesh(leftGeo, oakMat, 'frame_left_stile');
  leftMesh.position.z = Z_BACK;

  // 5. Right vertical stile (mitered bottom, flat top at springline)
  const rightShape = new THREE.Shape();
  rightShape.moveTo(R_OUT, SEAM_GAP * 0.5);
  rightShape.lineTo(R_OUT, ARCH_Y - SEAM_GAP * 0.5);
  rightShape.lineTo(R_IN, ARCH_Y - SEAM_GAP * 0.5);
  rightShape.lineTo(R_IN, FRAME_W + SEAM_GAP * 0.5);
  rightShape.closePath();

  const rightGeo = new THREE.ExtrudeGeometry(rightShape, {
    depth: D,
    bevelEnabled: false,
  });
  const rightMesh = addMesh(rightGeo, oakMat, 'frame_right_stile');
  rightMesh.position.z = Z_BACK;

  // 6-9. Four curved arch segments
  const angGap = SEAM_GAP / R_OUT;
  const segCount = 4;
  const segSpan = Math.PI / segCount;

  for (let i = 0; i < segCount; i++) {
    const a0 = i * segSpan + angGap * 0.5;
    const a1 = (i + 1) * segSpan - angGap * 0.5;

    const segShape = new THREE.Shape();
    segShape.absarc(0, ARCH_Y, R_OUT, a0, a1, false);
    segShape.absarc(0, ARCH_Y, R_IN, a1, a0, true);
    segShape.closePath();

    const segGeo = new THREE.ExtrudeGeometry(segShape, {
      depth: D,
      bevelEnabled: false,
      curveSegments: 16,
    });
    const segMesh = addMesh(segGeo, oakMat, `frame_arch_seg_${i + 1}`);
    segMesh.position.z = Z_BACK;
  }

  // 10-11. Wall hanging brackets on back
  const bracketGeo = new THREE.BoxGeometry(0.022, 0.032, 0.002);
  const bracketLeft = addMesh(bracketGeo, metalMat, 'hanging_bracket_left');
  bracketLeft.position.set(-R_IN * 0.65, ARCH_Y - 0.02, Z_BACK + 0.001);

  const bracketRight = addMesh(bracketGeo, metalMat, 'hanging_bracket_right');
  bracketRight.position.set(R_IN * 0.65, ARCH_Y - 0.02, Z_BACK + 0.001);

  // 12-13. Bottom felt bumper pads on back
  const padGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.002, 16);
  padGeo.rotateX(Math.PI / 2);

  const padLeft = addMesh(padGeo, padMat, 'bumper_pad_bottom_left');
  padLeft.position.set(-R_IN * 0.75, 0.025, Z_BACK + 0.001);

  const padRight = addMesh(padGeo, padMat, 'bumper_pad_bottom_right');
  padRight.position.set(R_IN * 0.75, 0.025, Z_BACK + 0.001);

  return group;
}
