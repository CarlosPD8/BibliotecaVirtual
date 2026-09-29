export type Quality = "high" | "medium" | "low";

export const QUALITY_SETTINGS: Record<
  Quality,
  { dpr: number; shadows: boolean; ao: "full" | "half" | "off"; msaa: number; candleLights: boolean }
> = {
  // Dedicated GPUs: every effect on.
  high: { dpr: 1.75, shadows: true, ao: "full", msaa: 4, candleLights: true },
  // Integrated laptop GPUs: no shadow maps, cheaper AO, only the chandeliers light the room.
  medium: { dpr: 1.25, shadows: false, ao: "half", msaa: 0, candleLights: false },
  // Phones and struggling machines.
  low: { dpr: 1, shadows: false, ao: "off", msaa: 0, candleLights: false },
};

const ORDER: Quality[] = ["high", "medium", "low"];

export function lowerQuality(q: Quality): Quality {
  return ORDER[Math.min(ORDER.indexOf(q) + 1, ORDER.length - 1)];
}

function gpuName(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  } catch {
    return "";
  }
}

/** Best guess before the first frame; PerformanceMonitor corrects it afterwards. */
export function initialQuality(): Quality {
  const forced = new URLSearchParams(window.location.search).get("calidad");
  if (forced === "alta") return "high";
  if (forced === "media") return "medium";
  if (forced === "baja") return "low";

  if (window.matchMedia("(pointer: coarse)").matches) return "low";
  const gpu = gpuName();
  if (/swiftshader|llvmpipe|software/i.test(gpu)) return "low";
  if (/intel|mali|adreno|powervr|apple gpu/i.test(gpu)) return "medium";
  return "high";
}
