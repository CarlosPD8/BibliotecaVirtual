import * as THREE from "three";
import { seeded } from "@/lib/random";

/**
 * Every book uses one small atlas laid out left to right:
 *   [ spine 80px | page edges 16px | cover board 32px ]  (128 x 512)
 * Real books get their own atlas with the title tooled on the spine; the
 * anonymous volumes share one atlas holding four spine designs.
 */
export const ATLAS_W = 128;
export const ATLAS_H = 512;
const SPINE_W = 80;
const PAGES_X = 80;
const PAGES_W = 16;
const COVER_X = 96;
const COVER_W = 32;

export const GOLD_HEX = "#d9b45f";
export const PAGE_HEX = "#e8dcc2";

export type SceneFonts = { display: string; body: string };

type Region = { x0: number; x1: number };
const px = (x: number) => x / ATLAS_W;
const inset = 1.5;
export const REGIONS = {
  spine: { x0: px(inset), x1: px(SPINE_W - inset) },
  pages: { x0: px(PAGES_X + inset), x1: px(PAGES_X + PAGES_W - inset) },
  cover: { x0: px(COVER_X + inset), x1: px(COVER_X + COVER_W - inset) },
} satisfies Record<string, Region>;

/**
 * Unit box whose faces sample the atlas regions. BoxGeometry face order is
 * +x, -x, +y, -y, +z, -z; the spine faces +z (towards the room) and the front
 * cover faces +x.
 */
export function createBookGeometry() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  const faceRegion: Region[] = [
    REGIONS.cover, // +x front cover
    REGIONS.cover, // -x back cover
    REGIONS.pages, // +y head
    REGIONS.pages, // -y tail
    REGIONS.spine, // +z spine
    REGIONS.pages, // -z fore-edge
  ];
  for (let face = 0; face < 6; face++) {
    const region = faceRegion[face];
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setX(i, region.x0 + uv.getX(i) * (region.x1 - region.x0));
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

// ---------------------------------------------------------------------------
// Canvas helpers

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D no disponible");
  return { canvas, ctx };
}

/** Paints the same shapes on the colour canvas (in gold) and the mask canvas (in white). */
function gilt(
  color: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  color.save();
  color.fillStyle = GOLD_HEX;
  color.strokeStyle = GOLD_HEX;
  paint(color);
  color.restore();
  mask.save();
  mask.fillStyle = "#fff";
  mask.strokeStyle = "#fff";
  paint(mask);
  mask.restore();
}

function leatherGround(ctx: CanvasRenderingContext2D, x: number, w: number, color: string, r: () => number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, 0, w, ATLAS_H);
  // Rounded spine: darker towards both edges.
  const shade = ctx.createLinearGradient(x, 0, x + w, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.45)");
  shade.addColorStop(0.3, "rgba(0,0,0,0.05)");
  shade.addColorStop(0.55, "rgba(255,235,200,0.06)");
  shade.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, 0, w, ATLAS_H);
  // Wear: scattered scuffs.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,240,220,0.05)";
    ctx.fillRect(x + r() * w, r() * ATLAS_H, 1 + r() * 2, 1 + r() * 3);
  }
  // Rubbed head and tail.
  const rub = ctx.createLinearGradient(0, 0, 0, ATLAS_H);
  rub.addColorStop(0, "rgba(255,230,200,0.12)");
  rub.addColorStop(0.04, "rgba(0,0,0,0)");
  rub.addColorStop(0.96, "rgba(0,0,0,0)");
  rub.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = rub;
  ctx.fillRect(x, 0, w, ATLAS_H);
}

