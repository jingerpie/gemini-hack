function build(THREE) {
  const group = new THREE.Group();

  const W = 1.15;
  const H = 0.85;
  const D = 0.65;

  const CANOPY_R = 0.06;
  const CANOPY_H = 0.03;
  const ROD_R = 0.008;
  const HUB_R = 0.025;
  const HUB_H = 0.065;
  const HUB_Y = 0.14;
  const ARM_R = 0.0065;
  const SOCKET_R = 0.012;
  const SOCKET_H = 0.022;
  const SHADE_LEN = 0.095;
  const SHADE_R = 0.028;

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb89758,
    roughness: 0.32,
    metalness: 0.85
  });

  const shadeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f5f0,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffdf9e,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  // Ceiling canopy at y = H
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 24),
    brassMat
  );
  canopy.name = "ceiling_canopy";
  canopy.position.set(0, H - CANOPY_H * 0.5, 0);
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(canopy);

  // Downrod from canopy to hub
  const rodLen = H - CANOPY_H - HUB_Y;
  const downrod = new THREE.Mesh(
    new THREE.CylinderGeometry(ROD_R, ROD_R, rodLen, 16),
    brassMat
  );
  downrod.name = "downrod";
  downrod.position.set(0, HUB_Y + rodLen * 0.5, 0);
  downrod.castShadow = true;
  downrod.receiveShadow = true;
  group.add(downrod);

  // Central hub
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(HUB_R, HUB_R, HUB_H, 24),
    brassMat
  );
  hub.name = "central_hub";
  hub.position.set(0, HUB_Y, 0);
  hub.castShadow = true;
  hub.receiveShadow = true;
  group.add(hub);

  // Shade profile (acorn/tulip frosted glass)
  const shadePoints = [
    new THREE.Vector2(0.009, 0.0),
    new THREE.Vector2(0.022, 0.02),
    new THREE.Vector2(SHADE_R, 0.048),
    new THREE.Vector2(0.024, 0.075),
    new THREE.Vector2(0.014, SHADE_LEN)
  ];
  const shadeGeo = new THREE.LatheGeometry(shadePoints, 20);
  const socketGeo = new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R, SOCKET_H, 16);
  const bulbGeo = new THREE.SphereGeometry(0.015, 14, 12);

  // 9 branching arms: [mid1, mid2, tip] relative to (0, HUB_Y, 0)
  const branches = [
    // Far left
    [
      new THREE.Vector3(-0.18, HUB_Y - 0.01, 0.03),
      new THREE.Vector3(-0.36, HUB_Y + 0.02, 0.05),
      new THREE.Vector3(-0.52, HUB_Y + 0.06, 0.04)
    ],
    // Upper-mid left
    [
      new THREE.Vector3(-0.12, HUB_Y, -0.02),
      new THREE.Vector3(-0.22, HUB_Y + 0.06, -0.06),
      new THREE.Vector3(-0.28, HUB_Y + 0.13, -0.08)
    ],
    // Lower-back left
    [
      new THREE.Vector3(-0.14, HUB_Y - 0.01, -0.08),
      new THREE.Vector3(-0.26, HUB_Y - 0.02, -0.18),
      new THREE.Vector3(-0.33, HUB_Y - 0.01, -0.25)
    ],
    // Lower-front left
    [
      new THREE.Vector3(-0.07, HUB_Y - 0.02, 0.08),
      new THREE.Vector3(-0.11, HUB_Y - 0.05, 0.16),
      new THREE.Vector3(-0.13, HUB_Y - 0.07, 0.22)
    ],
    // Upper-center right
    [
      new THREE.Vector3(0.06, HUB_Y + 0.01, 0.05),
      new THREE.Vector3(0.11, HUB_Y + 0.04, 0.12),
      new THREE.Vector3(0.15, HUB_Y + 0.07, 0.18)
    ],
    // Lower-front right
    [
      new THREE.Vector3(0.10, HUB_Y - 0.01, 0.06),
      new THREE.Vector3(0.18, HUB_Y - 0.05, 0.15),
      new THREE.Vector3(0.24, HUB_Y - 0.09, 0.22)
    ],
    // Upper-mid right
    [
      new THREE.Vector3(0.14, HUB_Y, -0.04),
      new THREE.Vector3(0.24, HUB_Y + 0.05, -0.10),
      new THREE.Vector3(0.32, HUB_Y + 0.11, -0.14)
    ],
    // Lower-back right
    [
      new THREE.Vector3(0.16, HUB_Y - 0.02, -0.06),
      new THREE.Vector3(0.27, HUB_Y - 0.04, -0.16),
      new THREE.Vector3(0.35, HUB_Y - 0.04, -0.24)
    ],
    // Far right
    [
      new THREE.Vector3(0.18, HUB_Y - 0.02, 0.02),
      new THREE.Vector3(0.36, HUB_Y - 0.03, 0.04),
      new THREE.Vector3(0.52, HUB_Y + 0.02, 0.03)
    ]
  ];

  const upVec = new THREE.Vector3(0, 1, 0);

  branches.forEach((pts, idx) => {
    const start = new THREE.Vector3(0, HUB_Y, 0);
    const curve = new THREE.CatmullRomCurve3([start, pts[0], pts[1], pts[2]]);

    const arm = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, ARM_R, 10, false),
      brassMat
    );
    arm.name = `branch_arm_${idx + 1}`;
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);

    const tip = pts[2];
    const tangent = curve.getTangent(1).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(upVec, tangent);

    const socket = new THREE.Mesh(socketGeo, brassMat);
    socket.name = `socket_collar_${idx + 1}`;
    socket.position.copy(tip).addScaledVector(tangent, SOCKET_H * 0.4);
    socket.quaternion.copy(quat);
    socket.castShadow = true;
    socket.receiveShadow = true;
    group.add(socket);

    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.name = `glass_shade_${idx + 1}`;
    shade.position.copy(tip).addScaledVector(tangent, SOCKET_H * 0.8);
    shade.quaternion.copy(quat);
    shade.castShadow = true;
    shade.receiveShadow = true;
    group.add(shade);

    const bulb = new THREE.Mesh(bulbGeo, emitMat);
    bulb.name = `emit_bulb_${idx + 1}`;
    bulb.position.copy(tip).addScaledVector(tangent, SOCKET_H * 0.8 + SHADE_LEN * 0.48);
    bulb.castShadow = true;
    bulb.receiveShadow = true;
    group.add(bulb);
  });

  return group;
}
