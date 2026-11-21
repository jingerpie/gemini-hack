function build(THREE) {
  const group = new THREE.Group();

  // Real-world dimensions (meters): 75cm x 100cm gallery-wrapped canvas
  const W = 0.75;
  const H = 1.00;
  const D = 0.038;
  const LAYER_T = 0.0025;

  // Materials
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xd8cbb8,
    roughness: 0.85,
    metalness: 0.0,
  });
  const skyCreamMat = new THREE.MeshStandardMaterial({
    color: 0xe6d7be,
    roughness: 0.78,
    metalness: 0.0,
  });
  const skyOchreMat = new THREE.MeshStandardMaterial({
    color: 0xd9a76a,
    roughness: 0.78,
    metalness: 0.0,
  });
  const skyLightMat = new THREE.MeshStandardMaterial({
    color: 0xf2ead7,
    roughness: 0.75,
    metalness: 0.0,
  });
  const horizonMat = new THREE.MeshStandardMaterial({
    color: 0x6b5c49,
    roughness: 0.82,
    metalness: 0.0,
  });
  const waterLightMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6cf,
    roughness: 0.65,
    metalness: 0.02,
  });
  const ochreMat = new THREE.MeshStandardMaterial({
    color: 0xc2842b,
    roughness: 0.72,
    metalness: 0.0,
  });
  const siennaMat = new THREE.MeshStandardMaterial({
    color: 0x9c421c,
    roughness: 0.72,
    metalness: 0.0,
  });
  const oliveMat = new THREE.MeshStandardMaterial({
    color: 0x7c8234,
    roughness: 0.75,
    metalness: 0.0,
  });
  const darkUmberMat = new THREE.MeshStandardMaterial({
    color: 0x2b241c,
    roughness: 0.80,
    metalness: 0.0,
  });
  const boatRedMat = new THREE.MeshStandardMaterial({
    color: 0xa63a24,
    roughness: 0.70,
    metalness: 0.0,
  });

  function addBox(name, w, h, d, x, y, z, mat) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Stretched canvas base (back at z = -D/2, front at z = +D/2)
  addBox('canvas_base', W, H, D, 0, H / 2, 0, canvasMat);

  const z1 = D / 2 + LAYER_T * 0.5;
  const z2 = D / 2 + LAYER_T * 1.4;
  const z3 = D / 2 + LAYER_T * 2.3;

  // 2. Sky background & warm clouds
  addBox('sky_base', W * 0.99, H * 0.36, LAYER_T, 0, H * 0.82, z1, skyCreamMat);
  addBox('sky_ochre_top', W * 0.55, H * 0.14, LAYER_T, -W * 0.15, H * 0.90, z2, skyOchreMat);
  addBox('sky_light_band', W * 0.88, H * 0.10, LAYER_T, 0, H * 0.72, z2, skyLightMat);
  addBox('sky_ochre_right', W * 0.30, H * 0.12, LAYER_T, W * 0.30, H * 0.83, z2, skyOchreMat);

  // 3. Horizon & distant harbor
  addBox('horizon_strip', W * 0.99, H * 0.025, LAYER_T, 0, H * 0.65, z2, horizonMat);
  addBox('harbor_pier_right', W * 0.22, H * 0.04, LAYER_T, W * 0.37, H * 0.635, z3, darkUmberMat);

  // 4. Boats and masts along horizon
  addBox('boat_left_1', W * 0.05, H * 0.018, LAYER_T, -W * 0.28, H * 0.635, z3, darkUmberMat);
  addBox('boat_left_2', W * 0.06, H * 0.016, LAYER_T, -W * 0.17, H * 0.635, z3, darkUmberMat);
  addBox('boat_right_red', W * 0.08, H * 0.020, LAYER_T, W * 0.12, H * 0.632, z3, boatRedMat);
  addBox('boat_right_dark', W * 0.09, H * 0.022, LAYER_T, W * 0.24, H * 0.632, z3, darkUmberMat);

  addBox('mast_left_1', 0.004, H * 0.06, LAYER_T, -W * 0.28, H * 0.665, z3, darkUmberMat);
  addBox('mast_left_2', 0.004, H * 0.055, LAYER_T, -W * 0.17, H * 0.662, z3, darkUmberMat);
  addBox('mast_right_1', 0.004, H * 0.08, LAYER_T, W * 0.11, H * 0.675, z3, darkUmberMat);
  addBox('mast_right_2', 0.004, H * 0.095, LAYER_T, W * 0.23, H * 0.680, z3, darkUmberMat);

  // 5. Middle water & reflections
  addBox('water_reflection_center', W * 0.34, H * 0.22, LAYER_T, -W * 0.04, H * 0.53, z1, waterLightMat);
  addBox('shore_olive_left', W * 0.36, H * 0.14, LAYER_T, -W * 0.31, H * 0.52, z2, oliveMat);
  addBox('shore_ochre_mid', W * 0.40, H * 0.12, LAYER_T, W * 0.12, H * 0.54, z2, ochreMat);
  addBox('shore_sienna_right', W * 0.28, H * 0.10, LAYER_T, W * 0.34, H * 0.50, z2, siennaMat);

  // 6. Foreground abstract impasto blocks
  addBox('fg_base_sienna', W * 0.99, H * 0.44, LAYER_T, 0, H * 0.22, z1, siennaMat);
  addBox('fg_ochre_center', W * 0.46, H * 0.24, LAYER_T, -W * 0.02, H * 0.32, z2, ochreMat);
  addBox('fg_olive_right', W * 0.32, H * 0.15, LAYER_T, W * 0.26, H * 0.42, z2, oliveMat);
  addBox('fg_highlight_cream', W * 0.18, H * 0.07, LAYER_T, -W * 0.16, H * 0.36, z3, skyLightMat);
  addBox('fg_dark_left', W * 0.16, H * 0.16, LAYER_T, -W * 0.38, H * 0.10, z2, darkUmberMat);
  addBox('fg_dark_right', W * 0.28, H * 0.14, LAYER_T, W * 0.32, H * 0.10, z2, darkUmberMat);
  addBox('fg_olive_bottom_left', W * 0.20, H * 0.10, LAYER_T, -W * 0.26, H * 0.14, z3, oliveMat);
  addBox('fg_ochre_bottom', W * 0.36, H * 0.12, LAYER_T, W * 0.05, H * 0.12, z3, ochreMat);

  return group;
}
