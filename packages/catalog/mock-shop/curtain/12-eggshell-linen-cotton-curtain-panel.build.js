function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 1.35;          // total curtain width
  const H = 2.30;          // total curtain height
  const D = 0.08;          // front-to-back fold depth
  const THICK = 0.012;     // fabric thickness
  const HEADER_H = 0.075;  // top rod-pocket ruffled header height
  const HEM_H = 0.045;     // bottom hem height
  const NUM_FOLDS = 7;     // number of major vertical fabric waves
  const NUM_GATHERS = 16;  // number of small gathered pleats at the top header

  // Materials
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xe4ded2,
    roughness: 0.92,
    metalness: 0.0,
  });

  const fabricTrimMat = new THREE.MeshStandardMaterial({
    color: 0xded7ca,
    roughness: 0.94,
    metalness: 0.0,
  });

  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x8a857e,
    roughness: 0.45,
    metalness: 0.6,
  });

  // Helper to compute fold Z center at a given X
  const foldAmp = (D - THICK) * 0.5;
  function getFoldZ(x) {
    const t = (x + W * 0.5) / W;
    return foldAmp * Math.sin(t * Math.PI * 2 * NUM_FOLDS);
  }

  // 1. Main wavy curtain panel (ExtrudeGeometry along Y)
  const panelShape = new THREE.Shape();
  const steps = 84;
  for (let i = 0; i <= steps; i++) {
    const x = -W * 0.5 + (i / steps) * W;
    const z = getFoldZ(x) + THICK * 0.5;
    if (i === 0) {
      panelShape.moveTo(x, -z);
    } else {
      panelShape.lineTo(x, -z);
    }
  }
  for (let i = steps; i >= 0; i--) {
    const x = -W * 0.5 + (i / steps) * W;
    const z = getFoldZ(x) - THICK * 0.5;
    panelShape.lineTo(x, -z);
  }
  panelShape.closePath();

  const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
    depth: H,
    bevelEnabled: false,
    curveSegments: 1,
  });
  const panelMesh = new THREE.Mesh(panelGeo, fabricMat);
  panelMesh.rotation.x = -Math.PI / 2;
  panelMesh.name = 'curtain_main_panel';
  panelMesh.castShadow = true;
  panelMesh.receiveShadow = true;
  group.add(panelMesh);

  // 2. Left and right vertical side hems
  const sideHemGeo = new THREE.BoxGeometry(0.018, H, THICK * 1.4);
  const leftHem = new THREE.Mesh(sideHemGeo, fabricTrimMat);
  leftHem.position.set(-W * 0.5 + 0.009, H * 0.5, getFoldZ(-W * 0.5));
  leftHem.name = 'curtain_left_hem';
  leftHem.castShadow = true;
  leftHem.receiveShadow = true;
  group.add(leftHem);

  const rightHem = new THREE.Mesh(sideHemGeo, fabricTrimMat);
  rightHem.position.set(W * 0.5 - 0.009, H * 0.5, getFoldZ(W * 0.5));
  rightHem.name = 'curtain_right_hem';
  rightHem.castShadow = true;
  rightHem.receiveShadow = true;
  group.add(rightHem);

  // 3. Bottom weighted hem bar (subtle thicker fold at y = 0..HEM_H)
  const bottomHemGeo = new THREE.BoxGeometry(W - 0.01, HEM_H, THICK * 1.1);
  const bottomHem = new THREE.Mesh(bottomHemGeo, fabricTrimMat);
  bottomHem.position.set(0, HEM_H * 0.5, 0);
  bottomHem.name = 'curtain_bottom_hem';
  bottomHem.castShadow = true;
  bottomHem.receiveShadow = true;
  group.add(bottomHem);

  // 4. Hidden internal curtain rod inside the top rod pocket
  const rodGeo = new THREE.CylinderGeometry(0.01, 0.01, W - 0.04, 16);
  rodGeo.rotateZ(Math.PI / 2);
  const rodMesh = new THREE.Mesh(rodGeo, rodMat);
  rodMesh.position.set(0, H - HEADER_H * 0.55, 0);
  rodMesh.name = 'curtain_internal_rod';
  rodMesh.castShadow = true;
  rodMesh.receiveShadow = true;
  group.add(rodMesh);

  // 5. Top ruffled rod-pocket gathers
  const gatherGeo = new THREE.CapsuleGeometry(0.014, HEADER_H * 0.65, 6, 12);
  for (let i = 0; i < NUM_GATHERS; i++) {
    const t = (i + 0.5) / NUM_GATHERS;
    const gx = -W * 0.5 + 0.03 + t * (W - 0.06);
    const gz = getFoldZ(gx) * 0.65 + (i % 2 === 0 ? 0.006 : -0.006);
    const gather = new THREE.Mesh(gatherGeo, fabricTrimMat);
    gather.position.set(gx, H - HEADER_H * 0.5, gz);
    gather.name = `curtain_header_gather_${i + 1}`;
    gather.castShadow = true;
    gather.receiveShadow = true;
    group.add(gather);
  }

  return group;
}
