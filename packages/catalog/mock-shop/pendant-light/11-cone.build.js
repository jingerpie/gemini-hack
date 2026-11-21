function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const TOTAL_H = 0.95;
  const SHADE_R = 0.19;
  const SHADE_H = 0.22;
  const RIM_TUBE_R = 0.005;
  const SOCKET_R = 0.022;
  const SOCKET_H = 0.04;
  const CORD_R = 0.004;
  const CANOPY_R = 0.045;
  const CANOPY_H = 0.10;
  const BULB_R = 0.032;

  const SHADE_BASE_Y = RIM_TUBE_R;
  const SHADE_TOP_Y = SHADE_BASE_Y + SHADE_H;
  const CANOPY_BASE_Y = TOTAL_H - CANOPY_H;

  // Shared materials
  const matteCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x26282a,
    roughness: 0.65,
    metalness: 0.15,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.85,
    metalness: 0.05,
  });

  const innerShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe9,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.BackSide,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    roughness: 0.3,
    metalness: 0.85,
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xffe4b5,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Shade outer cone
  const shadeOuterGeo = new THREE.ConeGeometry(SHADE_R, SHADE_H, 32, 1, true);
  const shadeOuter = new THREE.Mesh(shadeOuterGeo, matteCharcoalMat);
  shadeOuter.name = "shade_outer";
  shadeOuter.position.y = SHADE_BASE_Y + SHADE_H / 2;
  group.add(shadeOuter);

  // 2. Shade inner cone
  const shadeInnerGeo = new THREE.ConeGeometry(SHADE_R - 0.003, SHADE_H - 0.004, 32, 1, true);
  const shadeInner = new THREE.Mesh(shadeInnerGeo, innerShadeMat);
  shadeInner.name = "shade_inner";
  shadeInner.position.y = SHADE_BASE_Y + SHADE_H / 2 - 0.001;
  group.add(shadeInner);

  // 3. Shade rolled bottom rim
  const shadeRimGeo = new THREE.TorusGeometry(SHADE_R, RIM_TUBE_R, 12, 32);
  const shadeRim = new THREE.Mesh(shadeRimGeo, matteCharcoalMat);
  shadeRim.name = "shade_rim";
  shadeRim.rotation.x = Math.PI / 2;
  shadeRim.position.y = SHADE_BASE_Y;
  group.add(shadeRim);

  // 4. Socket collar at top of shade
  const socketCollarGeo = new THREE.CylinderGeometry(SOCKET_R * 0.85, SOCKET_R, SOCKET_H * 0.7, 24);
  const socketCollar = new THREE.Mesh(socketCollarGeo, matteCharcoalMat);
  socketCollar.name = "socket_collar";
  socketCollar.position.y = SHADE_TOP_Y + SOCKET_H * 0.25;
  group.add(socketCollar);

  // 5. Rounded top cap of socket collar
  const socketCapGeo = new THREE.SphereGeometry(SOCKET_R * 0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const socketCap = new THREE.Mesh(socketCapGeo, matteCharcoalMat);
  socketCap.name = "socket_cap";
  socketCap.position.y = SHADE_TOP_Y + SOCKET_H * 0.6;
  group.add(socketCap);

  // 6. Cord strain relief grommet at socket
  const grommetGeo = new THREE.CylinderGeometry(CORD_R * 1.8, CORD_R * 2.2, 0.012, 16);
  const cordGrommet = new THREE.Mesh(grommetGeo, cordMat);
  cordGrommet.name = "cord_grommet";
  cordGrommet.position.y = SHADE_TOP_Y + SOCKET_H * 0.6 + SOCKET_R * 0.85;
  group.add(cordGrommet);

  // 7. Inner socket housing
  const innerSocketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.045, 20);
  const innerSocket = new THREE.Mesh(innerSocketGeo, matteCharcoalMat);
  innerSocket.name = "inner_socket_housing";
  innerSocket.position.y = SHADE_TOP_Y - 0.025;
  group.add(innerSocket);

  // 8. Bulb screw base
  const bulbBaseGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.022, 20);
  const bulbBase = new THREE.Mesh(bulbBaseGeo, metalMat);
  bulbBase.name = "bulb_base";
  bulbBase.position.y = SHADE_TOP_Y - 0.055;
  group.add(bulbBase);

  // 9. Emissive bulb
  const bulbGeo = new THREE.SphereGeometry(BULB_R, 24, 16);
  const emitBulb = new THREE.Mesh(bulbGeo, bulbMat);
  emitBulb.name = "emit_bulb";
  emitBulb.position.y = SHADE_TOP_Y - 0.09;
  group.add(emitBulb);

  // 10. Hanging cord
  const cordBottomY = SHADE_TOP_Y + SOCKET_H * 0.6;
  const cordTopY = CANOPY_BASE_Y + 0.01;
  const cordLen = cordTopY - cordBottomY;
  const cordGeo = new THREE.CylinderGeometry(CORD_R, CORD_R, cordLen, 12);
  const cord = new THREE.Mesh(cordGeo, cordMat);
  cord.name = "cord";
  cord.position.y = cordBottomY + cordLen / 2;
  group.add(cord);

  // 11. Canopy bottom strain relief collar
  const canopyCollarGeo = new THREE.CylinderGeometry(CORD_R * 2.0, CORD_R * 1.6, 0.014, 16);
  const canopyCollar = new THREE.Mesh(canopyCollarGeo, cordMat);
  canopyCollar.name = "canopy_strain_relief";
  canopyCollar.position.y = CANOPY_BASE_Y - 0.005;
  group.add(canopyCollar);

  // 12. Canopy body
  const canopyBodyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H - 0.004, 32);
  const canopyBody = new THREE.Mesh(canopyBodyGeo, matteCharcoalMat);
  canopyBody.name = "canopy_body";
  canopyBody.position.y = CANOPY_BASE_Y + (CANOPY_H - 0.004) / 2;
  group.add(canopyBody);

  // 13. Canopy top plate (ceiling flush)
  const canopyTopGeo = new THREE.CylinderGeometry(CANOPY_R + 0.002, CANOPY_R + 0.002, 0.004, 32);
  const canopyTop = new THREE.Mesh(canopyTopGeo, matteCharcoalMat);
  canopyTop.name = "canopy_top_plate";
  canopyTop.position.y = TOTAL_H - 0.002;
  group.add(canopyTop);

  // Enable shadows on all meshes
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
