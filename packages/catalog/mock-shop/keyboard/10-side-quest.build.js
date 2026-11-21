function build(THREE) {
  "use strict";

  const group = new THREE.Group();

  // Dimensions (meters)
  const PAD_W = 0.078;
  const PAD_D = 0.088;
  const PAD_H_FRONT = 0.016;
  const PAD_H_BACK = 0.032;
  const FOOT_R = 0.0055;
  const FOOT_H = 0.003;
  const KEY_PITCH = 0.019;
  const KEY_1U_W = 0.0175;
  const KEY_2U_W = 0.0365;
  const KEY_H = 0.0095;
  const KNOB_R = 0.0085;
  const KNOB_H = 0.012;
  const CABLE_R = 0.0022;
  const COIL_R = 0.036;

  // Centering offset so the whole assembly (keypad + cable) is centered around (0, 0)
  const PAD_OFFSET_X = -0.042;
  const PAD_OFFSET_Z = 0.012;

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xf4a6ae,
    roughness: 0.42,
    metalness: 0.05
  });
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xf8b8bf,
    roughness: 0.38,
    metalness: 0.02
  });
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0xf29ca5,
    roughness: 0.35,
    metalness: 0.12
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0xe28d96,
    roughness: 0.85,
    metalness: 0.0
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xf5ab9c,
    roughness: 0.48,
    metalness: 0.02
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d8dc,
    roughness: 0.25,
    metalness: 0.85
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x242424,
    roughness: 0.7,
    metalness: 0.1
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

  // 1. Rubber feet (4x) touching y = 0
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.92, FOOT_H, 20);
  const footInsetX = PAD_W * 0.5 - FOOT_R - 0.004;
  const footInsetZ = PAD_D * 0.5 - FOOT_R - 0.004;
  const footPositions = [
    [-footInsetX, -footInsetZ, "foot_back_left"],
    [footInsetX, -footInsetZ, "foot_back_right"],
    [-footInsetX, footInsetZ, "foot_front_left"],
    [footInsetX, footInsetZ, "foot_front_right"]
  ];
  for (let i = 0; i < footPositions.length; i++) {
    const fp = footPositions[i];
    addMesh(
      footGeo,
      footMat,
      fp[2],
      PAD_OFFSET_X + fp[0],
      FOOT_H * 0.5,
      PAD_OFFSET_Z + fp[1]
    );
  }

  // 2. Wedge-shaped keypad body (extruded side profile along X)
  const bodyShape = new THREE.Shape();
  const halfD = PAD_D * 0.5;
  const bevel = 0.003;
  bodyShape.moveTo(-halfD + bevel, 0);
  bodyShape.lineTo(halfD - bevel, 0);
  bodyShape.quadraticCurveTo(halfD, 0, halfD, bevel);
  bodyShape.lineTo(halfD, PAD_H_FRONT - bevel);
  bodyShape.quadraticCurveTo(halfD, PAD_H_FRONT, halfD - bevel, PAD_H_FRONT);
  bodyShape.lineTo(-halfD + bevel, PAD_H_BACK);
  bodyShape.quadraticCurveTo(-halfD, PAD_H_BACK, -halfD, PAD_H_BACK - bevel);
  bodyShape.lineTo(-halfD, bevel);
  bodyShape.quadraticCurveTo(-halfD, 0, -halfD + bevel, 0);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: PAD_W - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3
  });
  bodyGeo.center();
  // Rotate so extrusion is along X, front (+Z) is lower
  addMesh(
    bodyGeo,
    caseMat,
    "keypad_body",
    PAD_OFFSET_X,
    FOOT_H + PAD_H_BACK * 0.5 - 0.001,
    PAD_OFFSET_Z,
    0,
    -Math.PI * 0.5,
    0
  );

  // Slope angle of the top surface
  const slopeAngle = Math.atan2(PAD_H_BACK - PAD_H_FRONT, PAD_D - 0.006);

  function topYAtZ(localZ) {
    const t = (halfD - localZ) / PAD_D;
    return FOOT_H + PAD_H_FRONT + t * (PAD_H_BACK - PAD_H_FRONT);
  }

  // 3. Keycap geometry helper (tapered truncated pyramid)
  function makeKeyGeo(w, d, h) {
    const geo = new THREE.CylinderGeometry(0.5, 0.68, h, 4, 1);
    geo.rotateY(Math.PI * 0.25);
    geo.scale(w, 1, d);
    return geo;
  }

  const key1uGeo = makeKeyGeo(KEY_1U_W, KEY_1U_W, KEY_H);
  const key2uGeo = makeKeyGeo(KEY_2U_W, KEY_1U_W, KEY_H);

  const colX = [-KEY_PITCH, 0, KEY_PITCH];
  const rowZ = [-KEY_PITCH, 0, KEY_PITCH];

  // Back row (row 0): 2 keys + 1 rotary knob
  for (let c = 0; c < 2; c++) {
    const lx = colX[c];
    const lz = rowZ[0];
    addMesh(
      key1uGeo,
      keyMat,
      "key_r0_c" + c,
      PAD_OFFSET_X + lx,
      topYAtZ(lz) + KEY_H * 0.42,
      PAD_OFFSET_Z + lz,
      slopeAngle,
      0,
      0
    );
  }

  // Rotary encoder knob at row 0, col 2
  const knobGeo = new THREE.CylinderGeometry(KNOB_R, KNOB_R, KNOB_H, 28);
  const knobZ = rowZ[0];
  const knobX = colX[2];
  addMesh(
    knobGeo,
    knobMat,
    "rotary_knob",
    PAD_OFFSET_X + knobX,
    topYAtZ(knobZ) + KNOB_H * 0.42,
    PAD_OFFSET_Z + knobZ,
    slopeAngle,
    0,
    0
  );

  // Middle row (row 1): 3 keys
  for (let c = 0; c < 3; c++) {
    const lx = colX[c];
    const lz = rowZ[1];
    addMesh(
      key1uGeo,
      keyMat,
      "key_r1_c" + c,
      PAD_OFFSET_X + lx,
      topYAtZ(lz) + KEY_H * 0.42,
      PAD_OFFSET_Z + lz,
      slopeAngle,
      0,
      0
    );
  }

  // Front row (row 2): 1x 2u key (spanning col 0 & 1) + 1x 1u key (col 2)
  const lzFront = rowZ[2];
  addMesh(
    key2uGeo,
    keyMat,
    "key_r2_wide",
    PAD_OFFSET_X + (colX[0] + colX[1]) * 0.5,
    topYAtZ(lzFront) + KEY_H * 0.42,
    PAD_OFFSET_Z + lzFront,
    slopeAngle,
    0,
    0
  );
  addMesh(
    key1uGeo,
    keyMat,
    "key_r2_c2",
    PAD_OFFSET_X + colX[2],
    topYAtZ(lzFront) + KEY_H * 0.42,
    PAD_OFFSET_Z + lzFront,
    slopeAngle,
    0,
    0
  );

  // 4. Coiled USB-C cable
  const coilCenterX = 0.036;
  const coilCenterZ = -0.018;
  const coilLoops = 4;
  const coilPitchY = CABLE_R * 2.05;

  const cablePoints = [];
  // Start from back of keypad
  cablePoints.push(
    new THREE.Vector3(
      PAD_OFFSET_X + 0.012,
      FOOT_H + PAD_H_BACK * 0.5,
      PAD_OFFSET_Z - PAD_D * 0.5 + 0.002
    )
  );
  cablePoints.push(
    new THREE.Vector3(
      PAD_OFFSET_X + 0.022,
      CABLE_R + 0.004,
      PAD_OFFSET_Z - PAD_D * 0.5 - 0.014
    )
  );

  // Spiral loops
  const stepsPerLoop = 24;
  const totalSteps = coilLoops * stepsPerLoop;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / stepsPerLoop;
    const angle = Math.PI * 1.15 + t * Math.PI * 2;
    const r = COIL_R - (i / totalSteps) * 0.002;
    const px = coilCenterX + Math.cos(angle) * r;
    const pz = coilCenterZ + Math.sin(angle) * r;
    const py = CABLE_R + (i / totalSteps) * (coilLoops - 1) * coilPitchY * 0.5;
    cablePoints.push(new THREE.Vector3(px, py, pz));
  }

  // Exit from coil toward front-right
  const plugX = 0.062;
  const plugZ = 0.036;
  cablePoints.push(new THREE.Vector3(coilCenterX + COIL_R + 0.006, CABLE_R * 1.5, coilCenterZ + 0.018));
  cablePoints.push(new THREE.Vector3(plugX + 0.012, CABLE_R * 1.2, plugZ - 0.014));
  cablePoints.push(new THREE.Vector3(plugX, 0.004, plugZ));

  const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 96, CABLE_R, 10, false);
  addMesh(cableGeo, cableMat, "usb_cable", 0, 0, 0);

  // 5. USB-C connector plug at the end of the cable
  const plugAngleY = -Math.PI * 0.35;
  const plugHousingGeo = new THREE.BoxGeometry(0.011, 0.0065, 0.014);
  addMesh(
    plugHousingGeo,
    cableMat,
    "usbc_plug_housing",
    plugX - Math.sin(plugAngleY) * 0.007,
    0.0035,
    plugZ - Math.cos(plugAngleY) * 0.007,
    0,
    plugAngleY,
    0
  );

  const plugTipGeo = new THREE.BoxGeometry(0.0082, 0.0028, 0.007);
  addMesh(
    plugTipGeo,
    metalMat,
    "usbc_plug_metal",
    plugX - Math.sin(plugAngleY) * 0.017,
    0.0035,
    plugZ - Math.cos(plugAngleY) * 0.017,
    0,
    plugAngleY,
    0
  );

  const plugPortGeo = new THREE.BoxGeometry(0.006, 0.0014, 0.001);
  addMesh(
    plugPortGeo,
    darkMat,
    "usbc_plug_opening",
    plugX - Math.sin(plugAngleY) * 0.0205,
    0.0035,
    plugZ - Math.cos(plugAngleY) * 0.0205,
    0,
    plugAngleY,
    0
  );

  return group;
}
