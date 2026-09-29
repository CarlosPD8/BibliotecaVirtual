"use client";

import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { CASE, caseStride, type LibraryLayout } from "@/lib/layout";
import { seeded } from "@/lib/random";
import { GOLD_HEX } from "./bookTextures";
import { CEILING } from "./Room";

const CANDLE = "#ffb566";
const FLAME_COLOR: [number, number, number] = [7, 4.6, 2.2]; // HDR, so only flames bloom
const SCONCE_Y = 3.1;
const SCONCE_INTENSITY = 4.2;
const CHANDELIER_Y = 5.15;
const CHANDELIER_Z = 3.3;
const CHANDELIER_INTENSITY = 16;
const ARMS = 8;

/** Anything that flickers: a flame mesh, a light, or both. */
type Flicker = { seed: number; flame?: THREE.Object3D; light?: THREE.PointLight; base?: number };
type Register = (f: Flicker) => () => void;

/** Owns every flickering object and animates them from one frame callback. */
function createFlickerBank() {
  const items = new Set<Flicker>();
  const noise = seeded("flicker");
  return {
    register: ((f) => {
      items.add(f);
      return () => items.delete(f);
    }) as Register,
    tick(t: number) {
      for (const f of items) {
        // Two slow waves plus a little jitter: calm candles, not a strobe.
        const wave = Math.sin(t * 7.1 + f.seed) * 0.05 + Math.sin(t * 2.3 + f.seed * 1.7) * 0.07;
        const jitter = (noise() - 0.5) * 0.04;
        if (f.light && f.base) f.light.intensity = f.base * (1 + wave + jitter);
        if (f.flame) f.flame.scale.set(1 - wave * 0.6, 1.9 + wave * 3, 1 - wave * 0.6);
      }
    },
  };
}

function useBrass() {
  const materials = useMemo(
    () => ({
      gold: new THREE.MeshStandardMaterial({ color: GOLD_HEX, metalness: 1, roughness: 0.28 }),
      wax: new THREE.MeshStandardMaterial({
        color: "#efe3c8",
        roughness: 0.6,
        emissive: "#ffcf8a",
        emissiveIntensity: 0.15,
      }),
      flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(...FLAME_COLOR), toneMapped: false }),
    }),
    [],
  );
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  return materials;
}

function Flame({ seed, register, material, size }: {
  seed: number;
  register: Register;
  material: THREE.Material;
  size: number;
}) {
  return (
    <mesh ref={(m) => (m ? register({ seed, flame: m }) : undefined)} material={material}>
      <sphereGeometry args={[size, 10, 10]} />
    </mesh>
  );
}

/** Brass sconce with a candle on the face of a pilaster. */
function Sconce({ x, lit, register }: { x: number; lit: boolean; register: Register }) {
  const m = useBrass();
  return (
    <group position={[x, SCONCE_Y, CASE.depth + 0.09]}>
      <mesh material={m.gold}>
        <boxGeometry args={[0.1, 0.24, 0.02]} />
      </mesh>
      <mesh material={m.gold} position={[0, -0.02, 0.13]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0, 0.27]}>
        <cylinderGeometry args={[0.055, 0.035, 0.03, 16]} />
      </mesh>
      <mesh material={m.wax} position={[0, 0.1, 0.27]}>
        <cylinderGeometry args={[0.018, 0.02, 0.17, 12]} />
      </mesh>
      <group position={[0, 0.215, 0.27]}>
        <Flame seed={x * 7.31} register={register} material={m.flame} size={0.014} />
      </group>
      {lit && (
        <pointLight
          ref={(l) => (l ? register({ seed: x * 7.31, light: l, base: SCONCE_INTENSITY }) : undefined)}
          position={[0, 0.26, 0.3]}
          color={CANDLE}
          intensity={SCONCE_INTENSITY}
          distance={6}
          decay={1.6}
        />
      )}
    </group>
  );
}

