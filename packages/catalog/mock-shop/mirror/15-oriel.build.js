function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.30;
  const H = 0.46;
  const D = 0.16;

  const PAD_H = 0.003;
  const BASE_W = 0.25;
  const BASE_D = D;
  const BASE_H = 0.012;

  const ARM_THICK = 0.008;
  const ARM_DEPTH = 0.018;
  const ARM_CORNER_R = 0.032;

  const MIRROR_W = 0.25;
  const MIRROR_H = 0.33;
  const FRAME_THICK = 0.012;
  const FRAME_DEPTH = 0.018;

  const PIVOT_Y = PAD_H + BASE_H + 0.265;
  const ARM_OUTER_HALF_W = MIRROR_W / 2 + 0.014;
  const ARM_INNER_HALF_W = ARM_OUTER_HALF_W - ARM_THICK;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a25d,
    metalness: 0.85,
    roughness: 0.28,
  });

  const darkPadMat = new THREE.MeshStandardMaterial({
    color: 0x1e1d1b,
    metalness: 0.05,
    roughness: 0.9,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1.0,
    roughness: 0.05,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base felt pad (y = 0 to PAD_H)
  const padGeo = new THREE.CylinderGeometry(1, 1, PAD_H, 32);
  padGeo.scale(BASE_W / 2 - 0.002, 1, BASE_D / 2 - 0.002);
  addMesh(padGeo, darkPadMat, 'base_felt_pad', 0, PAD_H / 2, 0);

  // 2. Oval brass base
  const baseGeo = new THREE.CylinderGeometry(1, 1, BASE_H, 32);
  baseGeo.scale(BASE_W / 2, 1, BASE_D / 2);
  addMesh(baseGeo, brassMat, 'base_plate', 0, PAD_H + BASE_H / 2, 0);

  // 3. U-shaped yoke arm (extruded in XY, centered in Z)
  const armBottomY = PAD_H + BASE_H - 0.001;
  const armTopY = PIVOT_Y;
  const rOut = ARM_CORNER_R;
  const rIn = ARM_CORNER_R - ARM_THICK;

  const armShape = new THREE.Shape();
  armShape.moveTo(-ARM_OUTER_HALF_W, armTopY);
  armShape.lineTo(-ARM_OUTER_HALF_W, armBottomY + rOut);
  armShape.absarc(
    -ARM_OUTER_HALF_W + rOut,
    armBottomY + rOut,
    rOut,
    Math.PI,
    Math.PI * 1.5,
    false
  );
  armShape.lineTo(ARM_OUTER_HALF_W - rOut, armBottomY);
  armShape.absarc(
    ARM_OUTER_HALF_W - rOut,
    armBottomY + rOut,
    rOut,
    Math.PI * 1.5,
    Math.PI * 2,
    false
  );
  armShape.lineTo(ARM_OUTER_HALF_W, armTopY);
  armShape.lineTo(ARM_INNER_HALF_W, armTopY);
  armShape.lineTo(ARM_INNER_HALF_W, armBottomY + rOut);
  armShape.absarc(
    ARM_OUTER_HALF_W - rOut,
    armBottomY + rOut,
    rIn,
    0,
    Math.PI * 1.5,
    true
  );
  armShape.lineTo(-ARM_OUTER_HALF_W + rOut, armBottomY + ARM_THICK);
  armShape.absarc(
    -ARM_OUTER_HALF_W + rOut,
    armBottomY + rOut,
    rIn,
    Math.PI * 1.5,
    Math.PI,
    true
  );
  armShape.lineTo(-ARM_INNER_HALF_W, armTopY);
  armShape.closePath();

  const armGeo = new THREE.ExtrudeGeometry(armShape, {
    depth: ARM_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 24,
  });
  armGeo.translate(0, 0, -ARM_DEPTH / 2);
  addMesh(armGeo, brassMat, 'yoke_arm', 0, 0, 0);

  // 4. Pivot pins, washers, and outer knobs
  const pinLen = ARM_OUTER_HALF_W - MIRROR_W / 2 + 0.004;
  const pinGeo = new THREE.CylinderGeometry(0.004, 0.004, pinLen, 16);
  pinGeo.rotateZ(Math.PI / 2);

  const washerGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.002, 20);
  washerGeo.rotateZ(Math.PI / 2);

  const knobGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.008, 24);
  knobGeo.rotateZ(Math.PI / 2);

  const pinX = (ARM_OUTER_HALF_W + MIRROR_W / 2) / 2;
  const washerX = ARM_INNER_HALF_W - 0.001;
  const knobX = ARM_OUTER_HALF_W + 0.004;

  addMesh(pinGeo, brassMat, 'pivot_pin_left', -pinX, PIVOT_Y, 0);
  addMesh(pinGeo, brassMat, 'pivot_pin_right', pinX, PIVOT_Y, 0);

  addMesh(washerGeo, brassMat, 'pivot_washer_left', -washerX, PIVOT_Y, 0);
  addMesh(washerGeo, brassMat, 'pivot_washer_right', washerX, PIVOT_Y, 0);

  addMesh(knobGeo, brassMat, 'pivot_knob_left', -knobX, PIVOT_Y, 0);
  addMesh(knobGeo, brassMat, 'pivot_knob_right', knobX, PIVOT_Y, 0);

  // 5. Oval mirror frame (outer rim)
  const rxOut = MIRROR_W / 2;
  const ryOut = MIRROR_H / 2;
  const rxIn = rxOut - FRAME_THICK;
  const ryIn = ryOut - FRAME_THICK;

  const frameShape = new THREE.Shape();
  frameShape.absellipse(0, 0, rxOut, ryOut, 0, Math.PI * 2, false, 0);
  const frameHole = new THREE.Path();
  frameHole.absellipse(0, 0, rxIn, ryIn, 0, Math.PI * 2, true, 0);
  frameShape.holes.push(frameHole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0015,
    bevelSegments: 3,
    curveSegments: 32,
  });
  frameGeo.translate(0, 0, -FRAME_DEPTH / 2);
  addMesh(frameGeo, brassMat, 'mirror_frame', 0, PIVOT_Y, 0);

  // 6. Mirror backing plate (-Z side)
  const backGeo = new THREE.CylinderGeometry(1, 1, 0.004, 32);
  backGeo.rotateX(Math.PI / 2);
  backGeo.scale(rxIn + 0.002, ryIn + 0.002, 1);
  addMesh(backGeo, brassMat, 'mirror_backing', 0, PIVOT_Y, -FRAME_DEPTH / 2 + 0.003);

  // 7. Mirror glass (+Z side)
  const glassGeo = new THREE.CylinderGeometry(1, 1, 0.003, 32);
  glassGeo.rotateX(Math.PI / 2);
  glassGeo.scale(rxIn + 0.001, ryIn + 0.001, 1);
  addMesh(glassGeo, mirrorMat, 'mirror_glass', 0, PIVOT_Y, FRAME_DEPTH / 2 - 0.003);

  return group;
}
