"use client";

import type { CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { CASE, type LibraryLayout } from "@/lib/layout";
import { galleryBoundary } from "./CameraRig";
import { useScene, type BookHandle } from "./SceneContext";

type Active = {
  id: string;
  tl: gsap.core.Timeline;
  handle: BookHandle;
};

/** How far in front of the camera the book is held, in metres. */
const HOLD_DISTANCE = 0.9;
/** Portrait phones see less width, and the reading card covers the lower half. */
const HOLD_DISTANCE_NARROW = 1.35;
const HOLD_Z = 1.05;

/**
 * Choreographs taking a book off the shelf and putting it back. One GSAP
 * timeline drives the camera and the book together, so closing the book is
 * just `reverse()` and an interrupted selection unwinds from wherever it is.
 */
export function BookDirector({
  layout,
  reducedMotion,
  onPresented,
  onReturned,
}: {
  layout: LibraryLayout;
  reducedMotion: boolean;
  onPresented: (id: string) => void;
  onReturned: () => void;
}) {
  const { registry, selectedId } = useScene();
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const size = useThree((s) => s.size);
  const active = useRef<Active | null>(null);
  const pending = useRef<string | null>(null);
  const presentedAt = useRef<number | null>(null);

  const callbacks = useRef({ onPresented, onReturned });
  useLayoutEffect(() => {
    callbacks.current = { onPresented, onReturned };
  });

  useEffect(() => {
    if (!controls) return;
    const c = controls;
    const current = active.current;

    function finishReturn() {
      presentedAt.current = null;
      c.setBoundary(galleryBoundary(layout));
      const next = pending.current;
      pending.current = null;
      active.current = null;
      if (next) build(next);
      else callbacks.current.onReturned();
    }

    function build(id: string) {
      const handle = registry.get(id);
      if (!handle) return;
      const { root, pivot, placed } = handle;
      gsap.killTweensOf(root.position);
      root.position.set(placed.x, placed.y, placed.z);
      root.rotation.set(0, 0, 0);
      pivot.rotation.set(0, 0, 0);
      pivot.position.y = 0;

      const narrow = size.width < 768;
      const bookCentreY = Math.max(placed.y + 0.18, 1.05) + placed.height / 2;
      const holdY = bookCentreY - placed.height / 2;
      const cam = {
        ...vec("p", c.getPosition(new THREE.Vector3())),
        ...vec("t", c.getTarget(new THREE.Vector3())),
        ...vec("f", c.getFocalOffset(new THREE.Vector3())),
      };
      const to = {
        px: placed.x,
        py: bookCentreY + 0.02,
        pz: HOLD_Z + (narrow ? HOLD_DISTANCE_NARROW : HOLD_DISTANCE),
        tx: placed.x,
        ty: bookCentreY,
        tz: HOLD_Z,
        // Shift the framing so the book sits beside the reading card.
        fx: narrow ? 0 : 0.17,
        fy: narrow ? 0.2 : 0,
        fz: 0,
      };

      c.setBoundary();
      const applyCamera = () => {
        c.setLookAt(cam.px, cam.py, cam.pz, cam.tx, cam.ty, cam.tz, false);
        c.setFocalOffset(cam.fx, cam.fy, cam.fz, false);
      };

      const presented = () => {
        presentedAt.current = performance.now();
        callbacks.current.onPresented(id);
      };

      const shelfFront = CASE.depth + placed.depth / 2 + 0.05;
      const tl = gsap.timeline({
        paused: true,
        onComplete: presented,
        onReverseComplete: finishReturn,
      });

      // Walk up to the shelf.
      tl.to(cam, { ...to, duration: 1.1, ease: "power3.inOut", onUpdate: applyCamera }, 0);
      // A finger hooks the head of the spine and tips the book out.
      tl.to(pivot.rotation, { x: 0.3, duration: 0.32, ease: "power2.out" }, 0.82);
      // It slides clear of its neighbours, settling upright again.
      tl.to(root.position, { z: shelfFront, duration: 0.42, ease: "power2.inOut" }, 1.08);
      tl.to(pivot.rotation, { x: 0.06, duration: 0.42, ease: "power2.inOut" }, 1.08);
      // And turns in the hand to show the front cover.
      tl.to(root.position, { y: holdY, z: HOLD_Z, duration: 0.7, ease: "power3.out" }, 1.42);
      tl.to(root.rotation, { y: -Math.PI / 2 + 0.38, duration: 0.7, ease: "power3.out" }, 1.42);
      tl.to(pivot.rotation, { x: -0.07, duration: 0.7, ease: "power3.out" }, 1.42);

      active.current = { id, tl, handle };
      if (reducedMotion) {
        // No travel: cut straight to the book in hand.
        tl.progress(1, true);
        applyCamera();
        presented();
      } else {
        tl.play();
      }
    }

    if (current) {
      if (current.id === selectedId) {
        // Re-selected while putting it back: take it out again.
        pending.current = null;
        current.tl.timeScale(1).play();
        return;
      }
      pending.current = selectedId;
      if (reducedMotion) {
        current.tl.progress(0, true);
        finishReturn();
        return;
      }
      current.tl.timeScale(selectedId ? 2.2 : 1.35).reverse();
      return;
    }
    if (selectedId) build(selectedId);
  }, [selectedId, controls, registry, layout, reducedMotion, size.width]);

  // Kill everything on unmount.
  useEffect(
    () => () => {
      active.current?.tl.kill();
      active.current = null;
    },
    [],
  );

  // The book breathes gently while it is held.
  useFrame(({ clock }) => {
    const a = active.current;
    if (!a || presentedAt.current === null || reducedMotion) return;
    const t = clock.getElapsedTime();
    a.handle.pivot.position.y = Math.sin(t * 1.3) * 0.004;
  });

  return null;
}

function vec<P extends string>(prefix: P, v: THREE.Vector3) {
  return { [`${prefix}x`]: v.x, [`${prefix}y`]: v.y, [`${prefix}z`]: v.z } as Record<
    `${P}x` | `${P}y` | `${P}z`,
    number
  >;
}
