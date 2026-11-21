function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 0.90;
  const R = 0.18;
  const APOTHEM = R * Math.cos(Math.PI / 6);
  const SIDE_W = R + 0.012;
  const PANEL_T = 0.014;
  const CORNER_H = 0.22;
  const PANEL_H = 0.30;
  const VAULT_H = 0.16;
  const CAGE_TOP_Y = PANEL_H + VAULT_H;
  const CANOPY_H = 0.095;
  const CANOPY_Y = H - CANOPY_H;

  // Materials
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x8f8c85,
    roughness: 0.85,
    metalness: 0.12
  });

  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x6e6b65,
    roughness: 0.65,
    metalness: 0.25
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd584,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // 1. Hexagonal Gothic Window Panels (6 meshes)
  const hw = SIDE_W / 2;
  const panelShape = new THREE.Shape();
  panelShape.moveTo(-hw, 0);
  panelShape.lineTo(hw, 0);
  panelShape.lineTo(hw, CORNER_H);
  panelShape.quadraticCurveTo(hw * 0.65, PANEL_H * 0.92, 0, PANEL_H);
  panelShape.quadraticCurveTo(-hw * 0.65, PANEL_H * 0.92, -hw, CORNER_H);
  panelShape.closePath();

  // Left lancet hole
  const leftHole = new THREE.Path();
  const lw = hw - 0.016;
  const rw = 0.007;
  leftHole.moveTo(-lw, 0.016);
  leftHole.lineTo(-rw, 0.016);
  leftHole.lineTo(-rw, 0.165);
  leftHole.quadraticCurveTo(-rw - (lw - rw) * 0.25, 0.20, -(lw + rw) / 2, 0.205);
  leftHole.quadraticCurveTo(-lw + (lw - rw) * 0.25, 0.20, -lw, 0.165);
  leftHole.closePath();
  panelShape.holes.push(leftHole);

  // Right lancet hole
  const rightHole = new THREE.Path();
  rightHole.moveTo(rw, 0.016);
  rightHole.lineTo(lw, 0.016);
  rightHole.lineTo(lw, 0.165);
  rightHole.quadraticCurveTo(lw - (lw - rw) * 0.25, 0.20, (lw + rw) / 2, 0.205);
  rightHole.quadraticCurveTo(rw + (lw - rw) * 0.25, 0.20, rw, 0.165);
  rightHole.closePath();
  panelShape.holes.push(rightHole);

  // Top rosette hole
  const rosetteHole = new THREE.Path();
  rosetteHole.absarc(0, 0.235, 0.022, 0, Math.PI * 2, false);
  panelShape.holes.push(rosetteHole);

  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: PANEL_T,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16
  });
  panelGeo.translate(0, 0, -PANEL_T / 2);

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const panel = new THREE.Mesh(panelGeo, stoneMat);
    panel.name = `gothic_panel_${i + 1}`;
    panel.position.set(
      Math.sin(angle) * APOTHEM,
      0,
      Math.cos(angle) * APOTHEM
    );
    panel.rotation.y = angle;
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  }

  // 2. Vaulted Dome Ribs (6 meshes)
  for (let i = 0; i < 6; i++) {
    const cAngle = (i * Math.PI) / 3 + Math.PI / 6;
    const sx = Math.sin(cAngle) * R;
    const sz = Math.cos(cAngle) * R;
    const ex = Math.sin(cAngle) * 0.024;
    const ez = Math.cos(cAngle) * 0.024;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, CORNER_H - 0.005, sz),
      new THREE.Vector3(sx * 0.92, CORNER_H + VAULT_H * 0.45, sz * 0.92),
      new THREE.Vector3(sx * 0.55, CORNER_H + VAULT_H * 0.88, sz * 0.55),
      new THREE.Vector3(ex, CAGE_TOP_Y, ez)
    ]);

    const ribGeo = new THREE.TubeGeometry(curve, 16, 0.007, 8, false);
    const rib = new THREE.Mesh(ribGeo, stoneMat);
    rib.name = `vault_rib_${i + 1}`;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  // 3. Top Hub & Loop
  const hubGeo = new THREE.CylinderGeometry(0.026, 0.030, 0.022, 16);
  const hub = new THREE.Mesh(hubGeo, stoneMat);
  hub.name = 'lantern_top_hub';
  hub.position.y = CAGE_TOP_Y;
  hub.castShadow = true;
  hub.receiveShadow = true;
  group.add(hub);

  const topLoopGeo = new THREE.TorusGeometry(0.016, 0.004, 10, 20);
  const topLoop = new THREE.Mesh(topLoopGeo, stoneMat);
  topLoop.name = 'lantern_top_loop';
  topLoop.position.y = CAGE_TOP_Y + 0.022;
  topLoop.castShadow = true;
  topLoop.receiveShadow = true;
  group.add(topLoop);

  // 4. Internal Stem, Socket, and Emissive Bulb
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.08, 10);
  const stem = new THREE.Mesh(stemGeo, socketMat);
  stem.name = 'socket_stem';
  stem.position.y = CAGE_TOP_Y - 0.04;
  stem.castShadow = true;
  stem.receiveShadow = true;
  group.add(stem);

  const socketGeo = new THREE.CylinderGeometry(0.020, 0.022, 0.055, 16);
  const socket = new THREE.Mesh(socketGeo, socketMat);
  socket.name = 'lamp_socket';
  socket.position.y = CAGE_TOP_Y - 0.10;
  socket.castShadow = true;
  socket.receiveShadow = true;
  group.add(socket);

  const bulbGeo = new THREE.SphereGeometry(0.026, 16, 12);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.name = 'emit_bulb';
  bulb.scale.set(1, 1.35, 1);
  bulb.position.y = CAGE_TOP_Y - 0.155;
  bulb.castShadow = true;
  bulb.receiveShadow = true;
  group.add(bulb);

  // 5. Hanging Chain Links
  const chainStartY = CAGE_TOP_Y + 0.042;
  const chainEndY = CANOPY_Y - 0.012;
  const linkCount = 8;
  const linkStep = (chainEndY - chainStartY) / (linkCount - 1);
  const linkGeo = new THREE.TorusGeometry(0.015, 0.0035, 8, 18);

  for (let i = 0; i < linkCount; i++) {
    const link = new THREE.Mesh(linkGeo, stoneMat);
    link.name = `chain_link_${i + 1}`;
    link.position.y = chainStartY + i * linkStep;
    link.scale.set(0.75, 1.35, 1);
    link.rotation.y = (i % 2) * (Math.PI / 2);
    link.castShadow = true;
    link.receiveShadow = true;
    group.add(link);
  }

  // 6. Ceiling Canopy & Bottom Loop
  const canopyLoop = new THREE.Mesh(topLoopGeo, stoneMat);
  canopyLoop.name = 'canopy_loop';
  canopyLoop.position.y = CANOPY_Y - 0.008;
  canopyLoop.castShadow = true;
  canopyLoop.receiveShadow = true;
  group.add(canopyLoop);

  const canopyPoints = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.022, 0.006),
    new THREE.Vector2(0.032, 0.025),
    new THREE.Vector2(0.046, 0.058),
    new THREE.Vector2(0.068, 0.078),
    new THREE.Vector2(0.072, 0.088),
    new THREE.Vector2(0.072, CANOPY_H),
    new THREE.Vector2(0.001, CANOPY_H)
  ];
  const canopyGeo = new THREE.LatheGeometry(canopyPoints, 24);
  const canopy = new THREE.Mesh(canopyGeo, stoneMat);
  canopy.name = 'ceiling_canopy';
  canopy.position.y = CANOPY_Y;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(canopy);

  return group;
}
