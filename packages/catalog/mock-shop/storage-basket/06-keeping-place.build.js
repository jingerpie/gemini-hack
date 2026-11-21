function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.20;
  const RADIUS = DIAMETER / 2;
  const HEIGHT = 0.16;
  const WALL_THICKNESS = 0.009;
  const CORD_RADIUS = 0.0045;
  const ROW_COUNT = 16;
  const RADIAL_SEGMENTS = 32;

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xe9e1d2,
    roughness: 0.92,
    metalness: 0.0
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xded5c5,
    roughness: 0.95,
    metalness: 0.0
  });

  // Main hollow basket shell via LatheGeometry
  const shellRadius = RADIUS - CORD_RADIUS * 0.55;
  const innerRadius = shellRadius - WALL_THICKNESS;
  const bottomThickness = 0.010;
  const cornerR = 0.012;

  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(shellRadius - cornerR, 0),
    new THREE.Vector2(shellRadius - cornerR * 0.35, cornerR * 0.25),
    new THREE.Vector2(shellRadius, cornerR),
    new THREE.Vector2(shellRadius, HEIGHT - CORD_RADIUS),
    new THREE.Vector2(shellRadius - WALL_THICKNESS * 0.5, HEIGHT),
    new THREE.Vector2(innerRadius, HEIGHT - CORD_RADIUS),
    new THREE.Vector2(innerRadius, bottomThickness + cornerR * 0.5),
    new THREE.Vector2(innerRadius - cornerR * 0.5, bottomThickness),
    new THREE.Vector2(0, bottomThickness)
  ];

  const shellGeo = new THREE.LatheGeometry(pts, RADIAL_SEGMENTS);
  const shellMesh = new THREE.Mesh(shellGeo, innerMat);
  shellMesh.name = 'basket_shell';
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  group.add(shellMesh);

  // Stacked horizontal crochet cord rows along the exterior
  const startY = cornerR * 0.85;
  const endY = HEIGHT - CORD_RADIUS * 1.1;
  const stepY = (endY - startY) / (ROW_COUNT - 1);

  for (let i = 0; i < ROW_COUNT; i++) {
    const y = startY + i * stepY;
    const isBottomCurve = i === 0;
    const ringTube = isBottomCurve ? CORD_RADIUS * 0.9 : CORD_RADIUS;
    const ringRadius = RADIUS - ringTube;

    const rowGeo = new THREE.TorusGeometry(ringRadius, ringTube, 8, RADIAL_SEGMENTS);
    rowGeo.rotateX(Math.PI / 2);

    const rowMesh = new THREE.Mesh(rowGeo, cordMat);
    rowMesh.position.y = y;
    rowMesh.name = 'crochet_row_' + (i + 1);
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    group.add(rowMesh);
  }

  // Top rim crochet border
  const rimTube = CORD_RADIUS * 1.15;
  const rimRadius = RADIUS - rimTube * 1.15;
  const rimGeo = new THREE.TorusGeometry(rimRadius, rimTube, 10, RADIAL_SEGMENTS);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, cordMat);
  rimMesh.position.y = HEIGHT - rimTube;
  rimMesh.name = 'top_rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // Concentric bottom spiral rings (resting at y = 0)
  const bottomRings = 4;
  for (let i = 0; i < bottomRings; i++) {
    const t = (i + 1) / (bottomRings + 1);
    const r = (shellRadius - cornerR) * t;
    const tube = 0.0025;
    const bGeo = new THREE.TorusGeometry(r, tube, 6, RADIAL_SEGMENTS);
    bGeo.rotateX(Math.PI / 2);
    const bMesh = new THREE.Mesh(bGeo, cordMat);
    bMesh.position.y = tube;
    bMesh.name = 'bottom_coil_' + (i + 1);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    group.add(bMesh);
  }

  return group;
}
