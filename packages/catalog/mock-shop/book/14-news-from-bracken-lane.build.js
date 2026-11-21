function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions for a hardcover novel lying flat (meters)
  const W = 0.155;        // width (X)
  const D = 0.235;        // depth / height of book (Z)
  const H = 0.028;        // thickness (Y)
  const COVER_T = 0.0025; // cover board thickness
  const PAGE_INSET = 0.004;
  const SPINE_R = H * 0.5;

  const matCover = new THREE.MeshStandardMaterial({
    color: 0x9a4427,
    roughness: 0.72,
    metalness: 0.02,
  });

  const matPages = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.85,
    metalness: 0.0,
  });

  const matCard = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.8,
    metalness: 0.0,
  });

  const matIllustBg = new THREE.MeshStandardMaterial({
    color: 0xe6d7c3,
    roughness: 0.85,
    metalness: 0.0,
  });

  const matRoof = new THREE.MeshStandardMaterial({
    color: 0xb05c3b,
    roughness: 0.78,
    metalness: 0.0,
  });

  const matInk = new THREE.MeshStandardMaterial({
    color: 0x8c3b20,
    roughness: 0.65,
    metalness: 0.0,
  });

  // Back cover (bottom, y = 0 to COVER_T)
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(W - SPINE_R * 0.5, COVER_T, D),
    matCover
  );
  backCover.name = "back_cover";
  backCover.position.set(SPINE_R * 0.25, COVER_T * 0.5, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  group.add(backCover);

  // Page block (between covers, inset from +X, +Z, -Z edges)
  const pageH = H - COVER_T * 2;
  const pageW = W - SPINE_R * 0.5 - PAGE_INSET;
  const pageD = D - PAGE_INSET * 2;
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(pageW, pageH, pageD),
    matPages
  );
  pageBlock.name = "page_block";
  pageBlock.position.set(
    SPINE_R * 0.25 - PAGE_INSET * 0.5,
    COVER_T + pageH * 0.5,
    0
  );
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  group.add(pageBlock);

  // Rounded spine on the -X side
  const spineGeo = new THREE.CylinderGeometry(SPINE_R, SPINE_R, D, 20, 1, false, 0, Math.PI);
  spineGeo.rotateX(Math.PI * 0.5);
  spineGeo.rotateY(Math.PI);
  const spine = new THREE.Mesh(spineGeo, matCover);
  spine.name = "spine";
  spine.position.set(-W * 0.5 + SPINE_R, H * 0.5, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  // Front cover (top, y = H - COVER_T to H)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(W - SPINE_R * 0.5, COVER_T, D),
    matCover
  );
  frontCover.name = "front_cover";
  frontCover.position.set(SPINE_R * 0.25, H - COVER_T * 0.5, 0);
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  group.add(frontCover);

  // Cream newsletter inset card on front cover (slightly tilted like the photo)
  const cardGroup = new THREE.Group();
  cardGroup.position.set(0.004, H + 0.0004, 0);
  cardGroup.rotation.y = 0.035;
  group.add(cardGroup);

  const cardW = W * 0.82;
  const cardD = D * 0.88;
  const cardT = 0.0008;

  const coverCard = new THREE.Mesh(
    new THREE.BoxGeometry(cardW, cardT, cardD),
    matCard
  );
  coverCard.name = "cover_inset_card";
  coverCard.castShadow = true;
  coverCard.receiveShadow = true;
  cardGroup.add(coverCard);

  // Title color blocks ("News / from / Bracken / Lane")
  const titleBars = [
    { name: "title_news", w: cardW * 0.55, d: 0.016, z: -cardD * 0.30 },
    { name: "title_from", w: cardW * 0.22, d: 0.007, z: -cardD * 0.22 },
    { name: "title_bracken", w: cardW * 0.72, d: 0.018, z: -cardD * 0.14 },
    { name: "title_lane", w: cardW * 0.44, d: 0.016, z: -cardD * 0.05 },
  ];
  for (let i = 0; i < titleBars.length; i++) {
    const b = titleBars[i];
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, 0.0003, b.d),
      matInk
    );
    bar.name = b.name;
    bar.position.set(0, cardT * 0.5 + 0.00015, b.z);
    bar.castShadow = true;
    bar.receiveShadow = true;
    cardGroup.add(bar);
  }

  // Illustration panel on lower half of card
  const illustD = cardD * 0.36;
  const illustZ = cardD * 0.19;
  const illustBg = new THREE.Mesh(
    new THREE.BoxGeometry(cardW * 0.94, 0.0003, illustD),
    matIllustBg
  );
  illustBg.name = "illustration_panel";
  illustBg.position.set(0, cardT * 0.5 + 0.00015, illustZ);
  illustBg.castShadow = true;
  illustBg.receiveShadow = true;
  cardGroup.add(illustBg);

  // Left village cottages block
  const cottages = new THREE.Mesh(
    new THREE.BoxGeometry(cardW * 0.26, 0.0004, illustD * 0.55),
    matRoof
  );
  cottages.name = "illustration_cottages";
  cottages.position.set(-cardW * 0.30, cardT * 0.5 + 0.00035, illustZ + 0.005);
  cottages.castShadow = true;
  cottages.receiveShadow = true;
  cardGroup.add(cottages);

  // Right meeting hall block
  const meetingHall = new THREE.Mesh(
    new THREE.BoxGeometry(cardW * 0.24, 0.0004, illustD * 0.52),
    matRoof
  );
  meetingHall.name = "illustration_meeting_hall";
  meetingHall.position.set(cardW * 0.31, cardT * 0.5 + 0.00035, illustZ + 0.004);
  meetingHall.castShadow = true;
  meetingHall.receiveShadow = true;
  cardGroup.add(meetingHall);

  // Author name bar ("Helen Taverner")
  const authorBar = new THREE.Mesh(
    new THREE.BoxGeometry(cardW * 0.62, 0.0003, 0.009),
    matInk
  );
  authorBar.name = "author_name_bar";
  authorBar.position.set(0, cardT * 0.5 + 0.00015, cardD * 0.43);
  authorBar.castShadow = true;
  authorBar.receiveShadow = true;
  cardGroup.add(authorBar);

  return group;
}
