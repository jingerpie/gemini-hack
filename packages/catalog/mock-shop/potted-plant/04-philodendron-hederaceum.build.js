function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const POT_H = 0.165;
  const POT_R_BOT = 0.068;
  const POT_R_TOP = 0.092;
  const RIM_H = 0.024;
  const RIM_R = 0.098;
  const SOIL_Y = POT_H - 0.018;
  const SOIL_R = 0.088;

  // Materials
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x8d4930,
    roughness: 0.65,
    metalness: 0.05
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2b1e16,
    roughness: 0.95,
    metalness: 0.0
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c7a29,
    roughness: 0.55,
    metalness: 0.0
  });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x3b6324, roughness: 0.42, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x4b772c, roughness: 0.38, metalness: 0.02 }),
    new THREE.MeshStandardMaterial({ color: 0x628c35, roughness: 0.40, metalness: 0.02 })
  ];

  function addMesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // Pot body
  const potGeo = new THREE.CylinderGeometry(POT_R_TOP, POT_R_BOT, POT_H, 28);
  const pot = addMesh(potGeo, potMat, "pot_body");
  pot.position.y = POT_H / 2;

  // Pot rim
  const rimGeo = new THREE.CylinderGeometry(RIM_R, RIM_R * 0.98, RIM_H, 28);
  const rim = addMesh(rimGeo, potMat, "pot_rim");
  rim.position.y = POT_H - RIM_H / 2;

  // Soil
  const soilGeo = new THREE.CylinderGeometry(SOIL_R, SOIL_R * 0.95, 0.02, 24);
  const soil = addMesh(soilGeo, soilMat, "soil");
  soil.position.y = SOIL_Y - 0.01;

  // Heart-shaped leaf geometry (ExtrudeGeometry)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.022, 0.018, 0.045, -0.005, 0.042, -0.032);
  leafShape.bezierCurveTo(0.038, -0.058, 0.015, -0.078, 0, -0.095);
  leafShape.bezierCurveTo(-0.015, -0.078, -0.038, -0.058, -0.042, -0.032);
  leafShape.bezierCurveTo(-0.045, -0.005, -0.022, 0.018, 0, 0);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.002,
    bevelEnabled: false,
    curveSegments: 10
  });
  leafGeo.rotateX(Math.PI * 0.5);

  // New-growth tip geometry
  const tipGeo = new THREE.ConeGeometry(0.0035, 0.038, 6);
  tipGeo.translate(0, 0.019, 0);

  // Stems definition: [points], leafCount, scaleBase, hasTip
  const stems = [
    // Left long trailing stem
    {
      pts: [
        [-0.02, SOIL_Y, 0.01],
        [-0.09, SOIL_Y + 0.035, 0.02],
        [-0.18, SOIL_Y + 0.025, 0.01],
        [-0.24, SOIL_Y + 0.065, -0.01],
        [-0.25, SOIL_Y + 0.115, -0.02]
      ],
      leaves: 5,
      scale: 0.95,
      tip: true
    },
    // Left-front arching stem
    {
      pts: [
        [-0.03, SOIL_Y, 0.02],
        [-0.08, SOIL_Y + 0.04, 0.06],
        [-0.14, SOIL_Y + 0.055, 0.09],
        [-0.17, SOIL_Y + 0.02, 0.11]
      ],
      leaves: 4,
      scale: 0.9,
      tip: false
    },
    // Right long trailing stem
    {
      pts: [
        [0.02, SOIL_Y, 0.0],
        [0.10, SOIL_Y + 0.03, 0.01],
        [0.19, SOIL_Y + 0.02, 0.02],
        [0.24, SOIL_Y + 0.065, 0.01],
        [0.26, SOIL_Y + 0.11, 0.0]
      ],
      leaves: 5,
      scale: 0.9,
      tip: true
    },
    // Right-back stem
    {
      pts: [
        [0.03, SOIL_Y, -0.02],
        [0.09, SOIL_Y + 0.05, -0.05],
        [0.16, SOIL_Y + 0.06, -0.07],
        [0.20, SOIL_Y + 0.03, -0.08]
      ],
      leaves: 4,
      scale: 0.85,
      tip: false
    },
    // Center tall upright stem
    {
      pts: [
        [0.0, SOIL_Y, 0.0],
        [-0.01, SOIL_Y + 0.06, -0.01],
        [-0.02, SOIL_Y + 0.12, 0.0],
        [-0.01, SOIL_Y + 0.17, 0.01]
      ],
      leaves: 4,
      scale: 1.05,
      tip: true
    },
    // Center-left upright stem
    {
      pts: [
        [-0.015, SOIL_Y, 0.01],
        [-0.04, SOIL_Y + 0.065, 0.02],
        [-0.06, SOIL_Y + 0.12, 0.03],
        [-0.07, SOIL_Y + 0.155, 0.02]
      ],
      leaves: 4,
      scale: 1.0,
      tip: false
    },
    // Center-right arching stem
    {
      pts: [
        [0.015, SOIL_Y, 0.015],
        [0.045, SOIL_Y + 0.06, 0.03],
        [0.08, SOIL_Y + 0.09, 0.04],
        [0.11, SOIL_Y + 0.055, 0.05]
      ],
      leaves: 4,
      scale: 0.95,
      tip: false
    },
    // Front-center cascading stem
    {
      pts: [
        [0.0, SOIL_Y, 0.03],
        [-0.02, SOIL_Y + 0.045, 0.07],
        [-0.04, SOIL_Y + 0.04, 0.11],
        [-0.05, SOIL_Y + 0.0, 0.13]
      ],
      leaves: 4,
      scale: 0.95,
      tip: false
    },
    // Back-center stem
    {
      pts: [
        [0.01, SOIL_Y, -0.025],
        [0.02, SOIL_Y + 0.07, -0.05],
        [0.04, SOIL_Y + 0.115, -0.06]
      ],
      leaves: 3,
      scale: 0.9,
      tip: false
    },
    // Inner low filler stem
    {
      pts: [
        [-0.025, SOIL_Y, -0.015],
        [-0.055, SOIL_Y + 0.045, -0.03],
        [-0.09, SOIL_Y + 0.065, -0.04]
      ],
      leaves: 3,
      scale: 0.85,
      tip: false
    }
  ];

  let leafIndex = 0;

  for (let s = 0; s < stems.length; s++) {
    const st = stems[s];
    const curvePts = st.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePts);

    const stemGeo = new THREE.TubeGeometry(curve, 16, 0.0028, 6, false);
    addMesh(stemGeo, stemMat, "stem_" + s);

    // Optional new-growth tip at end of stem
    if (st.tip) {
      const endPt = curve.getPoint(1);
      const endTan = curve.getTangent(1);
      const tip = addMesh(tipGeo, leafMats[2], "stem_tip_" + s);
      tip.position.copy(endPt);
      tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endTan);
    }

    // Place leaves deterministically along the stem
    for (let i = 0; i < st.leaves; i++) {
      const t = 0.25 + (0.7 * i) / Math.max(1, st.leaves - 1);
      const pos = curve.getPoint(t);
      const tan = curve.getTangent(t);

      // Petiole (short stalk connecting stem to leaf)
      const side = (i + s) % 2 === 0 ? 1 : -1;
      const leafDir = new THREE.Vector3(
        tan.x * 0.4 + side * 0.55,
        0.35 + ((i % 3) * 0.15),
        tan.z * 0.4 + (side * 0.25)
      ).normalize();

      const petioleLen = 0.022 + (i % 2) * 0.008;
      const petioleGeo = new THREE.CylinderGeometry(0.0014, 0.0018, petioleLen, 5);
      petioleGeo.translate(0, petioleLen / 2, 0);
      const petiole = addMesh(petioleGeo, stemMat, "petiole_" + s + "_" + i);
      petiole.position.copy(pos);
      petiole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafDir);

      // Leaf blade at tip of petiole
      const leafPos = pos.clone().addScaledVector(leafDir, petioleLen);
      const mat = leafMats[leafIndex % leafMats.length];
      const leaf = addMesh(leafGeo, mat, "leaf_" + leafIndex);
      leaf.position.copy(leafPos);

      const scale = st.scale * (0.85 + ((i * 7 + s * 3) % 5) * 0.07);
      leaf.scale.set(scale, scale, scale);

      // Orient leaf outward and slightly drooping
      const yaw = Math.atan2(leafDir.x, leafDir.z) + side * 0.25;
      const pitch = 0.25 + ((i + s) % 3) * 0.18;
      const roll = side * 0.22;
      leaf.rotation.set(pitch, yaw, roll);

      leafIndex++;
    }
  }

  return group;
}
