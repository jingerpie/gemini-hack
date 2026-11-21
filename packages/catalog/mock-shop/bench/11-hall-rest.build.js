function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const H = 0.45;
  const D = 0.38;
  const SEAT_T = 0.032;
  const LEG_W = 0.044;
  const LEG_H = H - SEAT_T;
  const OVERHANG_X = 0.025;
  const OVERHANG_Z = 0.020;
  const LEG_X = W / 2 - OVERHANG_X - LEG_W / 2;
  const LEG_Z = D / 2 - OVERHANG_Z - LEG_W / 2;

  const APRON_H = 0.045;
  const APRON_T = 0.024;
  const APRON_Y = LEG_H - APRON_H / 2;

  const STRETCHER_H = 0.032;
  const STRETCHER_T = 0.024;
  const STRETCHER_Y = 0.11;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xafa192,
    roughness: 0.72,
    metalness: 0.02
  });

  function addMesh(geo, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, woodMat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Seat top with subtle beveled edge
  const bevel = 0.005;
  const seatW = W - bevel * 2;
  const seatD = D - bevel * 2;
  const r = 0.012;
  const seatShape = new THREE.Shape();
  seatShape.moveTo(-seatW / 2 + r, -seatD / 2);
  seatShape.lineTo(seatW / 2 - r, -seatD / 2);
  seatShape.quadraticCurveTo(seatW / 2, -seatD / 2, seatW / 2, -seatD / 2 + r);
  seatShape.lineTo(seatW / 2, seatD / 2 - r);
  seatShape.quadraticCurveTo(seatW / 2, seatD / 2, seatW / 2 - r, seatD / 2);
  seatShape.lineTo(-seatW / 2 + r, seatD / 2);
  seatShape.quadraticCurveTo(-seatW / 2, seatD / 2, -seatW / 2, seatD / 2 - r);
  seatShape.lineTo(-seatW / 2, -seatD / 2 + r);
  seatShape.quadraticCurveTo(-seatW / 2, -seatD / 2, -seatW / 2 + r, -seatD / 2);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_T - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8
  });
  seatGeo.rotateX(-Math.PI / 2);
  addMesh(seatGeo, "seat_top", 0, LEG_H + bevel, 0);

  // 6 Legs (left, center, right x front, back)
  const legGeo = new THREE.BoxGeometry(LEG_W, LEG_H, LEG_W);
  const xPositions = [
    { name: "left", x: -LEG_X },
    { name: "center", x: 0 },
    { name: "right", x: LEG_X }
  ];
  const zPositions = [
    { name: "front", z: LEG_Z },
    { name: "back", z: -LEG_Z }
  ];

  for (const zp of zPositions) {
    for (const xp of xPositions) {
      addMesh(legGeo, `leg_${zp.name}_${xp.name}`, xp.x, LEG_H / 2, zp.z);
    }
  }

  // Longitudinal apron rails (front and back)
  const longApronLen = LEG_X * 2;
  const longApronGeo = new THREE.BoxGeometry(longApronLen, APRON_H, APRON_T);
  addMesh(longApronGeo, "apron_front", 0, APRON_Y, LEG_Z);
  addMesh(longApronGeo, "apron_back", 0, APRON_Y, -LEG_Z);

  // Cross apron rails (left, center, right)
  const crossLen = LEG_Z * 2;
  const crossApronGeo = new THREE.BoxGeometry(APRON_T, APRON_H, crossLen);
  for (const xp of xPositions) {
    addMesh(crossApronGeo, `apron_${xp.name}`, xp.x, APRON_Y, 0);
  }

  // Lower cross stretchers (left, center, right)
  const crossStretcherGeo = new THREE.BoxGeometry(STRETCHER_T, STRETCHER_H, crossLen);
  for (const xp of xPositions) {
    addMesh(crossStretcherGeo, `stretcher_${xp.name}`, xp.x, STRETCHER_Y, 0);
  }

  // Lower longitudinal stretcher
  const longStretcherGeo = new THREE.BoxGeometry(longApronLen, STRETCHER_H, STRETCHER_T);
  addMesh(longStretcherGeo, "stretcher_longitudinal", 0, STRETCHER_Y, 0);

  return group;
}
