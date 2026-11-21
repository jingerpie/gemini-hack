function build(THREE) {
  const group = new THREE.Group();

  // Named dimension constants (meters)
  const DIAMETER = 0.30;
  const R_OUTER = DIAMETER / 2; // 0.15 m
  const WALL_THICK = 0.004;
  const R_INNER = R_OUTER - WALL_THICK;

  const H_TOTAL = 0.095;
  const H_CANOPY = 0.012;
  const H_COLLAR = 0.010;
  const H_DRUM = H_TOTAL - H_CANOPY; // 0.083 m

  const R_CANOPY = 0.128;
  const R_COLLAR = 0.138;
  const R_DIFFUSER = R_INNER - 0.006;

  // Materials
  const matShade = new THREE.MeshStandardMaterial({
    color: 0xd6c8b4,
    roughness: 0.72,
    metalness: 0.05,
  });

  const matCanopy = new THREE.MeshStandardMaterial({
    color: 0xc9baa5,
    roughness: 0.68,
    metalness: 0.1,
  });

  const matGasket = new THREE.MeshStandardMaterial({
    color: 0x2b2926,
    roughness: 0.85,
    metalness: 0.05,
  });

  const matReflector = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.45,
    metalness: 0.1,
  });

  const matDiffuser = new THREE.MeshStandardMaterial({
    color: 0xfbf8f2,
    roughness: 0.35,
    metalness: 0.0,
    emissive: 0xfff1dc,
    emissiveIntensity: 1.5,
  });

  const matLed = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffe8c2,
    emissiveIntensity: 1.6,
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x8c8881,
    roughness: 0.4,
    metalness: 0.8,
  });

  function addMesh(geo, mat, name, y = 0, x = 0, z = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Plain top ceiling plate (y = H_TOTAL at top, no overlapping faces)
  const canopyGeo = new THREE.CylinderGeometry(R_CANOPY, R_CANOPY, H_CANOPY, 32);
  addMesh(canopyGeo, matCanopy, 'canopy_plate', H_TOTAL - H_CANOPY / 2);

  // 2. Thin shadow gasket ring recessed below the top face of the canopy
  const gasketGeo = new THREE.CylinderGeometry(R_CANOPY + 0.001, R_CANOPY + 0.001, 0.003, 32);
  addMesh(gasketGeo, matGasket, 'canopy_gasket', H_TOTAL - H_CANOPY + 0.0015);

  // 3. Upper stepped collar
  const collarGeo = new THREE.CylinderGeometry(R_COLLAR, R_OUTER, H_COLLAR, 32);
  addMesh(collarGeo, matShade, 'upper_collar', H_DRUM - H_COLLAR / 2 + 0.002);

  // 4. Outer drum shade with bottom inward lip (LatheGeometry, y = 0 at bottom)
  const drumPoints = [
    new THREE.Vector2(R_DIFFUSER - 0.002, 0.004),
    new THREE.Vector2(R_INNER, 0.004),
    new THREE.Vector2(R_INNER, H_DRUM - 0.004),
    new THREE.Vector2(R_OUTER, H_DRUM - 0.004),
    new THREE.Vector2(R_OUTER, 0.002),
    new THREE.Vector2(R_OUTER - 0.002, 0.0),
    new THREE.Vector2(R_DIFFUSER - 0.002, 0.0),
    new THREE.Vector2(R_DIFFUSER - 0.002, 0.004),
  ];
  const drumGeo = new THREE.LatheGeometry(drumPoints, 32);
  addMesh(drumGeo, matShade, 'outer_drum', 0);

  // 5. Inner reflector plate
  const reflectorGeo = new THREE.CylinderGeometry(R_INNER - 0.002, R_INNER - 0.002, 0.003, 32);
  addMesh(reflectorGeo, matReflector, 'inner_reflector', H_DRUM - 0.012);

  // 6. Diffuser trim ring
  const trimGeo = new THREE.TorusGeometry(R_DIFFUSER, 0.003, 12, 32);
  const trimMesh = addMesh(trimGeo, matShade, 'diffuser_trim_ring', 0.008);
  trimMesh.rotation.x = Math.PI / 2;

  // 7. Glowing white frosted diffuser underneath (shallow convex profile facing down)
  const diffuserPoints = [];
  const domeSteps = 12;
  const domeDrop = 0.008;
  for (let i = domeSteps; i >= 0; i--) {
    const t = i / domeSteps;
    const r = t * R_DIFFUSER;
    const y = 0.012 - domeDrop * Math.cos(t * Math.PI * 0.5);
    diffuserPoints.push(new THREE.Vector2(r, y));
  }
  const diffuserGeo = new THREE.LatheGeometry(diffuserPoints, 32);
  addMesh(diffuserGeo, matDiffuser, 'emit_diffuser', 0);

  // 8. Internal LED ring above diffuser
  const ledGeo = new THREE.TorusGeometry(R_DIFFUSER * 0.62, 0.006, 12, 32);
  const ledMesh = addMesh(ledGeo, matLed, 'emit_led_ring', H_DRUM - 0.022);
  ledMesh.rotation.x = Math.PI / 2;

  // 9. Central mounting hub inside
  const hubGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.014, 24);
  addMesh(hubGeo, matMetal, 'mounting_hub', H_DRUM - 0.019);

  // 10-13. Four mounting screws
  const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.006, 12);
  const screwRadius = R_CANOPY * 0.65;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const sx = Math.cos(angle) * screwRadius;
    const sz = Math.sin(angle) * screwRadius;
    addMesh(screwGeo, matMetal, `mounting_screw_${i + 1}`, H_DRUM - 0.014, sx, sz);
  }

  return group;
}
