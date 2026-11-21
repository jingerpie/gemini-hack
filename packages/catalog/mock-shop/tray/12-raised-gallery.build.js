function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.46;          // tray body width (X)
  const D = 0.33;          // tray body depth (Z)
  const H = 0.058;         // gallery height (Y)
  const RX = W / 2;
  const RZ = D / 2;
  const BASE_H = 0.006;
  const RIM_R = 0.0045;
  const SKIRT_H = 0.014;
  const POST_COUNT = 16;
  const HANDLE_EXT = 0.045;

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc2c2be,
    metalness: 0.9,
    roughness: 0.26,
  });

  const engravedMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0ac,
    metalness: 0.85,
    roughness: 0.42,
  });

  function makeMesh(geo, mat, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Oval base plate
  const baseGeo = new THREE.CylinderGeometry(1, 1, BASE_H, 32);
  const base = makeMesh(baseGeo, silverMat, 'tray_base');
  base.scale.set(RX, 1, RZ);
  base.position.y = BASE_H / 2;
  group.add(base);

  // Inner engraved medallion
  const medGeo = new THREE.CylinderGeometry(1, 1, 0.001, 32);
  const medallion = makeMesh(medGeo, engravedMat, 'center_engraving');
  medallion.scale.set(RX * 0.62, 1, RZ * 0.58);
  medallion.position.y = BASE_H + 0.0005;
  group.add(medallion);

  // Lower beaded rim
  const rimGeo = new THREE.TorusGeometry(1, RIM_R / RX, 10, 32);
  const lowerRim = makeMesh(rimGeo, silverMat, 'lower_rim');
  lowerRim.rotation.x = Math.PI / 2;
  lowerRim.scale.set(RX, RZ, 1);
  lowerRim.position.y = RIM_R;
  group.add(lowerRim);

  // Lower solid gallery skirt
  const skirtGeo = new THREE.CylinderGeometry(1, 1, SKIRT_H, 32, 1, true);
  const skirt = makeMesh(skirtGeo, silverMat, 'gallery_skirt');
  skirt.scale.set(RX, 1, RZ);
  skirt.position.y = BASE_H + SKIRT_H / 2;
  group.add(skirt);

  // Upper beaded rim
  const upperRim = makeMesh(rimGeo, silverMat, 'upper_rim');
  upperRim.rotation.x = Math.PI / 2;
  upperRim.scale.set(RX, RZ, 1);
  upperRim.position.y = H - RIM_R;
  group.add(upperRim);

  // Pierced gallery vertical posts
  const postH = H - BASE_H - SKIRT_H - RIM_R;
  const postGeo = new THREE.BoxGeometry(0.006, postH, 0.004);
  const postY = BASE_H + SKIRT_H + postH / 2;

  for (let i = 0; i < POST_COUNT; i++) {
    const angle = (i / POST_COUNT) * Math.PI * 2;
    const px = Math.cos(angle) * (RX - 0.002);
    const pz = Math.sin(angle) * (RZ - 0.002);
    const post = makeMesh(postGeo, silverMat, `gallery_post_${i + 1}`);
    post.position.set(px, postY, pz);
    post.rotation.y = -angle;
    group.add(post);
  }

  // Curved side handles (-X and +X)
  function createHandle(side, name) {
    const sign = side === 'right' ? 1 : -1;
    const attachZ = 0.055;
    const attachX = sign * (RX - 0.003);
    const attachY = H * 0.68;
    const midX = sign * (RX + HANDLE_EXT);
    const midY = H * 0.92;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(attachX, attachY, -attachZ),
      new THREE.Vector3(midX, midY, -attachZ * 0.65),
      new THREE.Vector3(midX + sign * 0.004, midY + 0.004, 0),
      new THREE.Vector3(midX, midY, attachZ * 0.65),
      new THREE.Vector3(attachX, attachY, attachZ),
    ]);

    const handleGeo = new THREE.TubeGeometry(curve, 20, 0.006, 10, false);
    return makeMesh(handleGeo, silverMat, name);
  }

  group.add(createHandle('left', 'handle_left'));
  group.add(createHandle('right', 'handle_right'));

  return group;
}
