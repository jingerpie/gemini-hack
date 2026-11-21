function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const DIAMETER = 0.50;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.055;
  const RIM_THICKNESS = 0.012;
  const INNER_RADIUS = RADIUS - RIM_THICKNESS;
  const DIAL_THICKNESS = 0.014;
  const DIAL_Z = -DEPTH / 2 + DIAL_THICKNESS / 2;
  const TICK_LENGTH = 0.036;
  const TICK_WIDTH = 0.005;
  const TICK_DEPTH = 0.003;
  const TICK_RADIUS = INNER_RADIUS - 0.012 - TICK_LENGTH / 2;
  const HOUR_LEN = 0.145;
  const HOUR_TAIL = 0.032;
  const HOUR_WIDTH = 0.011;
  const MIN_LEN = 0.195;
  const MIN_TAIL = 0.038;
  const MIN_WIDTH = 0.009;
  const HAND_DEPTH = 0.003;
  const CENTER_Y = RADIUS;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x627c8d,
    roughness: 0.65,
    metalness: 0.05
  });

  const tickMat = new THREE.MeshStandardMaterial({
    color: 0x22272b,
    roughness: 0.5,
    metalness: 0.1
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xe6e6e0,
    roughness: 0.4,
    metalness: 0.05
  });

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0ca,
    roughness: 0.3,
    metalness: 0.4
  });

  // 1. Dial backplate
  const dialGeo = new THREE.CylinderGeometry(INNER_RADIUS + 0.002, INNER_RADIUS + 0.002, DIAL_THICKNESS, 32);
  const dial = new THREE.Mesh(dialGeo, bodyMat);
  dial.name = "clock_dial";
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, CENTER_Y, DIAL_Z);
  dial.castShadow = true;
  dial.receiveShadow = true;
  group.add(dial);

  // 2. Outer cylindrical rim (LatheGeometry revolved around Y, then rotated to face +Z)
  const rimPoints = [
    new THREE.Vector2(INNER_RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, -DEPTH / 2),
    new THREE.Vector2(RADIUS, DEPTH / 2 - 0.004),
    new THREE.Vector2(RADIUS - 0.003, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS + 0.003, DEPTH / 2),
    new THREE.Vector2(INNER_RADIUS, DEPTH / 2 - 0.004),
    new THREE.Vector2(INNER_RADIUS, -DEPTH / 2)
  ];
  const rimGeo = new THREE.LatheGeometry(rimPoints, 32);
  const rim = new THREE.Mesh(rimGeo, bodyMat);
  rim.name = "outer_rim";
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, CENTER_Y, 0);
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  // 3. 12 Hour tick marks
  const tickGeo = new THREE.BoxGeometry(TICK_WIDTH, TICK_LENGTH, TICK_DEPTH);
  const tickZ = -DEPTH / 2 + DIAL_THICKNESS + TICK_DEPTH / 2 - 0.001;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.name = `tick_mark_${i}`;
    tick.position.set(
      Math.sin(angle) * TICK_RADIUS,
      CENTER_Y + Math.cos(angle) * TICK_RADIUS,
      tickZ
    );
    tick.rotation.z = -angle;
    tick.castShadow = true;
    tick.receiveShadow = true;
    group.add(tick);
  }

  // 4. Hour hand (pointing to ~10:10)
  const hourGroup = new THREE.Group();
  hourGroup.position.set(0, CENTER_Y, -DEPTH / 2 + DIAL_THICKNESS + HAND_DEPTH / 2 + 0.003);
  hourGroup.rotation.z = (55 * Math.PI) / 180;
  const hourGeo = new THREE.BoxGeometry(HOUR_WIDTH, HOUR_LEN + HOUR_TAIL, HAND_DEPTH);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.name = "hour_hand";
  hourHand.position.y = (HOUR_LEN - HOUR_TAIL) / 2;
  hourHand.castShadow = true;
  hourHand.receiveShadow = true;
  hourGroup.add(hourHand);
  group.add(hourGroup);

  // 5. Minute hand (pointing to ~2:00 / 10 min)
  const minGroup = new THREE.Group();
  minGroup.position.set(0, CENTER_Y, -DEPTH / 2 + DIAL_THICKNESS + HAND_DEPTH * 1.5 + 0.005);
  minGroup.rotation.z = (-58 * Math.PI) / 180;
  const minGeo = new THREE.BoxGeometry(MIN_WIDTH, MIN_LEN + MIN_TAIL, HAND_DEPTH);
  const minHand = new THREE.Mesh(minGeo, handMat);
  minHand.name = "minute_hand";
  minHand.position.y = (MIN_LEN - MIN_TAIL) / 2;
  minHand.castShadow = true;
  minHand.receiveShadow = true;
  minGroup.add(minHand);
  group.add(minGroup);

  // 6. Center pivot pin
  const pinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.012, 16);
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.name = "center_pin";
  pin.rotation.x = Math.PI / 2;
  pin.position.set(0, CENTER_Y, -DEPTH / 2 + DIAL_THICKNESS + 0.007);
  pin.castShadow = true;
  pin.receiveShadow = true;
  group.add(pin);

  return group;
}
