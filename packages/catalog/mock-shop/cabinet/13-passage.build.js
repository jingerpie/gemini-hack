function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const W = 0.64;
  const H = 0.96;
  const D = 0.24;

  const PANEL_T = 0.022;      // Side/top/back panel thickness
  const TOP_LIP_H = 0.036;    // Raised lip height around top tray
  const PLINTH_H = 0.055;     // Bottom kickplate height
  const FOOT_H = 0.004;       // Subtle floor glide height
  const GAP = 0.004;          // Gap between drawers and frame

  const INNER_W = W - PANEL_T * 2;
  const DRAWER_W = INNER_W - GAP * 2;
  const DRAWER_T = 0.018;

  // Vertical layout
  const SHELF_Y = H - TOP_LIP_H - PANEL_T; // Bottom of top shelf
  const DRAWER_AREA_TOP = SHELF_Y - GAP;
  const DRAWER_AREA_BOT = PLINTH_H + GAP;
  const DRAWER_AREA_H = DRAWER_AREA_TOP - DRAWER_AREA_BOT;
  const DRAWER_H = (DRAWER_AREA_H - GAP) / 2;

  // Cutout dimensions for finger-pull
  const NOTCH_W_TOP = 0.095;
  const NOTCH_W_BOT = 0.072;
  const NOTCH_H = 0.016;

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a34,
    roughness: 0.55,
    metalness: 0.02,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x1a130e,
    roughness: 0.85,
    metalness: 0.0,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x262626,
    roughness: 0.7,
    metalness: 0.1,
  });

  function addMesh(geom, mat, name, x, y, z) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Side panels (full height from FOOT_H to H)
  const sideH = H - FOOT_H;
  const sideGeom = new THREE.BoxGeometry(PANEL_T, sideH, D);
  addMesh(sideGeom, woodMat, 'left_side_panel', -W / 2 + PANEL_T / 2, FOOT_H + sideH / 2, 0);
  addMesh(sideGeom, woodMat, 'right_side_panel', W / 2 - PANEL_T / 2, FOOT_H + sideH / 2, 0);

  // Back panel (full height from FOOT_H to H, forms the back lip at the top)
  const backGeom = new THREE.BoxGeometry(INNER_W, sideH, PANEL_T);
  addMesh(backGeom, woodMat, 'back_panel', 0, FOOT_H + sideH / 2, -D / 2 + PANEL_T / 2);

  // Top recessed shelf
  const topShelfD = D - PANEL_T;
  const topShelfGeom = new THREE.BoxGeometry(INNER_W, PANEL_T, topShelfD);
  addMesh(topShelfGeom, woodMat, 'top_shelf', 0, SHELF_Y + PANEL_T / 2, PANEL_T / 2);

  // Bottom plinth / kickplate (recessed slightly from front)
  const plinthRecess = 0.014;
  const plinthGeom = new THREE.BoxGeometry(INNER_W, PLINTH_H - FOOT_H, PANEL_T);
  addMesh(
    plinthGeom,
    woodMat,
    'bottom_plinth',
    0,
    FOOT_H + (PLINTH_H - FOOT_H) / 2,
    D / 2 - DRAWER_T - plinthRecess - PANEL_T / 2
  );

  // Internal bottom floor
  const floorGeom = new THREE.BoxGeometry(INNER_W, PANEL_T, D - PANEL_T - plinthRecess);
  addMesh(
    floorGeom,
    woodMat,
    'cabinet_floor',
    0,
    PLINTH_H - PANEL_T / 2,
    (PANEL_T - plinthRecess) / 2
  );

  // Drawer front shape with top-center finger-pull notch
  function createDrawerFrontGeom() {
    const hw = DRAWER_W / 2;
    const hh = DRAWER_H / 2;
    const nwTop = NOTCH_W_TOP / 2;
    const nwBot = NOTCH_W_BOT / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(nwTop, hh);
    shape.lineTo(nwBot, hh - NOTCH_H);
    shape.lineTo(-nwBot, hh - NOTCH_H);
    shape.lineTo(-nwTop, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const extrudeSettings = {
      depth: DRAWER_T,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -DRAWER_T / 2);
    return geom;
  }

  const drawerGeom = createDrawerFrontGeom();
  const drawerZ = D / 2 - DRAWER_T / 2 - 0.002;

  const upperDrawerY = DRAWER_AREA_TOP - DRAWER_H / 2;
  const lowerDrawerY = DRAWER_AREA_BOT + DRAWER_H / 2;

  addMesh(drawerGeom, woodMat, 'upper_drawer_front', 0, upperDrawerY, drawerZ);
  addMesh(drawerGeom, woodMat, 'lower_drawer_front', 0, lowerDrawerY, drawerZ);

  // Dark recess backing behind the finger-pull cutouts
  const recessGeom = new THREE.BoxGeometry(NOTCH_W_TOP + 0.02, NOTCH_H + 0.015, 0.006);
  const recessZ = drawerZ - DRAWER_T / 2 - 0.004;
  addMesh(recessGeom, recessMat, 'upper_notch_recess', 0, upperDrawerY + DRAWER_H / 2 - NOTCH_H / 2, recessZ);
  addMesh(recessGeom, recessMat, 'lower_notch_recess', 0, lowerDrawerY + DRAWER_H / 2 - NOTCH_H / 2, recessZ);

  // Small corner feet / glides under the side panels
  const footW = PANEL_T + 0.002;
  const footD = 0.028;
  const footGeom = new THREE.BoxGeometry(footW, FOOT_H + 0.008, footD);
  const footY = (FOOT_H + 0.008) / 2;
  const footZFront = D / 2 - footD / 2;
  const footZBack = -D / 2 + footD / 2;
  const footX = W / 2 - PANEL_T / 2;

  addMesh(footGeom, footMat, 'foot_front_left', -footX, footY, footZFront);
  addMesh(footGeom, footMat, 'foot_front_right', footX, footY, footZFront);
  addMesh(footGeom, footMat, 'foot_back_left', -footX, footY, footZBack);
  addMesh(footGeom, footMat, 'foot_back_right', footX, footY, footZBack);

  return group;
}
