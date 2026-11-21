function build(THREE) {
  const group = new THREE.Group();

  const W = 0.40;
  const H = 0.40;
  const D = 0.15;
  const BEVEL = 0.05;
  const EXTRUDE_D = D - 2 * BEVEL;
  const INNER_W = W - 2 * BEVEL;
  const INNER_H = H - 2 * BEVEL;
  const CORNER_R = 0.035;
  const PLEAT_X = 0.095;
  const PLEAT_R = 0.009;

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x22462d,
    roughness: 0.85,
    metalness: 0.02
  });

  const shape = new THREE.Shape();
  const hw = INNER_W / 2;
  const hh = INNER_H / 2;
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
    depth: EXTRUDE_D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 10,
    curveSegments: 12
  });

  const body = new THREE.Mesh(bodyGeo, velvetMat);
  body.name = 'pillow_body';
  body.position.set(0, H / 2, -EXTRUDE_D / 2);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const pleatSides = [
    { name: 'left_tucked_pleat', x: -PLEAT_X },
    { name: 'right_tucked_pleat', x: PLEAT_X }
  ];

  for (const side of pleatSides) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side.x, 0.015, 0.022),
      new THREE.Vector3(side.x, 0.08, 0.068),
      new THREE.Vector3(side.x, H / 2, D / 2 + 0.002),
      new THREE.Vector3(side.x, H - 0.08, 0.068),
      new THREE.Vector3(side.x, H - 0.015, 0.022)
    ]);
    const pleatGeo = new THREE.TubeGeometry(curve, 24, PLEAT_R, 12, false);
    const pleat = new THREE.Mesh(pleatGeo, velvetMat);
    pleat.name = side.name;
    pleat.castShadow = true;
    pleat.receiveShadow = true;
    group.add(pleat);
  }

  return group;
}
