function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.42;
  const H = 0.08;
  const D = 0.50;
  const BEVEL = 0.022;
  const CORNER_R = 0.035;

  // Wool materials (matte, soft)
  const matBase = new THREE.MeshStandardMaterial({
    color: 0xa6a298,
    roughness: 0.94,
    metalness: 0.0,
  });
  const matCream = new THREE.MeshStandardMaterial({
    color: 0xe6dfd1,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matTaupe = new THREE.MeshStandardMaterial({
    color: 0xc2ac8c,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matGrey = new THREE.MeshStandardMaterial({
    color: 0x9da2a5,
    roughness: 0.92,
    metalness: 0.0,
  });
  const matOlive = new THREE.MeshStandardMaterial({
    color: 0x6f7754,
    roughness: 0.92,
    metalness: 0.0,
  });

  const palette = [matGrey, matCream, matTaupe, matOlive, matGrey, matCream, matTaupe, matOlive, matGrey];

  // 1. Base folded blanket body (rounded pillowy slab)
  const innerW = W - BEVEL * 2;
  const innerD = D - BEVEL * 2;
  const hw = innerW / 2;
  const hd = innerD / 2;
  const r = Math.min(CORNER_R, hw * 0.4, hd * 0.4);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: H - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  bodyGeo.rotateX(-Math.PI / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, matBase);
  bodyMesh.name = 'folded_blanket_body';
  bodyMesh.position.set(0, BEVEL, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Chunky cable-knit braid on the left side (-X)
  const cableX = -W * 0.34;
  const cableRadius = 0.011;
  const cableLen = 0.048;
  const cableGeo = new THREE.CapsuleGeometry(cableRadius, cableLen, 4, 10);
  const cableCount = 6;
  const cableStartZ = -D * 0.36;
  const cableStepZ = (D * 0.72) / (cableCount - 1);

  for (let i = 0; i < cableCount; i++) {
    const zPos = cableStartZ + i * cableStepZ;
    const isEven = i % 2 === 0;
    const mat = i % 3 === 0 ? matCream : i % 3 === 1 ? matGrey : matTaupe;
    const strand = new THREE.Mesh(cableGeo, mat);
    strand.name = `cable_knit_strand_${i + 1}`;
    strand.position.set(cableX + (isEven ? -0.012 : 0.012), H - 0.002, zPos);
    strand.rotation.x = Math.PI / 2;
    strand.rotation.z = isEven ? 0.35 : -0.35;
    strand.castShadow = true;
    strand.receiveShadow = true;
    group.add(strand);
  }

  // 3. Vertical chunky knit ribs (basketweave warp)
  const vRibRadius = 0.0105;
  const vRibLen = D - 0.06;
  const vRibGeo = new THREE.CapsuleGeometry(vRibRadius, vRibLen, 4, 10);
  const vCount = 8;
  const vStartX = -W * 0.20;
  const vEndX = W * 0.40;
  const vStepX = (vEndX - vStartX) / (vCount - 1);

  for (let i = 0; i < vCount; i++) {
    const xPos = vStartX + i * vStepX;
    const rib = new THREE.Mesh(vRibGeo, palette[i % palette.length]);
    rib.name = `vertical_knit_rib_${i + 1}`;
    rib.position.set(xPos, H - 0.003, 0);
    rib.rotation.x = Math.PI / 2;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  // 4. Horizontal chunky knit ribs (basketweave weft)
  const hRibRadius = 0.0095;
  const hRibLen = (vEndX - vStartX) + 0.02;
  const hRibGeo = new THREE.CapsuleGeometry(hRibRadius, hRibLen, 4, 10);
  const hCount = 9;
  const hStartZ = -D * 0.40;
  const hEndZ = D * 0.40;
  const hStepZ = (hEndZ - hStartZ) / (hCount - 1);

  for (let i = 0; i < hCount; i++) {
    const zPos = hStartZ + i * hStepZ;
    const rib = new THREE.Mesh(hRibGeo, palette[(i + 2) % palette.length]);
    rib.name = `horizontal_knit_rib_${i + 1}`;
    rib.position.set((vStartX + vEndX) / 2, H - 0.001, zPos);
    rib.rotation.z = Math.PI / 2;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
  }

  return group;
}
