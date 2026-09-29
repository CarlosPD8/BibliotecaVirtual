"use client";

import { Text } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CARCASS_TOP, CASE, caseStride, FRIEZE_H, shelfY, type LibraryLayout } from "@/lib/layout";
import { GOLD_HEX } from "./bookTextures";
import { tiled, type LibraryTextures } from "./useLibraryTextures";

const TOP_BOARD = CASE.shelves; // board index above the highest shelf

export function useWoodMaterials(textures: LibraryTextures) {
  const materials = useMemo(() => {
    const along = (repeat: [number, number], rotation = 0) => ({
      map: tiled(textures.mahoganyMap, ...repeat, rotation),
      normalMap: tiled(textures.mahoganyNormal, ...repeat, rotation),
      roughnessMap: tiled(textures.mahoganyRough, ...repeat, rotation),
    });
    return {
      shelf: new THREE.MeshStandardMaterial({
        ...along([1, 0.25]),
        color: "#9a6a55",
        roughness: 0.85,
        normalScale: new THREE.Vector2(0.4, 0.4),
      }),
      upright: new THREE.MeshStandardMaterial({
        ...along([0.5, 2], Math.PI / 2),
        color: "#94644f",
        roughness: 0.8,
        normalScale: new THREE.Vector2(0.4, 0.4),
      }),
      back: new THREE.MeshStandardMaterial({
        ...along([1, 1.5], Math.PI / 2),
        color: "#3c2319",
        roughness: 0.9,
      }),
      panel: new THREE.MeshStandardMaterial({
        ...along([0.3, 2], Math.PI / 2),
        color: "#5d3a2c",
        roughness: 0.75,
      }),
      frieze: new THREE.MeshStandardMaterial({
        ...along([6, 0.5]),
        color: "#8a5c49",
        roughness: 0.8,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD_HEX,
        metalness: 1,
        roughness: 0.32,
      }),
      plaque: new THREE.MeshStandardMaterial({ color: "#16100c", roughness: 0.55 }),
    };
  }, [textures]);

  useEffect(
    () => () => {
      for (const material of Object.values(materials)) {
        material.map?.dispose();
        material.normalMap?.dispose();
        material.roughnessMap?.dispose();
        material.dispose();
      }
    },
    [materials],
  );

  return materials;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

export function Block({
  material,
  position,
  size,
  shadows = true,
}: {
  material: THREE.Material;
  position: [number, number, number];
  size: [number, number, number];
  shadows?: boolean;
}) {
  return (
    <mesh
      geometry={unitBox}
      material={material}
      position={position}
      scale={size}
      castShadow={shadows}
      receiveShadow
    />
  );
}

export function Bookcases({ layout, textures }: { layout: LibraryLayout; textures: LibraryTextures }) {
  const m = useWoodMaterials(textures);
  const stride = caseStride();
  const W = layout.wallWidth;
  const D = CASE.depth;
  const pilasterDepth = D + 0.08;
  const pilasters = Array.from({ length: layout.cases + 1 }, (_, k) => -W / 2 + k * stride);
  const run = W + CASE.pilaster;

  return (
    <group>
      {layout.caseCentres.map((cx, c) => (
        <group key={c}>
          <Block
            material={m.back}
            position={[cx, (CASE.plinth + CARCASS_TOP) / 2, 0.015]}
            size={[CASE.innerWidth, CARCASS_TOP - CASE.plinth, 0.03]}
            shadows={false}
          />
          {Array.from({ length: TOP_BOARD + 1 }, (_, s) => (
            <group key={s}>
              <Block
                material={m.shelf}
                position={[cx, shelfY(s), D / 2]}
                size={[CASE.innerWidth, CASE.board, D]}
              />
              {/* Gilt nosing on the shelf edge. */}
              <Block
                material={m.gold}
                position={[cx, shelfY(s) - CASE.board / 2 + 0.006, D + 0.002]}
                size={[CASE.innerWidth, 0.008, 0.004]}
                shadows={false}
              />
            </group>
          ))}
        </group>
      ))}

      {pilasters.map((x, k) => (
        <group key={k}>
          <Block
            material={m.upright}
            position={[x, CASE.plinth + (CARCASS_TOP - CASE.plinth) / 2, pilasterDepth / 2]}
            size={[CASE.pilaster, CARCASS_TOP - CASE.plinth, pilasterDepth]}
          />
          {/* Recessed panel with gilt beading. */}
          <Block
            material={m.panel}
            position={[x, CASE.plinth + (CARCASS_TOP - CASE.plinth) / 2, pilasterDepth + 0.004]}
            size={[CASE.pilaster * 0.58, (CARCASS_TOP - CASE.plinth) * 0.82, 0.01]}
            shadows={false}
          />
          <Block
            material={m.gold}
            position={[x, CASE.plinth + (CARCASS_TOP - CASE.plinth) / 2, pilasterDepth + 0.002]}
            size={[CASE.pilaster * 0.66, (CARCASS_TOP - CASE.plinth) * 0.86, 0.004]}
            shadows={false}
          />
          {/* Capital and base. */}
          <Block
            material={m.gold}
            position={[x, CARCASS_TOP - 0.06, pilasterDepth / 2 + 0.02]}
            size={[CASE.pilaster + 0.06, 0.1, pilasterDepth + 0.06]}
          />
          <Block
            material={m.upright}
            position={[x, CARCASS_TOP - 0.16, pilasterDepth / 2 + 0.015]}
            size={[CASE.pilaster + 0.03, 0.1, pilasterDepth + 0.03]}
          />
          <Block
            material={m.gold}
            position={[x, CASE.plinth + 0.03, pilasterDepth / 2 + 0.015]}
            size={[CASE.pilaster + 0.04, 0.05, pilasterDepth + 0.04]}
          />
        </group>
      ))}

      {/* Plinth running the whole wall. */}
      <Block
        material={m.frieze}
        position={[0, CASE.plinth / 2, (D + 0.12) / 2]}
        size={[run + 0.06, CASE.plinth, D + 0.12]}
      />
      <Block
        material={m.gold}
        position={[0, CASE.plinth - 0.01, D + 0.121]}
        size={[run + 0.06, 0.012, 0.004]}
        shadows={false}
      />

      {/* Frieze and cornice. */}
      <Block
        material={m.frieze}
        position={[0, CARCASS_TOP + FRIEZE_H / 2, (D + 0.1) / 2]}
        size={[run + 0.02, FRIEZE_H, D + 0.1]}
      />
      <Block
        material={m.gold}
        position={[0, CARCASS_TOP + 0.02, D + 0.102]}
        size={[run + 0.02, 0.016, 0.006]}
        shadows={false}
      />
      <Block
        material={m.gold}
        position={[0, CARCASS_TOP + FRIEZE_H + 0.02, (D + 0.22) / 2]}
        size={[run + 0.2, 0.04, D + 0.22]}
      />
      <Block
        material={m.frieze}
        position={[0, CARCASS_TOP + FRIEZE_H + 0.11, (D + 0.34) / 2]}
        size={[run + 0.34, 0.14, D + 0.34]}
      />
      <Block
        material={m.upright}
        position={[0, CARCASS_TOP + FRIEZE_H + 0.195, (D + 0.44) / 2]}
        size={[run + 0.46, 0.05, D + 0.44]}
      />

      {/* Bronze plaques naming the surnames shelved in each case. */}
      {layout.caseCentres.map((cx, c) => {
        const label = layout.plaques[c];
        const y = CARCASS_TOP + FRIEZE_H / 2 + 0.01;
        const z = D + 0.1 + 0.003;
        return (
          <group key={`plaque-${c}`} position={[cx, y, z]}>
            <mesh geometry={unitBox} material={m.plaque} scale={[1.3, 0.2, 0.008]} />
            <mesh geometry={unitBox} material={m.gold} scale={[1.34, 0.24, 0.004]} position={[0, 0, -0.003]} />
            {label && (
              <Text
                font="/fonts/Cinzel.ttf"
                fontSize={0.075}
                letterSpacing={0.06}
                maxWidth={1.2}
                anchorX="center"
                anchorY="middle"
                position={[0, 0, 0.006]}
              >
                {label.toUpperCase()}
                <meshStandardMaterial color={GOLD_HEX} metalness={0.9} roughness={0.35} emissive={GOLD_HEX} emissiveIntensity={0.35} />
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}
