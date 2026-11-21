function build(THREE) {
  const group = new THREE.Group();

  // Dimensions (meters)
  const TOTAL_H = 0.85;
  const CANOPY_R = 0.042;
  const CANOPY_H = 0.048;
  const RIBBON_W = 0.058;
  const RIBBON_T = 0.008;
  const EMIT_T = 0.004;
  const SEGMENTS = 8;
  const HELIX_H = TOTAL_H - CANOPY_H;

  // Materials
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.28,
    metalness: 0.88,
  });

  const brassDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8a6d36,
    roughness: 0.4,
    metalness: 0.85,
  });

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0ec,
    roughness: 0.55,
    metalness: 0.05,
  });

  const emitMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffdca8,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.0,
  });

  // Ceiling canopy at the very top (y = TOTAL_H)
  const canopyGeo = new THREE.CylinderGeometry(CANOPY_R, CANOPY_R, CANOPY_H, 24);
  const canopy = new THREE.Mesh(canopyGeo, brassMat);
  canopy.name = 'ceiling_canopy';
  canopy.position.set(0, TOTAL_H - CANOPY_H / 2, 0);
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(canopy);

  // Small side mounting screw on canopy
  const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 10);
  const screw = new THREE.Mesh(screwGeo, brassDarkMat);
  screw.name = 'canopy_screw';
  screw.rotation.z = Math.PI / 2;
  screw.position.set(-CANOPY_R, TOTAL_H - CANOPY_H * 0.35, 0);
  screw.castShadow = true;
  screw.receiveShadow = true;
  group.add(screw);

  // Inner hub under canopy where ribbons attach
  const hubGeo = new THREE.CylinderGeometry(CANOPY_R * 0.82, CANOPY_R * 0.72, 0.015, 20);
  const hub = new THREE.Mesh(hubGeo, brassDarkMat);
  hub.name = 'canopy_hub';
  hub.position.set(0, TOTAL_H - CANOPY_H - 0.005, 0);
  hub.castShadow = true;
  hub.receiveShadow = true;
  group.add(hub);

  // Helper to compute point on sculptural double-helix
  function getHelixPoint(t, phaseOffset) {
    // t = 0 at bottom, t = 1 at top
    const y = t * HELIX_H;
    // Radius bulges in the middle, tapers at top and bottom
    const r = 0.024 + 0.095 * Math.sin(Math.PI * Math.pow(t, 0.85));
    const angle = phaseOffset + (1 - t) * Math.PI * 2.15;
    return new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );
  }

  // Build 2 intertwined ribbons
  const phases = [0, Math.PI];

  for (let rIdx = 0; rIdx < 2; rIdx++) {
    const phase = phases[rIdx];
    const ribbonLabel = rIdx === 0 ? 'a' : 'b';

    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = i / SEGMENTS;
      const t1 = (i + 1) / SEGMENTS;
      const tMid = (t0 + t1) * 0.5;

      const p0 = getHelixPoint(t0, phase);
      const p1 = getHelixPoint(t1, phase);
      const pMid = p0.clone().add(p1).multiplyScalar(0.5);

      const dir = p1.clone().sub(p0);
      const segLen = dir.length() * 1.12; // slight overlap to avoid gaps
      dir.normalize();

      // Radial outward vector at midpoint
      const radial = new THREE.Vector3(pMid.x, 0, pMid.z).normalize();
      if (radial.lengthSq() < 0.0001) {
        radial.set(1, 0, 0);
      }

      // Orthonormal basis: Y along tangent, Z along radial outward, X along binormal
      const zAxis = radial.clone();
      const xAxis = new THREE.Vector3().crossVectors(dir, zAxis).normalize();
      zAxis.crossVectors(xAxis, dir).normalize();

      const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, dir, zAxis);
      const quat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

      // Outer white matte ribbon segment
      const outerGeo = new THREE.BoxGeometry(RIBBON_W, segLen, RIBBON_T);
      const outerMesh = new THREE.Mesh(outerGeo, ribbonMat);
      outerMesh.name = `ribbon_${ribbonLabel}_outer_${i + 1}`;
      outerMesh.position.copy(pMid);
      outerMesh.quaternion.copy(quat);
      outerMesh.castShadow = true;
      outerMesh.receiveShadow = true;
      group.add(outerMesh);

      // Inner warm-glowing LED diffuser segment
      const emitGeo = new THREE.BoxGeometry(RIBBON_W * 0.88, segLen * 0.98, EMIT_T);
      const emitMesh = new THREE.Mesh(emitGeo, emitMat);
      emitMesh.name = `emit_ribbon_${ribbonLabel}_${i + 1}`;
      const inwardOffset = zAxis.clone().multiplyScalar(-(RIBBON_T * 0.5 + EMIT_T * 0.35));
      emitMesh.position.copy(pMid).add(inwardOffset);
      emitMesh.quaternion.copy(quat);
      emitMesh.castShadow = true;
      emitMesh.receiveShadow = true;
      group.add(emitMesh);
    }
  }

  return group;
}
