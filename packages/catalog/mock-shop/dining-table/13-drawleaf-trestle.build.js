function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.80;
  const D = 0.95;
  const H = 0.76;

  const TOP_THICK = 0.04;
  const BREADBOARD_W = 0.11;
  const MAIN_PLANK_LEN = W - BREADBOARD_W * 2;
  const NUM_PLANKS = 3;
  const PLANK_GAP = 0.002;
  const PLANK_D = (D - PLANK_GAP * (NUM_PLANKS - 1)) / NUM_PLANKS;

  const TRESTLE_X = W * 0.31; // ~0.558m from center
  const FOOT_LEN = D * 0.78;  // ~0.74m along Z
  const FOOT_W = 0.11;
  const FOOT_H = 0.075;
  const FOOT_END_H = 0.032;

  const POST_W = 0.075;
  const POST_D = 0.14;
  const BEARER_LEN = D * 0.80;
  const BEARER_W = 0.10;
  const BEARER_H = 0.055;
  const POST_H = H - TOP_THICK - BEARER_H - FOOT_H + 0.02; // slight overlap into foot and bearer

  const STRETCHER_Y = 0.25;
  const STRETCHER_H = 0.085;
  const STRETCHER_D = 0.055;
  const STRETCHER_LEN = TRESTLE_X * 2 + POST_W + 0.07; // protrudes through posts for wedged tenons

  const RUNNER_H = 0.032;
  const RUNNER_W = 0.045;
  const RUNNER_Z = D * 0.28;

  // Materials
  const oakTopMat = new THREE.MeshStandardMaterial({
    color: 0x8d5e34,
    roughness: 0.62,
    metalness: 0.04,
  });

  const oakBaseMat = new THREE.MeshStandardMaterial({
    color: 0x7a4f2a,
    roughness: 0.68,
    metalness: 0.04,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x623d1e,
    roughness: 0.72,
    metalness: 0.03,
  });

  function makeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Tabletop - Main planks
  const topY = H - TOP_THICK / 2;
  const plankGeo = new THREE.BoxGeometry(MAIN_PLANK_LEN, TOP_THICK, PLANK_D);
  for (let i = 0; i < NUM_PLANKS; i++) {
    const zPos = -D / 2 + PLANK_D / 2 + i * (PLANK_D + PLANK_GAP);
    const plank = makeMesh(plankGeo, oakTopMat, `tabletop_plank_${i + 1}`);
    plank.position.set(0, topY, zPos);
    group.add(plank);
  }

  // 2. Tabletop - Breadboard ends
  const breadboardGeo = new THREE.BoxGeometry(BREADBOARD_W, TOP_THICK, D);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const bb = makeMesh(breadboardGeo, oakTopMat, `tabletop_breadboard_${label}`);
    bb.position.set(side * (W / 2 - BREADBOARD_W / 2), topY, 0);
    group.add(bb);
  });

  // 3. Under-top longitudinal runners
  const runnerGeo = new THREE.BoxGeometry(W * 0.78, RUNNER_H, RUNNER_W);
  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'back' : 'front';
    const runner = makeMesh(runnerGeo, oakBaseMat, `undertop_runner_${label}`);
    runner.position.set(0, H - TOP_THICK - RUNNER_H / 2 + 0.002, side * RUNNER_Z);
    group.add(runner);
  });

  // 4. Drawleaf slide cleats under ends
  const cleatGeo = new THREE.BoxGeometry(0.16, 0.022, 0.035);
  [-1, 1].forEach((xSide) => {
    [-1, 1].forEach((zSide) => {
      const xLabel = xSide < 0 ? 'left' : 'right';
      const zLabel = zSide < 0 ? 'back' : 'front';
      const cleat = makeMesh(cleatGeo, oakDarkMat, `drawleaf_cleat_${xLabel}_${zLabel}`);
      cleat.position.set(
        xSide * (W / 2 - 0.14),
        H - TOP_THICK - 0.011,
        zSide * (D * 0.34)
      );
      group.add(cleat);
    });
  });

  // 5. Trestle Foot Geometry (ExtrudeGeometry along X, profiled in Z-Y)
  const footShape = new THREE.Shape();
  const halfF = FOOT_LEN / 2;
  const flatCenter = 0.09;
  footShape.moveTo(-halfF, 0);
  footShape.lineTo(halfF, 0);
  footShape.lineTo(halfF, FOOT_END_H);
  footShape.lineTo(flatCenter, FOOT_H);
  footShape.lineTo(-flatCenter, FOOT_H);
  footShape.lineTo(-halfF, FOOT_END_H);
  footShape.closePath();

  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: FOOT_W,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  // Rotate so shape X -> world Z, extrude Z -> world X, centered on X
  footGeo.rotateY(Math.PI / 2);
  footGeo.translate(-FOOT_W / 2, 0, 0);

  // 6. Top Bearer Geometry (chamfered ends along Z)
  const bearerShape = new THREE.Shape();
  const halfB = BEARER_LEN / 2;
  bearerShape.moveTo(-halfB + 0.04, 0);
  bearerShape.lineTo(halfB - 0.04, 0);
  bearerShape.lineTo(halfB, BEARER_H);
  bearerShape.lineTo(-halfB, BEARER_H);
  bearerShape.closePath();

  const bearerGeo = new THREE.ExtrudeGeometry(bearerShape, {
    depth: BEARER_W,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  bearerGeo.rotateY(Math.PI / 2);
  bearerGeo.translate(-BEARER_W / 2, 0, 0);

  // 7. Trestle Posts, Feet, Bearers, and Wedges
  const postGeo = new THREE.BoxGeometry(POST_W, POST_H, POST_D);
  const wedgeGeo = new THREE.BoxGeometry(0.018, 0.145, 0.022);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'left' : 'right';
    const xPos = side * TRESTLE_X;

    // Foot (bottom touches y = 0)
    const foot = makeMesh(footGeo, oakBaseMat, `trestle_foot_${label}`);
    foot.position.set(xPos, 0, 0);
    group.add(foot);

    // Vertical Post
    const post = makeMesh(postGeo, oakBaseMat, `trestle_post_${label}`);
    post.position.set(xPos, FOOT_H + POST_H / 2 - 0.01, 0);
    group.add(post);

    // Top Bearer
    const bearer = makeMesh(bearerGeo, oakBaseMat, `trestle_bearer_${label}`);
    bearer.position.set(xPos, H - TOP_THICK - BEARER_H, 0);
    group.add(bearer);

    // Wedged tenon peg on outside of post
    const wedge = makeMesh(wedgeGeo, oakDarkMat, `stretcher_wedge_${label}`);
    wedge.position.set(xPos + side * (POST_W / 2 + 0.018), STRETCHER_Y, 0);
    wedge.rotation.z = side * -0.05;
    group.add(wedge);
  });

  // 8. Center Stretcher Beam
  const stretcherGeo = new THREE.BoxGeometry(STRETCHER_LEN, STRETCHER_H, STRETCHER_D);
  const stretcher = makeMesh(stretcherGeo, oakBaseMat, 'center_stretcher');
  stretcher.position.set(0, STRETCHER_Y, 0);
  group.add(stretcher);

  return group;
}
