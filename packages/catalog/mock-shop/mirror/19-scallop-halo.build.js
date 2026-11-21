function build(THREE) {
  const group = new THREE.Group();

  const DIAM = 0.30;
  const RADIUS = DIAM / 2;
  const CENTER_Y = RADIUS;

  const BACKING_R = 0.115;
  const BACKING_THICK = 0.008;
  const MIRROR_R = 0.065;
  const MIRROR_THICK = 0.003;

  const NUM_SPOKES = 12;
  const SHELL_OUTER_R = 0.055;
  const SHELL_MID_R = 0.045;
  const SHELL_INNER_R = 0.036;

  const DIST_OUTER = 0.095;
  const DIST_MID = 0.072;
  const DIST_INNER = 0.052;

  const TOTAL_DEPTH = 0.032;
  const BACK_Z = -TOTAL_DEPTH / 2;

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe4e8,
    metalness: 1,
    roughness: 0.05,
  });

  const backingMat = new THREE.MeshStandardMaterial({
    color: 0xd8ccb8,
    roughness: 0.85,
    metalness: 0.0,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x9c8970,
    roughness: 0.9,
    metalness: 0.0,
  });

  const shellMats = [
    new THREE.MeshStandardMaterial({
      color: 0xf3ead8,
      roughness: 0.55,
      metalness: 0.05,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xe8dcc4,
      roughness: 0.6,
      metalness: 0.05,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xf7f1e3,
      roughness: 0.5,
      metalness: 0.05,
    }),
  ];

  // Backing board
  const backingGeo = new THREE.CylinderGeometry(
    BACKING_R,
    BACKING_R,
    BACKING_THICK,
    32
  );
  const backing = new THREE.Mesh(backingGeo, backingMat);
  backing.name = 'mirror_backing';
  backing.rotation.x = Math.PI / 2;
  backing.position.set(0, CENTER_Y, BACK_Z + BACKING_THICK / 2);
  backing.castShadow = true;
  backing.receiveShadow = true;
  group.add(backing);

  // Mirror glass
  const mirrorGeo = new THREE.CylinderGeometry(
    MIRROR_R,
    MIRROR_R,
    MIRROR_THICK,
    32
  );
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.name = 'mirror_glass';
  mirror.rotation.x = Math.PI / 2;
  mirror.position.set(0, CENTER_Y, BACK_Z + BACKING_THICK + MIRROR_THICK / 2);
  mirror.castShadow = true;
  mirror.receiveShadow = true;
  group.add(mirror);

  // Hanging rope loop on the back
  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, CENTER_Y + BACKING_R - 0.01, BACK_Z + 0.003),
    new THREE.Vector3(-0.008, CENTER_Y + RADIUS - 0.012, BACK_Z + 0.003),
    new THREE.Vector3(0, CENTER_Y + RADIUS - 0.005, BACK_Z + 0.003),
    new THREE.Vector3(0.008, CENTER_Y + RADIUS - 0.012, BACK_Z + 0.003),
    new THREE.Vector3(0.015, CENTER_Y + BACKING_R - 0.01, BACK_Z + 0.003),
  ]);
  const ropeGeo = new THREE.TubeGeometry(ropeCurve, 16, 0.0025, 8, false);
  const rope = new THREE.Mesh(ropeGeo, ropeMat);
  rope.name = 'hanging_rope';
  rope.castShadow = true;
  rope.receiveShadow = true;
  group.add(rope);

  // Helper to create a scalloped shell geometry
  function createShellGeometry(radius) {
    const shape = new THREE.Shape();
    const halfAngle = Math.PI * 0.34;
    const steps = 24;
    const numRibs = 9;

    shape.moveTo(0, 0);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = -halfAngle + t * 2 * halfAngle;
      const wave = 1 + 0.035 * Math.sin(t * numRibs * Math.PI);
      const r = radius * wave;
      const x = r * Math.sin(a);
      const y = r * Math.cos(a);
      shape.lineTo(x, y);
    }
    shape.lineTo(0, 0);

    const extrudeSettings = {
      depth: 0.0035,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.002,
      bevelSegments: 2,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  const outerShellGeo = createShellGeometry(SHELL_OUTER_R);
  const midShellGeo = createShellGeometry(SHELL_MID_R);
  const innerShellGeo = createShellGeometry(SHELL_INNER_R);

  const rings = [
    { name: 'outer', geo: outerShellGeo, dist: DIST_OUTER, zOffset: 0.008, tilt: -0.06 },
    { name: 'middle', geo: midShellGeo, dist: DIST_MID, zOffset: 0.015, tilt: -0.08 },
    { name: 'inner', geo: innerShellGeo, dist: DIST_INNER, zOffset: 0.022, tilt: -0.1 },
  ];

  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    const ring = rings[rIdx];
    for (let i = 0; i < NUM_SPOKES; i++) {
      const angle = (i / NUM_SPOKES) * Math.PI * 2;
      const mat = shellMats[(i + rIdx) % shellMats.length];
      const shell = new THREE.Mesh(ring.geo, mat);
      shell.name = `shell_${ring.name}_${i + 1}`;

      // Position hinge at radial distance
      const sx = Math.sin(angle) * ring.dist;
      const sy = CENTER_Y + Math.cos(angle) * ring.dist;
      shell.position.set(sx, sy, BACK_Z + ring.zOffset);

      // Rotate so shell fans outward along the radial direction
      shell.rotation.z = -angle;
      shell.rotation.x = ring.tilt;

      shell.castShadow = true;
      shell.receiveShadow = true;
      group.add(shell);
    }
  }

  return group;
}
