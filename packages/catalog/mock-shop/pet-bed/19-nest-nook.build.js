function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (in meters)
  const W = 0.60;
  const H = 0.18;
  const D = 0.45;

  const BASE_H = 0.018;
  const WALL_THICK = 0.075;
  const FRONT_DIP_H = 0.088;
  const BEVEL = 0.014;
  const CORNER_R = 0.04;

  const CUSHION_W = W - 2 * WALL_THICK + 0.03;
  const CUSHION_D = D - 2 * WALL_THICK + 0.03;
  const CUSHION_H = 0.078;

  // Materials
  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x3ea4b5,
    roughness: 0.85,
    metalness: 0.02,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x18181a,
    roughness: 0.9,
    metalness: 0.05,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.88,
    metalness: 0.02,
  });

  const tagMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Helper: rounded rectangle shape centered at (0, 0)
  function roundedRectShape(w, d, r) {
    const s = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    const cr = Math.min(r, hw, hd);
    s.moveTo(-hw + cr, -hd);
    s.lineTo(hw - cr, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + cr);
    s.lineTo(hw, hd - cr);
    s.quadraticCurveTo(hw, hd, hw - cr, hd);
    s.lineTo(-hw + cr, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - cr);
    s.lineTo(-hw, -hd + cr);
    s.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
    return s;
  }

  function addMesh(geo, mat, name, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Black Base
  const baseBevel = 0.004;
  const baseShape = roundedRectShape(W - 2 * baseBevel, D - 2 * baseBevel, CORNER_R);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_H - 2 * baseBevel,
    bevelEnabled: true,
    bevelThickness: baseBevel,
    bevelSize: baseBevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  baseGeo.rotateX(Math.PI / 2);
  addMesh(baseGeo, baseMat, 'bed_base', [0, BASE_H - baseBevel, 0]);

  // 2. Back Bolster Wall (-Z)
  const wallH = H - BASE_H;
  const backShape = roundedRectShape(W - 2 * BEVEL, WALL_THICK - 2 * BEVEL, 0.02);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: wallH - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  backGeo.rotateX(Math.PI / 2);
  addMesh(
    backGeo,
    tealMat,
    'bolster_back',
    [0, H - BEVEL, -D / 2 + WALL_THICK / 2]
  );

  // 3. Left Bolster Wall (-X)
  const sideShape = roundedRectShape(WALL_THICK - 2 * BEVEL, D - 2 * BEVEL, 0.02);
  const leftGeo = new THREE.ExtrudeGeometry(sideShape, {
    depth: wallH - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 12,
  });
  leftGeo.rotateX(Math.PI / 2);
  addMesh(
    leftGeo,
    tealMat,
    'bolster_left',
    [-W / 2 + WALL_THICK / 2, H - BEVEL, 0]
  );

  // 4. Right Bolster Wall (+X)
  addMesh(
    leftGeo,
    tealMat,
    'bolster_right',
    [W / 2 - WALL_THICK / 2, H - BEVEL, 0]
  );

  // 5. Front Bolster Wall (+Z) with U-shaped entry dip
  const frontW = W - 2 * BEVEL;
  const hw = frontW / 2;
  const dipStart = hw - WALL_THICK * 0.85;
  const dipBottom = FRONT_DIP_H - BASE_H - BEVEL;
  const topY = wallH - BEVEL;

  const frontShape = new THREE.Shape();
  frontShape.moveTo(-hw, 0);
  frontShape.lineTo(hw, 0);
  frontShape.lineTo(hw, topY);
  frontShape.lineTo(dipStart, topY);
  frontShape.bezierCurveTo(
    dipStart * 0.65,
    topY,
    dipStart * 0.6,
    dipBottom,
    0,
    dipBottom
  );
  frontShape.bezierCurveTo(
    -dipStart * 0.6,
    dipBottom,
    -dipStart * 0.65,
    topY,
    -dipStart,
    topY
  );
  frontShape.lineTo(-hw, topY);
  frontShape.closePath();

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    depth: WALL_THICK - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 20,
  });
  addMesh(
    frontGeo,
    tealMat,
    'bolster_front',
    [0, BASE_H + BEVEL, D / 2 - WALL_THICK + BEVEL]
  );

  // 6. Top Rim Piping (continuous closed loop along the top of the bolster)
  const rimX = W / 2 - WALL_THICK * 0.35;
  const rimZBack = -D / 2 + WALL_THICK * 0.35;
  const rimZFront = D / 2 - WALL_THICK * 0.35;
  const rimY = H - 0.004;
  const rimDipY = FRONT_DIP_H - 0.004;

  const rimPoints = [
    new THREE.Vector3(-rimX, rimY, rimZBack),
    new THREE.Vector3(0, rimY, rimZBack),
    new THREE.Vector3(rimX, rimY, rimZBack),
    new THREE.Vector3(rimX, rimY, 0),
    new THREE.Vector3(rimX, rimY, rimZFront),
    new THREE.Vector3(dipStart, rimY, rimZFront),
    new THREE.Vector3(dipStart * 0.45, rimDipY + 0.015, rimZFront),
    new THREE.Vector3(0, rimDipY, rimZFront),
    new THREE.Vector3(-dipStart * 0.45, rimDipY + 0.015, rimZFront),
    new THREE.Vector3(-dipStart, rimY, rimZFront),
    new THREE.Vector3(-rimX, rimY, rimZFront),
    new THREE.Vector3(-rimX, rimY, 0),
  ];
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true, 'catmullrom', 0.3);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 64, 0.0045, 8, true);
  addMesh(rimGeo, tealMat, 'bolster_top_piping');

  // 7-10. Vertical Corner Seams
  const seamGeo = new THREE.CylinderGeometry(0.0035, 0.0035, wallH - 0.02, 8);
  const seamX = W / 2 - 0.008;
  const seamZ = D / 2 - 0.008;
  const seamY = BASE_H + (wallH - 0.02) / 2 + 0.005;
  addMesh(seamGeo, tealMat, 'corner_seam_fl', [-seamX, seamY, seamZ]);
  addMesh(seamGeo, tealMat, 'corner_seam_fr', [seamX, seamY, seamZ]);
  addMesh(seamGeo, tealMat, 'corner_seam_bl', [-seamX, seamY, -seamZ]);
  addMesh(seamGeo, tealMat, 'corner_seam_br', [seamX, seamY, -seamZ]);

  // 11. Inner Cushion Base
  const cBevel = 0.022;
  const cushionShape = roundedRectShape(
    CUSHION_W - 2 * cBevel,
    CUSHION_D - 2 * cBevel,
    0.04
  );
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, {
    depth: CUSHION_H - 2 * cBevel,
    bevelEnabled: true,
    bevelThickness: cBevel,
    bevelSize: cBevel,
    bevelSegments: 5,
    curveSegments: 16,
  });
  cushionGeo.rotateX(Math.PI / 2);
  addMesh(
    cushionGeo,
    cushionMat,
    'inner_cushion',
    [0, BASE_H + CUSHION_H - cBevel, 0]
  );

  // 12. Inner Cushion Top Puff (subtle pillowy crown)
  const puffGeo = new THREE.SphereGeometry(1, 24, 16);
  puffGeo.scale(CUSHION_W * 0.44, 0.022, CUSHION_D * 0.44);
  addMesh(
    puffGeo,
    cushionMat,
    'inner_cushion_puff',
    [0, BASE_H + CUSHION_H - 0.008, 0]
  );

  // 13. Side Fabric Tag (+X side)
  const tagGeo = new THREE.BoxGeometry(0.004, 0.022, 0.014);
  addMesh(
    tagGeo,
    tagMat,
    'side_brand_tag',
    [W / 2 + 0.001, BASE_H + 0.022, D / 2 - 0.045]
  );

  return group;
}
