function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.78;
  const H = 0.78;
  const D = 0.82;
  const SEAT_H = 0.42;
  const FRAME_T = 0.044; // thickness of side frame
  const LEG_W = 0.048;
  const ARM_H = 0.54;
  const SEAT_TILT = -0.10; // radians, tilts back
  const BACK_TILT = -0.28; // radians, tilts back

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc49768,
    roughness: 0.58,
    metalness: 0.02,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xede8de,
    roughness: 0.92,
    metalness: 0.0,
  });

  // Helper to create a rounded-corner ExtrudeGeometry cushion
  function createCushionGeo(width, height, depth, radius, bevel) {
    const hw = width / 2 - radius;
    const hh = height / 2 - radius;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -height / 2);
    shape.lineTo(hw, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -hh);
    shape.lineTo(width / 2, hh);
    shape.quadraticCurveTo(width / 2, height / 2, hw, height / 2);
    shape.lineTo(-hw, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, hh);
    shape.lineTo(-width / 2, -hh);
    shape.quadraticCurveTo(-width / 2, -height / 2, -hw, -height / 2);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }

  // Side frame profile in 2D (X = Z-axis from back to front, Y = height)
  // Front is +Z (right side of 2D shape), Back is -Z (left side of 2D shape)
  const zFront = D / 2 - 0.04;
  const zBack = -D / 2 + 0.04;

  const sideShape = new THREE.Shape();
  // Start at bottom of front leg
  sideShape.moveTo(zFront - 0.02, 0);
  sideShape.lineTo(zFront + 0.022, 0);
  // Front leg outer edge up to armrest curve
  sideShape.lineTo(zFront - 0.01, ARM_H - 0.05);
  sideShape.quadraticCurveTo(zFront - 0.015, ARM_H + 0.01, zFront - 0.07, ARM_H + 0.01);
  // Armrest top edge sloping slightly down toward back
  sideShape.lineTo(zBack + 0.14, ARM_H + 0.045);
  // Backrest stile extending up
  sideShape.lineTo(zBack + 0.02, H - 0.08);
  sideShape.quadraticCurveTo(zBack + 0.01, H - 0.06, zBack - 0.025, H - 0.07);
  // Backrest outer edge down to rear leg
  sideShape.lineTo(zBack + 0.04, 0.25);
  sideShape.lineTo(zBack - 0.01, 0);
  // Bottom of rear leg
  sideShape.lineTo(zBack + 0.032, 0);
  // Rear leg inner edge up to side rail
  sideShape.lineTo(zBack + 0.07, 0.21);
  // Side rail bottom edge
  sideShape.lineTo(zFront - 0.045, 0.25);
  // Front leg inner edge down to floor
  sideShape.lineTo(zFront - 0.02, 0);

  // Inner cutout hole of side frame
  const hole = new THREE.Path();
  hole.moveTo(zFront - 0.045, 0.30);
  hole.lineTo(zFront - 0.055, ARM_H - 0.04);
  hole.quadraticCurveTo(zFront - 0.06, ARM_H - 0.025, zFront - 0.09, ARM_H - 0.025);
  hole.lineTo(zBack + 0.14, ARM_H + 0.005);
  hole.lineTo(zBack + 0.08, 0.26);
  hole.lineTo(zFront - 0.045, 0.30);
  sideShape.holes.push(hole);

  const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: FRAME_T - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Rotate so 2D X becomes +Z, 2D Y stays +Y, extrusion is along X
  sideGeo.rotateY(-Math.PI / 2);

  const sideXOffset = W / 2 - FRAME_T / 2;

  const leftFrame = new THREE.Mesh(sideGeo, oakMat);
  leftFrame.name = 'left_side_frame';
  leftFrame.position.x = -sideXOffset + FRAME_T / 2;
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  group.add(leftFrame);

  const rightFrame = new THREE.Mesh(sideGeo, oakMat);
  rightFrame.name = 'right_side_frame';
  rightFrame.position.x = sideXOffset + FRAME_T / 2;
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  group.add(rightFrame);

  // Cross rails (front & rear under seat)
  const innerW = W - FRAME_T * 2;
  const railGeo = new THREE.BoxGeometry(innerW + 0.01, 0.042, 0.036);

  const frontRail = new THREE.Mesh(railGeo, oakMat);
  frontRail.name = 'front_seat_rail';
  frontRail.position.set(0, 0.275, zFront - 0.035);
  frontRail.castShadow = true;
  frontRail.receiveShadow = true;
  group.add(frontRail);

  const rearRail = new THREE.Mesh(railGeo, oakMat);
  rearRail.name = 'rear_seat_rail';
  rearRail.position.set(0, 0.235, zBack + 0.075);
  rearRail.castShadow = true;
  rearRail.receiveShadow = true;
  group.add(rearRail);

  // Seat slats
  const slatCount = 5;
  const slatGeo = new THREE.BoxGeometry(0.055, 0.016, 0.62);
  for (let i = 0; i < slatCount; i++) {
    const t = i / (slatCount - 1) - 0.5;
    const slat = new THREE.Mesh(slatGeo, oakMat);
    slat.name = `seat_slat_${i + 1}`;
    slat.position.set(t * (innerW - 0.10), 0.268, 0.02);
    slat.rotation.x = SEAT_TILT;
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }

  // Backrest cross rails
  const backTopRailGeo = new THREE.BoxGeometry(innerW + 0.01, 0.045, 0.028);
  const backTopRail = new THREE.Mesh(backTopRailGeo, oakMat);
  backTopRail.name = 'backrest_top_rail';
  backTopRail.position.set(0, H - 0.11, zBack + 0.01);
  backTopRail.rotation.x = BACK_TILT;
  backTopRail.castShadow = true;
  backTopRail.receiveShadow = true;
  group.add(backTopRail);

  const backMidRail = new THREE.Mesh(backTopRailGeo, oakMat);
  backMidRail.name = 'backrest_mid_rail';
  backMidRail.position.set(0, 0.45, zBack + 0.07);
  backMidRail.rotation.x = BACK_TILT;
  backMidRail.castShadow = true;
  backMidRail.receiveShadow = true;
  group.add(backMidRail);

  // Seat Cushion
  const seatCushionW = innerW - 0.012;
  const seatCushionD = 0.64;
  const seatCushionH = 0.135;
  const seatCushionGeo = createCushionGeo(seatCushionW, seatCushionD, seatCushionH, 0.03, 0.028);
  seatCushionGeo.rotateX(Math.PI / 2);

  const seatCushion = new THREE.Mesh(seatCushionGeo, fabricMat);
  seatCushion.name = 'seat_cushion';
  seatCushion.position.set(0, SEAT_H - seatCushionH / 2 - 0.01, 0.035);
  seatCushion.rotation.x = SEAT_TILT;
  seatCushion.castShadow = true;
  seatCushion.receiveShadow = true;
  group.add(seatCushion);

  // Backrest Cushion
  const backCushionW = innerW - 0.016;
  const backCushionH = 0.42;
  const backCushionD = 0.135;
  const backCushionGeo = createCushionGeo(backCushionW, backCushionH, backCushionD, 0.035, 0.028);

  const backCushion = new THREE.Mesh(backCushionGeo, fabricMat);
  backCushion.name = 'backrest_cushion';
  backCushion.position.set(0, 0.565, -0.175);
  backCushion.rotation.x = BACK_TILT;
  backCushion.castShadow = true;
  backCushion.receiveShadow = true;
  group.add(backCushion);

  return group;
}
