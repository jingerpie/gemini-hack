function build(THREE) {
  const group = new THREE.Group();

  const SPEAKER_W = 0.16;
  const H = 0.22;
  const D = 0.24;
  const GAP = 0.10;
  const W = SPEAKER_W * 2 + GAP;
  const FOOT_H = 0.008;
  const FOOT_R = 0.012;
  const LIP_H = 0.026;
  const TOP_D = 0.085;
  const GRILLE_T = 0.012;

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x26292c,
    roughness: 0.62,
    metalness: 0.08,
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x181a1c,
    roughness: 0.92,
    metalness: 0.02,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x111213,
    roughness: 0.85,
    metalness: 0.05,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc2c6ca,
    roughness: 0.25,
    metalness: 0.88,
  });
  const redRingMat = new THREE.MeshStandardMaterial({
    color: 0xb02020,
    roughness: 0.4,
    metalness: 0.2,
  });

  const dz = D - TOP_D;
  const dy = H - (FOOT_H + LIP_H);
  const baffleAngle = Math.atan2(dz, dy);
  const baffleLen = Math.hypot(dz, dy);
  const midZ = TOP_D / 2;
  const midY = (FOOT_H + LIP_H + H) / 2;

  const profile = new THREE.Shape();
  profile.moveTo(-D / 2, FOOT_H);
  profile.lineTo(D / 2, FOOT_H);
  profile.lineTo(D / 2, FOOT_H + LIP_H);
  profile.lineTo(-D / 2 + TOP_D, H);
  profile.lineTo(-D / 2, H);
  profile.closePath();

  const cabinetGeo = new THREE.ExtrudeGeometry(profile, {
    depth: SPEAKER_W,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  cabinetGeo.translate(0, 0, -SPEAKER_W / 2);
  cabinetGeo.rotateY(-Math.PI / 2);

  const grilleGeo = new THREE.BoxGeometry(SPEAKER_W - 0.016, baffleLen - 0.014, GRILLE_T);
  const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R, FOOT_H, 16);
  const cupGeo = new THREE.BoxGeometry(0.006, 0.056, 0.044);
  const postGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.014, 16);
  postGeo.rotateZ(-Math.PI / 2);
  const ringGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 16);
  ringGeo.rotateZ(-Math.PI / 2);
  const holeGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 12);
  holeGeo.rotateZ(-Math.PI / 2);

  const xOffsets = [-(SPEAKER_W / 2 + GAP / 2), SPEAKER_W / 2 + GAP / 2];
  const sideNames = ['left', 'right'];

  xOffsets.forEach((xOff, idx) => {
    const spk = new THREE.Group();
    const label = sideNames[idx];
    spk.position.x = xOff;

    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.name = `speaker_${label}_cabinet`;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    spk.add(cabinet);

    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.name = `speaker_${label}_grille`;
    grille.rotation.x = -baffleAngle;
    const nY = Math.sin(baffleAngle);
    const nZ = Math.cos(baffleAngle);
    grille.position.set(0, midY + nY * (GRILLE_T * 0.4), midZ + nZ * (GRILLE_T * 0.4));
    grille.castShadow = true;
    grille.receiveShadow = true;
    spk.add(grille);

    const footCoords = [
      [-SPEAKER_W / 2 + 0.022, D / 2 - 0.025, 'fl'],
      [SPEAKER_W / 2 - 0.022, D / 2 - 0.025, 'fr'],
      [-SPEAKER_W / 2 + 0.022, -D / 2 + 0.025, 'bl'],
      [SPEAKER_W / 2 - 0.022, -D / 2 + 0.025, 'br'],
    ];
    footCoords.forEach(([fx, fz, fTag]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.name = `speaker_${label}_foot_${fTag}`;
      foot.position.set(fx, FOOT_H / 2, fz);
      foot.castShadow = true;
      foot.receiveShadow = true;
      spk.add(foot);
    });

    const sideX = SPEAKER_W / 2 + 0.001;
    const cup = new THREE.Mesh(cupGeo, footMat);
    cup.name = `speaker_${label}_terminal_cup`;
    cup.position.set(sideX, FOOT_H + 0.048, -D / 2 + 0.036);
    cup.castShadow = true;
    cup.receiveShadow = true;
    spk.add(cup);

    const post1 = new THREE.Mesh(postGeo, metalMat);
    post1.name = `speaker_${label}_binding_post_pos`;
    post1.position.set(sideX + 0.006, FOOT_H + 0.048, -D / 2 + 0.027);
    post1.castShadow = true;
    post1.receiveShadow = true;
    spk.add(post1);

    const ring1 = new THREE.Mesh(ringGeo, redRingMat);
    ring1.name = `speaker_${label}_binding_ring_red`;
    ring1.position.set(sideX + 0.004, FOOT_H + 0.048, -D / 2 + 0.027);
    ring1.castShadow = true;
    ring1.receiveShadow = true;
    spk.add(ring1);

    const post2 = new THREE.Mesh(postGeo, metalMat);
    post2.name = `speaker_${label}_binding_post_neg`;
    post2.position.set(sideX + 0.006, FOOT_H + 0.048, -D / 2 + 0.045);
    post2.castShadow = true;
    post2.receiveShadow = true;
    spk.add(post2);

    [0.105, 0.135].forEach((hy, hIdx) => {
      const hole = new THREE.Mesh(holeGeo, footMat);
      hole.name = `speaker_${label}_mount_insert_${hIdx + 1}`;
      hole.position.set(sideX + 0.001, hy, -D / 2 + 0.036);
      hole.castShadow = true;
      hole.receiveShadow = true;
      spk.add(hole);
    });

    group.add(spk);
  });

  return group;
}
