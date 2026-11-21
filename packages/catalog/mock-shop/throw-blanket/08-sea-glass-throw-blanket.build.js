function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.48;
  const D = 0.36;
  const LAYER_H = 0.068;
  const CORNER_R = 0.028;
  const BEVEL = 0.008;

  // Color block widths along X (sum = W)
  const W_LEFT = W * 0.62;
  const W_MID = W * 0.20;
  const W_RIGHT = W * 0.18;

  // X centers for the 3 color blocks
  const X_LEFT = -W / 2 + W_LEFT / 2;
  const X_MID = -W / 2 + W_LEFT + W_MID / 2;
  const X_RIGHT = W / 2 - W_RIGHT / 2;

  // Materials
  const matSeaGlass = new THREE.MeshStandardMaterial({ color: 0x6ca89e, roughness: 0.92, metalness: 0.0 });
  const matMint = new THREE.MeshStandardMaterial({ color: 0xa7cec8, roughness: 0.92, metalness: 0.0 });
  const matOlive = new THREE.MeshStandardMaterial({ color: 0x8b8764, roughness: 0.92, metalness: 0.0 });

  const matOchre = new THREE.MeshStandardMaterial({ color: 0xce7b3a, roughness: 0.92, metalness: 0.0 });
  const matPeach = new THREE.MeshStandardMaterial({ color: 0xe6b89c, roughness: 0.92, metalness: 0.0 });
  const matTerracotta = new THREE.MeshStandardMaterial({ color: 0xc95d3e, roughness: 0.92, metalness: 0.0 });

  const matCharcoal = new THREE.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.92, metalness: 0.0 });
  const matHeatherGrey = new THREE.MeshStandardMaterial({ color: 0x888c90, roughness: 0.92, metalness: 0.0 });
  const matRust = new THREE.MeshStandardMaterial({ color: 0x8a3b32, roughness: 0.92, metalness: 0.0 });

  const matCream = new THREE.MeshStandardMaterial({ color: 0xebe7df, roughness: 0.92, metalness: 0.0 });
  const matMutedCoral = new THREE.MeshStandardMaterial({ color: 0xd99b8c, roughness: 0.92, metalness: 0.0 });

  // Helper to create a rounded-rectangle cross-section in (Z, Y) extruded along X
  function createFoldBlock(width, height, depth, radius, bevelSize) {
    const shape = new THREE.Shape();
    const hz = depth / 2 - bevelSize;
    const hy = height / 2 - bevelSize;
    const r = Math.min(radius, hz * 0.9, hy * 0.9);

    shape.moveTo(-hz + r, -hy);
    shape.lineTo(hz - r, -hy);
    shape.quadraticCurveTo(hz, -hy, hz, -hy + r);
    shape.lineTo(hz, hy - r);
    shape.quadraticCurveTo(hz, hy, hz - r, hy);
    shape.lineTo(-hz + r, hy);
    shape.quadraticCurveTo(-hz, hy, -hz, hy - r);
    shape.lineTo(-hz, -hy + r);
    shape.quadraticCurveTo(-hz, -hy, -hz + r, -hy);

    const extrudeDepth = Math.max(0.004, width - bevelSize * 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: extrudeDepth,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelSegments: 3,
      curveSegments: 8
    });
    // Rotate so extrusion is along +X, centered at origin
    geo.rotateY(Math.PI / 2);
    geo.center();
    return geo;
  }

  function addMesh(geo, mat, x, y, z, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Build 3 stacked folded layers
  const layerConfigs = [
    {
      y: LAYER_H / 2,
      prefix: 'bottom_layer',
      mats: [matSeaGlass, matMint, matOlive],
      h: LAYER_H
    },
    {
      y: LAYER_H * 1.46,
      prefix: 'middle_layer',
      mats: [matOchre, matPeach, matTerracotta],
      h: LAYER_H
    },
    {
      y: LAYER_H * 2.42,
      prefix: 'top_layer_base',
      mats: [matCharcoal, matHeatherGrey, matRust],
      h: LAYER_H * 0.92
    }
  ];

  const overlap = 0.006;
  const widths = [W_LEFT + overlap, W_MID + overlap, W_RIGHT + overlap];
  const xs = [X_LEFT, X_MID, X_RIGHT];
  const partNames = ['left', 'mid', 'right'];

  for (let i = 0; i < layerConfigs.length; i++) {
    const cfg = layerConfigs[i];
    for (let j = 0; j < 3; j++) {
      const geo = createFoldBlock(widths[j], cfg.h, D, CORNER_R, BEVEL);
      addMesh(geo, cfg.mats[j], xs[j], cfg.y, 0, `${cfg.prefix}_${partNames[j]}`);
    }
  }

  // Top layer cream fold-over cap (sits slightly recessed from the front edge)
  const capH = 0.022;
  const capD = D * 0.92;
  const capY = LAYER_H * 2.42 + (LAYER_H * 0.92) / 2 - capH * 0.35;
  const capZ = -D * 0.03;
  const capMats = [matCream, matCream, matMutedCoral];

  for (let j = 0; j < 3; j++) {
    const geo = createFoldBlock(widths[j], capH, capD, 0.009, 0.004);
    addMesh(geo, capMats[j], xs[j], capY, capZ, `top_layer_cap_${partNames[j]}`);
  }

  // Subtle woven edge bumps along left and right sides
  const bumpGeo = new THREE.SphereGeometry(0.006, 8, 6);
  const bumpCount = 4;
  for (let i = 0; i < layerConfigs.length; i++) {
    const cfg = layerConfigs[i];
    for (let b = 0; b < bumpCount; b++) {
      const bz = -D * 0.32 + (b / (bumpCount - 1)) * (D * 0.64);
      addMesh(bumpGeo, cfg.mats[0], -W / 2 - 0.001, cfg.y, bz, `${cfg.prefix}_selvedge_left_${b}`);
      addMesh(bumpGeo, cfg.mats[2], W / 2 + 0.001, cfg.y, bz, `${cfg.prefix}_selvedge_right_${b}`);
    }
  }

  return group;
}
