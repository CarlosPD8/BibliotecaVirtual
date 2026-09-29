"use client";

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { QUALITY_SETTINGS, type Quality } from "./quality";

/**
 * Ambient occlusion seats every book in its row, bloom lets only the candle
 * flames glow (they are the only surfaces brighter than 1.0), and the
 * vignette keeps the eye on the shelves.
 */
export function Effects({ quality }: { quality: Quality }) {
  const { ao, msaa } = QUALITY_SETTINGS[quality];
  return (
    <EffectComposer multisampling={msaa}>
      <>
        {ao !== "off" && (
          <N8AO
            aoRadius={0.4}
            distanceFalloff={0.6}
            intensity={ao === "full" ? 2.4 : 1.8}
            color="#120905"
            halfRes={ao === "half"}
            quality={ao === "full" ? "medium" : "performance"}
          />
        )}
      </>
      <Bloom mipmapBlur luminanceThreshold={1.1} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
    </EffectComposer>
  );
}
