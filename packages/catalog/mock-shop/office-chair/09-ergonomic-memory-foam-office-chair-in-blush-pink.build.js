function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.64;
  const H = 0.88;
  const D = 0.62;
  const SEAT_H = 0.46;
  const BASE_R = 0.30;
  const CASTER_R = 0.025;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe6c2bf,
    roughness: 0.88,
    metalness: 0.02,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xb88f8b,
    roughness: 0.35,
    metalness: 0.65,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.15,
    metalness: 0.9,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.5,
    metalness: 0.4,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. 5-Star Base & Casters
  const hubGeo = new THREE.CylinderGeometry(0.044, 0.048, 0.065, 24);
  const hub = addMesh(hubGeo, baseMat, 'base_hub');
  hub.position.set(0, 0.115, 0);

  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Caster wheel
    const wheelGeo = new THREE.CylinderGeometry(CASTER_R, CASTER_R, 0.028, 20);
    const wheel = addMesh(wheelGeo, darkMetalMat, `caster_wheel_${i + 1}`);
    wheel.rotation.z = Math.PI / 2;
    wheel.rotation.y = angle;
    wheel.position.set(cos * BASE_R, CASTER_R, sin * BASE_R);

    // Caster hood
    const hoodGeo = new THREE.CylinderGeometry(
      CASTER_R + 0.004,
      CASTER_R + 0.004,
      0.032,
      20,
      1,
      false,
      0,
      Math.PI * 1.2
    );
    const hood = addMesh(hoodGeo, baseMat, `caster_hood_${i + 1}`);
    hood.rotation.z = Math.PI / 2;
    hood.rotation.y = angle;
    hood.position.set(cos * BASE_R, CASTER_R + 0.002, sin * BASE_R);

    // Caster stem
    const stemGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.035, 12);
    const stem = addMesh(stemGeo, baseMat, `caster_stem_${i + 1}`);
    stem.position.set(cos * BASE_R, CASTER_R + 0.022, sin * BASE_R);

    // Tapered leg
    const legLen = BASE_R - 0.02;
    const legGeo = new THREE.BoxGeometry(0.026, 0.024, legLen);
    const leg = addMesh(legGeo, baseMat, `base_leg_${i + 1}`);
    const midR = (0.03 + BASE_R) * 0.5;
    leg.position.set(cos * midR, 0.09, sin * midR);
    leg.rotation.y = -angle + Math.PI / 2;
    leg.rotation.x = 0.22;
  }

  // 2. Gas Lift & Mechanism
  const outerLiftGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.16, 24);
  const outerLift = addMesh(outerLiftGeo, baseMat, 'gas_lift_outer');
  outerLift.position.set(0, 0.22, 0);

  const innerPistonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.045, 20);
  const innerPiston = addMesh(innerPistonGeo, chromeMat, 'gas_lift_piston');
  innerPiston.position.set(0, 0.315, 0);

  const mechGeo = new THREE.BoxGeometry(0.14, 0.032, 0.16);
  const mech = addMesh(mechGeo, darkMetalMat, 'tilt_mechanism');
  mech.position.set(0, 0.345, -0.01);

  // Height adjustment lever
  const leverRodGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.18, 12);
  const leverRod = addMesh(leverRodGeo, baseMat, 'adjustment_lever_rod');
  leverRod.rotation.z = Math.PI / 2;
  leverRod.rotation.y = 0.15;
  leverRod.position.set(-0.14, 0.34, 0.02);

  const leverHandleGeo = new THREE.BoxGeometry(0.045, 0.008, 0.022);
  const leverHandle = addMesh(leverHandleGeo, baseMat, 'adjustment_lever_handle');
  leverHandle.position.set(-0.23, 0.335, 0.034);
  leverHandle.rotation.z = 0.2;

  // 3. Seat Pan (Lower Bowl of the Tub Shell)
  const panShape = new THREE.Shape();
  const panRx = 0.285;
  const panRz = 0.265;
  panShape.absellipse(0, 0, panRx, panRz, 0, Math.PI * 2, false, 0);

  const panGeo = new THREE.ExtrudeGeometry(panShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 8,
    curveSegments: 32,
  });
  panGeo.rotateX(Math.PI / 2);
  const seatPan = addMesh(panGeo, fabricMat, 'seat_shell_pan');
  seatPan.position.set(0, 0.405, 0.01);

  // 4. One-Piece Wrap-Around Tub Shell (Back + Low Arms)
  const rOut = 0.305;
  const rIn = 0.255;
  const startAngle = -0.18 * Math.PI;
  const endAngle = 1.18 * Math.PI;
  const arcSegs = 32;

  const tubShape = new THREE.Shape();
  for (let i = 0; i <= arcSegs; i++) {
    const a = startAngle + (i / arcSegs) * (endAngle - startAngle);
    const x = Math.cos(a) * rOut;
    const y = Math.sin(a) * rOut * 0.95;
    if (i === 0) tubShape.moveTo(x, y);
    else tubShape.lineTo(x, y);
  }
  for (let i = arcSegs; i >= 0; i--) {
    const a = startAngle + (i / arcSegs) * (endAngle - startAngle);
    const x = Math.cos(a) * rIn;
    const y = Math.sin(a) * rIn * 0.95;
    tubShape.lineTo(x, y);
  }
  tubShape.closePath();

  const shellH = H - 0.38; // 0.50m tall at the back
  const tubGeo = new THREE.ExtrudeGeometry(tubShape, {
    depth: shellH,
    steps: 18,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 6,
    curveSegments: 24,
  });
  tubGeo.rotateX(-Math.PI / 2);

  // Sculpt the extruded U-wall into a smooth tub silhouette
  const pos = tubGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const t = Math.max(0, Math.min(1, y / shellH));

    // Smoothly drop the height from the tall back (z < -0.12) to low arms (z > 0.0)
    // and curve down to meet the front of the seat pan (z > 0.14)
    let heightFactor = 1.0;
    if (z > -0.12) {
      const u = Math.min(1, (z + 0.12) / 0.30);
      // Smoothstep curve from 1.0 down to 0.36 at the arm, then down to 0.12 at the front tip
      const armDrop = 1.0 - 0.64 * (u * u * (3 - 2 * u));
      heightFactor = armDrop;
    }

    y = y * heightFactor;

    // Taper the upper backrest slightly narrower toward the top
    if (z < 0) {
      const backFactor = Math.min(1, -z / 0.25);
      x *= 1.0 - 0.15 * t * backFactor;
      // Gentle ergonomic recline
      z -= t * 0.055 * backFactor;
    }

    pos.setXYZ(i, x, y, z);
  }
  tubGeo.computeVertexNormals();

  const tubShell = addMesh(tubGeo, fabricMat, 'tub_backrest_shell');
  tubShell.position.set(0, 0.38, 0.01);

  // 5. Thick Rounded Seat Cushion (Memory Foam)
  const cushionShape = new THREE.Shape();
  cushionShape.absellipse(0, 0, 0.235, 0.22, 0, Math.PI * 2, false, 0);

  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.028,
    bevelSegments: 8,
    curveSegments: 32,
  });
  cushionGeo.rotateX(Math.PI / 2);
  const cushion = addMesh(cushionGeo, fabricMat, 'seat_cushion');
  cushion.position.set(0, SEAT_H - 0.005, 0.025);

  return group;
}
