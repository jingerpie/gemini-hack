function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.40;
  const H = 0.58;
  const D = 0.52;

  const CASTER_H = 0.055;
  const WHEEL_R = 0.022;
  const WHEEL_W = 0.012;
  const TOP_H = 0.022;
  const BODY_H = H - CASTER_H - TOP_H;
  const BODY_Y = CASTER_H + BODY_H / 2;

  const DRAWER_THICK = 0.016;
  const DRAWER_W = W - 0.008;
  const TOP_RAIL_H = 0.032;
  const GAP = 0.004;
  const BOTTOM_MARGIN = 0.006;
  const AVAIL_DRAWER_H = BODY_H - TOP_RAIL_H - BOTTOM_MARGIN - GAP * 2;
  const TOP_DRAWER_H = AVAIL_DRAWER_H * 0.34;
  const BOT_DRAWER_H = AVAIL_DRAWER_H * 0.66;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2f3437,
    roughness: 0.55,
    metalness: 0.35
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xcbb79c,
    roughness: 0.65,
    metalness: 0.02
  });
  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x1b1f21,
    roughness: 0.75,
    metalness: 0.2
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.25,
    metalness: 0.85
  });
  const casterMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.7,
    metalness: 0.1
  });
  const casterHubMat = new THREE.MeshStandardMaterial({
    color: 0x3c4044,
    roughness: 0.5,
    metalness: 0.2
  });

  function enableShadows(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Wood Top (rounded rectangle extruded)
  const topR = 0.012;
  const topShape = new THREE.Shape();
  const hw = W / 2;
  const hd = D / 2;
  topShape.moveTo(-hw + topR, -hd);
  topShape.lineTo(hw - topR, -hd);
  topShape.quadraticCurveTo(hw, -hd, hw, -hd + topR);
  topShape.lineTo(hw, hd - topR);
  topShape.quadraticCurveTo(hw, hd, hw - topR, hd);
  topShape.lineTo(-hw + topR, hd);
  topShape.quadraticCurveTo(-hw, hd, -hw, hd - topR);
  topShape.lineTo(-hw, -hd + topR);
  topShape.quadraticCurveTo(-hw, -hd, -hw + topR, -hd);

  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TOP_H,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 8
  });
  topGeo.rotateX(Math.PI / 2);
  const woodTop = enableShadows(new THREE.Mesh(topGeo, woodMat));
  woodTop.name = 'wood_top';
  woodTop.position.set(0, H, 0);
  group.add(woodTop);

  // 2. Main Metal Body
  const bodyD = D - DRAWER_THICK;
  const bodyGeo = new THREE.BoxGeometry(W, BODY_H, bodyD);
  const body = enableShadows(new THREE.Mesh(bodyGeo, bodyMat));
  body.name = 'cabinet_body';
  body.position.set(0, BODY_Y, -DRAWER_THICK / 2);
  group.add(body);

  // 3. Top Drawer
  const topDrawerY = CASTER_H + BODY_H - TOP_RAIL_H - GAP - TOP_DRAWER_H / 2;
  const drawerZ = D / 2 - DRAWER_THICK / 2;
  const topDrawerGeo = new THREE.BoxGeometry(DRAWER_W, TOP_DRAWER_H, DRAWER_THICK);
  const topDrawer = enableShadows(new THREE.Mesh(topDrawerGeo, bodyMat));
  topDrawer.name = 'top_drawer_front';
  topDrawer.position.set(0, topDrawerY, drawerZ);
  group.add(topDrawer);

  // Top Drawer Recessed Handle
  const handleW = 0.14;
  const handleH = 0.022;
  const handleD = 0.006;
  const topHandleGeo = new THREE.BoxGeometry(handleW, handleH, handleD);
  const topHandle = enableShadows(new THREE.Mesh(topHandleGeo, recessMat));
  topHandle.name = 'top_drawer_handle';
  topHandle.position.set(0, topDrawerY + TOP_DRAWER_H / 2 - 0.028, drawerZ + DRAWER_THICK / 2 - handleD / 2 + 0.001);
  group.add(topHandle);

  // 4. Bottom Drawer
  const botDrawerY = CASTER_H + BOTTOM_MARGIN + BOT_DRAWER_H / 2;
  const botDrawerGeo = new THREE.BoxGeometry(DRAWER_W, BOT_DRAWER_H, DRAWER_THICK);
  const botDrawer = enableShadows(new THREE.Mesh(botDrawerGeo, bodyMat));
  botDrawer.name = 'bottom_drawer_front';
  botDrawer.position.set(0, botDrawerY, drawerZ);
  group.add(botDrawer);

  // Bottom Drawer Recessed Handle
  const botHandleGeo = new THREE.BoxGeometry(handleW, handleH, handleD);
  const botHandle = enableShadows(new THREE.Mesh(botHandleGeo, recessMat));
  botHandle.name = 'bottom_drawer_handle';
  botHandle.position.set(0, botDrawerY + BOT_DRAWER_H / 2 - 0.028, drawerZ + DRAWER_THICK / 2 - handleD / 2 + 0.001);
  group.add(botHandle);

  // 5. Lock Cylinder (top right of front rail)
  const lockY = CASTER_H + BODY_H - TOP_RAIL_H / 2;
  const lockX = W / 2 - 0.042;
  const lockZ = D / 2 - 0.002;
  const lockGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16);
  lockGeo.rotateX(Math.PI / 2);
  const lockMesh = enableShadows(new THREE.Mesh(lockGeo, metalMat));
  lockMesh.name = 'lock_cylinder';
  lockMesh.position.set(lockX, lockY, lockZ);
  group.add(lockMesh);

  const keyholeGeo = new THREE.BoxGeometry(0.002, 0.007, 0.002);
  const keyhole = enableShadows(new THREE.Mesh(keyholeGeo, recessMat));
  keyhole.name = 'lock_keyhole';
  keyhole.position.set(lockX, lockY, lockZ + 0.003);
  group.add(keyhole);

  // 6. Casters (4 corners + 1 front-center anti-tip)
  function addCaster(name, x, z, hasBrake) {
    const cGroup = new THREE.Group();
    cGroup.position.set(x, 0, z);

    // Stem / housing
    const stemH = CASTER_H - WHEEL_R;
    const stemGeo = new THREE.CylinderGeometry(0.012, 0.015, stemH, 12);
    const stem = enableShadows(new THREE.Mesh(stemGeo, casterMat));
    stem.name = name + '_housing';
    stem.position.set(0, WHEEL_R + stemH / 2, 0);
    cGroup.add(stem);

    // Dual wheels
    const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 20);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelL = enableShadows(new THREE.Mesh(wheelGeo, casterMat));
    wheelL.name = name + '_wheel_left';
    wheelL.position.set(-WHEEL_W * 0.8, WHEEL_R, 0);
    cGroup.add(wheelL);

    const wheelR = enableShadows(new THREE.Mesh(wheelGeo, casterHubMat));
    wheelR.name = name + '_wheel_right';
    wheelR.position.set(WHEEL_W * 0.8, WHEEL_R, 0);
    cGroup.add(wheelR);

    if (hasBrake) {
      const brakeGeo = new THREE.BoxGeometry(0.014, 0.006, 0.016);
      const brake = enableShadows(new THREE.Mesh(brakeGeo, casterMat));
      brake.name = name + '_brake';
      brake.position.set(0, WHEEL_R + 0.008, WHEEL_R * 0.85);
      cGroup.add(brake);
    }

    group.add(cGroup);
  }

  const cx = W / 2 - 0.045;
  const czFront = D / 2 - 0.055;
  const czBack = -D / 2 + 0.055;

  addCaster('caster_front_left', -cx, czFront, true);
  addCaster('caster_front_right', cx, czFront, true);
  addCaster('caster_back_left', -cx, czBack, false);
  addCaster('caster_back_right', cx, czBack, false);
  addCaster('caster_anti_tip', 0, czFront - 0.02, false);

  return group;
}
