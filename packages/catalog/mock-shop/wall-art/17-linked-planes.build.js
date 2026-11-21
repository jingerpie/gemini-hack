function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W1 = 0.45;
  const H1 = 0.45;
  const W2 = 0.34;
  const H2 = 0.34;
  const W3 = 0.24;
  const H3 = 0.24;
  const GAP = 0.08;
  const D = 0.055; // Depth from wall (back at -D/2, front at +D/2)
  const THICK = 0.006; // Sheet metal thickness
  const BEND_R = 0.012; // Outer bend radius

  const TOTAL_W = W1 + GAP + W2 + GAP + W3;
  const CENTER_Y = H1 / 2;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d40,
    roughness: 0.45,
    metalness: 0.35,
  });

  const cleatMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.7,
    metalness: 0.2,
  });

  function createPanel(w, h, centerX, prefix) {
    const panelGroup = new THREE.Group();
    panelGroup.position.set(centerX, CENTER_Y, 0);

    const flatH = h - 2 * BEND_R;
    const returnD = D - BEND_R;
    const frontZ = D / 2 - THICK / 2;

    // 1. Front flat plate
    const frontGeo = new THREE.BoxGeometry(w, flatH, THICK);
    const frontMesh = new THREE.Mesh(frontGeo, metalMat);
    frontMesh.name = `${prefix}_front_plate`;
    frontMesh.position.set(0, 0, frontZ);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    panelGroup.add(frontMesh);

    // 2. Top rounded bend (cylinder along X)
    const bendGeo = new THREE.CylinderGeometry(
      BEND_R,
      BEND_R,
      w,
      16,
      1,
      false,
      0,
      Math.PI / 2
    );
    bendGeo.rotateZ(Math.PI / 2);

    const topBendMesh = new THREE.Mesh(bendGeo, metalMat);
    topBendMesh.name = `${prefix}_top_bend`;
    topBendMesh.position.set(0, flatH / 2, D / 2 - BEND_R);
    topBendMesh.castShadow = true;
    topBendMesh.receiveShadow = true;
    panelGroup.add(topBendMesh);

    // 3. Bottom rounded bend
    const bottomBendGeo = new THREE.CylinderGeometry(
      BEND_R,
      BEND_R,
      w,
      16,
      1,
      false,
      Math.PI / 2,
      Math.PI / 2
    );
    bottomBendGeo.rotateZ(Math.PI / 2);

    const bottomBendMesh = new THREE.Mesh(bottomBendGeo, metalMat);
    bottomBendMesh.name = `${prefix}_bottom_bend`;
    bottomBendMesh.position.set(0, -flatH / 2, D / 2 - BEND_R);
    bottomBendMesh.castShadow = true;
    bottomBendMesh.receiveShadow = true;
    panelGroup.add(bottomBendMesh);

    // 4. Top return flange (going back to wall)
    const returnGeo = new THREE.BoxGeometry(w, THICK, returnD);
    const topReturnMesh = new THREE.Mesh(returnGeo, metalMat);
    topReturnMesh.name = `${prefix}_top_return`;
    topReturnMesh.position.set(0, h / 2 - THICK / 2, -BEND_R / 2);
    topReturnMesh.castShadow = true;
    topReturnMesh.receiveShadow = true;
    panelGroup.add(topReturnMesh);

    // 5. Bottom return flange (going back to wall)
    const bottomReturnMesh = new THREE.Mesh(returnGeo, metalMat);
    bottomReturnMesh.name = `${prefix}_bottom_return`;
    bottomReturnMesh.position.set(0, -h / 2 + THICK / 2, -BEND_R / 2);
    bottomReturnMesh.castShadow = true;
    bottomReturnMesh.receiveShadow = true;
    panelGroup.add(bottomReturnMesh);

    // 6. Wall mounting cleat (flush with z = -D/2)
    const cleatW = w * 0.65;
    const cleatH = h * 0.2;
    const cleatD = 0.012;
    const cleatGeo = new THREE.BoxGeometry(cleatW, cleatH, cleatD);
    const cleatMesh = new THREE.Mesh(cleatGeo, cleatMat);
    cleatMesh.name = `${prefix}_wall_cleat`;
    cleatMesh.position.set(0, h * 0.18, -D / 2 + cleatD / 2);
    cleatMesh.castShadow = true;
    cleatMesh.receiveShadow = true;
    panelGroup.add(cleatMesh);

    return panelGroup;
  }

  const x1 = -TOTAL_W / 2 + W1 / 2;
  const x2 = -TOTAL_W / 2 + W1 + GAP + W2 / 2;
  const x3 = TOTAL_W / 2 - W3 / 2;

  group.add(createPanel(W1, H1, x1, "left_panel"));
  group.add(createPanel(W2, H2, x2, "middle_panel"));
  group.add(createPanel(W3, H3, x3, "right_panel"));

  return group;
}
