function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.44;
  const D = 0.24;
  const H = 0.185;
  const SEAT_THICK = 0.022;
  const SEAT_RADIUS = 0.018;
  const SEAT_BEVEL = 0.005;

  const LEG_THICK = 0.018;
  const LEG_BEVEL = 0.003;
  const LEG_TOP_W = 0.175;
  const LEG_BOT_W = 0.205;
  const LEG_SPLAY = 0.20; // radians outward
  const LEG_INSET_X = 0.055; // distance from seat outer edge to leg top

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8a27a,
    roughness: 0.58,
    metalness: 0.02,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a049,
    roughness: 0.32,
    metalness: 0.85,
  });

  // Helper: rounded rectangle shape centered at (0, 0)
  function makeRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  }

  // 1. Seat
  const seatInnerW = W - SEAT_BEVEL * 2;
  const seatInnerD = D - SEAT_BEVEL * 2;
  const seatShape = makeRoundedRectShape(seatInnerW, seatInnerD, SEAT_RADIUS);
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_THICK - SEAT_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: SEAT_BEVEL,
    bevelSize: SEAT_BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  seatGeo.rotateX(Math.PI / 2);
  seatGeo.computeBoundingBox();
  const seatYOffset = -seatGeo.boundingBox.max.y + H;

  const seatMesh = new THREE.Mesh(seatGeo, woodMat);
  seatMesh.name = 'seat_top';
  seatMesh.position.set(0, seatYOffset, 0);
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  group.add(seatMesh);

  const seatBottomY = H - SEAT_THICK;

  // 2. Leg Panels (profile in X-Y plane, extruded along Z, then rotated to sit in Y-Z plane)
  // Vertical height of leg panel before splay
  const legHeight = seatBottomY / Math.cos(LEG_SPLAY) + 0.004;
  const hwTop = LEG_TOP_W / 2;
  const hwBot = LEG_BOT_W / 2;
  const footR = 0.014;
  const archH = 0.022;

  const legShape = new THREE.Shape();
  // Start at top-left
  legShape.moveTo(-hwTop, legHeight);
  legShape.lineTo(hwTop, legHeight);
  // Right edge down to bottom-right foot
  legShape.lineTo(hwBot, footR);
  legShape.quadraticCurveTo(hwBot, 0, hwBot - footR, 0);
  // Bottom arch cutout
  legShape.lineTo(hwBot - footR - 0.015, 0);
  legShape.quadraticCurveTo(0, archH * 2, -(hwBot - footR - 0.015), 0);
  legShape.lineTo(-(hwBot - footR), 0);
  // Bottom-left foot
  legShape.quadraticCurveTo(-hwBot, 0, -hwBot, footR);
  legShape.lineTo(-hwTop, legHeight);

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_THICK - LEG_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: LEG_BEVEL,
    bevelSize: LEG_BEVEL,
    bevelSegments: 3,
    curveSegments: 12,
  });
  // Center extrusion along Z, then rotate so width is along Z and thickness is along X
  legGeo.translate(0, 0, -(LEG_THICK - LEG_BEVEL * 2) / 2);
  legGeo.rotateY(Math.PI / 2);

  const legTopX = W / 2 - LEG_INSET_X;

  [-1, 1].forEach((side) => {
    const legMesh = new THREE.Mesh(legGeo, woodMat);
    legMesh.name = side < 0 ? 'leg_left' : 'leg_right';
    // Pivot at bottom-center of leg, or position top at seatBottomY
    // Since legShape has y=0 at bottom and y=legHeight at top:
    // Rotate around Z by -side * LEG_SPLAY so bottom splays outward
    legMesh.rotation.z = -side * LEG_SPLAY;
    // Compute X position so top of leg is at side * legTopX
    const topOffsetX = Math.sin(side * LEG_SPLAY) * legHeight;
    legMesh.position.set(side * legTopX + topOffsetX, 0.002, 0);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    // 3. Brass Hinges (front and back on each leg)
    const hingeZPositions = [LEG_TOP_W / 2 - 0.022, -(LEG_TOP_W / 2 - 0.022)];
    hingeZPositions.forEach((hz, idx) => {
      const tag = (side < 0 ? 'left' : 'right') + '_' + (idx === 0 ? 'front' : 'back');

      const barrelGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.026, 12);
      barrelGeo.rotateX(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, brassMat);
      barrel.name = 'hinge_barrel_' + tag;
      barrel.position.set(side * (legTopX - 0.01), seatBottomY - 0.003, hz);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      group.add(barrel);

      const plateSeatGeo = new THREE.BoxGeometry(0.016, 0.0025, 0.024);
      const plateSeat = new THREE.Mesh(plateSeatGeo, brassMat);
      plateSeat.name = 'hinge_plate_seat_' + tag;
      plateSeat.position.set(side * (legTopX - 0.018), seatBottomY - 0.0012, hz);
      plateSeat.castShadow = true;
      plateSeat.receiveShadow = true;
      group.add(plateSeat);

      const plateLegGeo = new THREE.BoxGeometry(0.0025, 0.016, 0.024);
      const plateLeg = new THREE.Mesh(plateLegGeo, brassMat);
      plateLeg.name = 'hinge_plate_leg_' + tag;
      plateLeg.rotation.z = -side * LEG_SPLAY;
      plateLeg.position.set(side * (legTopX - 0.008), seatBottomY - 0.010, hz);
      plateLeg.castShadow = true;
      plateLeg.receiveShadow = true;
      group.add(plateLeg);
    });
  });

  // Grounding & centering
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.set(-center.x, -box.min.y, -center.z);

  return group;
}
