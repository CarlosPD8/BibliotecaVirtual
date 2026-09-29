"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CASE, caseStride, CORNICE_TOP, UPPER, upperShelfY, type LibraryLayout } from "@/lib/layout";
import { Block, useWoodMaterials } from "./Bookcases";
import type { LibraryTextures } from "./useLibraryTextures";

const RAIL_Z = UPPER.balconyDepth - 0.05;
const RAIL_H = 0.9;
const BALUSTER_STEP = 0.16;

/** Turned baluster profile: base, vase belly, neck, cap. */
function createBalusterGeometry() {
  const profile = [
    [0.0, 0],
    [0.036, 0],
    [0.036, 0.06],
    [0.024, 0.1],
    [0.044, 0.26],
    [0.05, 0.34],
    [0.034, 0.44],
    [0.02, 0.52],
    [0.028, 0.6],
    [0.02, 0.68],
    [0.034, 0.74],
    [0.034, 0.78],
    [0.0, 0.78],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(profile, 12);
}

function Balusters({ from, to, posts, material }: {
  from: number;
  to: number;
  posts: number[];
  material: THREE.Material;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createBalusterGeometry(), []);
  const xs = useMemo(() => {
    const out: number[] = [];
    for (let x = from; x <= to; x += BALUSTER_STEP) {
      if (posts.every((p) => Math.abs(p - x) > 0.12)) out.push(x);
    }
    return out;
  }, [from, to, posts]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const matrix = new THREE.Matrix4();
    xs.forEach((x, i) => {
      matrix.makeTranslation(x, UPPER.floor + 0.07, RAIL_Z);
      m.setMatrixAt(i, matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [xs]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <instancedMesh ref={mesh} args={[geometry, material, xs.length]} castShadow receiveShadow />;
}

/**
 * Upper gallery: a balcony running above the cornice with a turned
 * balustrade and a second tier of shallower bookcases.
 */
export function Gallery({ layout, textures }: { layout: LibraryLayout; textures: LibraryTextures }) {
  const m = useWoodMaterials(textures);
  const stride = caseStride();
  const W = layout.wallWidth;
  const run = W + CASE.pilaster;
  const posts = useMemo(
    () => Array.from({ length: layout.cases + 1 }, (_, k) => -W / 2 + k * stride),
    [layout.cases, W, stride],
  );
  const top = upperShelfY(UPPER.shelves) + CASE.board / 2;

  return (
    <group>
      {/* Balcony floor, its moulded edge and gilt soffit. */}
      <Block
        material={m.frieze}
        position={[0, (CORNICE_TOP + UPPER.floor) / 2, UPPER.balconyDepth / 2]}
        size={[run + 0.46, UPPER.floor - CORNICE_TOP, UPPER.balconyDepth]}
      />
      <Block
        material={m.gold}
        position={[0, CORNICE_TOP - 0.004, UPPER.balconyDepth - 0.03]}
        size={[run + 0.46, 0.012, 0.05]}
        shadows={false}
      />

      {/* Upper cases. */}
      {layout.caseCentres.map((cx, c) => (
        <group key={c}>
          <Block
            material={m.back}
            position={[cx, (UPPER.floor + top) / 2, 0.015]}
            size={[CASE.innerWidth, top - UPPER.floor, 0.03]}
            shadows={false}
          />
          {Array.from({ length: UPPER.shelves + 1 }, (_, s) => (
            <Block
              key={s}
              material={m.shelf}
              position={[cx, upperShelfY(s), UPPER.depth / 2]}
              size={[CASE.innerWidth, CASE.board, UPPER.depth]}
            />
          ))}
        </group>
      ))}
      {posts.map((x, k) => (
        <group key={k}>
          <Block
            material={m.upright}
            position={[x, (UPPER.floor + top) / 2, (UPPER.depth + 0.04) / 2]}
            size={[CASE.pilaster, top - UPPER.floor, UPPER.depth + 0.04]}
          />
          {/* Balustrade newel post. */}
          <Block
            material={m.upright}
            position={[x, UPPER.floor + RAIL_H / 2, RAIL_Z]}
            size={[0.13, RAIL_H + 0.04, 0.13]}
          />
          <Block
            material={m.gold}
            position={[x, UPPER.floor + RAIL_H + 0.035, RAIL_Z]}
            size={[0.15, 0.03, 0.15]}
            shadows={false}
          />
        </group>
      ))}
      {/* Crown of the upper cases. */}
      <Block
        material={m.frieze}
        position={[0, top + 0.09, (UPPER.depth + 0.14) / 2]}
        size={[run + 0.1, 0.18, UPPER.depth + 0.14]}
      />
      <Block
        material={m.gold}
        position={[0, top + 0.005, UPPER.depth + 0.071]}
        size={[run + 0.1, 0.012, 0.004]}
        shadows={false}
      />

      {/* Rails and balusters. */}
      <Block
        material={m.upright}
        position={[0, UPPER.floor + RAIL_H, RAIL_Z]}
        size={[run + 0.3, 0.06, 0.11]}
      />
      <Block
        material={m.upright}
        position={[0, UPPER.floor + 0.045, RAIL_Z]}
        size={[run + 0.3, 0.05, 0.09]}
      />
      <Balusters from={-run / 2} to={run / 2} posts={posts} material={m.upright} />
    </group>
  );
}
