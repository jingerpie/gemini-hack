function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.20;
  const D = 1.80;
  const BACKING_H = 0.004;
  const PILE_H = 0.016;
  const BINDING_R = 0.0085;
  const BORDER_INSET = 0.115;
  const GROOVE_W = 0.008;
  const GROOVE_DEPTH = 0.004;

  // Terracotta accent block dimensions & position
  const ACCENT_W = 0.34;
  const ACCENT_D = 0.46;
  const ACCENT_X = W / 2 - BINDING_R - ACCENT_W / 2;
  const ACCENT_Z = -0.14;
  const ACCENT_H = PILE_H + 0.001;

  // Materials
  const creamPileMat = new THREE.MeshStandardMaterial({
    color: 0xeae5d9,
    roughness: 0.92,
    metalness: 0.0
  });

  const creamGrooveMat = new THREE.MeshStandardMaterial({
    color: 0xd8d1c2,
    roughness: 0.95,
    metalness: 0.0
  });

  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0xe5dfd1,
    roughness: 0.88,
    metalness: 0.0
  });

  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xa63c14,
    roughness: 0.93,
    metalness: 0.0
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0xc8bfae,
    roughness: 0.95,
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

  // 1. Backing layer (sits at y = 0)
  const innerW = W - BINDING_R * 2;
  const innerD = D - BINDING_R * 2;
  addMesh(
    new THREE.BoxGeometry(innerW, BACKING_H, innerD),
    backingMat,
    "rug_backing",
    0,
    BACKING_H / 2,
    0
  );

  // 2. Groove base layer (underneath the pile, visible in the carved channel)
  const grooveBaseH = PILE_H - GROOVE_DEPTH;
  addMesh(
    new THREE.BoxGeometry(innerW - 0.004, grooveBaseH, innerD - 0.004),
    creamGrooveMat,
    "groove_base",
    0,
    BACKING_H + grooveBaseH / 2,
    0
  );

  // 3. Outer border strips (between binding and carved groove)
  const borderStripW = BORDER_INSET - BINDING_R - GROOVE_W / 2;
  const fullPileY = BACKING_H + PILE_H / 2;

  // North (-Z) and South (+Z) outer borders
  addMesh(
    new THREE.BoxGeometry(innerW, PILE_H, borderStripW),
    creamPileMat,
    "outer_border_north",
    0,
    fullPileY,
    -innerD / 2 + borderStripW / 2
  );
  addMesh(
    new THREE.BoxGeometry(innerW, PILE_H, borderStripW),
    creamPileMat,
    "outer_border_south",
    0,
    fullPileY,
    innerD / 2 - borderStripW / 2
  );

  // West (-X) and East (+X) outer borders (between north & south strips)
  const sideBorderD = innerD - borderStripW * 2;
  addMesh(
    new THREE.BoxGeometry(borderStripW, PILE_H, sideBorderD),
    creamPileMat,
    "outer_border_west",
    -innerW / 2 + borderStripW / 2,
    fullPileY,
    0
  );
  addMesh(
    new THREE.BoxGeometry(borderStripW, PILE_H, sideBorderD),
    creamPileMat,
    "outer_border_east",
    innerW / 2 - borderStripW / 2,
    fullPileY,
    0
  );

  // 4. Inner cream field (inside the carved groove)
  const fieldW = W - BORDER_INSET * 2 - GROOVE_W;
  const fieldD = D - BORDER_INSET * 2 - GROOVE_W;
  addMesh(
    new THREE.BoxGeometry(fieldW, PILE_H, fieldD),
    creamPileMat,
    "inner_cream_field",
    0,
    fullPileY,
    0
  );

  // 5. Terracotta offset accent block on the +X side
  addMesh(
    new THREE.BoxGeometry(ACCENT_W, ACCENT_H, ACCENT_D),
    terracottaMat,
    "terracotta_accent_block",
    ACCENT_X,
    BACKING_H + ACCENT_H / 2,
    ACCENT_Z
  );

  // 6. Serged edge bindings along all 4 sides
  const bindingY = BINDING_R;
  const hBarLen = W - BINDING_R * 2;
  const vBarLen = D - BINDING_R * 2;

  addMesh(
    new THREE.CylinderGeometry(BINDING_R, BINDING_R, hBarLen, 16),
    bindingMat,
    "edge_binding_north",
    0,
    bindingY,
    -D / 2 + BINDING_R,
    0,
    0,
    Math.PI / 2
  );
  addMesh(
    new THREE.CylinderGeometry(BINDING_R, BINDING_R, hBarLen, 16),
    bindingMat,
    "edge_binding_south",
    0,
    bindingY,
    D / 2 - BINDING_R,
    0,
    0,
    Math.PI / 2
  );
  addMesh(
    new THREE.CylinderGeometry(BINDING_R, BINDING_R, vBarLen, 16),
    bindingMat,
    "edge_binding_west",
    -W / 2 + BINDING_R,
    bindingY,
    0,
    Math.PI / 2,
    0,
    0
  );
  addMesh(
    new THREE.CylinderGeometry(BINDING_R, BINDING_R, vBarLen, 16),
    bindingMat,
    "edge_binding_east",
    W / 2 - BINDING_R,
    bindingY,
    0,
    Math.PI / 2,
    0,
    0
  );

  // 7. Corner binding caps
  const cornerGeo = new THREE.SphereGeometry(BINDING_R, 16, 12);
  const cx = W / 2 - BINDING_R;
  const cz = D / 2 - BINDING_R;
  addMesh(cornerGeo, bindingMat, "corner_binding_nw", -cx, bindingY, -cz);
  addMesh(cornerGeo, bindingMat, "corner_binding_ne", cx, bindingY, -cz);
  addMesh(cornerGeo, bindingMat, "corner_binding_sw", -cx, bindingY, cz);
  addMesh(cornerGeo, bindingMat, "corner_binding_se", cx, bindingY, cz);

  return group;
}
