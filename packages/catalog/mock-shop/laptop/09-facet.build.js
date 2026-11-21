function build(THREE) {
  const group = new THREE.Group();

  // Named dimensions (meters)
  const W = 0.30;           // Overall width along X (30 cm)
  const D = 0.22;           // Overall depth along Z (22 cm)
  const BASE_H = 0.011;     // Base thickness
  const LID_H = 0.215;      // Lid height
  const LID_T = 0.005;      // Lid thickness
  const FOOT_H = 0.002;     // Rubber feet height
  const OPEN_ANGLE = 105 * (Math.PI / 180); // 105 degrees open
  const TILT_BACK = OPEN_ANGLE - Math.PI / 2; // 15 degrees past vertical

  // Materials
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x8b4c2f,        // Warm matte terracotta/saddle brown
    roughness: 0.62,
    metalness: 0.05
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e20,        // Dark charcoal for keyboard, bezel, ports
    roughness: 0.75,
    metalness: 0.1
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x6b3a24,        // Slightly darker brown rubber feet
    roughness: 0.85,
    metalness: 0.0
  });

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x1a2634,
    emissive: 0x3a6ea5,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.1
  });

  // 1. Base Shell (bottom-center origin: feet touch y = 0)
  const baseGeo = new THREE.BoxGeometry(W, BASE_H, D);
  const baseMesh = new THREE.Mesh(baseGeo, shellMat);
  baseMesh.name = "base_shell";
  baseMesh.position.set(0, FOOT_H + BASE_H / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Faceted front/side bevel trim on base
  const baseTrimGeo = new THREE.BoxGeometry(W * 0.96, BASE_H * 0.45, D * 0.96);
  const baseTrimMesh = new THREE.Mesh(baseTrimGeo, shellMat);
  baseTrimMesh.name = "base_bevel_trim";
  baseTrimMesh.position.set(0, FOOT_H + BASE_H * 0.22, 0);
  baseTrimMesh.castShadow = true;
  baseTrimMesh.receiveShadow = true;
  group.add(baseTrimMesh);

  // 2. Rubber Feet (touching y = 0)
  const frontFootGeo = new THREE.BoxGeometry(0.022, FOOT_H, 0.008);
  const footLeft = new THREE.Mesh(frontFootGeo, footMat);
  footLeft.name = "foot_front_left";
  footLeft.position.set(-W * 0.38, FOOT_H / 2, D * 0.42);
  footLeft.castShadow = true;
  footLeft.receiveShadow = true;
  group.add(footLeft);

  const footRight = new THREE.Mesh(frontFootGeo, footMat);
  footRight.name = "foot_front_right";
  footRight.position.set(W * 0.38, FOOT_H / 2, D * 0.42);
  footRight.castShadow = true;
  footRight.receiveShadow = true;
  group.add(footRight);

  const rearFootGeo = new THREE.BoxGeometry(W * 0.72, FOOT_H, 0.008);
  const footRear = new THREE.Mesh(rearFootGeo, footMat);
  footRear.name = "foot_rear";
  footRear.position.set(0, FOOT_H / 2, -D * 0.42);
  footRear.castShadow = true;
  footRear.receiveShadow = true;
  group.add(footRear);

  // 3. Keyboard Deck & Keys
  const kbWellGeo = new THREE.BoxGeometry(W * 0.86, 0.0015, D * 0.44);
  const kbWell = new THREE.Mesh(kbWellGeo, darkMat);
  kbWell.name = "keyboard_well";
  kbWell.position.set(0, FOOT_H + BASE_H + 0.0005, -D * 0.14);
  kbWell.castShadow = true;
  kbWell.receiveShadow = true;
  group.add(kbWell);

  // Trackpad
  const trackpadGeo = new THREE.BoxGeometry(W * 0.34, 0.001, D * 0.28);
  const trackpad = new THREE.Mesh(trackpadGeo, shellMat);
  trackpad.name = "trackpad";
  trackpad.position.set(0, FOOT_H + BASE_H + 0.0006, D * 0.28);
  trackpad.castShadow = true;
  trackpad.receiveShadow = true;
  group.add(trackpad);

  // Side port cutouts (right side)
  const portGeo = new THREE.BoxGeometry(0.002, 0.004, 0.012);
  const port1 = new THREE.Mesh(portGeo, darkMat);
  port1.name = "side_port_1";
  port1.position.set(W / 2 + 0.0002, FOOT_H + BASE_H * 0.55, -D * 0.22);
  port1.castShadow = true;
  port1.receiveShadow = true;
  group.add(port1);

  const port2 = new THREE.Mesh(portGeo, darkMat);
  port2.name = "side_port_2";
  port2.position.set(W / 2 + 0.0002, FOOT_H + BASE_H * 0.55, -D * 0.12);
  port2.castShadow = true;
  port2.receiveShadow = true;
  group.add(port2);

  // 4. Hinge
  const hingeGeo = new THREE.CylinderGeometry(0.004, 0.004, W * 0.78, 16);
  hingeGeo.rotateZ(Math.PI / 2);
  const hinge = new THREE.Mesh(hingeGeo, darkMat);
  hinge.name = "hinge_barrel";
  hinge.position.set(0, FOOT_H + BASE_H, -D / 2 + 0.006);
  hinge.castShadow = true;
  hinge.receiveShadow = true;
  group.add(hinge);

  // 5. Lid Group (pivots at hinge, tilted back 15 deg for 105 deg open pose)
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, FOOT_H + BASE_H, -D / 2 + 0.006);
  lidGroup.rotation.x = -TILT_BACK;
  group.add(lidGroup);

  // Outer snap-on lid shell
  const lidShellGeo = new THREE.BoxGeometry(W, LID_H, LID_T);
  const lidShell = new THREE.Mesh(lidShellGeo, shellMat);
  lidShell.name = "lid_shell";
  lidShell.position.set(0, LID_H / 2, 0);
  lidShell.castShadow = true;
  lidShell.receiveShadow = true;
  lidGroup.add(lidShell);

  // Faceted raised back panel on lid
  const lidFacetGeo = new THREE.BoxGeometry(W * 0.88, LID_H * 0.86, 0.002);
  const lidFacet = new THREE.Mesh(lidFacetGeo, shellMat);
  lidFacet.name = "lid_facet_panel";
  lidFacet.position.set(0, LID_H * 0.52, -LID_T / 2 - 0.0008);
  lidFacet.castShadow = true;
  lidFacet.receiveShadow = true;
  lidGroup.add(lidFacet);

  // Screen bezel
  const bezelGeo = new THREE.BoxGeometry(W * 0.96, LID_H * 0.94, 0.0015);
  const bezel = new THREE.Mesh(bezelGeo, darkMat);
  bezel.name = "screen_bezel";
  bezel.position.set(0, LID_H / 2, LID_T / 2 + 0.0006);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  lidGroup.add(bezel);

  // Lit screen (emissive)
  const screenGeo = new THREE.BoxGeometry(W * 0.90, LID_H * 0.84, 0.001);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = "emit_screen";
  screen.position.set(0, LID_H * 0.52, LID_T / 2 + 0.0012);
  screen.castShadow = true;
  screen.receiveShadow = true;
  lidGroup.add(screen);

  return group;
}
