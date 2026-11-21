function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.40;
  const D = 0.36;
  const H = 0.45;
  const SEAT_T = 0.036;
  const LEG_T = 0.032;
  const LEG_INSET = 0.17;
  const LEG_TOP_D = 0.25;
  const LEG_BOT_D = 0.33;
  const FOOT_PAD_H = 0.002;
  const STRETCHER_Y = 0.125;
  const STRETCHER_H = 0.036;
  const STRETCHER_D = 0.028;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5d34,
    roughness: 0.58,
    metalness: 0.02,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622,
    roughness: 0.9,
    metalness: 0.0,
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Seat top with rounded corners and two handle cutouts
  const seatBevel = 0.004;
  const sw = W - seatBevel * 2;
  const sd = D - seatBevel * 2;
  const cr = 0.014; // corner radius

  const seatShape = new THREE.Shape();
  seatShape.moveTo(-sw / 2 + cr, -sd / 2);
  seatShape.lineTo(sw / 2 - cr, -sd / 2);
  seatShape.quadraticCurveTo(sw / 2, -sd / 2, sw / 2, -sd / 2 + cr);
  seatShape.lineTo(sw / 2, sd / 2 - cr);
  seatShape.quadraticCurveTo(sw / 2, sd / 2, sw / 2 - cr, sd / 2);
  seatShape.lineTo(-sw / 2 + cr, sd / 2);
  seatShape.quadraticCurveTo(-sw / 2, sd / 2, -sw / 2, sd / 2 - cr);
  seatShape.lineTo(-sw / 2, -sd / 2 + cr);
  seatShape.quadraticCurveTo(-sw / 2, -sd / 2, -sw / 2 + cr, -sd / 2);

  // Handle cutouts near left and right ends
  const holeW = 0.024;
  const holeD = 0.105;
  const holeXOffset = W / 2 - 0.085;
  const hr = holeW / 2;

  [-holeXOffset, holeXOffset].forEach((hx) => {
    const hole = new THREE.Path();
    hole.moveTo(hx - hr, -holeD / 2 + hr);
    hole.absarc(hx, -holeD / 2 + hr, hr, Math.PI, 0, false);
    hole.lineTo(hx + hr, holeD / 2 - hr);
    hole.absarc(hx, holeD / 2 - hr, hr, 0, Math.PI, false);
    hole.closePath();
    seatShape.holes.push(hole);
  });

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_T - seatBevel * 2,
    bevelEnabled: true,
    bevelThickness: seatBevel,
    bevelSize: seatBevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
  seatGeo.rotateX(Math.PI / 2);
  // Top of seat sits at y = H
  addMesh(seatGeo, woodMat, 'seat_top', 0, H - seatBevel, 0);

  // 2. Slab legs (trapezoidal profile with arched bottom)
  const legH = H - SEAT_T - FOOT_PAD_H;
  const legBevel = 0.003;
  const archH = 0.014;
  const footW = 0.045;

  const legShape = new THREE.Shape();
  // Drawn in XY where X is Z-depth and Y is height
  legShape.moveTo(-LEG_BOT_D / 2 + legBevel, legBevel);
  legShape.lineTo(-LEG_BOT_D / 2 + footW, legBevel);
  legShape.quadraticCurveTo(0, archH + legBevel, LEG_BOT_D / 2 - footW, legBevel);
  legShape.lineTo(LEG_BOT_D / 2 - legBevel, legBevel);
  legShape.lineTo(LEG_TOP_D / 2 - legBevel, legH - legBevel);
  legShape.lineTo(-LEG_TOP_D / 2 + legBevel, legH - legBevel);
  legShape.closePath();

  const legGeo = new THREE.ExtrudeGeometry(legShape, {
    depth: LEG_T - legBevel * 2,
    bevelEnabled: true,
    bevelThickness: legBevel,
    bevelSize: legBevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
  // Center extrusion along local Z, then rotate so extrusion is along X
  legGeo.translate(0, 0, -(LEG_T - legBevel * 2) / 2);
  legGeo.rotateY(Math.PI / 2);

  const legX = W / 2 - LEG_INSET;
  addMesh(legGeo, woodMat, 'leg_left', -legX, FOOT_PAD_H, 0);
  addMesh(legGeo, woodMat, 'leg_right', legX, FOOT_PAD_H, 0);

  // 3. Stretcher bar between legs
  const stretcherLen = (legX - LEG_T / 2) * 2 + 0.01;
  const stretcherGeo = new THREE.BoxGeometry(stretcherLen, STRETCHER_H, STRETCHER_D);
  addMesh(stretcherGeo, woodMat, 'stretcher', 0, STRETCHER_Y, 0);

  // 4. Protruding mortise-and-tenon details on outer leg faces
  const tenonGeo = new THREE.BoxGeometry(0.012, STRETCHER_H + 0.004, STRETCHER_D * 0.72);
  addMesh(tenonGeo, woodMat, 'tenon_left', -legX - LEG_T / 2 - 0.004, STRETCHER_Y, 0);
  addMesh(tenonGeo, woodMat, 'tenon_right', legX + LEG_T / 2 + 0.004, STRETCHER_Y, 0);

  // 5. Under-seat longitudinal support rail
  const underRailH = 0.028;
  const underRailD = 0.032;
  const underRailGeo = new THREE.BoxGeometry(stretcherLen, underRailH, underRailD);
  addMesh(underRailGeo, woodMat, 'under_rail', 0, H - SEAT_T - underRailH / 2 + 0.002, 0);

  // 6. Under-seat cross cleats
  const cleatGeo = new THREE.BoxGeometry(0.024, 0.022, LEG_TOP_D * 0.85);
  addMesh(cleatGeo, woodMat, 'cleat_left', -legX + LEG_T / 2 + 0.01, H - SEAT_T - 0.011, 0);
  addMesh(cleatGeo, woodMat, 'cleat_right', legX - LEG_T / 2 - 0.01, H - SEAT_T - 0.011, 0);

  // 7. Floor felt pads under the four foot contact points
  const padGeo = new THREE.BoxGeometry(LEG_T * 0.85, FOOT_PAD_H, footW * 0.8);
  const padZ = LEG_BOT_D / 2 - footW / 2;
  addMesh(padGeo, padMat, 'foot_pad_lf', -legX, FOOT_PAD_H / 2, padZ);
  addMesh(padGeo, padMat, 'foot_pad_lb', -legX, FOOT_PAD_H / 2, -padZ);
  addMesh(padGeo, padMat, 'foot_pad_rf', legX, FOOT_PAD_H / 2, padZ);
  addMesh(padGeo, padMat, 'foot_pad_rb', legX, FOOT_PAD_H / 2, -padZ);

  return group;
}
