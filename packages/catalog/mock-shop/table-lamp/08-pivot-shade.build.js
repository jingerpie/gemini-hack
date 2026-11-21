function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const H = 0.42;
  const BASE_R = 0.09;
  const BASE_H = 0.008;
  const STEM_R = 0.009;
  const STEM_Z = -0.055;
  const SHADE_R = 0.105;
  const SHADE_H = 0.125;
  const SHADE_Z = 0.035;
  const SHADE_BOTTOM_Y = H - SHADE_H;
  const PIVOT_Y = SHADE_BOTTOM_Y + 0.045;
  const PIVOT_Z = STEM_Z;
  const STEM_H = PIVOT_Y - BASE_H;
  const CORD_R = 0.003;

  // Materials
  const matteCharcoal = new THREE.MeshStandardMaterial({
    color: 0x2b2d2f,
    roughness: 0.45,
    metalness: 0.55
  });
  const darkPlastic = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.65,
    metalness: 0.1
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    roughness: 0.25,
    metalness: 0.9
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xffe4b5,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0
  });

  function addMesh(geo, mat, name, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Base disc
  addMesh(
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 32),
    matteCharcoal,
    "base_disc",
    0,
    BASE_H / 2,
    0
  );

  // Stem collar at base
  addMesh(
    new THREE.CylinderGeometry(STEM_R * 1.35, STEM_R * 1.45, 0.008, 24),
    matteCharcoal,
    "stem_collar",
    0,
    BASE_H + 0.004,
    STEM_Z
  );

  // Vertical stem pole
  addMesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 24),
    matteCharcoal,
    "stem_pole",
    0,
    BASE_H + STEM_H / 2,
    STEM_Z
  );

  // Pivot joint housing
  addMesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.032, 24),
    matteCharcoal,
    "pivot_housing",
    0,
    PIVOT_Y,
    PIVOT_Z,
    0,
    0,
    Math.PI / 2
  );

  // Pivot end caps
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.005, 20),
    matteCharcoal,
    "pivot_cap_left",
    -0.018,
    PIVOT_Y,
    PIVOT_Z,
    0,
    0,
    Math.PI / 2
  );
  addMesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.005, 20),
    matteCharcoal,
    "pivot_cap_right",
    0.018,
    PIVOT_Y,
    PIVOT_Z,
    0,
    0,
    Math.PI / 2
  );

  // Shade connector neck
  const neckLen = Math.abs(SHADE_Z - PIVOT_Z) - SHADE_R * 0.6;
  addMesh(
    new THREE.CylinderGeometry(0.01, 0.012, neckLen + 0.04, 16),
    matteCharcoal,
    "shade_connector",
    0,
    PIVOT_Y,
    PIVOT_Z + (neckLen + 0.02) / 2,
    Math.PI / 2,
    0,
    0
  );

  // Dome shade (LatheGeometry with outer + inner wall for realistic thickness)
  const shadePoints = [];
  const wallT = 0.003;
  const skirtH = 0.028;
  const domeR = SHADE_R;
  const steps = 16;

  // Outer profile from top center down to bottom rim
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * (Math.PI / 2);
    const r = Math.sin(theta) * domeR;
    const y = skirtH + Math.cos(theta) * (SHADE_H - skirtH);
    shadePoints.push(new THREE.Vector2(r, y));
  }
  shadePoints.push(new THREE.Vector2(domeR, 0));
  shadePoints.push(new THREE.Vector2(domeR - wallT, 0));

  // Inner profile from bottom rim back up to top center
  for (let i = steps; i >= 0; i--) {
    const theta = (i / steps) * (Math.PI / 2);
    const r = Math.max(0, Math.sin(theta) * (domeR - wallT));
    const y = skirtH + Math.cos(theta) * (SHADE_H - skirtH - wallT);
    shadePoints.push(new THREE.Vector2(r, y));
  }

  addMesh(
    new THREE.LatheGeometry(shadePoints, 32),
    matteCharcoal,
    "shade_dome",
    0,
    SHADE_BOTTOM_Y,
    SHADE_Z
  );

  // Bulb socket inside shade
  addMesh(
    new THREE.CylinderGeometry(0.014, 0.016, 0.028, 16),
    darkPlastic,
    "bulb_socket",
    0,
    SHADE_BOTTOM_Y + SHADE_H - 0.025,
    SHADE_Z
  );

  // Emissive bulb inside shade
  addMesh(
    new THREE.SphereGeometry(0.026, 20, 16),
    bulbMat,
    "emit_bulb",
    0,
    SHADE_BOTTOM_Y + SHADE_H - 0.055,
    SHADE_Z
  );

  // Cord grommet at lower stem
  addMesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12),
    darkPlastic,
    "cord_grommet",
    0,
    BASE_H + 0.016,
    STEM_Z - STEM_R - 0.002,
    Math.PI / 2,
    0,
    0
  );

  // Power cord curving neatly behind/beside the base
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, BASE_H + 0.016, STEM_Z - STEM_R - 0.004),
    new THREE.Vector3(0, CORD_R + 0.004, STEM_Z - 0.045),
    new THREE.Vector3(0.06, CORD_R, STEM_Z - 0.075),
    new THREE.Vector3(0.11, CORD_R, -0.04),
    new THREE.Vector3(0.09, CORD_R, 0.04),
    new THREE.Vector3(0.02, CORD_R, 0.08)
  ]);
  addMesh(
    new THREE.TubeGeometry(cordCurve, 32, CORD_R, 8, false),
    darkPlastic,
    "power_cord"
  );

  // Inline switch body
  addMesh(
    new THREE.BoxGeometry(0.018, 0.012, 0.042),
    darkPlastic,
    "inline_switch_body",
    0.11,
    0.006,
    -0.04,
    0,
    -0.15,
    0
  );

  // Inline switch rocker
  addMesh(
    new THREE.BoxGeometry(0.009, 0.006, 0.016),
    darkPlastic,
    "inline_switch_rocker",
    0.11,
    0.013,
    -0.04,
    0.2,
    -0.15,
    0
  );

  // Plug body
  addMesh(
    new THREE.BoxGeometry(0.016, 0.012, 0.026),
    darkPlastic,
    "plug_body",
    0.02,
    0.006,
    0.08,
    0,
    -0.9,
    0
  );

  // Plug prongs
  addMesh(
    new THREE.BoxGeometry(0.002, 0.006, 0.014),
    chromeMat,
    "plug_prong_left",
    0.006,
    0.006,
    0.092,
    0,
    -0.9,
    0
  );
  addMesh(
    new THREE.BoxGeometry(0.002, 0.006, 0.014),
    chromeMat,
    "plug_prong_right",
    0.012,
    0.006,
    0.085,
    0,
    -0.9,
    0
  );

  return group;
}
