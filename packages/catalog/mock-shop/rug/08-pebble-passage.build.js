function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.0; // short side along X
  const D = 1.6; // long side along Z
  const BASE_H = 0.018;
  const BEVEL = 0.006;
  const TOTAL_BASE_H = BASE_H + BEVEL * 2;
  const RING_H = 0.012;

  // Materials
  const baseWoolMat = new THREE.MeshStandardMaterial({
    color: 0xe6decb,
    roughness: 0.95,
    metalness: 0.0,
  });

  const raisedWoolMat = new THREE.MeshStandardMaterial({
    color: 0xf0eadc,
    roughness: 0.92,
    metalness: 0.0,
  });

  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0xddd3be,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Helper to register mesh
  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Main oval rug base
  const ovalShape = new THREE.Shape();
  ovalShape.absellipse(0, 0, W / 2 - BEVEL, D / 2 - BEVEL, 0, Math.PI * 2, false, 0);

  const baseGeo = new THREE.ExtrudeGeometry(ovalShape, {
    depth: BASE_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 32,
  });
  // Rotate so extrusion is along +Y, centered at Y = TOTAL_BASE_H / 2
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(baseGeo, baseWoolMat, "rug_oval_base", 0, BEVEL, 0);

  // 2. Perimeter braided/piped binding
  const rimPoints = [];
  const rimSegs = 32;
  for (let i = 0; i < rimSegs; i++) {
    const a = (i / rimSegs) * Math.PI * 2;
    rimPoints.push(new THREE.Vector3(Math.cos(a) * (W / 2 - 0.004), TOTAL_BASE_H * 0.5, Math.sin(a) * (D / 2 - 0.004)));
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 32, 0.009, 8, true);
  addMesh(rimGeo, bindingMat, "rug_perimeter_binding", 0, 0, 0);

  // 3. Raised concentric pebble rings and mounds
  const ringGeo = new THREE.TorusGeometry(1, 0.14, 10, 28);
  const moundGeo = new THREE.SphereGeometry(1, 20, 12);

  const pebbles = [
    // [type, x, z, radiusX, radiusZ, rotY, hasInnerRing, hasCenterMound]
    ["ring", -0.18, -0.32, 0.14, 0.11, 0.3, true, true],
    ["ring", 0.18, -0.36, 0.13, 0.12, -0.4, true, false],
    ["ring", 0.02, -0.58, 0.11, 0.09, 0.2, false, true],
    ["ring", -0.22, -0.02, 0.16, 0.13, -0.5, true, true],
    ["ring", 0.19, -0.06, 0.15, 0.12, 0.4, true, false],
    ["ring", 0.02, 0.14, 0.12, 0.09, 0.1, true, true],
    ["ring", -0.16, 0.36, 0.15, 0.18, 0.6, true, true],
    ["ring", 0.20, 0.32, 0.13, 0.11, -0.2, true, false],
    ["ring", -0.02, 0.58, 0.12, 0.10, 0.3, false, true],
    ["mound", -0.33, 0.18, 0.06, 0.05, 0.2, false, false],
    ["mound", 0.34, 0.12, 0.06, 0.07, -0.3, false, false],
    ["mound", 0.32, -0.20, 0.05, 0.06, 0.5, false, false],
    ["mound", -0.32, -0.22, 0.05, 0.04, -0.1, false, false],
    ["mound", 0.06, -0.22, 0.06, 0.05, 0.0, false, false],
    ["mound", -0.05, 0.30, 0.05, 0.04, 0.4, false, false],
  ];

  const surfaceY = TOTAL_BASE_H - 0.003;

  pebbles.forEach((p, idx) => {
    const [type, x, z, rx, rz, rotY, hasInner, hasCenter] = p;
    if (type === "ring") {
      addMesh(
        ringGeo,
        raisedWoolMat,
        `pebble_outer_ring_${idx + 1}`,
        x,
        surfaceY,
        z,
        Math.PI / 2,
        0,
        rotY,
        rx,
        rz,
        RING_H / 0.14
      );
      if (hasInner) {
        addMesh(
          ringGeo,
          raisedWoolMat,
          `pebble_inner_ring_${idx + 1}`,
          x,
          surfaceY,
          z,
          Math.PI / 2,
          0,
          rotY + 0.2,
          rx * 0.55,
          rz * 0.55,
          RING_H / 0.14
        );
      }
      if (hasCenter) {
        addMesh(
          moundGeo,
          baseWoolMat,
          `pebble_center_mound_${idx + 1}`,
          x,
          surfaceY,
          z,
          0,
          rotY,
          0,
          rx * 0.28,
          RING_H * 0.85,
          rz * 0.28
        );
      }
    } else {
      addMesh(
        moundGeo,
        raisedWoolMat,
        `pebble_mound_${idx + 1}`,
        x,
        surfaceY,
        z,
        0,
        rotY,
        0,
        rx,
        RING_H * 0.9,
        rz
      );
    }
  });

  return group;
}