function pageEdges(ctx: CanvasRenderingContext2D, x: number, w: number, r: () => number) {
  ctx.fillStyle = PAGE_HEX;
  ctx.fillRect(x, 0, w, ATLAS_H);
  for (let i = 0; i < w; i++) {
    ctx.fillStyle = `rgba(90,70,40,${0.05 + r() * 0.12})`;
    ctx.fillRect(x + i, 0, 1, ATLAS_H);
  }
  // Foxing near the edges.
  const fox = ctx.createLinearGradient(0, 0, 0, ATLAS_H);
  fox.addColorStop(0, "rgba(120,80,30,0.25)");
  fox.addColorStop(0.1, "rgba(0,0,0,0)");
  fox.addColorStop(0.9, "rgba(0,0,0,0)");
  fox.addColorStop(1, "rgba(120,80,30,0.25)");
  ctx.fillStyle = fox;
  ctx.fillRect(x, 0, w, ATLAS_H);
}

/** Raised band across the spine, tooled with a gilt fillet on each side. */
function raisedBand(
  color: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
  y: number,
  x = 0,
  w = SPINE_W,
) {
  const band = color.createLinearGradient(0, y - 7, 0, y + 7);
  band.addColorStop(0, "rgba(0,0,0,0.45)");
  band.addColorStop(0.45, "rgba(255,230,190,0.18)");
  band.addColorStop(1, "rgba(0,0,0,0.5)");
  color.fillStyle = band;
  color.fillRect(x, y - 7, w, 14);
  gilt(color, mask, (ctx) => {
    ctx.fillRect(x + 4, y - 9, w - 8, 1.5);
    ctx.fillRect(x + 4, y + 7.5, w - 8, 1.5);
  });
}

function fleuron(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // Small lozenge with dots: the classic tool between bands.
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.6, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.6, cy);
  ctx.closePath();
  ctx.fill();
  for (const [dx, dy] of [
    [-size, 0],
    [size, 0],
  ]) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Largest font size (<= max) at which `text` fits `length` along the spine. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: string,
  length: number,
  max: number,
  min: number,
) {
  for (let size = max; size >= min; size -= 1) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= length) return size;
  }
  return min;
}

function splitInTwo(text: string): [string, string] | null {
  const words = text.split(" ");
  if (words.length < 2) return null;
  let best: [string, string] = [text, ""];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

/** Text running head to tail, letter tops towards the front cover. */
function verticalText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function toDataTexture(color: HTMLCanvasElement, mask: HTMLCanvasElement, maskInAlpha: boolean) {
  const w = color.width;
  const h = color.height;
  const c = color.getContext("2d")!.getImageData(0, 0, w, h).data;
  const m = mask.getContext("2d")!.getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);
  // Canvas rows start at the top; WebGL rows start at the bottom.
  for (let y = 0; y < h; y++) {
    const src = y * w * 4;
    const dst = (h - 1 - y) * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      if (maskInAlpha) {
        out[dst + x] = c[src + x];
        out[dst + x + 1] = c[src + x + 1];
        out[dst + x + 2] = c[src + x + 2];
        out[dst + x + 3] = m[src + x];
      } else {
        out[dst + x] = m[src + x];
        out[dst + x + 1] = m[src + x + 1];
        out[dst + x + 2] = m[src + x + 2];
        out[dst + x + 3] = 255;
      }
    }
  }
  const texture = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// Real books

