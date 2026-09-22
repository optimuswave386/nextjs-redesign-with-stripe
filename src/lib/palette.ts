// Turns a photograph into a handful of accent colours, then into full site themes.

export type HSL = { h: number; s: number; l: number };
export type Theme = {
  id: string;
  label: string;
  mode: "dark" | "light";
  swatch: string;
  vars: Record<string, string>;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const css = (h: number, s: number, l: number) =>
  `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });
}

const BINS = 24; // 15° hue buckets

function pickColours(data: Uint8ClampedArray, minSat: number, count: number): HSL[] {
  const bins = Array.from({ length: BINS }, () => ({ w: 0, sin: 0, cos: 0, s: 0, l: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s < minSat || l < 0.1 || l > 0.92) continue;
    // Favour vivid, mid-tone pixels over murky shadows and blown highlights.
    const weight = s * (1 - Math.abs(l - 0.5));
    const bin = bins[Math.floor(h / (360 / BINS)) % BINS];
    const rad = (h * Math.PI) / 180;
    bin.w += weight;
    bin.sin += Math.sin(rad) * weight;
    bin.cos += Math.cos(rad) * weight;
    bin.s += s * weight;
    bin.l += l * weight;
  }

  const ranked = bins
    .filter((b) => b.w > 0)
    .sort((a, b) => b.w - a.w)
    .map((b) => ({
      h: ((Math.atan2(b.sin, b.cos) * 180) / Math.PI + 360) % 360,
      s: b.s / b.w,
      l: b.l / b.w,
    }));

  const picked: HSL[] = [];
  for (const c of ranked) {
    const far = picked.every((p) => {
      const d = Math.abs(p.h - c.h);
      return Math.min(d, 360 - d) >= 30;
    });
    if (far) picked.push(c);
    if (picked.length === count) break;
  }
  return picked;
}

export async function extractPalette(src: string, count = 5): Promise<HSL[]> {
  const img = await loadImage(src);
  const width = 96;
  const height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const strict = pickColours(data, 0.18, count);
  return strict.length >= 3 ? strict : pickColours(data, 0.06, count);
}

export const fallbackPalette: HSL[] = [
  { h: 255, s: 0.75, l: 0.6 },
  { h: 200, s: 0.7, l: 0.55 },
  { h: 15, s: 0.75, l: 0.55 },
  { h: 150, s: 0.55, l: 0.5 },
];

const NAMES = [
  "Crimson", "Ember", "Gold", "Moss", "Fern", "Jade",
  "Lagoon", "Ocean", "Indigo", "Violet", "Orchid", "Rose",
];
const hueName = (h: number) => NAMES[Math.round(h / 30) % 12];

function themeVars({ h, s }: HSL, mode: "dark" | "light"): Record<string, string> {
  const accentSat = clamp(s, 0.5, 0.9);
  if (mode === "dark") {
    const tint = clamp(s * 0.5, 0.12, 0.35);
    return {
      "--bg": css(h, tint, 0.06),
      "--surface": css(h, tint, 0.1),
      "--line": css(h, tint * 0.9, 0.21),
      "--text": css(h, 0.2, 0.94),
      "--muted": css(h, 0.14, 0.7),
      "--accent": css(h, accentSat, 0.65),
      "--accent-ink": css(h, 0.4, 0.08),
    };
  }
  return {
    "--bg": css(h, 0.3, 0.97),
    "--surface": css(h, 0.28, 0.93),
    "--line": css(h, 0.2, 0.83),
    "--text": css(h, 0.3, 0.1),
    "--muted": css(h, 0.14, 0.36),
    "--accent": css(h, accentSat, 0.36),
    "--accent-ink": css(h, 0.2, 0.98),
  };
}

export function buildThemes(palette: HSL[]): Theme[] {
  const source = palette.length ? palette : fallbackPalette;
  const seen = new Set<string>();
  const named = source.map((c, i) => {
    let name = hueName(c.h);
    if (seen.has(name)) name = `${name} ${i + 1}`;
    seen.add(name);
    return { c, name };
  });
  const themes: Theme[] = [];
  for (const mode of ["dark", "light"] as const) {
    for (const { c, name } of named) {
      const vars = themeVars(c, mode);
      themes.push({
        id: `${mode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        label: name,
        mode,
        swatch: vars["--accent"],
        vars,
      });
    }
  }
  return themes;
}
