function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.45;
  const H = 0.35;
  const D = 0.40;

  const ARCH_R = W / 2; // 0.225
  const SIDE_H = H - ARCH_R; // 0.125
  const WALL_T = 0.025;
  const BASE_H = 0.055;
  const HOLE_Y = 0.165;
  const HOLE_R = 0.105;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xd6c6ad,
    roughness: 0.88,
    metalness: 0.02,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xb09e84,
    roughness: 0.94,
    metalness: 0.02,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x8f7a62,
    roughness: 0.92,
    metalness: 0.0,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xdfd3be,
    roughness: 0.95,
    metalness: 0.0,
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xc9b89c,
    roughness: 0.85,
    metalness: 0.02,
  });

  const zipperMat = new THREE.MeshStandardMaterial({
    color: 0x9c8b75,
    roughness: 0.5,
    metalness: 0.35,
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Helper to create outer arch shape
  function createArchShape(width, sideH, radius) {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0);
    s.lineTo(width / 2, 0);
    s.lineTo(width / 2, sideH);
    s.absarc(0, sideH, radius, 0, Math.PI, false);
    s.lineTo(-width / 2, 0);
    return s;
  }

  // 1. Main body shell (hollow arch extruded along Z)
  const outerShape = createArchShape(W, SIDE_H, ARCH_R);
  const innerPath = new THREE.Path();
  const inW = W - WALL_T * 2;
  const inR = inW / 2;
  innerPath.moveTo(-inW / 2, WALL_T);
  innerPath.lineTo(inW / 2, WALL_T);
  innerPath.lineTo(inW / 2, SIDE_H);
  innerPath.absarc(0, SIDE_H, inR, 0, Math.PI, false);
  innerPath.lineTo(-inW / 2, WALL_T);
  outerShape.holes.push(innerPath);

  const shellLen = D - WALL_T * 2;
  const shellGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: shellLen,
    bevelEnabled: false,
    curveSegments: 28,
  });
  shellGeo.translate(0, 0, -shellLen / 2);
  addMesh(shellGeo, canvasMat, 'main_body_shell');

  // 2. Back wall (solid arch at -Z)
  const backShape = createArchShape(W, SIDE_H, ARCH_R);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: WALL_T,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 28,
  });
  backGeo.translate(0, 0, -D / 2);
  addMesh(backGeo, canvasMat, 'back_wall');

  // 3. Front wall (arch with circular entrance hole at +Z)
  const frontShape = createArchShape(W, SIDE_H, ARCH_R);
  const holePath = new THREE.Path();
  holePath.absarc(0, HOLE_Y, HOLE_R, 0, Math.PI * 2, true);
  frontShape.holes.push(holePath);

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: WALL_T,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 28,
  });
  frontGeo.translate(0, 0, D / 2 - WALL_T);
  addMesh(frontGeo, canvasMat, 'front_wall');

  // 4. Bottom darker woven base band
  const baseGeo = new THREE.BoxGeometry(W + 0.004, BASE_H, D + 0.004);
  // Cut out? No, it wraps the bottom exterior; keep it slightly proud of the shell
  // Actually, to avoid blocking the interior floor, we make it a thin outer skirt:
  const skirtShape = new THREE.Shape();
  const sw = W / 2 + 0.002;
  const sd = D / 2 + 0.002;
  skirtShape.moveTo(-sw, -sd);
  skirtShape.lineTo(sw, -sd);
  skirtShape.lineTo(sw, sd);
  skirtShape.lineTo(-sw, sd);
  skirtShape.closePath();

  const skirtHole = new THREE.Path();
  const isw = W / 2 - WALL_T + 0.002;
  const isd = D / 2 - WALL_T + 0.002;
  skirtHole.moveTo(-isw, -isd);
  skirtHole.lineTo(isw, -isd);
  skirtHole.lineTo(isw, isd);
  skirtHole.lineTo(-isw, isd);
  skirtHole.closePath();
  skirtShape.holes.push(skirtHole);

  const skirtGeo = new THREE.ExtrudeGeometry(skirtShape, {
    depth: BASE_H,
    bevelEnabled: false,
  });
  skirtGeo.rotateX(Math.PI / 2);
  addMesh(skirtGeo, baseMat, 'base_band', 0, BASE_H, 0);

  // 5. Interior floor pad
  const floorGeo = new THREE.BoxGeometry(inW, WALL_T, shellLen);
  addMesh(floorGeo, interiorMat, 'floor_pad', 0, WALL_T / 2, 0);

  // 6. Interior back lining
  const backLiningGeo = new THREE.BoxGeometry(inW, H * 0.65, 0.01);
  addMesh(backLiningGeo, interiorMat, 'interior_back_lining', 0, H * 0.35, -D / 2 + WALL_T + 0.005);

  // 7. Inner plush cushion (main body)
  const cushW = inW * 0.92;
  const cushD = shellLen * 0.9;
  const cushH = 0.065;
  const cushGeo = new THREE.BoxGeometry(cushW, cushH, cushD);
  addMesh(cushGeo, cushionMat, 'inner_cushion_base', 0, WALL_T + cushH / 2, 0);

  // 8. Inner cushion puffed top
  const puffGeo = new THREE.SphereGeometry(1, 24, 16);
  puffGeo.scale(cushW * 0.48, 0.032, cushD * 0.48);
  addMesh(puffGeo, cushionMat, 'inner_cushion_top', 0, WALL_T + cushH * 0.75, 0);

  // 9. Entrance circular piping
  const entrancePipingGeo = new THREE.TorusGeometry(HOLE_R + 0.003, 0.006, 10, 32);
  addMesh(entrancePipingGeo, pipingMat, 'entrance_piping', 0, HOLE_Y, D / 2 + 0.002);

  // 10. Front arch perimeter seam / zipper piping
  const seamPoints = [];
  const seamSegs = 24;
  seamPoints.push(new THREE.Vector3(-W / 2, 0.01, D / 2));
  seamPoints.push(new THREE.Vector3(-W / 2, SIDE_H, D / 2));
  for (let i = 1; i < seamSegs; i++) {
    const a = Math.PI - (i / seamSegs) * Math.PI;
    seamPoints.push(
      new THREE.Vector3(Math.cos(a) * ARCH_R, SIDE_H + Math.sin(a) * ARCH_R, D / 2)
    );
  }
  seamPoints.push(new THREE.Vector3(W / 2, SIDE_H, D / 2));
  seamPoints.push(new THREE.Vector3(W / 2, 0.01, D / 2));

  const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
  const seamGeo = new THREE.TubeGeometry(seamCurve, 32, 0.006, 8, false);
  addMesh(seamGeo, pipingMat, 'front_arch_piping');

  // 11. Zipper pull tab on upper right of front arch
  const zipGeo = new THREE.BoxGeometry(0.012, 0.022, 0.008);
  const zipMesh = addMesh(zipGeo, zipperMat, 'zipper_pull', ARCH_R * 0.72, SIDE_H + ARCH_R * 0.68, D / 2 + 0.008);
  zipMesh.rotation.z = -0.6;

  // 12. Rolled-up flap at top of entrance
  const flapW = HOLE_R * 2.15;
  const flapR = 0.022;
  const flapY = HOLE_Y + HOLE_R - 0.012;
  const flapZ = D / 2 + 0.018;

  const flapGeo = new THREE.CylinderGeometry(flapR, flapR, flapW, 20);
  flapGeo.rotateZ(Math.PI / 2);
  addMesh(flapGeo, canvasMat, 'rolled_flap_core', 0, flapY, flapZ);

  // 13. Flap drape connecting rolled core to upper front wall
  const drapeGeo = new THREE.BoxGeometry(flapW * 0.96, 0.055, 0.016);
  const drapeMesh = addMesh(drapeGeo, canvasMat, 'rolled_flap_drape', 0, flapY + 0.025, D / 2 + 0.008);
  drapeMesh.rotation.x = -0.25;

  // 14. Left & right rolled flap end caps
  const capGeo = new THREE.CylinderGeometry(flapR * 0.75, flapR * 0.75, 0.006, 16);
  capGeo.rotateZ(Math.PI / 2);
  addMesh(capGeo, interiorMat, 'rolled_flap_cap_left', -flapW / 2 - 0.002, flapY, flapZ);
  addMesh(capGeo, interiorMat, 'rolled_flap_cap_right', flapW / 2 + 0.002, flapY, flapZ);

  return group;
}