export function createSpineTexture(
  book: { id: string; title: string; author: string },
  leather: string,
  fonts: SceneFonts,
) {
  const r = seeded(`spine-${book.id}`);
  const { canvas: colorCanvas, ctx: color } = makeCanvas(ATLAS_W, ATLAS_H);
  const { canvas: maskCanvas, ctx: mask } = makeCanvas(ATLAS_W, ATLAS_H);
  mask.fillStyle = "#000";
  mask.fillRect(0, 0, ATLAS_W, ATLAS_H);

  leatherGround(color, 0, SPINE_W, leather, r);
  pageEdges(color, PAGES_X, PAGES_W, r);
  leatherGround(color, COVER_X, COVER_W, leather, r);

  // Head and tail fillets.
  gilt(color, mask, (ctx) => {
    ctx.fillRect(5, 10, SPINE_W - 10, 2);
    ctx.fillRect(5, 15, SPINE_W - 10, 1);
    ctx.fillRect(5, ATLAS_H - 16, SPINE_W - 10, 1);
    ctx.fillRect(5, ATLAS_H - 12, SPINE_W - 10, 2);
  });
  raisedBand(color, mask, 38);
  raisedBand(color, mask, ATLAS_H - 40);
  gilt(color, mask, (ctx) => {
    fleuron(ctx, SPINE_W / 2, 24, 6);
    fleuron(ctx, SPINE_W / 2, ATLAS_H - 26, 6);
  });

  // Title panel between the bands, on a darker morocco label.
  const titleTop = 62;
  const titleBottom = ATLAS_H - 118;
  const titleLength = titleBottom - titleTop - 16;
  color.fillStyle = "rgba(0,0,0,0.28)";
  color.fillRect(9, titleTop - 6, SPINE_W - 18, titleBottom - titleTop + 12);
  gilt(color, mask, (ctx) => {
    ctx.lineWidth = 1.5;
    ctx.strokeRect(11, titleTop - 3, SPINE_W - 22, titleBottom - titleTop + 6);
  });

  const title = book.title.toUpperCase();
  const cy = (titleTop + titleBottom) / 2;
  let size = fitFont(color, title, fonts.display, "700", titleLength, 34, 20);
  const lines = size <= 22 ? splitInTwo(title) : null;
  if (lines) {
    size = Math.min(
      fitFont(color, lines[0], fonts.display, "700", titleLength, 26, 12),
      fitFont(color, lines[1], fonts.display, "700", titleLength, 26, 12),
    );
    gilt(color, mask, (ctx) => {
      ctx.font = `700 ${size}px ${fonts.display}`;
      verticalText(ctx, lines[0], SPINE_W / 2 + size * 0.58, cy);
      verticalText(ctx, lines[1], SPINE_W / 2 - size * 0.58, cy);
    });
  } else {
    size = fitFont(color, title, fonts.display, "700", titleLength, 34, 12);
    gilt(color, mask, (ctx) => {
      ctx.font = `700 ${size}px ${fonts.display}`;
      verticalText(ctx, title, SPINE_W / 2, cy);
    });
  }

  // Author between the lower fillets.
  const author = book.author;
  const authorTop = titleBottom + 14;
  const authorBottom = ATLAS_H - 56;
  const authorSize = fitFont(color, author, fonts.body, "italic 600", authorBottom - authorTop, 22, 10);
  gilt(color, mask, (ctx) => {
    ctx.font = `italic 600 ${authorSize}px ${fonts.body}`;
    verticalText(ctx, author, SPINE_W / 2, (authorTop + authorBottom) / 2);
  });

  // Cover board: a single gilt fillet along the edge.
  gilt(color, mask, (ctx) => {
    ctx.fillRect(COVER_X + 3, 6, 1, ATLAS_H - 12);
  });

  const texture = toDataTexture(colorCanvas, maskCanvas, true);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Tooled leather front cover, used when Open Library has no image. */
export function createCoverCanvas(
  book: { id: string; title: string; author: string },
  leather: string,
  fonts: SceneFonts,
) {
  const W = 512;
  const H = 768;
  const r = seeded(`cover-${book.id}`);
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = leather;
  ctx.fillRect(0, 0, W, H);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.85);
  vignette.addColorStop(0, "rgba(255,235,210,0.07)");
  vignette.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.1)" : "rgba(255,240,220,0.04)";
    ctx.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3);
  }
  ctx.strokeStyle = GOLD_HEX;
  ctx.fillStyle = GOLD_HEX;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  for (const [x, y] of [
    [40, 40],
    [W - 40, 40],
    [40, H - 40],
    [W - 40, H - 40],
  ]) {
    fleuron(ctx, x, y, 14);
  }
  fleuron(ctx, W / 2, H * 0.62, 18);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const words = book.title.toUpperCase().split(" ");
  const lines: string[] = [];
  ctx.font = `700 44px ${fonts.display}`;
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > W - 140 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const startY = H * 0.36 - ((lines.length - 1) * 54) / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * 54));
  ctx.font = `italic 600 32px ${fonts.body}`;
  ctx.fillText(book.author, W / 2, H * 0.75);
  return canvas;
}

