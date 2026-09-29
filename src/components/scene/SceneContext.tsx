"use client";

import { createContext, useContext } from "react";
import type { Group } from "three";
import type { PlacedBook } from "@/lib/layout";
import type { SceneFonts } from "./bookTextures";

export type BookHandle = {
  root: Group;
  pivot: Group;
  placed: PlacedBook;
};

export type SceneContextValue = {
  registry: Map<string, BookHandle>;
  fonts: SceneFonts;
  selectedId: string | null;
  /** A book is travelling or in hand: shelves ignore hover. */
  locked: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene() {
  const value = useContext(SceneContext);
  if (!value) throw new Error("useScene debe usarse dentro de <LibraryScene>");
  return value;
}
