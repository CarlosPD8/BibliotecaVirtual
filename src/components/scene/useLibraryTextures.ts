"use client";

import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

const FILES = {
  mahoganyMap: "/textures/mahogany_color.jpg",
  mahoganyNormal: "/textures/mahogany_normal.jpg",
  mahoganyRough: "/textures/mahogany_rough.jpg",
  parquetMap: "/textures/parquet_color.jpg",
  parquetNormal: "/textures/parquet_normal.jpg",
  parquetRough: "/textures/parquet_rough.jpg",
  leatherNormal: "/textures/leather_normal.jpg",
  leatherRough: "/textures/leather_rough.jpg",
};

export type LibraryTextures = Record<keyof typeof FILES, THREE.Texture>;

export function useLibraryTextures(): LibraryTextures {
  const textures = useTexture(FILES) as LibraryTextures;
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  useLayoutEffect(() => {
    for (const [key, texture] of Object.entries(textures)) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(8, maxAnisotropy);
      texture.colorSpace = key.endsWith("Map") ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.needsUpdate = true;
    }
  }, [textures, maxAnisotropy]);

  return textures;
}

/** Clone of a texture set with its own repeat, so one image can tile differently per surface. */
export function tiled(texture: THREE.Texture, repeatX: number, repeatY: number, rotation = 0) {
  const clone = texture.clone();
  clone.wrapS = clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeatX, repeatY);
  clone.rotation = rotation;
  clone.center.set(0.5, 0.5);
  clone.needsUpdate = true;
  return clone;
}
