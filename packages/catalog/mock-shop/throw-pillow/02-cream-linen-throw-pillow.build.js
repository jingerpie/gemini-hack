function build(THREE) {
  const group = new THREE.Group();

  const W = 0.48;
  const H = 0.45;
  const D = 0.16;

  const BEVEL_S = 0.035;
  const BEVEL_T = 0.045;
  const EXTRUDE_D = 0.03;

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d3,
    roughness: 0.9,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xebe6d8,
    roughness: 0.85,
    metalness: 0.0
  });

  const halfW = W / 2 - BEVEL_S;
  const botY = BEVEL_S;
  const topY = H - BEVEL_S;
  const midY = (botY + topY) / 2;

  // Pillow silhouette with gentle inward curves and slightly flared bottom corners
  const shape = new THREE.Shape();
  shape.moveTo(-halfW - 0.012, botY);
  shape.quadraticCurveTo(0, botY + 0.006, halfW + 0.012, botY);
  shape.quadraticCurveTo(halfW - 0.015, midY, halfW, topY);
  shape.quadraticCurveTo(0, topY - 0.022, -halfW, topY);
  shape.quadraticCurveTo(-halfW + 0.015, midY, -halfW - 0.012, botY);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_D,
    bevelEnabled: true,
    bevelThickness: BEVEL_T,
    bevelSize: BEVEL_S,
    bevelSegments: 8,
    curveSegments: 20
  });
  bodyGeo.translate(0, 0, -EXTRUDE_D / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, linenMat);
  bodyMesh.name = 'pillow_body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Plump central loft
  const loftGeo = new THREE.SphereGeometry(1, 32, 24);
  const loftMesh = new THREE.Mesh(loftGeo, linenMat);
  loftMesh.name = 'pillow_loft';
  loftMesh.scale.set(W * 0.42, H * 0.40, D * 0.50);
  loftMesh.position.set(0, H * 0.5, 0);
  loftMesh.castShadow = true;
  loftMesh.receiveShadow = true;
  group.add(loftMesh);

  // Perimeter piping seam
  const pipeHalfW = W / 2;
  const pipeBotY = 0.005;
  const pipeTopY = H;
  const pipeMidY = (pipeBotY + pipeTopY) / 2;

  const pipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-pipeHalfW - 0.012, pipeBotY, 0),
    new THREE.Vector3(0, pipeBotY + 0.004, 0),
    new THREE.Vector3(pipeHalfW + 0.012, pipeBotY, 0),
    new THREE.Vector3(pipeHalfW - 0.014, pipeMidY, 0),
    new THREE.Vector3(pipeHalfW, pipeTopY, 0),
    new THREE.Vector3(0, pipeTopY - 0.020, 0),
    new THREE.Vector3(-pipeHalfW, pipeTopY, 0),
    new THREE.Vector3(-pipeHalfW + 0.014, pipeMidY, 0)
  ], true);

  const pipeGeo = new THREE.TubeGeometry(pipeCurve, 64, 0.005, 8, true);
  const pipeMesh = new THREE.Mesh(pipeGeo, pipingMat);
  pipeMesh.name = 'pillow_piping';
  pipeMesh.castShadow = true;
  pipeMesh.receiveShadow = true;
  group.add(pipeMesh);

  return group;
}
