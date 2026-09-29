"use client";

import type { ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { proxiedCover } from "@/lib/covers";
import type { PlacedBook } from "@/lib/layout";
import { createRealBookMaterial } from "./bookMaterials";
import { createCoverCanvas, createSpineTexture } from "./bookTextures";
import { useScene } from "./SceneContext";

const CLICK_TOLERANCE_PX = 6;
const HOVER_PULL = 0.018;

/**
 * One of the owner's books. The outer group is the book's resting pose; the
 * pivot sits on the bottom front edge so the book tilts out the way it does
 * when a finger hooks the head of the spine.
 */
export const RealBook = memo(function RealBook({
  placed,
  geometry,
  leatherNormal,
}: {
  placed: PlacedBook;
  geometry: THREE.BufferGeometry;
  leatherNormal: THREE.Texture;
}) {
  const { registry, fonts, selectedId, locked, onSelect, onHover } = useScene();
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const { book, thickness: t, height: h, depth: d, color } = placed;
  const selected = selectedId === book.id;

  const material = useMemo(() => {
    const spine = createSpineTexture(book, color, fonts);
    return createRealBookMaterial(spine, leatherNormal);
  }, [book, color, fonts, leatherNormal]);

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  useEffect(() => {
    if (!root.current || !pivot.current) return;
    registry.set(book.id, { root: root.current, pivot: pivot.current, placed });
    return () => {
      registry.delete(book.id);
    };
  }, [registry, book.id, placed]);

  const hoverTo = (z: number) => {
    if (!root.current) return;
    gsap.to(root.current.position, { z, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  };

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (locked) return;
    onHover(book.id);
    document.body.style.cursor = "pointer";
    if (!locked) hoverTo(placed.z + HOVER_PULL);
  };

  const onPointerOut = () => {
    onHover(null);
    document.body.style.cursor = "";
    if (!locked) hoverTo(placed.z);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_TOLERANCE_PX) return; // it was a drag along the gallery
    if (locked && selectedId === book.id) return;
    onSelect(book.id);
  };

  return (
    <group ref={root} position={[placed.x, placed.y, placed.z]}>
      <group ref={pivot} position={[0, 0, d / 2]}>
        <mesh
          geometry={geometry}
          material={material}
          position={[0, h / 2, -d / 2]}
          scale={[t, h, d]}
          castShadow
          receiveShadow
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        />
        {selected && <FrontCover placed={placed} />}
      </group>
    </group>
  );
});

/** High resolution front cover, only mounted for the book in hand. */
function FrontCover({ placed }: { placed: PlacedBook }) {
  const { fonts } = useScene();
  const { book, thickness: t, height: h, depth: d, color } = placed;

  const tooled = useMemo(() => {
    const texture = new THREE.CanvasTexture(createCoverCanvas(book, color, fonts));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [book, color, fonts]);

  const [photo, setPhoto] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const src = proxiedCover(book.cover_url);
    if (!src) return;
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(
      src,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        loaded = texture;
        if (cancelled) texture.dispose();
        else setPhoto(texture);
      },
      undefined,
      () => {
        // Keep the tooled leather cover when Open Library fails.
      },
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [book.cover_url]);

  useEffect(() => () => tooled.dispose(), [tooled]);

  return (
    <mesh position={[t / 2 + 0.0012, h / 2, -d / 2]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[d * 0.97, h * 0.97]} />
      <meshStandardMaterial map={photo ?? tooled} roughness={photo ? 0.55 : 0.6} />
    </mesh>
  );
}
