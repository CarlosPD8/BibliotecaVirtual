"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { BookSlot } from "@/lib/layout";
import { seeded } from "@/lib/random";
import { createFillerMaterial } from "./bookMaterials";
import { createBookGeometry, createFillerAtlas, FILLER_VARIANTS } from "./bookTextures";

/** Every anonymous volume in the library, drawn in a single call. */
export function FillerBooks({
  slots,
  leatherNormal,
}: {
  slots: BookSlot[];
  leatherNormal: THREE.Texture;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    const g = createBookGeometry();
    const r = seeded("filler-variants");
    const variants = new Float32Array(slots.length);
    for (let i = 0; i < slots.length; i++) variants[i] = Math.floor(r() * FILLER_VARIANTS);
    g.setAttribute("aVariant", new THREE.InstancedBufferAttribute(variants, 1));
    return g;
  }, [slots]);

  const material = useMemo(() => {
    const atlas = createFillerAtlas();
    return createFillerMaterial(atlas, leatherNormal);
  }, [leatherNormal]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const r = seeded("filler-lean");
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    slots.forEach((slot, i) => {
      // A few volumes sit a touch proud of the row or slightly skewed.
      const proud = r() < 0.15 ? r() * 0.02 : 0;
      euler.set(0, (r() - 0.5) * 0.03, 0);
      rotation.setFromEuler(euler);
      position.set(slot.x, slot.y + slot.height / 2, slot.z + proud);
      scale.set(slot.thickness, slot.height, slot.depth);
      matrix.compose(position, rotation, scale);
      m.setMatrixAt(i, matrix);
      m.setColorAt(i, color.set(slot.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [slots]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, slots.length]}
      castShadow
      receiveShadow
      // Anonymous volumes are not interactive; skip them when raycasting.
      raycast={() => null}
    />
  );
}
