function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.35;
  const D = 0.35;
  const CAGE_H = 0.42;
  const TOTAL_H = 0.88;
  const BAR_T = 0.014;
  const CROSS_T = 0.008;
  const CANOPY_R = 0.055;
  const CANOPY_H = 0.024;
  const HUB_Y = 0.095;
  const ARM_R = 0.072;
  const SLEEVE_R = 0.009;
  const SLEEVE_H = 0.068;
  const BULB_R = 0.0095;
  const BULB_H = 0.036;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a358,
    roughness: 0.32,
    metalness: 0.85
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e5,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Ceiling canopy (lathe with bottom collar)
  const canopyPts = [
    new THREE.Vector2(0, TOTAL_H),
    new THREE.Vector2(CANOPY_R, TOTAL_H),
    new THREE.Vector2(CANOPY_R, TOTAL_H - CANOPY_H * 0.7),
    new THREE.Vector2(CANOPY_R * 0.88, TOTAL_H - CANOPY_H),
    new THREE.Vector2(0.012, TOTAL_H - CANOPY_H),
    new THREE.Vector2(0.012, TOTAL_H - CANOPY_H - 0.01),
    new THREE.Vector2(0, TOTAL_H - CANOPY_H - 0.01)
  ];
  const canopyGeo = new THREE.LatheGeometry(canopyPts, 24);
  addMesh(canopyGeo, brassMat, "ceiling_canopy", 0, 0, 0);

  // 2. Lantern frame: 4 vertical corner posts
  const halfW = W / 2 - BAR_T / 2;
  const halfD = D / 2 - BAR_T / 2;
  const postGeo = new THREE.BoxGeometry(BAR_T, CAGE_H, BAR_T);
  const corners = [
    [-halfW, -halfD, "post_back_left"],
    [halfW, -halfD, "post_back_right"],
    [-halfW, halfD, "post_front_left"],
    [halfW, halfD, "post_front_right"]
  ];
  for (let i = 0; i < corners.length; i++) {
    addMesh(postGeo, brassMat, corners[i][2], corners[i][0], CAGE_H / 2, corners[i][1]);
  }

  // 3. Horizontal frame bars (4 bottom, 4 top)
  const barXGeo = new THREE.BoxGeometry(W - BAR_T * 2, BAR_T, BAR_T);
  const barZGeo = new THREE.BoxGeometry(BAR_T, BAR_T, D - BAR_T * 2);

  addMesh(barXGeo, brassMat, "bottom_bar_front", 0, BAR_T / 2, halfD);
  addMesh(barXGeo, brassMat, "bottom_bar_back", 0, BAR_T / 2, -halfD);
  addMesh(barZGeo, brassMat, "bottom_bar_left", -halfW, BAR_T / 2, 0);
  addMesh(barZGeo, brassMat, "bottom_bar_right", halfW, BAR_T / 2, 0);

  const topBarY = CAGE_H - BAR_T / 2;
  addMesh(barXGeo, brassMat, "top_bar_front", 0, topBarY, halfD);
  addMesh(barXGeo, brassMat, "top_bar_back", 0, topBarY, -halfD);
  addMesh(barZGeo, brassMat, "top_bar_left", -halfW, topBarY, 0);
  addMesh(barZGeo, brassMat, "top_bar_right", halfW, topBarY, 0);

  // 4. Top crossbars
  const crossXGeo = new THREE.BoxGeometry(W - BAR_T * 2, CROSS_T, CROSS_T);
  const crossZGeo = new THREE.BoxGeometry(CROSS_T, CROSS_T, D - BAR_T * 2);
  addMesh(crossXGeo, brassMat, "top_crossbar_x", 0, topBarY, 0);
  addMesh(crossZGeo, brassMat, "top_crossbar_z", 0, topBarY, 0);

  // 5. Top suspension loop
  const loopGeo = new THREE.TorusGeometry(0.016, 0.0035, 10, 20);
  addMesh(loopGeo, brassMat, "top_suspension_loop", 0, CAGE_H + 0.012, 0);

  // 6. Chain links connecting canopy to top loop
  const chainStart = CAGE_H + 0.024;
  const chainEnd = TOTAL_H - CANOPY_H - 0.008;
  const numLinks = 5;
  const linkStep = (chainEnd - chainStart) / numLinks;
  const linkGeo = new THREE.TorusGeometry(linkStep * 0.42, 0.003, 8, 16);
  for (let i = 0; i < numLinks; i++) {
    const ly = chainStart + (i + 0.5) * linkStep;
    const ry = (i % 2 === 0) ? 0 : Math.PI / 2;
    addMesh(linkGeo, brassMat, "chain_link_" + (i + 1), 0, ly, 0, 0, ry, 0);
  }

  // 7. Central stem and bottom hub (LatheGeometry)
  const stemPts = [
    new THREE.Vector2(0.0055, topBarY),
    new THREE.Vector2(0.0055, HUB_Y + 0.014),
    new THREE.Vector2(0.018, HUB_Y + 0.014),
    new THREE.Vector2(0.018, HUB_Y - 0.012),
    new THREE.Vector2(0.009, HUB_Y - 0.012),
    new THREE.Vector2(0.009, HUB_Y - 0.022),
    new THREE.Vector2(0, HUB_Y - 0.022)
  ];
  const stemGeo = new THREE.LatheGeometry(stemPts, 20);
  addMesh(stemGeo, brassMat, "central_stem_hub", 0, 0, 0);

  // 8. Six candelabra arms, candle sleeves, and emit_ bulbs
  const sleeveGeo = new THREE.CylinderGeometry(SLEEVE_R, SLEEVE_R, SLEEVE_H, 16);
  const bulbPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BULB_R * 0.7, 0.004),
    new THREE.Vector2(BULB_R, BULB_H * 0.35),
    new THREE.Vector2(BULB_R * 0.55, BULB_H * 0.78),
    new THREE.Vector2(0, BULB_H)
  ];
  const bulbGeo = new THREE.LatheGeometry(bulbPts, 16);

  const numArms = 6;
  for (let i = 0; i < numArms; i++) {
    const angle = (i / numArms) * Math.PI * 2 + Math.PI / 6;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // L-shaped arm from hub to candle base
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cosA * 0.016, HUB_Y, sinA * 0.016),
      new THREE.Vector3(cosA * ARM_R, HUB_Y, sinA * ARM_R),
      new THREE.Vector3(cosA * ARM_R, HUB_Y + 0.022, sinA * ARM_R)
    ]);
    const armGeo = new THREE.TubeGeometry(curve, 12, 0.0038, 8, false);
    addMesh(armGeo, brassMat, "candelabra_arm_" + (i + 1), 0, 0, 0);

    const cx = cosA * ARM_R;
    const cz = sinA * ARM_R;
    const sleeveY = HUB_Y + 0.022 + SLEEVE_H / 2;
    addMesh(sleeveGeo, brassMat, "candle_sleeve_" + (i + 1), cx, sleeveY, cz);

    const bulbY = HUB_Y + 0.022 + SLEEVE_H - 0.002;
    addMesh(bulbGeo, bulbMat, "emit_bulb_" + (i + 1), cx, bulbY, cz);
  }

  return group;
}
