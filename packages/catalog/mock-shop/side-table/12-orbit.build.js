function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const LARGE_W = 0.52;
  const LARGE_D = 0.52;
  const LARGE_H = 0.50;

  const SMALL_W = 0.41;
  const SMALL_D = 0.41;
  const SMALL_H = 0.42;

  const TOP_THICK = 0.022;
  const TOP_CORNER_R = 0.055;
  const TUBE_R = 0.010;
  const BEND_R = 0.045;
  const FOOT_H = 0.008;
  const FOOT_R = 0.0105;
  const FRAME_INSET = 0.028;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb88456,
    roughness: 0.48,
    metalness: 0.02,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d3c,
    roughness: 0.38,
    metalness: 0.78,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1e1f1f,
    roughness: 0.85,
    metalness: 0.05,
  });

  function createRoundedRectShape(w, d, r) {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hd = d / 2;
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  function buildTable(prefix, w, d, h) {
    const tableGroup = new THREE.Group();

    const topBottomY = h - TOP_THICK;
    const barCenterY = topBottomY - TUBE_R;
    const legX = w / 2 - FRAME_INSET;
    const legZ = d / 2 - FRAME_INSET;

    // Tabletop
    const bevel = 0.002;
    const topShape = createRoundedRectShape(w - bevel * 2, d - bevel * 2, TOP_CORNER_R);
    const topGeo = new THREE.ExtrudeGeometry(topShape, {
      depth: TOP_THICK - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 12,
    });
    topGeo.rotateX(-Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, woodMat);
    topMesh.position.y = topBottomY + bevel;
    topMesh.name = `${prefix}_tabletop`;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Tubular U-frames (front and back)
    const zPositions = [legZ, -legZ];
    const zNames = ["front", "back"];

    for (let i = 0; i < 2; i++) {
      const z = zPositions[i];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-legX, FOOT_H, z),
        new THREE.Vector3(-legX, barCenterY - BEND_R, z),
        new THREE.Vector3(-legX + BEND_R * 0.29, barCenterY - BEND_R * 0.29, z),
        new THREE.Vector3(-legX + BEND_R, barCenterY, z),
        new THREE.Vector3(legX - BEND_R, barCenterY, z),
        new THREE.Vector3(legX - BEND_R * 0.29, barCenterY - BEND_R * 0.29, z),
        new THREE.Vector3(legX, barCenterY - BEND_R, z),
        new THREE.Vector3(legX, FOOT_H, z),
      ]);

      const frameGeo = new THREE.TubeGeometry(curve, 32, TUBE_R, 12, false);
      const frameMesh = new THREE.Mesh(frameGeo, metalMat);
      frameMesh.name = `${prefix}_frame_${zNames[i]}`;
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      tableGroup.add(frameMesh);
    }

    // Rubber feet and side bolt caps
    const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
    const boltGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12);
    boltGeo.rotateZ(Math.PI / 2);

    const corners = [
      { x: -legX, z: legZ, label: "front_left", dir: -1 },
      { x: legX, z: legZ, label: "front_right", dir: 1 },
      { x: -legX, z: -legZ, label: "back_left", dir: -1 },
      { x: legX, z: -legZ, label: "back_right", dir: 1 },
    ];

    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];

      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(c.x, FOOT_H / 2, c.z);
      foot.name = `${prefix}_foot_${c.label}`;
      foot.castShadow = true;
      foot.receiveShadow = true;
      tableGroup.add(foot);

      const bolt = new THREE.Mesh(boltGeo, metalMat);
      bolt.position.set(c.x + c.dir * (TUBE_R + 0.001), barCenterY - BEND_R - 0.025, c.z);
      bolt.name = `${prefix}_bolt_${c.label}`;
      bolt.castShadow = true;
      bolt.receiveShadow = true;
      tableGroup.add(bolt);
    }

    return tableGroup;
  }

  const largeTable = buildTable("large", LARGE_W, LARGE_D, LARGE_H);
  const smallTable = buildTable("small", SMALL_W, SMALL_D, SMALL_H);

  group.add(largeTable);
  group.add(smallTable);

  return group;
}