/** Brass chandelier: a ring of candles and one light standing in for all of them. */
function Chandelier({ x, register }: { x: number; register: Register }) {
  const m = useBrass();
  const chain = CEILING - CHANDELIER_Y - 0.3;
  const ring = 0.55;

  return (
    <group position={[x, CHANDELIER_Y, CHANDELIER_Z]}>
      <mesh material={m.gold} position={[0, 0.3 + chain / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, chain, 6]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.3, 12]} />
      </mesh>
      <mesh material={m.gold} position={[0, -0.05, 0]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.13, 20, 14]} />
      </mesh>
      <mesh material={m.gold} position={[0, -0.2, 0]} rotation-x={Math.PI}>
        <coneGeometry args={[0.05, 0.14, 12]} />
      </mesh>
      <mesh material={m.gold} rotation-x={Math.PI / 2}>
        <torusGeometry args={[ring, 0.014, 8, 48]} />
      </mesh>
      {Array.from({ length: ARMS }, (_, i) => {
        const a = (i / ARMS) * Math.PI * 2;
        const cx = Math.cos(a) * ring;
        const cz = Math.sin(a) * ring;
        return (
          <group key={i} position={[cx, 0, cz]}>
            <mesh material={m.gold} position={[-cx / 2, -0.04, -cz / 2]} rotation={[0, -a, Math.PI / 2 - 0.15]}>
              <cylinderGeometry args={[0.008, 0.008, ring, 6]} />
            </mesh>
            <mesh material={m.gold} position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.04, 0.025, 0.025, 12]} />
            </mesh>
            <mesh material={m.wax} position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.015, 0.017, 0.14, 10]} />
            </mesh>
            <group position={[0, 0.19, 0]}>
              <Flame seed={x * 3.1 + i * 1.7} register={register} material={m.flame} size={0.012} />
            </group>
          </group>
        );
      })}
      <pointLight
        ref={(l) => (l ? register({ seed: x, light: l, base: CHANDELIER_INTENSITY }) : undefined)}
        position={[0, 0.15, 0]}
        color={CANDLE}
        intensity={CHANDELIER_INTENSITY}
        distance={14}
        decay={1.5}
      />
    </group>
  );
}

export function Lighting({
  layout,
  shadows,
  candleLights,
}: {
  layout: LibraryLayout;
  shadows: boolean;
  /** Real point lights in the sconces; off on weaker GPUs, where only the chandeliers light the room. */
  candleLights: boolean;
}) {
  const [bank] = useState(createFlickerBank);
  const register = bank.register;
  const stride = caseStride();
  const pilasters = useMemo(
    () => Array.from({ length: layout.cases + 1 }, (_, k) => -layout.wallWidth / 2 + k * stride),
    [layout.cases, layout.wallWidth, stride],
  );
  const middle = Math.floor(layout.cases / 2);
  const chandeliers = layout.caseCentres.filter((_, i) => (i - middle) % 2 === 0);
  useFrame(({ clock }) => bank.tick(clock.getElapsedTime()));

  const shadowSpan = Math.min(layout.wallWidth, 14);

  return (
    <>
      <ambientLight color="#ffd7a8" intensity={0.16} />
      <hemisphereLight args={["#ffd6a0", "#1b120c", 0.3]} />

      {/* Warm key light from high behind the viewer; casts the shelf shadows. */}
      <directionalLight
        position={[-3, 8, 9]}
        intensity={1.05}
        color="#ffd2a2"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadowSpan / 2}
        shadow-camera-right={shadowSpan / 2}
        shadow-camera-top={7}
        shadow-camera-bottom={-1}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />

      {/* Moonlight through the end windows. */}
      <directionalLight position={[-12, 5, 4]} intensity={0.3} color="#8fa6d4" />
      <directionalLight position={[12, 5, 4]} intensity={0.2} color="#8fa6d4" />

      {pilasters.map((x, k) => (
        <Sconce key={k} x={x} lit={candleLights && k % 2 === 1} register={register} />
      ))}
      {chandeliers.map((x) => (
        <Chandelier key={x} x={x} register={register} />
      ))}

      {/* Dust in the candlelight. */}
      <Sparkles
        count={160}
        scale={[layout.wallWidth, 4.5, 3.2]}
        position={[0, 2.8, 1.9]}
        size={1.6}
        speed={0.18}
        opacity={0.35}
        color="#ffe2b0"
        noise={0.6}
      />

      {/* Soft warm reflections for the gilt and polished wood. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={1.6} color="#ffcc90" position={[0, 5, 6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ff9e57" position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#7f95c2" position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffd7a0" position={[0, CEILING - 0.5, 3]} rotation-x={Math.PI / 2} scale={1.2} />
      </Environment>
    </>
  );
}
