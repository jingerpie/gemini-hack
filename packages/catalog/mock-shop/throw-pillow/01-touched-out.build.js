function build(THREE) {
  const group = new THREE.Group();

  const W = 0.45;
  const H = 0.45;
  const D = 0.14;
  const BEVEL = 0.06;
  const INNER_W = W - BEVEL * 2;
  const INNER_H = H - BEVEL * 2;
  const INNER_D = D - BEVEL * 2;
  const CORNER_R = 0.03;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe66865,
    roughness: 0.92,
    metalness: 0.0
  });

  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x0d1b38,
    roughness: 0.85,
    metalness: 0.0
  });

  const zipperMat = new THREE.MeshStandardMaterial({
    color: 0xc9524f,
    roughness: 0.6,
    metalness: 0.2
  });

  const centerY = H * 0.5;

  // Single soft rounded cushion body
  const hw = INNER_W * 0.5;
  const hh = INNER_H * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + CORNER_R, -hh);
  shape.lineTo(hw - CORNER_R, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + CORNER_R);
  shape.lineTo(hw, hh - CORNER_R);
  shape.quadraticCurveTo(hw, hh, hw - CORNER_R, hh);
  shape.lineTo(-hw + CORNER_R, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - CORNER_R);
  shape.lineTo(-hw, -hh + CORNER_R);
  shape.quadraticCurveTo(-hw, -hh, -hw + CORNER_R, -hh);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: INNER_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 8,
    curveSegments: 12
  });
  bodyGeo.translate(0, 0, -INNER_D * 0.5);

  const body = new THREE.Mesh(bodyGeo, fabricMat);
  body.position.set(0, centerY, 0);
  body.name = "pillow_body";
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Small zipper pull tucked at bottom center
  const zipperGeo = new THREE.CapsuleGeometry(0.0035, 0.01, 4, 8);
  const zipper = new THREE.Mesh(zipperGeo, zipperMat);
  zipper.position.set(0, 0.006, 0);
  zipper.rotation.z = 0.2;
  zipper.name = "zipper_pull";
  zipper.castShadow = true;
  zipper.receiveShadow = true;
  group.add(zipper);

  // Front graphic: stylized hand outline lying on the +Z face
  const frontZ = D * 0.5 + 0.0012;
  const handPoints = [
    new THREE.Vector3(-0.048, centerY - 0.095, frontZ),
    new THREE.Vector3(-0.055, centerY - 0.05, frontZ),
    new THREE.Vector3(-0.072, centerY - 0.005, frontZ),
    new THREE.Vector3(-0.062, centerY + 0.002, frontZ),
    new THREE.Vector3(-0.042, centerY - 0.035, frontZ),
    new THREE.Vector3(-0.045, centerY + 0.025, frontZ),
    new THREE.Vector3(-0.032, centerY + 0.028, frontZ),
    new THREE.Vector3(-0.022, centerY - 0.028, frontZ),
    new THREE.Vector3(-0.012, centerY + 0.038, frontZ),
    new THREE.Vector3(0.002, centerY + 0.038, frontZ),
    new THREE.Vector3(0.006, centerY - 0.028, frontZ),
    new THREE.Vector3(0.022, centerY + 0.025, frontZ),
    new THREE.Vector3(0.035, centerY + 0.022, frontZ),
    new THREE.Vector3(0.028, centerY - 0.035, frontZ),
    new THREE.Vector3(0.058, centerY - 0.012, frontZ),
    new THREE.Vector3(0.068, centerY - 0.022, frontZ),
    new THREE.Vector3(0.042, centerY - 0.068, frontZ),
    new THREE.Vector3(0.018, centerY - 0.1, frontZ),
    new THREE.Vector3(-0.018, centerY - 0.105, frontZ)
  ];
  const handCurve = new THREE.CatmullRomCurve3(handPoints, true);
  const handGeo = new THREE.TubeGeometry(handCurve, 32, 0.0028, 8, true);
  const hand = new THREE.Mesh(handGeo, navyMat);
  hand.name = "hand_outline";
  hand.castShadow = true;
  hand.receiveShadow = true;
  group.add(hand);

  // Palm crease line
  const creaseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.018, centerY - 0.052, frontZ),
    new THREE.Vector3(0.002, centerY - 0.065, frontZ),
    new THREE.Vector3(-0.005, centerY - 0.082, frontZ)
  ]);
  const creaseGeo = new THREE.TubeGeometry(creaseCurve, 12, 0.0026, 8, false);
  const crease = new THREE.Mesh(creaseGeo, navyMat);
  crease.name = "hand_palm_crease";
  crease.castShadow = true;
  crease.receiveShadow = true;
  group.add(crease);

  // Thin flat navy bands representing "TOUCHED OUT" print across upper front
  const textY = centerY + 0.095;
  const wordLeftGeo = new THREE.CapsuleGeometry(0.012, 0.145, 4, 8);
  const wordLeft = new THREE.Mesh(wordLeftGeo, navyMat);
  wordLeft.rotation.z = Math.PI * 0.5;
  wordLeft.scale.set(1, 1, 0.12);
  wordLeft.position.set(-0.052, textY, frontZ);
  wordLeft.name = "graphic_text_touched";
  wordLeft.castShadow = true;
  wordLeft.receiveShadow = true;
  group.add(wordLeft);

  const wordRightGeo = new THREE.CapsuleGeometry(0.012, 0.072, 4, 8);
  const wordRight = new THREE.Mesh(wordRightGeo, navyMat);
  wordRight.rotation.z = Math.PI * 0.5;
  wordRight.scale.set(1, 1, 0.12);
  wordRight.position.set(0.088, textY, frontZ);
  wordRight.name = "graphic_text_out";
  wordRight.castShadow = true;
  wordRight.receiveShadow = true;
  group.add(wordRight);

  return group;
}
