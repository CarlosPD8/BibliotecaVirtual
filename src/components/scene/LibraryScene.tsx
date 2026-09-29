"use client";

import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { LibraryLayout } from "@/lib/layout";
import { BookDirector } from "./BookDirector";
import { Bookcases } from "./Bookcases";
import { createBookGeometry, type SceneFonts } from "./bookTextures";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { FillerBooks } from "./FillerBooks";
import { Gallery } from "./Gallery";
import { Lighting } from "./Lighting";
import { initialQuality, lowerQuality, QUALITY_SETTINGS, type Quality } from "./quality";
import { RealBook } from "./RealBook";
import { Room } from "./Room";
import { SceneContext, type BookHandle, type SceneContextValue } from "./SceneContext";
import { useLibraryTextures } from "./useLibraryTextures";

export type LibrarySceneProps = {
  layout: LibraryLayout;
  selectedId: string | null;
  /** True while a book is travelling or in hand: the visitor cannot walk. */
  locked: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onPresented: (id: string) => void;
  onReturned: () => void;
  onReady: () => void;
};

const BACKGROUND = "#0c0806";

/** Resolves the next/font families so canvas-drawn spines use the same type as the page. */
function useSceneFonts(): SceneFonts | null {
  const [fonts, setFonts] = useState<SceneFonts | null>(null);
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const display = style.getPropertyValue("--font-display").trim() || "serif";
    const body = style.getPropertyValue("--font-body").trim() || "serif";
    let cancelled = false;
    Promise.all([
      document.fonts.load(`700 32px ${display}`),
      document.fonts.load(`italic 600 24px ${body}`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setFonts({ display, body });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return fonts;
}

function Contents({
  layout,
  quality,
  reducedMotion,
  onPresented,
  onReturned,
}: Pick<LibrarySceneProps, "layout" | "reducedMotion" | "onPresented" | "onReturned"> & {
  quality: Quality;
}) {
  const textures = useLibraryTextures();
  const bookGeometry = useMemo(() => createBookGeometry(), []);
  useEffect(() => () => bookGeometry.dispose(), [bookGeometry]);

  return (
    <>
      <Room layout={layout} textures={textures} />
      <Bookcases layout={layout} textures={textures} />
      <Gallery layout={layout} textures={textures} />
      <FillerBooks slots={layout.fillers} leatherNormal={textures.leatherNormal} />
      {layout.books.map((placed) => (
        <RealBook
          key={placed.book.id}
          placed={placed}
          geometry={bookGeometry}
          leatherNormal={textures.leatherNormal}
        />
      ))}
      <Lighting
        layout={layout}
        shadows={QUALITY_SETTINGS[quality].shadows}
        candleLights={QUALITY_SETTINGS[quality].candleLights}
      />
      <BookDirector
        layout={layout}
        reducedMotion={reducedMotion}
        onPresented={onPresented}
        onReturned={onReturned}
      />
    </>
  );
}

/** Tells the page when textures have finished loading. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const { active, progress } = useProgress();
  useEffect(() => {
    if (!active && progress === 100) onReady();
  }, [active, progress, onReady]);
  return null;
}

export default function LibraryScene(props: LibrarySceneProps) {
  const { layout, selectedId, locked, reducedMotion, onSelect, onHover, onPresented, onReturned, onReady } =
    props;
  const fonts = useSceneFonts();
  const [registry] = useState(() => new Map<string, BookHandle>());
  const [quality, setQuality] = useState<Quality>(initialQuality);
  // Shadow maps are decided once: toggling them later recompiles every material.
  const [shadows] = useState(() => QUALITY_SETTINGS[quality].shadows);
  const settings = QUALITY_SETTINGS[quality];

  const context = useMemo<SceneContextValue | null>(
    () => (fonts ? { registry, fonts, selectedId, locked, onSelect, onHover } : null),
    [registry, fonts, selectedId, locked, onSelect, onHover],
  );

  return (
    <Canvas
      shadows={shadows ? "percentage" : false}
      dpr={[1, settings.dpr]}
      camera={{ fov: 44, near: 0.05, far: 40, position: [0, 2.15, 8.4] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => onHover(null)}
      aria-label="Biblioteca en 3D. Usa el buscador para encontrar un libro."
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 11, 26]} />
      <CameraRig layout={layout} locked={locked} />
      {context && (
        <SceneContext.Provider value={context}>
          <Suspense fallback={null}>
            <Contents
              layout={layout}
              quality={quality}
              reducedMotion={reducedMotion}
              onPresented={onPresented}
              onReturned={onReturned}
            />
            <ReadySignal onReady={onReady} />
            <Effects quality={quality} />
          </Suspense>
        </SceneContext.Provider>
      )}
      {/* Steps quality down when the frame rate stays low (integrated GPUs, phones). */}
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => setQuality(lowerQuality)}
      />
    </Canvas>
  );
}
