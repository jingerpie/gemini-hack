function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.70;       // Overall width (exact listing size)
  const H = 0.42;       // Cabinet height
  const D_BOX = 0.22;   // Cabinet depth
  const T = 0.018;      // Wood panel thickness
  const LEAF_D = 0.38;  // Drop-down desk leaf depth
  const D_TOTAL = D_BOX + LEAF_D;

  // Centering offsets so bounding box is centered on x=0, z=0 and bottom touches y=0
  const Z_BACK = -D_TOTAL / 2;
  const Z_BOX_FRONT = Z_BACK + D_BOX;

  // Materials
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0xc9a982,
    roughness: 0.65,
    metalness: 0.02
  });

  const darkOakMat = new THREE.MeshStandardMaterial({
    color: 0x8f7151,
    roughness: 0.75,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    roughness: 0.32,
    metalness: 0.85
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d40,
    roughness: 0.4,
    metalness: 0.8
  });

  function addMesh(geo, mat, name, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rx || ry || rz) {
      mesh.rotation.set(rx, ry, rz);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Outer cabinet box
  const topGeo = new THREE.BoxGeometry(W, T, D_BOX);
  addMesh(topGeo, oakMat, 'top_panel', 0, H - T / 2, Z_BACK + D_BOX / 2);

  const bottomGeo = new THREE.BoxGeometry(W - 2 * T, T, D_BOX);
  addMesh(bottomGeo, oakMat, 'bottom_panel', 0, T / 2, Z_BACK + D_BOX / 2);

  const sideGeo = new THREE.BoxGeometry(T, H - T, D_BOX);
  addMesh(sideGeo, oakMat, 'left_panel', -W / 2 + T / 2, (H - T) / 2, Z_BACK + D_BOX / 2);
  addMesh(sideGeo, oakMat, 'right_panel', W / 2 - T / 2, (H - T) / 2, Z_BACK + D_BOX / 2);

  const backGeo = new THREE.BoxGeometry(W - 2 * T, H - 2 * T, T);
  addMesh(backGeo, oakMat, 'back_panel', 0, H / 2, Z_BACK + T / 2);

  // 2. Drop-down desk leaf (open horizontal position)
  const leafGeo = new THREE.BoxGeometry(W, T, LEAF_D);
  addMesh(leafGeo, oakMat, 'desk_leaf', 0, T / 2, Z_BOX_FRONT + LEAF_D / 2);

  // Recessed finger pull at front center of desk leaf
  const pullGeo = new THREE.BoxGeometry(0.08, 0.006, 0.012);
  addMesh(pullGeo, darkOakMat, 'finger_pull_recess', 0, T / 2, Z_BOX_FRONT + LEAF_D - 0.005);

  // 3. Top center magnetic catch plate
  const catchGeo = new THREE.BoxGeometry(0.035, 0.006, 0.016);
  addMesh(catchGeo, metalMat, 'top_catch_plate', 0, H - T - 0.003, Z_BOX_FRONT - 0.018);

  // 4. Interior top wall-mounting brackets
  const wallBracketGeo = new THREE.BoxGeometry(0.022, 0.028, 0.022);
  addMesh(wallBracketGeo, darkMetalMat, 'left_wall_bracket', -W / 2 + T + 0.011, H - T - 0.014, Z_BACK + T + 0.011);
  addMesh(wallBracketGeo, darkMetalMat, 'right_wall_bracket', W / 2 - T - 0.011, H - T - 0.014, Z_BACK + T + 0.011);

  // 5. Bottom hinges
  const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.024, 12);
  addMesh(hingeGeo, metalMat, 'left_hinge', -W / 2 + T + 0.018, T, Z_BOX_FRONT, 0, 0, Math.PI / 2);
  addMesh(hingeGeo, metalMat, 'right_hinge', W / 2 - T - 0.018, T, Z_BOX_FRONT, 0, 0, Math.PI / 2);

  // 6. Left and right gas struts (folding stays)
  const bracketGeo = new THREE.BoxGeometry(0.008, 0.018, 0.018);
  const cylGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.11, 12);
  const rodGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.11, 12);

  function addStrut(sideSign, prefix) {
    const xPos = sideSign * (W / 2 - T - 0.008);
    const upperPos = new THREE.Vector3(xPos, 0.18, Z_BOX_FRONT - 0.025);
    const lowerPos = new THREE.Vector3(xPos, T + 0.006, Z_BOX_FRONT + 0.035);

    addMesh(bracketGeo, darkMetalMat, `${prefix}_strut_upper_bracket`, upperPos.x, upperPos.y, upperPos.z);
    addMesh(bracketGeo, metalMat, `${prefix}_strut_lower_bracket`, lowerPos.x, lowerPos.y, lowerPos.z);

    const dir = new THREE.Vector3().subVectors(lowerPos, upperPos);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(upperPos, lowerPos).multiplyScalar(0.5);

    // Cylinder (upper half)
    const cylPos = new THREE.Vector3().lerpVectors(upperPos, mid, 0.55);
    const cyl = addMesh(cylGeo, darkMetalMat, `${prefix}_strut_cylinder`, cylPos.x, cylPos.y, cylPos.z);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

    // Piston rod (lower half)
    const rodPos = new THREE.Vector3().lerpVectors(mid, lowerPos, 0.45);
    const rod = addMesh(rodGeo, metalMat, `${prefix}_strut_rod`, rodPos.x, rodPos.y, rodPos.z);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  }

  addStrut(-1, 'left');
  addStrut(1, 'right');

  return group;
}
