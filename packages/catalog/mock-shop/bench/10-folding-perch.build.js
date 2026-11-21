function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const W = 0.44;
  const D = 0.19;
  const SEAT_H = 0.16;
  const SEAT_T = 0.022;
  const SEAT_R = 0.024;
  const SEAT_BEVEL = 0.004;
  const SEAT_BOTTOM_Y = SEAT_H - SEAT_T;

  const LEG_D = 0.165;
  const LEG_T = 0.020;
  const LEG_ANGLE = 0.34;
  const LEG_TOP_X = W / 2 - 0.055;
  const LEG_L = (SEAT_BOTTOM_Y - (LEG_T / 2) * Math.sin(LEG_ANGLE)) / Math.cos(LEG_ANGLE);

  const HINGE_W = 0.042;
  const HINGE_H = 0.036;
  const HINGE_T = 0.0025;
  const HINGE_BARREL_R = 0.0035;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4b895,
    roughness: 0.65,
    metalness: 0.0
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a951,
    roughness: 0.35,
    metalness: 0.85
  });

  // Helper: rounded rectangle shape
  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  // 1. Seat Top
  const seatShape = createRoundedRectShape(W - SEAT_BEVEL * 2, D - SEAT_BEVEL * 2, SEAT_R);
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_T - SEAT_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: SEAT_BEVEL,
    bevelSize: SEAT_BEVEL,
    bevelSegments: 3,
    curveSegments: 12
  });
  seatGeo.rotateX(Math.PI / 2);
  // Extrude goes from z=0 to z=depth; after rotateX(PI/2), y goes from 0 down to -depth.
  // Bevel adds SEAT_BEVEL on top and bottom. So top is at +SEAT_BEVEL.
  const seatMesh = new THREE.Mesh(seatGeo, woodMat);
  seatMesh.name = 'seat_top';
  seatMesh.position.set(0, SEAT_H - SEAT_BEVEL, 0);
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  group.add(seatMesh);

  // 2. Leg Panel Geometry (profile in ZY plane, extruded along X)
  // Shape in 2D: X = Z-axis of bench (-LEG_D/2 to +LEG_D/2), Y = local Y (-LEG_L to 0)
  const legShape = new THREE.Shape();
  const hd = LEG_D / 2 - 0.002;
  const footW = 0.036;
  const archH = 0.016;
  const archW = hd - footW;
  const rFoot = 0.010;

  legShape.moveTo(-hd, 0);
  legShape.lineTo(hd, 0);
  legShape.lineTo(hd, -LEG_L + rFoot);
  legShape.quadraticCurveTo(hd, -LEG_L, hd - rFoot, -LEG_L);
  legShape.lineTo(archW + rFoot, -LEG_L);
  legShape.quadraticCurveTo(archW, -LEG_L, archW, -LEG_L + archH * 0.6);
  legShape.quadraticCurveTo(0, -LEG_L + archH, -archW, -LEG_L + archH * 0.6);
  legShape.quadraticCurveTo(-archW, -LEG_L, -archW - rFoot, -LEG_L);
  legShape.lineTo(-hd + rFoot, -LEG_L);
  legShape.quadraticCurveTo(-hd, -LEG_L, -hd, -LEG_L + rFoot);
  legShape.closePath();

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_T - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 10
  });
  // Center extrusion along Z, then rotateY(PI/2) so extrusion is along X
  legGeo.translate(0, 0, -(LEG_T - 0.004) / 2);
  legGeo.rotateY(Math.PI / 2);

  // Helper to build a leg + its brass hinge
  function createLegAssembly(side) {
    const isRight = side === 'right';
    const sign = isRight ? 1 : -1;
    const legGroup = new THREE.Group();
    legGroup.position.set(sign * LEG_TOP_X, SEAT_BOTTOM_Y, 0);
    legGroup.rotation.z = sign * LEG_ANGLE;

    const legMesh = new THREE.Mesh(legGeo, woodMat);
    legMesh.name = side + '_leg';
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legGroup.add(legMesh);

    // Brass hinge on the outer face of the leg
    const outerX = sign * (LEG_T / 2 + HINGE_T / 2);
    const hingeBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(HINGE_BARREL_R, HINGE_BARREL_R, HINGE_W, 12),
      brassMat
    );
    hingeBarrel.name = side + '_hinge_barrel';
    hingeBarrel.rotation.x = Math.PI / 2;
    hingeBarrel.position.set(outerX, -0.004, 0);
    hingeBarrel.castShadow = true;
    hingeBarrel.receiveShadow = true;
    legGroup.add(hingeBarrel);

    const hingeLeafLeg = new THREE.Mesh(
      new THREE.BoxGeometry(HINGE_T, HINGE_H, HINGE_W),
      brassMat
    );
    hingeLeafLeg.name = side + '_hinge_leaf_leg';
    hingeLeafLeg.position.set(outerX, -0.004 - HINGE_H / 2, 0);
    hingeLeafLeg.castShadow = true;
    hingeLeafLeg.receiveShadow = true;
    legGroup.add(hingeLeafLeg);

    // 4 small brass screws on the hinge leaf
    const screwGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.002, 10);
    screwGeo.rotateZ(Math.PI / 2);
    const screwOffsets = [
      [-0.012, -0.012],
      [-0.012, 0.012],
      [-0.028, -0.012],
      [-0.028, 0.012]
    ];
    screwOffsets.forEach((off, idx) => {
      const screw = new THREE.Mesh(screwGeo, brassMat);
      screw.name = side + '_hinge_screw_' + (idx + 1);
      screw.position.set(outerX + sign * (HINGE_T / 2 + 0.0005), off[0], off[1]);
      screw.castShadow = true;
      screw.receiveShadow = true;
      legGroup.add(screw);
    });

    group.add(legGroup);
  }

  createLegAssembly('left');
  createLegAssembly('right');

  return group;
}
