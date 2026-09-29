"use client";

import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CASE, type LibraryLayout } from "@/lib/layout";

const { ACTION } = CameraControlsImpl;

export const HOME = {
  position: new THREE.Vector3(0, 2.15, 8.4),
  target: new THREE.Vector3(0, 2.35, 0.3),
};

/** Where the camera's target may roam while walking the gallery. */
export function galleryBoundary(layout: LibraryLayout) {
  const halfWall = layout.wallWidth / 2 - CASE.innerWidth * 0.35;
  return new THREE.Box3(
    new THREE.Vector3(-halfWall, 0.9, -0.2),
    new THREE.Vector3(halfWall, 3.4, 0.9),
  );
}

/**
 * Walks the gallery: drag moves along the wall, wheel or pinch steps closer,
 * right-drag (or two fingers) turns the head a little. Arrow keys move too.
 */
export function CameraRig({ layout, locked }: { layout: LibraryLayout; locked: boolean }) {
  const controls = useRef<CameraControlsImpl>(null);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.left = ACTION.TRUCK;
    c.mouseButtons.right = ACTION.ROTATE;
    c.mouseButtons.middle = ACTION.DOLLY;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_TRUCK;
    c.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
    c.touches.three = ACTION.NONE;
    c.minDistance = 1.4;
    c.maxDistance = 8.4;
    c.minAzimuthAngle = -0.45;
    c.maxAzimuthAngle = 0.45;
    c.minPolarAngle = Math.PI / 2 - 0.42;
    c.maxPolarAngle = Math.PI / 2 + 0.3;
    c.smoothTime = 0.35;
    c.draggingSmoothTime = 0.12;
    c.truckSpeed = 1.4;
    c.dollyToCursor = true;
    c.boundaryFriction = 0.3;
    c.setBoundary(galleryBoundary(layout));
    c.setLookAt(...HOME.position.toArray(), ...HOME.target.toArray(), false);
  }, [layout]);

  // Narrow screens start further back so a whole bookcase fits.
  useEffect(() => {
    const c = controls.current;
    if (!c || locked) return;
    const portrait = size.width < size.height;
    c.maxDistance = portrait ? 10.5 : 8.4;
  }, [size.width, size.height, locked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = controls.current;
      if (!c || locked) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const step = e.shiftKey ? 2.5 : 1;
      if (e.key === "ArrowLeft") c.truck(-step, 0, true);
      else if (e.key === "ArrowRight") c.truck(step, 0, true);
      else if (e.key === "ArrowUp") c.truck(0, 0.5, true);
      else if (e.key === "ArrowDown") c.truck(0, -0.5, true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  return <CameraControls ref={controls} makeDefault enabled={!locked} />;
}
