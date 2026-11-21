function build(THREE) {
  const group = new THREE.Group();

  const DIAMETER = 0.42;
  const RADIUS = DIAMETER / 2;
  const DEPTH = 0.14;
  const HALF_DEPTH = DEPTH / 2;
  const BUTTON_RADIUS = 0.026;
  const BUTTON_DEPTH = 0.014;
  const LOBE_COUNT = 14;

  const boucleMat = new THREE.MeshStandardMaterial({
    color: 0xf0e7d5,
    roughness: 0.95,
    metalness: 0.0
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe2,
    roughness: 0.85,
    metalness: 0.0
  });

  const centerY = RADIUS;

  // Main cushion core
  const coreGeo = new THREE.SphereGeometry(RADIUS * 0.92, 32, 24);
  coreGeo.scale(1.0, 1.0, (HALF_DEPTH * 0.88) / (RADIUS * 0.92));
  const coreMesh = new THREE.Mesh(coreGeo, boucleMat);
  coreMesh.name = 'cushion_core';
  coreMesh.position.set(0, centerY, 0);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  group.add(coreMesh);

  // Radial gathered lobes
  const lobeGeo = new THREE.SphereGeometry(RADIUS * 0.52, 20, 16);
  lobeGeo.scale(0.36, 1.0, (HALF_DEPTH * 0.96) / (RADIUS * 0.52));

  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = (i / LOBE_COUNT) * Math.PI * 2;
    const lobeMesh = new THREE.Mesh(lobeGeo, boucleMat);
    lobeMesh.name = `cushion_lobe_${i + 1}`;
    const offsetR = RADIUS * 0.48;
    lobeMesh.position.set(
      Math.cos(angle) * offsetR,
      centerY + Math.sin(angle) * offsetR,
      0
    );
    lobeMesh.rotation.z = angle - Math.PI / 2;
    lobeMesh.castShadow = true;
    lobeMesh.receiveShadow = true;
    group.add(lobeMesh);
  }

  // Front and back center tufted buttons
  const buttonGeo = new THREE.SphereGeometry(BUTTON_RADIUS, 24, 16);
  buttonGeo.scale(1.0, 1.0, BUTTON_DEPTH / BUTTON_RADIUS);

  const frontButton = new THREE.Mesh(buttonGeo, buttonMat);
  frontButton.name = 'center_button_front';
  frontButton.position.set(0, centerY, HALF_DEPTH * 0.62);
  frontButton.castShadow = true;
  frontButton.receiveShadow = true;
  group.add(frontButton);

  const backButton = new THREE.Mesh(buttonGeo, buttonMat);
  backButton.name = 'center_button_back';
  backButton.position.set(0, centerY, -HALF_DEPTH * 0.62);
  backButton.castShadow = true;
  backButton.receiveShadow = true;
  group.add(backButton);

  return group;
}
