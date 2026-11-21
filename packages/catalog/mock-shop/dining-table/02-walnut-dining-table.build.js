function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const D = 0.90;
  const H = 0.75;
  const TOP_THICK = 0.038;
  const OVERHANG = 0.035;
  const LEG_SIZE = 0.068;
  const APRON_H = 0.075;
  const APRON_THICK = 0.025;
  const LEG_H = H - TOP_THICK;

  // Materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x623f26,
    roughness: 0.46,
    metalness: 0.04,
  });

  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0x3b2414,
    roughness: 0.58,
    metalness: 0.02,
  });

  function addMesh(geo, mat, x, y, z, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tabletop
  const topGeo = new THREE.BoxGeometry(W, TOP_THICK, D);
  addMesh(topGeo, walnutMat, 0, H - TOP_THICK / 2, 0, "tabletop");

  // Leg positions
  const legOffsetX = W / 2 - OVERHANG - LEG_SIZE / 2;
  const legOffsetZ = D / 2 - OVERHANG - LEG_SIZE / 2;

  const legCoords = [
    { x: -legOffsetX, z: legOffsetZ, name: "leg_front_left", isFront: true },
    { x: legOffsetX, z: legOffsetZ, name: "leg_front_right", isFront: true },
    { x: -legOffsetX, z: -legOffsetZ, name: "leg_back_left", isFront: false },
    { x: legOffsetX, z: -legOffsetZ, name: "leg_back_right", isFront: false },
  ];

  const legGeo = new THREE.BoxGeometry(LEG_SIZE, LEG_H, LEG_SIZE);
  const tenonW = 0.028;
  const tenonH = 0.014;
  const tenonD = 0.004;
  const tenonGeo = new THREE.BoxGeometry(tenonW, tenonH, tenonD);

  const apronCenterY = LEG_H - APRON_H / 2;
  const tenonY1 = apronCenterY + 0.016;
  const tenonY2 = apronCenterY - 0.016;

  for (let i = 0; i < legCoords.length; i++) {
    const lc = legCoords[i];
    addMesh(legGeo, walnutMat, lc.x, LEG_H / 2, lc.z, lc.name);

    // Exposed through-tenon details on front and back faces of legs
    const zSign = lc.isFront ? 1 : -1;
    const tenonZ = lc.z + zSign * (LEG_SIZE / 2 + tenonD / 2 - 0.001);
    addMesh(tenonGeo, endGrainMat, lc.x, tenonY1, tenonZ, lc.name + "_tenon_upper");
    addMesh(tenonGeo, endGrainMat, lc.x, tenonY2, tenonZ, lc.name + "_tenon_lower");
  }

  // Aprons (front, back, left, right)
  const frontBackApronLen = W - 2 * OVERHANG - 2 * LEG_SIZE;
  const sideApronLen = D - 2 * OVERHANG - 2 * LEG_SIZE;

  const frontBackApronGeo = new THREE.BoxGeometry(frontBackApronLen, APRON_H, APRON_THICK);
  const sideApronGeo = new THREE.BoxGeometry(APRON_THICK, APRON_H, sideApronLen);

  const apronZOffset = legOffsetZ + LEG_SIZE / 2 - APRON_THICK / 2 - 0.008;
  const apronXOffset = legOffsetX + LEG_SIZE / 2 - APRON_THICK / 2 - 0.008;

  addMesh(frontBackApronGeo, walnutMat, 0, apronCenterY, apronZOffset, "apron_front");
  addMesh(frontBackApronGeo, walnutMat, 0, apronCenterY, -apronZOffset, "apron_back");
  addMesh(sideApronGeo, walnutMat, -apronXOffset, apronCenterY, 0, "apron_left");
  addMesh(sideApronGeo, walnutMat, apronXOffset, apronCenterY, 0, "apron_right");

  // Underside support cleats
  const cleatGeo = new THREE.BoxGeometry(0.04, 0.02, sideApronLen);
  addMesh(cleatGeo, walnutMat, -0.25, LEG_H - 0.01, 0, "support_cleat_left");
  addMesh(cleatGeo, walnutMat, 0.25, LEG_H - 0.01, 0, "support_cleat_right");

  return group;
}
