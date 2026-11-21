function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.72;
  const H = 0.68;
  const D = 0.76;
  const POLE_R = 0.013;
  const POLE_Z = D / 2 - 0.025;
  const CUSH_W = 0.56;
  const CUSH_D = 0.70;
  const CUSH_H = 0.11;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4b48c,
    roughness: 0.62,
    metalness: 0.02
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb5a38d,
    roughness: 0.92,
    metalness: 0.0
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xa89680,
    roughness: 0.9,
    metalness: 0.0
  });

  const pipingMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29d,
    roughness: 0.85,
    metalness: 0.0
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.95,
    metalness: 0.0
  });

  function addMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // A-frame geometry calculations
  const botX = W / 2 - POLE_R;
  const botY = POLE_R;
  const topX = 0;
  const topY = H - POLE_R;

  const dx = botX - topX;
  const dy = topY - botY;
  const poleLen = Math.sqrt(dx * dx + dy * dy) + 0.03;
  const slopeAngle = Math.atan2(dx, dy);

  // Ridge pole
  const ridgeGeo = new THREE.CylinderGeometry(POLE_R * 0.95, POLE_R * 0.95, D, 16);
  ridgeGeo.rotateX(Math.PI / 2);
  const ridgePole = addMesh(ridgeGeo, woodMat, 'ridge_pole');
  ridgePole.position.set(0, topY - POLE_R * 1.1, 0);

  // 4 angled wooden poles + fabric sleeves
  const poleCorners = [
    { name: 'fl', signX: -1, signZ: 1 },
    { name: 'fr', signX: 1, signZ: 1 },
    { name: 'bl', signX: -1, signZ: -1 },
    { name: 'br', signX: 1, signZ: -1 }
  ];

  const sleeveLen = poleLen * 0.30;
  const sleeveGeo = new THREE.CylinderGeometry(POLE_R + 0.0035, POLE_R + 0.0035, sleeveLen, 16);
  const poleGeo = new THREE.CylinderGeometry(POLE_R, POLE_R, poleLen, 16);

  poleCorners.forEach((c) => {
    const midX = (c.signX * botX) / 2;
    const midY = (botY + topY) / 2;
    const zPos = c.signZ * POLE_Z;
    const rotZ = c.signX * slopeAngle;

    const pole = addMesh(poleGeo, woodMat, `pole_${c.name}`);
    pole.position.set(midX, midY, zPos);
    pole.rotation.z = rotZ;

    // Top sleeve
    const topOffset = poleLen * 0.28;
    const sleeveTop = addMesh(sleeveGeo, fabricMat, `sleeve_${c.name}_top`);
    sleeveTop.position.set(
      midX - c.signX * Math.sin(slopeAngle) * topOffset,
      midY + Math.cos(slopeAngle) * topOffset,
      zPos
    );
    sleeveTop.rotation.z = rotZ;

    // Bottom sleeve
    const botOffset = poleLen * 0.28;
    const sleeveBot = addMesh(sleeveGeo, fabricMat, `sleeve_${c.name}_bot`);
    sleeveBot.position.set(
      midX + c.signX * Math.sin(slopeAngle) * botOffset,
      midY - Math.cos(slopeAngle) * botOffset,
      zPos
    );
    sleeveBot.rotation.z = rotZ;
  });

  // Canopy fabric slopes (left and right)
  const canopyLen = poleLen - 0.05;
  const canopyD = D - 0.04;
  const canopyGeo = new THREE.BoxGeometry(0.007, canopyLen, canopyD);

  const canopyLeft = addMesh(canopyGeo, fabricMat, 'canopy_left');
  canopyLeft.position.set(-botX / 2 + 0.004, (botY + topY) / 2, 0);
  canopyLeft.rotation.z = -slopeAngle;

  const canopyRight = addMesh(canopyGeo, fabricMat, 'canopy_right');
  canopyRight.position.set(botX / 2 - 0.004, (botY + topY) / 2, 0);
  canopyRight.rotation.z = slopeAngle;

  // Canopy top ridge wrap
  const ridgeWrapGeo = new THREE.CylinderGeometry(POLE_R + 0.006, POLE_R + 0.006, canopyD, 16);
  ridgeWrapGeo.rotateX(Math.PI / 2);
  const ridgeWrap = addMesh(ridgeWrapGeo, fabricMat, 'canopy_ridge_wrap');
  ridgeWrap.position.set(0, topY - POLE_R * 0.8, 0);

  // Cushion base (non-slip dark bottom)
  const baseH = 0.015;
  const baseGeo = new THREE.BoxGeometry(CUSH_W - 0.02, baseH, CUSH_D - 0.02);
  const cushionBase = addMesh(baseGeo, baseMat, 'cushion_base');
  cushionBase.position.set(0, baseH / 2, 0);

  // Cushion main body
  const bodyH = CUSH_H - baseH - 0.025;
  const bodyGeo = new THREE.BoxGeometry(CUSH_W, bodyH, CUSH_D);
  const cushionBody = addMesh(bodyGeo, cushionMat, 'cushion_body');
  cushionBody.position.set(0, baseH + bodyH / 2, 0);

  // Cushion puffy top dome
  const domeGeo = new THREE.SphereGeometry(0.5, 24, 16);
  domeGeo.scale(CUSH_W * 0.98, 0.055, CUSH_D * 0.98);
  const cushionDome = addMesh(domeGeo, cushionMat, 'cushion_top_dome');
  cushionDome.position.set(0, baseH + bodyH - 0.002, 0);

  // Cushion piping / zipper seam details
  const pipeThick = 0.005;
  const pipeFrontGeo = new THREE.BoxGeometry(CUSH_W + 0.004, pipeThick, pipeThick);
  const pipeSideGeo = new THREE.BoxGeometry(pipeThick, pipeThick, CUSH_D + 0.004);

  const pipeFront = addMesh(pipeFrontGeo, pipingMat, 'cushion_piping_front');
  pipeFront.position.set(0, baseH + bodyH * 0.45, CUSH_D / 2);

  const pipeBack = addMesh(pipeFrontGeo, pipingMat, 'cushion_piping_back');
  pipeBack.position.set(0, baseH + bodyH * 0.45, -CUSH_D / 2);

  const pipeLeft = addMesh(pipeSideGeo, pipingMat, 'cushion_piping_left');
  pipeLeft.position.set(-CUSH_W / 2, baseH + bodyH * 0.45, 0);

  const pipeRight = addMesh(pipeSideGeo, pipingMat, 'cushion_piping_right');
  pipeRight.position.set(CUSH_W / 2, baseH + bodyH * 0.45, 0);

  return group;
}
