function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const H = 0.32;
  const BASE_R = 0.065;
  const BASE_H = 0.125;
  const PAD_H = 0.004;
  const SHADE_R = 0.12;
  const SHADE_H = H - BASE_H + 0.005;
  const NECK_R = 0.061;
  const SEGMENTS = 32;

  // Materials
  const matBase = new THREE.MeshStandardMaterial({
    color: 0xa67449,
    roughness: 0.85,
    metalness: 0.02
  });

  const matDarkRubber = new THREE.MeshStandardMaterial({
    color: 0x1e1d1b,
    roughness: 0.9,
    metalness: 0.05
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0xc2b8a3,
    roughness: 0.35,
    metalness: 0.85
  });

  const matCeramic = new THREE.MeshStandardMaterial({
    color: 0xebe6dc,
    roughness: 0.4,
    metalness: 0.05
  });

  const matShade = new THREE.MeshPhysicalMaterial({
    color: 0xf7f1e6,
    roughness: 0.65,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6
  });

  const matEmitBulb = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffd28a,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  const matEmitCore = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffe4b5,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Bottom rubber/felt pad
  addMesh(
    new THREE.CylinderGeometry(BASE_R - 0.002, BASE_R - 0.003, PAD_H, SEGMENTS),
    matDarkRubber,
    'base_pad',
    0,
    PAD_H * 0.5,
    0
  );

  // 2. Main terracotta/sandstone cylindrical base
  const bodyH = BASE_H - PAD_H;
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, bodyH, SEGMENTS),
    matBase,
    'base_cylinder',
    0,
    PAD_H + bodyH * 0.5,
    0
  );

  // 3. Recessed bottom plate
  addMesh(
    new THREE.CylinderGeometry(BASE_R * 0.72, BASE_R * 0.72, 0.002, SEGMENTS),
    matDarkRubber,
    'bottom_plate',
    0,
    PAD_H + 0.001,
    0
  );

  // 4 & 5. Bottom plate screws
  for (let i = 0; i < 2; i++) {
    const sx = (i === 0 ? -1 : 1) * BASE_R * 0.45;
    addMesh(
      new THREE.CylinderGeometry(0.0025, 0.0025, 0.003, 12),
      matMetal,
      `bottom_screw_${i + 1}`,
      sx,
      PAD_H + 0.0015,
      0
    );
  }

  // 6. Top rim/collar of the base
  addMesh(
    new THREE.TorusGeometry(NECK_R, 0.0035, 12, SEGMENTS),
    matMetal,
    'collar_ring',
    0,
    BASE_H,
    0
  ).rotation.x = Math.PI * 0.5;

  // 7. Internal socket cup
  addMesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.032, 24),
    matCeramic,
    'socket_cup',
    0,
    BASE_H + 0.012,
    0
  );

  // 8. Internal socket metal threads
  addMesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.016, 24),
    matMetal,
    'socket_threads',
    0,
    BASE_H + 0.032,
    0
  );

  // 9. Emissive bulb glass inside shade
  addMesh(
    new THREE.SphereGeometry(0.032, 24, 20),
    matEmitBulb,
    'emit_bulb_glass',
    0,
    BASE_H + 0.068,
    0
  );

  // 10. Emissive bulb core
  addMesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.024, 12),
    matEmitCore,
    'emit_bulb_core',
    0,
    BASE_H + 0.068,
    0
  );

  // 11. Matte glass dome shade (LatheGeometry for mushroom-dome silhouette)
  const shadePoints = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let r, y;
    if (t < 0.25) {
      // Smooth flare from neck to widest part
      const k = t / 0.25;
      const ease = Math.sin(k * Math.PI * 0.5);
      r = NECK_R + (SHADE_R - NECK_R) * ease;
      y = (BASE_H - 0.003) + SHADE_H * 0.32 * k;
    } else {
      // Upper dome curve to top pole
      const k = (t - 0.25) / 0.75;
      const angle = k * Math.PI * 0.5;
      r = SHADE_R * Math.cos(angle);
      y = (BASE_H - 0.003) + SHADE_H * 0.32 + SHADE_H * 0.68 * Math.sin(angle);
    }
    shadePoints.push(new THREE.Vector2(Math.max(0, r), y));
  }
  const shadeGeo = new THREE.LatheGeometry(shadePoints, SEGMENTS);
  addMesh(shadeGeo, matShade, 'shade_dome', 0, 0, 0);

  // 12. Cord exit grommet at the back (-Z)
  const grommet = addMesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.008, 16),
    matDarkRubber,
    'cord_exit_grommet',
    0,
    PAD_H + 0.012,
    -BASE_R
  );
  grommet.rotation.x = Math.PI * 0.5;

  // 13. Power cord exiting to the back (-Z)
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, PAD_H + 0.012, -BASE_R - 0.002),
    new THREE.Vector3(0, 0.004, -BASE_R - 0.03),
    new THREE.Vector3(0.02, 0.0035, -BASE_R - 0.09),
    new THREE.Vector3(0.05, 0.0035, -BASE_R - 0.14)
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 20, 0.0035, 10, false),
    matDarkRubber,
    'power_cord',
    0,
    0,
    0
  );

  // 14. Inline cord switch
  const sw = addMesh(
    new THREE.BoxGeometry(0.018, 0.012, 0.036),
    matDarkRubber,
    'inline_switch',
    0.02,
    0.006,
    -BASE_R - 0.09
  );
  sw.rotation.y = -0.35;

  return group;
}
