function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 1.95;              // Total height
  const BASE_W = 0.32;         // Marble base width (X)
  const BASE_D = 0.42;         // Marble base depth (Z)
  const BASE_H = 0.055;        // Marble base height (Y)
  const TUBE_R = 0.011;        // Arc tube radius
  const SHADE_R = 0.21;        // Shade outer radius
  const SHADE_H = 0.125;       // Shade dome height
  const CORD_DROP = 0.13;      // Vertical cord drop from arc tip to shade neck

  // Materials
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xd8d3c8,
    roughness: 0.65,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.28,
    metalness: 0.85,
  });

  const brassInnerMat = new THREE.MeshStandardMaterial({
    color: 0xe2c275,
    roughness: 0.35,
    metalness: 0.75,
    side: THREE.DoubleSide,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.75,
    metalness: 0.05,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Helper to create and configure a mesh
  function makeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Arc curve definition in local coordinates (before Z-centering)
  // Base center at local z = 0, arc sweeps back (-Z) then forward (+Z)
  const arcPoints = [
    new THREE.Vector3(0, BASE_H + TUBE_R * 1.1, 0.04),
    new THREE.Vector3(0, BASE_H + TUBE_R * 1.2, -0.06),
    new THREE.Vector3(0, 0.24, -0.34),
    new THREE.Vector3(0, 0.65, -0.58),
    new THREE.Vector3(0, 1.15, -0.62),
    new THREE.Vector3(0, 1.58, -0.44),
    new THREE.Vector3(0, 1.84, -0.10),
    new THREE.Vector3(0, H - 0.02, 0.24),
  ];
  const arcCurve = new THREE.CatmullRomCurve3(arcPoints);

  // Compute Z-centering offset so bounding box is centered on z = 0
  const minZ = -0.62 - TUBE_R;
  const maxZ = 0.24 + SHADE_R;
  const zOffset = -(minZ + maxZ) / 2;

  const lampGroup = new THREE.Group();
  lampGroup.position.z = zOffset;
  group.add(lampGroup);

  // 1. Marble Base
  const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
  const baseMesh = makeMesh(baseGeo, marbleMat, 'marble_base');
  baseMesh.position.set(0, BASE_H / 2, 0);
  lampGroup.add(baseMesh);

  // 2. Brass Mounting Block on Base
  const mountBlockGeo = new THREE.BoxGeometry(0.044, 0.032, 0.055);
  const mountBlock = makeMesh(mountBlockGeo, brassMat, 'base_brass_mount');
  mountBlock.position.set(0, BASE_H + 0.014, -0.02);
  lampGroup.add(mountBlock);

  // Brass End Cap at start of arc
  const startCapGeo = new THREE.CylinderGeometry(TUBE_R * 1.15, TUBE_R * 1.15, 0.02, 16);
  const startCap = makeMesh(startCapGeo, brassMat, 'arc_start_cap');
  startCap.rotation.x = Math.PI / 2;
  startCap.position.set(0, BASE_H + TUBE_R * 1.1, 0.04);
  lampGroup.add(startCap);

  // 3. Main Brass Arc Tube
  const arcGeo = new THREE.TubeGeometry(arcCurve, 64, TUBE_R, 16, false);
  const arcMesh = makeMesh(arcGeo, brassMat, 'brass_arc_stem');
  lampGroup.add(arcMesh);

  // 4. Telescoping Joint Collars along the arc
  const collarTs = [0.46, 0.72];
  collarTs.forEach((t, idx) => {
    const pt = arcCurve.getPointAt(t);
    const tangent = arcCurve.getTangentAt(t).normalize();
    const collarGeo = new THREE.CylinderGeometry(TUBE_R * 1.35, TUBE_R * 1.35, 0.024, 16);
    const collar = makeMesh(collarGeo, brassMat, `arc_joint_collar_${idx + 1}`);
    collar.position.copy(pt);
    collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    lampGroup.add(collar);
  });

  // 5. Top Tip Elbow & Cap
  const tipPt = arcCurve.getPointAt(1.0);
  const elbowGeo = new THREE.CylinderGeometry(TUBE_R * 1.2, TUBE_R * 1.2, 0.032, 16);
  const elbow = makeMesh(elbowGeo, brassMat, 'arc_top_elbow');
  elbow.position.set(tipPt.x, tipPt.y - 0.008, tipPt.z);
  lampGroup.add(elbow);

  // 6. Pendant Cord
  const cordTopY = tipPt.y - 0.02;
  const cordGeo = new THREE.CylinderGeometry(0.0035, 0.0035, CORD_DROP, 10);
  const pendantCord = makeMesh(cordGeo, cordMat, 'pendant_cord');
  pendantCord.position.set(tipPt.x, cordTopY - CORD_DROP / 2, tipPt.z);
  lampGroup.add(pendantCord);

  // 7. Shade Neck / Socket Housing
  const neckH = 0.048;
  const neckY = cordTopY - CORD_DROP;
  const neckGeo = new THREE.CylinderGeometry(0.022, 0.026, neckH, 24);
  const shadeNeck = makeMesh(neckGeo, brassMat, 'shade_neck');
  shadeNeck.position.set(tipPt.x, neckY - neckH / 2, tipPt.z);
  lampGroup.add(shadeNeck);

  // 8. Dome Shade (LatheGeometry)
  const shadeTopY = neckY - neckH + 0.008;
  const lathePts = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * (Math.PI / 2);
    const r = 0.022 + Math.sin(angle) * (SHADE_R - 0.022);
    const y = -SHADE_H * (1 - Math.cos(angle));
    lathePts.push(new THREE.Vector2(r, y));
  }
  const shadeGeo = new THREE.LatheGeometry(lathePts, 32);
  const shadeMesh = makeMesh(shadeGeo, brassMat, 'brass_dome_shade');
  shadeMesh.position.set(tipPt.x, shadeTopY, tipPt.z);
  lampGroup.add(shadeMesh);

  // Inner reflective lining of shade
  const innerLathePts = lathePts.map(
    (p) => new THREE.Vector2(Math.max(0.01, p.x - 0.002), p.y - 0.002)
  );
  const innerShadeGeo = new THREE.LatheGeometry(innerLathePts, 32);
  const innerShade = makeMesh(innerShadeGeo, brassInnerMat, 'shade_inner_lining');
  innerShade.position.copy(shadeMesh.position);
  lampGroup.add(innerShade);

  // 9. Light Bulb inside shade
  const bulbGeo = new THREE.SphereGeometry(0.032, 16, 16);
  const bulb = makeMesh(bulbGeo, bulbMat, 'light_bulb');
  bulb.position.set(tipPt.x, shadeTopY - SHADE_H * 0.65, tipPt.z);
  lampGroup.add(bulb);

  // 10. Floor Power Cord & Foot Switch
  const floorCordPts = [
    new THREE.Vector3(0, 0.015, -BASE_D * 0.48),
    new THREE.Vector3(-0.04, 0.004, -BASE_D * 0.62),
    new THREE.Vector3(-0.18, 0.004, -BASE_D * 0.85),
    new THREE.Vector3(-0.35, 0.004, -BASE_D * 0.95),
  ];
  const floorCordCurve = new THREE.CatmullRomCurve3(floorCordPts);
  const floorCordGeo = new THREE.TubeGeometry(floorCordCurve, 24, 0.004, 8, false);
  const floorCord = makeMesh(floorCordGeo, cordMat, 'floor_power_cord');
  lampGroup.add(floorCord);

  // Foot Switch
  const switchPos = floorCordPts[floorCordPts.length - 1];
  const switchBodyGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.016, 20);
  const switchBody = makeMesh(switchBodyGeo, cordMat, 'foot_switch_body');
  switchBody.position.set(switchPos.x, 0.008, switchPos.z);
  lampGroup.add(switchBody);

  const switchBtnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 16);
  const switchBtn = makeMesh(switchBtnGeo, cordMat, 'foot_switch_button');
  switchBtn.position.set(switchPos.x, 0.018, switchPos.z);
  lampGroup.add(switchBtn);

  return group;
}
