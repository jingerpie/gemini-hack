function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 1.45;
  const BASE_R = 0.13;
  const BASE_H = 0.022;
  const PAD_H = 0.003;
  const STEM_R = 0.009;
  const BASE_Z = -0.05;
  const STEM_Z = BASE_Z - BASE_R * 0.55;
  const ARC_START_Y = 1.02;
  const ARC_END_Y = 1.24;
  const ARC_END_Z = 0.12;
  const SHADE_NECK_R = 0.028;
  const SHADE_NECK_H = 0.055;
  const SHADE_CONE_R = 0.095;
  const SHADE_CONE_H = 0.155;
  const SHADE_TILT = 0.62; // radians, tilted forward/downward

  // Materials
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe8e4da,
    roughness: 0.45,
    metalness: 0.15,
  });

  const matInterior = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.BackSide,
  });

  const matPad = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  const matBulb = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xffeed0,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.0,
  });

  const matSocket = new THREE.MeshStandardMaterial({
    color: 0xd0ccc2,
    roughness: 0.5,
    metalness: 0.2,
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Base pad (touches y = 0)
  const padGeo = new THREE.CylinderGeometry(BASE_R - 0.004, BASE_R - 0.004, PAD_H, 32);
  const pad = addMesh(padGeo, matPad, "base_pad");
  pad.position.set(0, PAD_H / 2, BASE_Z);

  // 2. Base disc
  const baseGeo = new THREE.CylinderGeometry(BASE_R - 0.003, BASE_R, BASE_H, 32);
  const base = addMesh(baseGeo, matCream, "base_disc");
  base.position.set(0, PAD_H + BASE_H / 2, BASE_Z);

  // 3. Stem collar at base
  const collarGeo = new THREE.CylinderGeometry(STEM_R * 1.45, STEM_R * 1.65, 0.012, 20);
  const stemCollar = addMesh(collarGeo, matCream, "stem_base_collar");
  stemCollar.position.set(0, PAD_H + BASE_H + 0.005, STEM_Z);

  // 4. Vertical stem
  const stemH = ARC_START_Y - (PAD_H + BASE_H);
  const stemGeo = new THREE.CylinderGeometry(STEM_R, STEM_R, stemH, 20);
  const stem = addMesh(stemGeo, matCream, "stem_vertical");
  stem.position.set(0, PAD_H + BASE_H + stemH / 2, STEM_Z);

  // 5. Curved arc
  const arcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, ARC_START_Y - 0.01, STEM_Z),
    new THREE.Vector3(0, ARC_START_Y + 0.14, STEM_Z + 0.01),
    new THREE.Vector3(0, ARC_END_Y + 0.02, (STEM_Z + ARC_END_Z) * 0.5),
    new THREE.Vector3(0, ARC_END_Y, ARC_END_Z),
  ]);
  const arcGeo = new THREE.TubeGeometry(arcCurve, 24, STEM_R, 16, false);
  addMesh(arcGeo, matCream, "stem_arc");

  // 6. Arc end collar
  const endCollarGeo = new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.35, 0.014, 16);
  const endCollar = addMesh(endCollarGeo, matCream, "arc_end_collar");
  endCollar.rotation.x = Math.PI / 2;
  endCollar.position.set(0, ARC_END_Y, ARC_END_Z);

  // 7. Swivel joint
  const jointGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 16);
  const joint = addMesh(jointGeo, matCream, "swivel_joint");
  joint.rotation.x = Math.PI / 2;
  joint.position.set(0, ARC_END_Y, ARC_END_Z + 0.014);

  // 8. Shade assembly (pivoted at swivel joint)
  const shadePivot = new THREE.Group();
  shadePivot.position.set(0, ARC_END_Y, ARC_END_Z + 0.038);
  shadePivot.rotation.x = SHADE_TILT;
  group.add(shadePivot);

  function addShadeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shadePivot.add(mesh);
    return mesh;
  }

  // Shade cylindrical neck
  const neckGeo = new THREE.CylinderGeometry(SHADE_NECK_R * 0.94, SHADE_NECK_R, SHADE_NECK_H, 28);
  const neck = addShadeMesh(neckGeo, matCream, "shade_neck");
  neck.position.set(0, 0.01, 0);

  // Shade flared cone exterior
  const coneGeo = new THREE.CylinderGeometry(SHADE_NECK_R, SHADE_CONE_R, SHADE_CONE_H, 32, 1, true);
  const cone = addShadeMesh(coneGeo, matCream, "shade_cone");
  cone.position.set(0, 0.01 - SHADE_NECK_H / 2 - SHADE_CONE_H / 2, 0);

  // Shade flared cone interior
  const innerConeGeo = new THREE.CylinderGeometry(SHADE_NECK_R - 0.002, SHADE_CONE_R - 0.002, SHADE_CONE_H, 32, 1, true);
  const innerCone = addShadeMesh(innerConeGeo, matInterior, "shade_interior");
  innerCone.position.copy(cone.position);

  // Shade rim
  const rimGeo = new THREE.TorusGeometry(SHADE_CONE_R - 0.001, 0.002, 10, 32);
  const rim = addShadeMesh(rimGeo, matCream, "shade_rim");
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.01 - SHADE_NECK_H / 2 - SHADE_CONE_H, 0);

  // Bulb socket
  const socketGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.035, 16);
  const socket = addShadeMesh(socketGeo, matSocket, "bulb_socket");
  socket.position.set(0, -0.025, 0);

  // Light bulb
  const bulbGeo = new THREE.SphereGeometry(0.026, 20, 16);
  const bulb = addShadeMesh(bulbGeo, matBulb, "light_bulb");
  bulb.position.set(0, -0.062, 0);

  // 9. Power cord & foot switch
  const grommetGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.012, 12);
  const grommet = addMesh(grommetGeo, matCream, "cord_grommet");
  grommet.rotation.x = Math.PI / 2;
  grommet.position.set(0, 0.065, STEM_Z - STEM_R);

  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.065, STEM_Z - STEM_R),
    new THREE.Vector3(-0.02, 0.025, STEM_Z - 0.06),
    new THREE.Vector3(-0.06, 0.0035, STEM_Z - 0.14),
    new THREE.Vector3(-0.14, 0.0035, STEM_Z - 0.18),
    new THREE.Vector3(-0.24, 0.0035, STEM_Z - 0.16),
  ]);
  const cordGeo = new THREE.TubeGeometry(cordCurve, 24, 0.0032, 8, false);
  addMesh(cordGeo, matCream, "power_cord");

  // Foot switch
  const switchGeo = new THREE.BoxGeometry(0.052, 0.016, 0.032);
  const switchBody = addMesh(switchGeo, matCream, "foot_switch_body");
  switchBody.position.set(-0.24, 0.008, STEM_Z - 0.16);
  switchBody.rotation.y = 0.25;

  const buttonGeo = new THREE.CylinderGeometry(0.008, 0.009, 0.006, 16);
  const switchButton = addMesh(buttonGeo, matCream, "foot_switch_button");
  switchButton.position.set(-0.24, 0.018, STEM_Z - 0.16);

  return group;
}
