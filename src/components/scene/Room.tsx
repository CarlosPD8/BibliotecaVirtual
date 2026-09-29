"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CASE, type LibraryLayout } from "@/lib/layout";
import { seeded } from "@/lib/random";
import { GOLD_HEX } from "./bookTextures";
import { tiled, type LibraryTextures } from "./useLibraryTextures";

export const CEILING = 7.1;
const ROOM_DEPTH = 13;
const WALL_GREEN = "#17241d";

function createRugTexture() {
  const W = 1024;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const r = seeded("rug");

  ctx.fillStyle = "#5a1714";
  ctx.fillRect(0, 0, W, H);

  // Borders: navy guard, gold band, navy guard.
  const band = (inset: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(inset + width / 2, inset + width / 2, W - 2 * inset - width, H - 2 * inset - width);
  };
  band(0, 40, "#1c2238");
  band(40, 34, "#a9853c");
  band(74, 10, "#1c2238");

  // Repeating boteh along the gold band.
  ctx.fillStyle = "#5a1714";
  for (let x = 60; x < W - 40; x += 36) {
    ctx.beginPath();
    ctx.ellipse(x, 57, 7, 11, 0.5, 0, Math.PI * 2);
    ctx.ellipse(x, H - 57, 7, 11, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Field lattice.
  ctx.strokeStyle = "rgba(20,10,14,0.55)";
  ctx.lineWidth = 3;
  for (let x = 84; x < W - 84; x += 48) {
    for (let y = 84; y < H - 84; y += 48) {
      ctx.beginPath();
      ctx.moveTo(x + 24, y);
      ctx.lineTo(x + 48, y + 24);
      ctx.lineTo(x + 24, y + 48);
      ctx.lineTo(x, y + 24);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Central medallion.
  const cx = W / 2;
  const cy = H / 2;
  for (const [rx, ry, color] of [
    [230, 150, "#1c2238"],
    [200, 128, "#a9853c"],
    [176, 110, "#6e1f19"],
    [110, 70, "#1c2238"],
    [60, 38, "#a9853c"],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.quadraticCurveTo(cx - rx * 0.4, cy - ry, cx, cy - ry);
    ctx.quadraticCurveTo(cx + rx * 0.4, cy - ry, cx + rx, cy);
    ctx.quadraticCurveTo(cx + rx * 0.4, cy + ry, cx, cy + ry);
    ctx.quadraticCurveTo(cx - rx * 0.4, cy + ry, cx - rx, cy);
    ctx.fill();
  }

  // Wool texture and wear.
  const image = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (r() - 0.5) * 26;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Tall arched window at the end of the gallery, lit by the moon. */
function MoonWindow({ x, facing, woodMaterial }: { x: number; facing: 1 | -1; woodMaterial: THREE.Material }) {
  const glass = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: "#35507c", toneMapped: false, fog: false }),
    [],
  );
  useEffect(() => () => glass.dispose(), [glass]);
  const w = 1.6;
  const h = 3.2;
  const y0 = 1.2;
  return (
    <group position={[x, 0, 3.4]} rotation={[0, (facing * Math.PI) / 2, 0]}>
      <mesh position={[0, y0 + h / 2, 0.01]} material={glass}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, y0 + h, 0.01]} material={glass}>
        <circleGeometry args={[w / 2, 32, 0, Math.PI]} />
      </mesh>
      {/* Mullions and transoms. */}
      {[-w / 4, 0, w / 4].map((mx) => (
        <mesh key={mx} position={[mx, y0 + h / 2 + 0.3, 0.03]} material={woodMaterial}>
          <boxGeometry args={[0.04, h + 0.6, 0.04]} />
        </mesh>
      ))}
      {[0.8, 1.6, 2.4].map((ty) => (
        <mesh key={ty} position={[0, y0 + ty, 0.03]} material={woodMaterial}>
          <boxGeometry args={[w, 0.04, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, y0 - 0.08, 0.1]} material={woodMaterial}>
        <boxGeometry args={[w + 0.3, 0.12, 0.25]} />
      </mesh>
    </group>
  );
}

export function Room({ layout, textures }: { layout: LibraryLayout; textures: LibraryTextures }) {
  const W = layout.wallWidth + CASE.pilaster;
  const floorW = W + 0.2;

  const m = useMemo(() => {
    const floorRepeat: [number, number] = [floorW / 1.6, ROOM_DEPTH / 1.6];
    return {
      floor: new THREE.MeshStandardMaterial({
        map: tiled(textures.parquetMap, ...floorRepeat),
        normalMap: tiled(textures.parquetNormal, ...floorRepeat),
        roughnessMap: tiled(textures.parquetRough, ...floorRepeat),
        color: "#8c6a55",
        roughness: 0.7,
        envMapIntensity: 0.6,
      }),
      rug: new THREE.MeshStandardMaterial({ map: createRugTexture(), roughness: 1 }),
      wall: new THREE.MeshStandardMaterial({ color: WALL_GREEN, roughness: 0.95 }),
      wood: new THREE.MeshStandardMaterial({
        map: tiled(textures.mahoganyMap, 4, 1),
        normalMap: tiled(textures.mahoganyNormal, 4, 1),
        color: "#6e4636",
        roughness: 0.8,
      }),
      gold: new THREE.MeshStandardMaterial({ color: GOLD_HEX, metalness: 1, roughness: 0.35 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#1f1510", roughness: 0.9 }),
    };
  }, [textures, floorW]);

  useEffect(
    () => () => {
      for (const material of Object.values(m)) {
        material.map?.dispose();
        material.normalMap?.dispose();
        material.roughnessMap?.dispose();
        material.dispose();
      }
    },
    [m],
  );

  const beamsX = Math.ceil(floorW / 2.2);
  const beamsZ = Math.ceil(ROOM_DEPTH / 2.2);

  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, ROOM_DEPTH / 2]} material={m.floor} receiveShadow>
        <planeGeometry args={[floorW, ROOM_DEPTH]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 3.6]} material={m.rug} receiveShadow>
        <planeGeometry args={[6.4, 4]} />
      </mesh>

      {/* Wall above the cornice */}
      <mesh position={[0, (4.4 + CEILING) / 2, -0.01]} material={m.wall}>
        <planeGeometry args={[floorW, CEILING - 4.4]} />
      </mesh>

      {/* End walls */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh
            position={[side * (floorW / 2), CEILING / 2, ROOM_DEPTH / 2]}
            rotation={[0, (-side * Math.PI) / 2, 0]}
            material={m.wall}
            receiveShadow
          >
            <planeGeometry args={[ROOM_DEPTH, CEILING]} />
          </mesh>
          <mesh
            position={[side * (floorW / 2 - 0.05), 0.2, ROOM_DEPTH / 2]}
            material={m.wood}
          >
            <boxGeometry args={[0.1, 0.4, ROOM_DEPTH]} />
          </mesh>
          <MoonWindow x={side * (floorW / 2 - 0.01)} facing={side === -1 ? 1 : -1} woodMaterial={m.wood} />
        </group>
      ))}

      {/* Coffered ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, CEILING, ROOM_DEPTH / 2]} material={m.ceiling}>
        <planeGeometry args={[floorW, ROOM_DEPTH]} />
      </mesh>
      {Array.from({ length: beamsX + 1 }, (_, i) => (
        <mesh
          key={`bx-${i}`}
          position={[-floorW / 2 + (i * floorW) / beamsX, CEILING - 0.14, ROOM_DEPTH / 2]}
          material={m.wood}
        >
          <boxGeometry args={[0.22, 0.28, ROOM_DEPTH]} />
        </mesh>
      ))}
      {Array.from({ length: beamsZ + 1 }, (_, i) => (
        <group key={`bz-${i}`}>
          <mesh position={[0, CEILING - 0.14, (i * ROOM_DEPTH) / beamsZ]} material={m.wood}>
            <boxGeometry args={[floorW, 0.28, 0.22]} />
          </mesh>
          <mesh position={[0, CEILING - 0.285, (i * ROOM_DEPTH) / beamsZ]} material={m.gold}>
            <boxGeometry args={[floorW, 0.012, 0.24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
