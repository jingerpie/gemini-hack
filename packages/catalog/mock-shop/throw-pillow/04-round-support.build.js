function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const BODY_LEN = 0.54;
  const RADIUS = 0.10;
  const CAP_BULGE = 0.014;
  const PIPING_R = 0.0045;

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xc8baa2,
    roughness: 0.88,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xc2b39a,
    roughness: 0.85,
    metalness: 0.0
  });

  const zipperMat = new THREE.MeshStandardMaterial({
    color: 0xa6977f,
    roughness: 0.75,
    metalness: 0.05
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9b8e7b,
    roughness: 0.4,
    metalness: 0.65
  });

  // 1. Main bolster body with softly domed ends (LatheGeometry rotated along X)
  const halfLen = BODY_LEN / 2;
  const profile = [];
  const capSteps = 8;

  // Bottom/left cap from center (0, -halfLen - CAP_BULGE) to rim (RADIUS, -halfLen)
  for (let i = 0; i <= capSteps; i++) {
    const t = i / capSteps;
    const angle = t * (Math.PI / 2);
    const r = Math.sin(angle) * RADIUS;
    const y = -halfLen - Math.cos(angle) * CAP_BULGE;
    profile.push(new THREE.Vector2(r, y));
  }

  // Top/right cap from rim (RADIUS, halfLen) to center (0, halfLen + CAP_BULGE)
  for (let i = 0; i <= capSteps; i++) {
    const t = i / capSteps;
    const angle = (1 - t) * (Math.PI / 2);
    const r = Math.sin(angle) * RADIUS;
    const y = halfLen + Math.cos(angle) * CAP_BULGE;
    profile.push(new THREE.Vector2(r, y));
  }

  const bodyGeo = new THREE.LatheGeometry(profile, 32);
  const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
  bodyMesh.name = 'bolster_body';
  bodyMesh.rotation.z = -Math.PI / 2;
  bodyMesh.position.y = RADIUS;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Circular piping at both ends
  const pipingGeo = new THREE.TorusGeometry(RADIUS - PIPING_R * 0.25, PIPING_R, 12, 32);

  const pipingLeft = new THREE.Mesh(pipingGeo, pipingMat);
  pipingLeft.name = 'piping_left';
  pipingLeft.rotation.y = Math.PI / 2;
  pipingLeft.position.set(-halfLen, RADIUS, 0);
  pipingLeft.castShadow = true;
  pipingLeft.receiveShadow = true;
  group.add(pipingLeft);

  const pipingRight = new THREE.Mesh(pipingGeo, pipingMat);
  pipingRight.name = 'piping_right';
  pipingRight.rotation.y = Math.PI / 2;
  pipingRight.position.set(halfLen, RADIUS, 0);
  pipingRight.castShadow = true;
  pipingRight.receiveShadow = true;
  group.add(pipingRight);

  // 3. Concealed zipper seam along lower-front edge
  const zipAngle = Math.PI / 3; // 60 deg below +Z
  const zipY = RADIUS - RADIUS * Math.sin(zipAngle);
  const zipZ = RADIUS * Math.cos(zipAngle);

  const zipSeamGeo = new THREE.CylinderGeometry(0.0028, 0.0028, BODY_LEN - 0.006, 8);
  const zipSeam = new THREE.Mesh(zipSeamGeo, zipperMat);
  zipSeam.name = 'zipper_seam';
  zipSeam.rotation.z = Math.PI / 2;
  zipSeam.position.set(0, zipY, zipZ);
  zipSeam.castShadow = true;
  zipSeam.receiveShadow = true;
  group.add(zipSeam);

  // 4. Zipper slider & pull tab near left end
  const sliderX = -halfLen + 0.038;
  const sliderGeo = new THREE.BoxGeometry(0.011, 0.005, 0.006);
  const slider = new THREE.Mesh(sliderGeo, metalMat);
  slider.name = 'zipper_slider';
  slider.position.set(sliderX, zipY, zipZ + 0.002);
  slider.castShadow = true;
  slider.receiveShadow = true;
  group.add(slider);

  const pullGeo = new THREE.BoxGeometry(0.004, 0.013, 0.0025);
  const pull = new THREE.Mesh(pullGeo, metalMat);
  pull.name = 'zipper_pull';
  pull.position.set(sliderX, zipY - 0.007, zipZ + 0.004);
  pull.rotation.x = 0.2;
  pull.castShadow = true;
  pull.receiveShadow = true;
  group.add(pull);

  return group;
}
