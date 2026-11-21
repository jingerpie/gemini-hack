function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.80; // total swag width
  const H = 0.55; // total height from lowest point (y=0) to swag ends
  const D = 0.02; // total depth
  const SWAG_TOP_Y = H;
  const SWAG_DROP = 0.24;
  const PENDANT_COUNT = 10;
  const STAR_R = 0.044;
  const MOON_R = 0.044;
  const PENDANT_D = 0.012;
  const BULB_R = 0.007;
  const WIRE_R = 0.0018;
  const CORD_R = 0.0025;

  // Materials
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.3,
    metalness: 0.8
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.65,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8bdc2,
    roughness: 0.25,
    metalness: 0.9
  });

  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0xffe4b5,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.72,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2
  });

  const emitBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffc966,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // Helper to create 5-pointed star shape centered at (0, 0)
  function createStarShape(outerR, innerR) {
    const shape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points + Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  // Helper to create crescent moon shape centered around (0, 0)
  function createMoonShape(r) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, r, Math.PI * 0.4, Math.PI * 1.6, false);
    shape.absarc(r * 0.42, 0, r * 0.78, Math.PI * 1.48, Math.PI * 0.52, true);
    shape.closePath();
    return shape;
  }

  const extrudeSettings = {
    depth: PENDANT_D,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 16
  };

  const starGeo = new THREE.ExtrudeGeometry(
    createStarShape(STAR_R, STAR_R * 0.46),
    extrudeSettings
  );
  starGeo.translate(0, 0, -PENDANT_D / 2);

  const moonGeo = new THREE.ExtrudeGeometry(
    createMoonShape(MOON_R),
    extrudeSettings
  );
  moonGeo.translate(0, 0, -PENDANT_D / 2);

  const bulbGeo = new THREE.SphereGeometry(BULB_R, 12, 10);

  // Catenary curve helper
  function getSwagY(x) {
    const t = x / (W / 2); // -1 to 1
    return SWAG_TOP_Y - SWAG_DROP * (1 - t * t);
  }

  // Main catenary wire
  const wirePoints = [];
  const wireSegments = 32;
  for (let i = 0; i <= wireSegments; i++) {
    const t = i / wireSegments;
    const x = -W / 2 + t * W;
    const y = getSwagY(x);
    wirePoints.push(new THREE.Vector3(x, y, -D / 2 + WIRE_R));
  }
  const wireCurve = new THREE.CatmullRomCurve3(wirePoints);
  const wireGeo = new THREE.TubeGeometry(wireCurve, 32, WIRE_R, 8, false);
  const wireMesh = new THREE.Mesh(wireGeo, wireMat);
  wireMesh.name = "main_swag_wire";
  wireMesh.castShadow = true;
  wireMesh.receiveShadow = true;
  group.add(wireMesh);

  // Pendants along the swag
  for (let i = 0; i < PENDANT_COUNT; i++) {
    const t = (i + 0.5) / PENDANT_COUNT;
    const x = -W / 2 + t * W;
    const wireY = getSwagY(x);
    const isStar = i % 2 === 0;
    const pendantY = wireY - (isStar ? STAR_R : MOON_R) * 0.85;
    const zPos = 0;

    const pendantMesh = new THREE.Mesh(isStar ? starGeo : moonGeo, acrylicMat);
    pendantMesh.name = isStar ? `star_pendant_${i + 1}` : `moon_pendant_${i + 1}`;
    pendantMesh.position.set(x, pendantY, zPos);
    pendantMesh.castShadow = true;
    pendantMesh.receiveShadow = true;
    group.add(pendantMesh);

    const bulbMesh = new THREE.Mesh(bulbGeo, emitBulbMat);
    bulbMesh.name = `emit_bulb_${i + 1}`;
    bulbMesh.position.set(x, pendantY + (isStar ? STAR_R * 0.25 : MOON_R * 0.3), zPos);
    bulbMesh.castShadow = true;
    bulbMesh.receiveShadow = true;
    group.add(bulbMesh);
  }

  // Power cord hanging down on the right side to y = 0
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(W / 2, SWAG_TOP_Y, -D / 2 + CORD_R),
    new THREE.Vector3(W / 2 + 0.015, SWAG_TOP_Y * 0.65, -D / 2 + CORD_R),
    new THREE.Vector3(W / 2 - 0.01, SWAG_TOP_Y * 0.3, -D / 2 + CORD_R),
    new THREE.Vector3(W / 2, 0.045, -D / 2 + CORD_R)
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 20, CORD_R, 8, false);
  const cordMesh = new THREE.Mesh(cordGeo, cordMat);
  cordMesh.name = "power_cord";
  cordMesh.castShadow = true;
  cordMesh.receiveShadow = true;
  group.add(cordMesh);

  // Inline switch box on the power cord
  const switchBoxGeo = new THREE.BoxGeometry(0.018, 0.048, 0.012);
  const switchBoxMesh = new THREE.Mesh(switchBoxGeo, cordMat);
  switchBoxMesh.name = "inline_switch_box";
  switchBoxMesh.position.set(W / 2 - 0.005, SWAG_TOP_Y * 0.32, -D / 2 + 0.006);
  switchBoxMesh.castShadow = true;
  switchBoxMesh.receiveShadow = true;
  group.add(switchBoxMesh);

  // USB plug body at the bottom of the power cord (touching y = 0)
  const usbBodyGeo = new THREE.BoxGeometry(0.016, 0.03, 0.009);
  const usbBodyMesh = new THREE.Mesh(usbBodyGeo, cordMat);
  usbBodyMesh.name = "usb_plug_body";
  usbBodyMesh.position.set(W / 2, 0.03, -D / 2 + 0.0045);
  usbBodyMesh.castShadow = true;
  usbBodyMesh.receiveShadow = true;
  group.add(usbBodyMesh);

  // USB metal connector tip touching y = 0
  const usbTipGeo = new THREE.BoxGeometry(0.012, 0.015, 0.005);
  const usbTipMesh = new THREE.Mesh(usbTipGeo, metalMat);
  usbTipMesh.name = "usb_metal_connector";
  usbTipMesh.position.set(W / 2, 0.0075, -D / 2 + 0.0045);
  usbTipMesh.castShadow = true;
  usbTipMesh.receiveShadow = true;
  group.add(usbTipMesh);

  return group;
}
