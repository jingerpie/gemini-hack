function build(THREE) {
  const group = new THREE.Group();

  const W = 0.46;
  const H = 0.46;
  const D = 0.16;

  const BEVEL_SIZE = 0.04;
  const BEVEL_THICKNESS = 0.055;
  const EXTRUDE_DEPTH = 0.02;
  const HALF_SPAN = W / 2 - BEVEL_SIZE; // 0.19
  const MID_DIP = HALF_SPAN - 0.02;     // 0.17

  const velvetMat = new THREE.MeshPhysicalMaterial({
    color: 0x9c2254,
    roughness: 0.88,
    metalness: 0.0,
    sheen: 0.65,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(0xd94b82)
  });

  const pipingMat = new THREE.MeshPhysicalMaterial({
    color: 0x871c48,
    roughness: 0.85,
    metalness: 0.0,
    sheen: 0.5,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xc43d72)
  });

  // 1. Main cushion body with pinched-square silhouette and soft beveled edges
  const shape = new THREE.Shape();
  shape.moveTo(-HALF_SPAN, -HALF_SPAN);
  shape.quadraticCurveTo(0, -MID_DIP, HALF_SPAN, -HALF_SPAN);
  shape.quadraticCurveTo(MID_DIP, 0, HALF_SPAN, HALF_SPAN);
  shape.quadraticCurveTo(0, MID_DIP, -HALF_SPAN, HALF_SPAN);
  shape.quadraticCurveTo(-MID_DIP, 0, -HALF_SPAN, -HALF_SPAN);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: BEVEL_SIZE,
    bevelThickness: BEVEL_THICKNESS,
    curveSegments: 16
  });
  bodyGeo.translate(0, 0, -EXTRUDE_DEPTH / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, velvetMat);
  bodyMesh.name = "cushion_body";
  bodyMesh.position.set(0, H / 2, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Plump central belly on front and back
  const coreGeo = new THREE.SphereGeometry(1, 24, 16);
  const coreMesh = new THREE.Mesh(coreGeo, velvetMat);
  coreMesh.name = "cushion_plump_core";
  coreMesh.scale.set(0.19, 0.19, D / 2);
  coreMesh.position.set(0, H / 2, 0);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // 3. Perimeter seam piping
  const seamEdge = W / 2 - 0.004;
  const seamDip = seamEdge - 0.022;
  const seamPoints = [
    new THREE.Vector3(-seamEdge, H / 2 - seamEdge, 0),
    new THREE.Vector3(0, H / 2 - seamDip, 0),
    new THREE.Vector3(seamEdge, H / 2 - seamEdge, 0),
    new THREE.Vector3(seamDip, H / 2, 0),
    new THREE.Vector3(seamEdge, H / 2 + seamEdge, 0),
    new THREE.Vector3(0, H / 2 + seamDip, 0),
    new THREE.Vector3(-seamEdge, H / 2 + seamEdge, 0),
    new THREE.Vector3(-seamDip, H / 2, 0)
  ];
  const seamCurve = new THREE.CatmullRomCurve3(seamPoints, true, "catmullrom", 0.4);
  const seamGeo = new THREE.TubeGeometry(seamCurve, 32, 0.0045, 8, true);
  const seamMesh = new THREE.Mesh(seamGeo, pipingMat);
  seamMesh.name = "cushion_seam_piping";
  seamMesh.castShadow = true;
  seamMesh.receiveShadow = true;
  group.add(seamMesh);

  // 4. Four soft flared corners
  const cornerGeo = new THREE.SphereGeometry(0.022, 12, 10);
  const cornerOffset = W / 2 - 0.024;
  const corners = [
    { name: "corner_bottom_left", x: -cornerOffset, y: H / 2 - cornerOffset },
    { name: "corner_bottom_right", x: cornerOffset, y: H / 2 - cornerOffset },
    { name: "corner_top_left", x: -cornerOffset, y: H / 2 + cornerOffset },
    { name: "corner_top_right", x: cornerOffset, y: H / 2 + cornerOffset }
  ];

  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const cornerMesh = new THREE.Mesh(cornerGeo, velvetMat);
    cornerMesh.name = c.name;
    cornerMesh.scale.set(1.05, 1.05, 0.65);
    cornerMesh.position.set(c.x, c.y, 0);
    cornerMesh.castShadow = true;
    cornerMesh.receiveShadow = true;
    group.add(cornerMesh);
  }

  return group;
}
