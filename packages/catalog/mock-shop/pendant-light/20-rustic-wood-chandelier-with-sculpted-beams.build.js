function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.82;
  const D = 0.82;
  const H = 0.58;

  const RING_OUTER_R = 0.38;
  const RING_INNER_R = 0.33;
  const RING_H = 0.045;

  const CANOPY_R = 0.11;
  const CANOPY_H = 0.032;

  const ARM_COUNT = 8;
  const BEAM_THICK = 0.028;
  const BEAM_WIDTH = 0.032;

  const CANDLE_R = 0.015;
  const CANDLE_H = 0.095;
  const BOBECHE_R = 0.030;
  const BOBECHE_H = 0.014;
  const BULB_R = 0.014;
  const BULB_H = 0.055;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f52,
    roughness: 0.78,
    metalness: 0.04,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.55,
    metalness: 0.65,
  });

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xb8966e,
    roughness: 0.65,
    metalness: 0.02,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Ceiling canopy plate (at y = H - CANOPY_H to H)
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 32);
  const canopy = new THREE.Mesh(canopyGeo, woodMat);
  canopy.name = 'ceiling_canopy';
  canopy.position.set(0, H - CANOPY_H / 2, 0);
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(canopy);

  // 2. Bottom circular wooden ring (at y = 0 to RING_H)
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, RING_OUTER_R, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, RING_INNER_R, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: RING_H,
    bevelEnabled: false,
    curveSegments: 32,
  });
  ringGeo.rotateX(-Math.PI / 2);
  const bottomRing = new THREE.Mesh(ringGeo, woodMat);
  bottomRing.name = 'bottom_wood_ring';
  bottomRing.position.set(0, 0, 0);
  bottomRing.castShadow = true;
  bottomRing.receiveShadow = true;
  group.add(bottomRing);

  // 3. Sculpted curved beam geometry (in XY plane, extruded along Z)
  const beamTopY = H - CANOPY_H + 0.005;
  const beamBotY = RING_H - 0.005;
  const beamTopInnerX = 0.032;
  const beamTopOuterX = beamTopInnerX + BEAM_WIDTH;
  const beamBotOuterX = RING_OUTER_R + 0.018;
  const beamBotInnerX = beamBotOuterX - BEAM_WIDTH * 1.3;

  const beamShape = new THREE.Shape();
  beamShape.moveTo(beamTopInnerX, beamTopY);
  beamShape.lineTo(beamTopOuterX, beamTopY);
  beamShape.quadraticCurveTo(
    beamTopOuterX + 0.02,
    beamBotY + (beamTopY - beamBotY) * 0.25,
    beamBotOuterX,
    beamBotY
  );
  beamShape.lineTo(beamBotInnerX, beamBotY);
  beamShape.quadraticCurveTo(
    beamTopInnerX + 0.015,
    beamBotY + (beamTopY - beamBotY) * 0.28,
    beamTopInnerX,
    beamTopY
  );

  const beamGeo = new THREE.ExtrudeGeometry(beamShape, {
    depth: BEAM_THICK,
    bevelEnabled: false,
    curveSegments: 24,
  });
  beamGeo.translate(0, 0, -BEAM_THICK / 2);

  // Shared geometries for bobeche, candle sleeve, and flame bulb
  const bobechePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BOBECHE_R * 0.55, 0),
    new THREE.Vector2(BOBECHE_R, BOBECHE_H),
    new THREE.Vector2(BOBECHE_R * 0.85, BOBECHE_H),
    new THREE.Vector2(CANDLE_R, 0.003),
    new THREE.Vector2(0, 0.003),
  ];
  const bobecheGeo = new THREE.LatheGeometry(bobechePoints, 20);

  const candleGeo = new THREE.CylinderGeometry(CANDLE_R, CANDLE_R, CANDLE_H, 16);

  const bulbPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(BULB_R * 0.65, BULB_H * 0.15),
    new THREE.Vector2(BULB_R, BULB_H * 0.42),
    new THREE.Vector2(BULB_R * 0.55, BULB_H * 0.78),
    new THREE.Vector2(0, BULB_H),
  ];
  const bulbGeo = new THREE.LatheGeometry(bulbPoints, 16);

  const candleRadius = (RING_OUTER_R + RING_INNER_R) / 2 + 0.012;

  for (let i = 0; i < ARM_COUNT; i++) {
    const angle = (i / ARM_COUNT) * Math.PI * 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Sculpted beam
    const beam = new THREE.Mesh(beamGeo, woodMat);
    beam.name = `sculpted_beam_${i + 1}`;
    beam.rotation.y = angle;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Candle position on top of ring
    const cx = cosA * candleRadius;
    const cz = -sinA * candleRadius;

    // Bobeche cup
    const bobeche = new THREE.Mesh(bobecheGeo, ironMat);
    bobeche.name = `bobeche_${i + 1}`;
    bobeche.position.set(cx, RING_H, cz);
    bobeche.castShadow = true;
    bobeche.receiveShadow = true;
    group.add(bobeche);

    // Candle sleeve
    const candle = new THREE.Mesh(candleGeo, waxMat);
    candle.name = `candle_sleeve_${i + 1}`;
    candle.position.set(cx, RING_H + 0.003 + CANDLE_H / 2, cz);
    candle.castShadow = true;
    candle.receiveShadow = true;
    group.add(candle);

    // Emissive flame bulb
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.name = `emit_bulb_${i + 1}`;
    bulb.position.set(cx, RING_H + 0.003 + CANDLE_H - 0.002, cz);
    bulb.castShadow = true;
    bulb.receiveShadow = true;
    group.add(bulb);
  }

  return group;
}
