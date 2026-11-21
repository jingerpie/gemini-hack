function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.90;
  const D = 1.96;
  const H = 0.40;
  const MATTRESS_H = 0.11;
  const HALF_GAP = 0.008;
  const HALF_D = (D - HALF_GAP) / 2;

  const TUBE_R = 0.014;
  const LEG_R = 0.013;
  const FRAME_Y = H - MATTRESS_H - TUBE_R + 0.002;
  const MATTRESS_Y = H - MATTRESS_H / 2;

  const CASTER_R = 0.022;
  const CASTER_W = 0.018;
  const LEG_BOTTOM_Y = CASTER_R * 2 + 0.012;

  // Materials
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xd5c8b5,
    roughness: 0.9,
    metalness: 0.0
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3a3c3e,
    roughness: 0.42,
    metalness: 0.65
  });

  const casterWheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.1
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Two-part folding mattress
  const mattressGeo = new THREE.BoxGeometry(W, MATTRESS_H, HALF_D);
  const frontZ = (HALF_D + HALF_GAP) / 2;
  const backZ = -(HALF_D + HALF_GAP) / 2;
  addMesh(mattressGeo, mattressMat, 'mattress_front', 0, MATTRESS_Y, frontZ);
  addMesh(mattressGeo, mattressMat, 'mattress_back', 0, MATTRESS_Y, backZ);

  // 2. Two-part perimeter steel frame
  const fw = W / 2 - TUBE_R;
  function makeFrameHalf(zStart, zEnd, name) {
    const r = 0.04;
    const zDir = zEnd > zStart ? 1 : -1;
    const pts = [
      new THREE.Vector3(-fw, FRAME_Y, zStart),
      new THREE.Vector3(-fw, FRAME_Y, zEnd - zDir * r),
      new THREE.Vector3(-fw + r, FRAME_Y, zEnd),
      new THREE.Vector3(fw - r, FRAME_Y, zEnd),
      new THREE.Vector3(fw, FRAME_Y, zEnd - zDir * r),
      new THREE.Vector3(fw, FRAME_Y, zStart),
      new THREE.Vector3(-fw, FRAME_Y, zStart)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const geo = new THREE.TubeGeometry(curve, 32, TUBE_R, 12, false);
    addMesh(geo, frameMat, name);
  }

  makeFrameHalf(HALF_GAP / 2, D / 2 - TUBE_R, 'frame_front');
  makeFrameHalf(-HALF_GAP / 2, -D / 2 + TUBE_R, 'frame_back');

  // 3. Four U-shaped leg assemblies + casters + diagonal braces
  const legW = W / 2 - TUBE_R * 2.2;
  const legPositions = [
    { zTop: D / 2 - 0.14, zBot: D / 2 - 0.10, braceZ: D / 2 - 0.34, name: 'front_outer' },
    { zTop: 0.065, zBot: 0.065, braceZ: 0.26, name: 'front_inner' },
    { zTop: -0.065, zBot: -0.065, braceZ: -0.26, name: 'back_inner' },
    { zTop: -D / 2 + 0.14, zBot: -D / 2 + 0.10, braceZ: -D / 2 + 0.34, name: 'back_outer' }
  ];

  const wheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, CASTER_W, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const forkGeo = new THREE.BoxGeometry(CASTER_W + 0.008, LEG_BOTTOM_Y - CASTER_R, 0.024);

  legPositions.forEach((leg) => {
    const r = 0.035;
    const pts = [
      new THREE.Vector3(-legW, FRAME_Y, leg.zTop),
      new THREE.Vector3(-legW, LEG_BOTTOM_Y + r, leg.zBot),
      new THREE.Vector3(-legW + r, LEG_BOTTOM_Y, leg.zBot),
      new THREE.Vector3(legW - r, LEG_BOTTOM_Y, leg.zBot),
      new THREE.Vector3(legW, LEG_BOTTOM_Y + r, leg.zBot),
      new THREE.Vector3(legW, FRAME_Y, leg.zTop)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const legGeo = new THREE.TubeGeometry(curve, 28, LEG_R, 10, false);
    addMesh(legGeo, frameMat, `leg_${leg.name}`);

    // Casters (left & right)
    [-legW + 0.03, legW - 0.03].forEach((cx, idx) => {
      const side = idx === 0 ? 'left' : 'right';
      addMesh(
        forkGeo,
        frameMat,
        `caster_fork_${leg.name}_${side}`,
        cx,
        (LEG_BOTTOM_Y + CASTER_R) / 2,
        leg.zBot
      );
      addMesh(
        wheelGeo,
        casterWheelMat,
        `caster_wheel_${leg.name}_${side}`,
        cx,
        CASTER_R,
        leg.zBot
      );
    });

    // Diagonal brace struts (left & right)
    [-legW, legW].forEach((bx, idx) => {
      const side = idx === 0 ? 'left' : 'right';
      const p1 = new THREE.Vector3(bx, FRAME_Y, leg.braceZ);
      const p2 = new THREE.Vector3(bx, LEG_BOTTOM_Y + 0.10, leg.zBot);
      const dist = p1.distanceTo(p2);
      const braceGeo = new THREE.CylinderGeometry(0.007, 0.007, dist, 8);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const braceMesh = addMesh(braceGeo, frameMat, `brace_${leg.name}_${side}`, mid.x, mid.y, mid.z);
      braceMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(p2, p1).normalize()
      );
    });
  });

  return group;
}