// ---------------------------------------------------------------------------
// Anonymous volumes

export const FILLER_VARIANTS = 4;

/**
 * Mask atlas for the anonymous volumes, four designs side by side.
 * R = gilt, G = page paper, B = darker label leather. The leather colour
 * comes from each instance.
 */
export function createFillerAtlas() {
  const W = ATLAS_W * FILLER_VARIANTS;
  const r = seeded("filler-atlas");
  const { canvas: maskCanvas, ctx } = makeCanvas(W, ATLAS_H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, ATLAS_H);

  const gold = (paint: () => void) => {
    ctx.save();
    ctx.fillStyle = "#ff0000";
    ctx.strokeStyle = "#ff0000";
    ctx.globalCompositeOperation = "lighter";
    paint();
    ctx.restore();
  };

  for (let v = 0; v < FILLER_VARIANTS; v++) {
    const ox = v * ATLAS_W;
    // Page edges.
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(ox + PAGES_X, 0, PAGES_W, ATLAS_H);

    gold(() => {
      ctx.fillRect(ox + 5, 10, SPINE_W - 10, 2);
      ctx.fillRect(ox + 5, ATLAS_H - 12, SPINE_W - 10, 2);
    });

    if (v === 0) {
      // Five raised bands.
      for (let i = 1; i <= 5; i++) {
        const y = (ATLAS_H / 6) * i;
        gold(() => {
          ctx.fillRect(ox + 4, y - 6, SPINE_W - 8, 1.5);
          ctx.fillRect(ox + 4, y + 5, SPINE_W - 8, 1.5);
        });
      }
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(ox + 6, ATLAS_H / 6 + 10, SPINE_W - 12, ATLAS_H / 6 - 20);
      gold(() => ctx.fillRect(ox + 16, ATLAS_H / 6 + 30, SPINE_W - 32, ATLAS_H / 6 - 60));
    } else if (v === 1) {
      // Label near the head with a gilt title block.
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(ox + 8, 60, SPINE_W - 16, 180);
      gold(() => {
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox + 10, 62, SPINE_W - 20, 176);
        for (let i = 0; i < 3; i++) ctx.fillRect(ox + 26 + i * 10, 90, 4, 120);
      });
    } else if (v === 2) {
      // Plain calf with gilt fillets top and bottom.
      gold(() => {
        for (const y of [34, 42, ATLAS_H - 44, ATLAS_H - 36]) ctx.fillRect(ox + 5, y, SPINE_W - 10, 1.5);
      });
    } else {
      // Tall ornament panel.
      gold(() => {
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox + 10, 40, SPINE_W - 20, ATLAS_H - 80);
        for (let i = 0; i < 6; i++) {
          const y = 80 + i * 66;
          ctx.beginPath();
          ctx.moveTo(ox + SPINE_W / 2, y - 12);
          ctx.lineTo(ox + SPINE_W / 2 + 8, y);
          ctx.lineTo(ox + SPINE_W / 2, y + 12);
          ctx.lineTo(ox + SPINE_W / 2 - 8, y);
          ctx.fill();
        }
      });
    }

    // Wear on the gilt so no two panels look stamped from the same die.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = "#7f7f7f";
      ctx.fillRect(ox + r() * SPINE_W, r() * ATLAS_H, 1 + r() * 2, 1 + r() * 2);
    }
    ctx.restore();
  }

  const texture = toDataTexture(maskCanvas, maskCanvas, false);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}
