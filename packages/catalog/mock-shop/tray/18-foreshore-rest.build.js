function build(THREE) {
  const group = new THREE.Group();

  // Dimensions in meters (24 x 13 cm)
  const W = 0.24;
  const D = 0.13;
  const H = 0.022;
  const R = D / 2; // 0.065
  const L = (W - D) / 2; // 0.055

  const FOOT_H = 0.002;
  const BASE_H = 0.007;
  const WALL_T = 0.007;
  const LIP_R = WALL_T / 2;
  const RIDGE_R = 0.0032;
  const FLOOR_Y = FOOT_H + BASE_H;

  // Materials
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0x8da68f,
    roughness: 0.24,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.15,
  });

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xb59c80,
    roughness: 0.85,
    metalness: 0.0,
  });

  function createStadiumShape(halfStraight, radius) {
    const shape = new THREE.Shape();
    shape.moveTo(-halfStraight, -radius);
    shape.lineTo(halfStraight, -radius);
    shape.absarc(halfStraight, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-halfStraight, radius);
    shape.absarc(-halfStraight, 0, radius, Math.PI / 2, (3 * Math.PI) / 2, false);
    return shape;
  }

  function addMesh(geometry, material, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Unglazed clay foot at the bottom
  const footShape = createStadiumShape(L, R - 0.006);
  const footGeo = new THREE.ExtrudeGeometry(footShape, {
    depth: FOOT_H,
    bevelEnabled: false,
    curveSegments: 24,
  });
  footGeo.rotateX(-Math.PI / 2);
  const footMesh = addMesh(footGeo, clayMat, 'tray_clay_foot');
  footMesh.position.y = 0;

  // 2. Glazed base plate
  const baseShape = createStadiumShape(L, R - 0.002);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H,
    bevelEnabled: false,
    curveSegments: 24,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseMesh = addMesh(baseGeo, glazeMat, 'tray_base');
  baseMesh.position.y = FOOT_H;

  // 3. Outer rim wall (extruded stadium ring)
  const rimOuterShape = createStadiumShape(L, R);
  const rimInnerHole = createStadiumShape(L, R - WALL_T);
  rimOuterShape.holes.push(rimInnerHole);

  const wallHeight = H - FOOT_H - LIP_R;
  const rimGeo = new THREE.ExtrudeGeometry(rimOuterShape, {
    depth: wallHeight,
    bevelEnabled: false,
    curveSegments: 24,
  });
  rimGeo.rotateX(-Math.PI / 2);
  const rimMesh = addMesh(rimGeo, glazeMat, 'tray_rim_wall');
  rimMesh.position.y = FOOT_H;

  // 4. Rounded top lip along the rim
  const lipRadius = R - LIP_R;
  const lipY = H - LIP_R;
  const lipPoints = [];
  const arcSteps = 16;
  for (let i = 0; i <= arcSteps; i++) {
    const a = -Math.PI / 2 + (i / arcSteps) * Math.PI;
    lipPoints.push(new THREE.Vector3(L + Math.cos(a) * lipRadius, lipY, Math.sin(a) * lipRadius));
  }
  for (let i = 0; i <= arcSteps; i++) {
    const a = Math.PI / 2 + (i / arcSteps) * Math.PI;
    lipPoints.push(new THREE.Vector3(-L + Math.cos(a) * lipRadius, lipY, Math.sin(a) * lipRadius));
  }
  const lipCurve = new THREE.CatmullRomCurve3(lipPoints, true);
  const lipGeo = new THREE.TubeGeometry(lipCurve, 64, LIP_R, 12, true);
  addMesh(lipGeo, glazeMat, 'tray_rim_lip');

  // 5. Inner decorative raised ridges (4 segments: left C, right C, front bar, back bar)
  const ridgeR = R - 0.022;
  const ridgeY = FLOOR_Y + 0.0004;

  function addRidge(points, name) {
    const curve = new THREE.CatmullRomCurve3(points, false);
    const geo = new THREE.TubeGeometry(curve, 20, RIDGE_R, 10, false);
    addMesh(geo, glazeMat, name);

    const capGeo = new THREE.SphereGeometry(RIDGE_R, 10, 8);
    const startCap = addMesh(capGeo, glazeMat, name + '_cap_start');
    startCap.position.copy(points[0]);
    const endCap = addMesh(capGeo, glazeMat, name + '_cap_end');
    endCap.position.copy(points[points.length - 1]);
  }

  // Left C-shaped ridge
  const leftPts = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.62 + (i / 10) * (Math.PI * 0.76);
    leftPts.push(new THREE.Vector3(-L + Math.cos(a) * ridgeR, ridgeY, Math.sin(a) * ridgeR));
  }
  addRidge(leftPts, 'inner_ridge_left');

  // Right C-shaped ridge
  const rightPts = [];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 0.38 + (i / 10) * (Math.PI * 0.76);
    rightPts.push(new THREE.Vector3(L + Math.cos(a) * ridgeR, ridgeY, Math.sin(a) * ridgeR));
  }
  addRidge(rightPts, 'inner_ridge_right');

  // Front straight ridge (+Z)
  const barHalf = L * 0.68;
  addRidge(
    [
      new THREE.Vector3(-barHalf, ridgeY, ridgeR),
      new THREE.Vector3(0, ridgeY, ridgeR),
      new THREE.Vector3(barHalf, ridgeY, ridgeR),
    ],
    'inner_ridge_front'
  );

  // Back straight ridge (-Z)
  addRidge(
    [
      new THREE.Vector3(-barHalf, ridgeY, -ridgeR),
      new THREE.Vector3(0, ridgeY, -ridgeR),
      new THREE.Vector3(barHalf, ridgeY, -ridgeR),
    ],
    'inner_ridge_back'
  );

  return group;
}
