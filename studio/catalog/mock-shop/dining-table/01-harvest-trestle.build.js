function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters)
  const W = 1.90;
  const H = 0.76;
  const D = 0.90;

  const TOP_THICK = 0.045;
  const BREADBOARD_W = 0.15;
  const CENTER_TOP_W = W - 2 * BREADBOARD_W;

  const TRESTLE_X = W / 2 - 0.38;

  const FOOT_L = 0.68;
  const FOOT_W = 0.085;
  const FOOT_H = 0.065;

  const CLEAT_L = 0.64;
  const CLEAT_W = 0.08;
  const CLEAT_H = 0.045;

  const POST_W = 0.065;
  const POST_D = 0.065;
  const POST_Z_OFFSET = 0.095;
  const POST_H = H - TOP_THICK - CLEAT_H - FOOT_H;

  const STRETCHER_Y = 0.24;
  const STRETCHER_H = 0.095;
  const STRETCHER_D = 0.055;
  const STRETCHER_OVERHANG = 0.14;
  const STRETCHER_L = 2 * (TRESTLE_X + STRETCHER_OVERHANG);

  const WEDGE_H = 0.21;
  const WEDGE_W = 0.032;
  const WEDGE_D = 0.032;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb57b45,
    roughness: 0.62,
    metalness: 0.0
  });

  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0xa66e3b,
    roughness: 0.68,
    metalness: 0.0
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

  // Tabletop: center section + 2 breadboard ends
  const topY = H - TOP_THICK / 2;
  const centerTopGeo = new THREE.BoxGeometry(CENTER_TOP_W, TOP_THICK, D);
  addMesh(centerTopGeo, woodMat, 'tabletop_center', 0, topY, 0);

  const breadboardGeo = new THREE.BoxGeometry(BREADBOARD_W, TOP_THICK, D);
  const breadboardX = CENTER_TOP_W / 2 + BREADBOARD_W / 2;
  addMesh(breadboardGeo, endGrainMat, 'tabletop_breadboard_left', -breadboardX, topY, 0);
  addMesh(breadboardGeo, endGrainMat, 'tabletop_breadboard_right', breadboardX, topY, 0);

  // Trestle foot profile (sloped ends along Z)
  const footShape = new THREE.Shape();
  const halfFL = FOOT_L / 2;
  const slopeLen = 0.09;
  const tipH = 0.024;
  footShape.moveTo(-halfFL, 0);
  footShape.lineTo(halfFL, 0);
  footShape.lineTo(halfFL, tipH);
  footShape.lineTo(halfFL - slopeLen, FOOT_H);
  footShape.lineTo(-halfFL + slopeLen, FOOT_H);
  footShape.lineTo(-halfFL, tipH);
  footShape.closePath();

  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: FOOT_W,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2
  });
  // Rotate so extrusion (Z) becomes X, and shape X becomes Z
  footGeo.rotateY(Math.PI / 2);
  footGeo.translate(-FOOT_W / 2, 0, 0);

  const postGeo = new THREE.BoxGeometry(POST_W, POST_H, POST_D);
  const cleatGeo = new THREE.BoxGeometry(CLEAT_W, CLEAT_H, CLEAT_L);

  // Tapered tusk wedge
  const wedgeGeo = new THREE.CylinderGeometry(WEDGE_W * 0.42, WEDGE_W * 0.62, WEDGE_H, 4);
  wedgeGeo.rotateY(Math.PI / 4);

  const sides = [
    { label: 'left', sign: -1 },
    { label: 'right', sign: 1 }
  ];

  for (const side of sides) {
    const tx = side.sign * TRESTLE_X;

    // Foot
    addMesh(footGeo, woodMat, `trestle_foot_${side.label}`, tx, 0, 0);

    // Two vertical posts per trestle
    const postY = FOOT_H + POST_H / 2;
    addMesh(postGeo, woodMat, `trestle_post_${side.label}_front`, tx, postY, POST_Z_OFFSET);
    addMesh(postGeo, woodMat, `trestle_post_${side.label}_back`, tx, postY, -POST_Z_OFFSET);

    // Top cleat supporting tabletop
    const cleatY = H - TOP_THICK - CLEAT_H / 2;
    addMesh(cleatGeo, woodMat, `trestle_cleat_${side.label}`, tx, cleatY, 0);

    // Tusk wedge outside the posts
    const wedgeX = tx + side.sign * (POST_W / 2 + 0.045);
    const wedgeTilt = side.sign * -0.06;
    addMesh(wedgeGeo, endGrainMat, `trestle_wedge_${side.label}`, wedgeX, STRETCHER_Y + 0.01, 0, 0, 0, wedgeTilt);
  }

  // Central stretcher beam
  const stretcherGeo = new THREE.BoxGeometry(STRETCHER_L, STRETCHER_H, STRETCHER_D);
  addMesh(stretcherGeo, woodMat, 'central_stretcher', 0, STRETCHER_Y, 0);

  return group;
}
