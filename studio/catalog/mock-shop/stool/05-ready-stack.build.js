function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const H = 0.45;           // Total stool height
  const SEAT_W = 0.35;      // Seat width
  const SEAT_D = 0.35;      // Seat depth
  const SEAT_T = 0.018;     // Seat thickness
  const SEAT_R = 0.055;     // Seat corner radius
  const LEG_R = 0.011;      // Tubular steel leg radius (22mm diameter)
  const GLIDE_H = 0.008;    // Floor glide height
  const FOOT_SPREAD = 0.20; // Half-distance between leg centers at floor
  const TOP_SPREAD = 0.145; // Half-distance between leg centers at top bend

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd8c09d,
    roughness: 0.55,
    metalness: 0.05
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x8e8477,
    roughness: 0.42,
    metalness: 0.35
  });

  const glideMat = new THREE.MeshStandardMaterial({
    color: 0x2b2927,
    roughness: 0.75,
    metalness: 0.05
  });

  // Helper to enable shadows on all meshes
  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Rounded square plywood seat
  const hw = SEAT_W / 2 - 0.003;
  const hd = SEAT_D / 2 - 0.003;
  const r = SEAT_R;
  const seatShape = new THREE.Shape();
  seatShape.moveTo(-hw + r, -hd);
  seatShape.lineTo(hw - r, -hd);
  seatShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  seatShape.lineTo(hw, hd - r);
  seatShape.quadraticCurveTo(hw, hd, hw - r, hd);
  seatShape.lineTo(-hw + r, hd);
  seatShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  seatShape.lineTo(-hw, -hd + r);
  seatShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: SEAT_T - 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 16
  });
  seatGeo.rotateX(Math.PI / 2);
  const seatMesh = addMesh(seatGeo, woodMat, 'seat_plywood');
  seatMesh.position.y = H - 0.002;

  // 2. Four tubular steel legs, foot glides, mounting brackets, and screws
  const seatBottomY = H - SEAT_T;
  const legTopY = seatBottomY - LEG_R;

  const corners = [
    { name: 'fl', sx: -1, sz: 1 },
    { name: 'fr', sx: 1, sz: 1 },
    { name: 'bl', sx: -1, sz: -1 },
    { name: 'br', sx: 1, sz: -1 }
  ];

  const glideGeo = new THREE.CylinderGeometry(LEG_R + 0.001, LEG_R + 0.001, GLIDE_H, 16);
  const bracketGeo = new THREE.BoxGeometry(0.036, 0.014, 0.036);
  const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12);

  corners.forEach((c) => {
    const fx = c.sx * FOOT_SPREAD;
    const fz = c.sz * FOOT_SPREAD;
    const tx = c.sx * TOP_SPREAD;
    const tz = c.sz * TOP_SPREAD;
    const ix = c.sx * (TOP_SPREAD - 0.055);
    const iz = c.sz * (TOP_SPREAD - 0.055);

    // Leg curve from floor glide up to underside of seat
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, GLIDE_H, fz),
      new THREE.Vector3(tx + c.sx * 0.012, legTopY - 0.08, tz + c.sz * 0.012),
      new THREE.Vector3(tx, legTopY - 0.015, tz),
      new THREE.Vector3(tx - c.sx * 0.02, legTopY, tz - c.sz * 0.02),
      new THREE.Vector3(ix, legTopY, iz)
    ]);

    const legGeo = new THREE.TubeGeometry(curve, 24, LEG_R, 16, false);
    addMesh(legGeo, frameMat, `leg_${c.name}`);

    // Floor glide
    const glide = addMesh(glideGeo, glideMat, `glide_${c.name}`);
    glide.position.set(fx, GLIDE_H / 2, fz);

    // Under-seat mounting bracket
    const bracket = addMesh(bracketGeo, frameMat, `bracket_${c.name}`);
    bracket.position.set(ix, seatBottomY - 0.007, iz);

    // Mounting screw
    const screw = addMesh(screwGeo, glideMat, `screw_${c.name}`);
    screw.position.set(ix, seatBottomY - 0.015, iz);
  });

  return group;
}
