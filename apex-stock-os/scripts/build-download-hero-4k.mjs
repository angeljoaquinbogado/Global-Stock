/**
 * Creates a polished 3840x2160 rendition from the original approved
 * illustration. This is an upscale, NOT a native 4K source. The original
 * 1672x941 detail cannot be reconstructed by interpolation.
 *
 * Runs on npm predev/prebuild, before Next.js collects /public assets.
 * Never alters the approved source photo.
 */
import { stat, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import sharp from "sharp";

const source = resolve(process.cwd(), "public/download/global-stock-control-total.avif");
const target = resolve(process.cwd(), "public/download/global-stock-control-total-4k.webp");

const input = await stat(source);
let output = null;
try { output = await stat(target); } catch { /* first build */ }
if (!output || output.mtimeMs < input.mtimeMs) {
  await mkdir(dirname(target), { recursive: true });
  await sharp(source, { failOn: "error" })
    .resize(3840, 2160, {
      fit: "fill",
      kernel: "lanczos3"
    })
    // Restrained sharpening after interpolation helps screen microtype without
    // adding visible halos to the device bezels or the light background.
    .sharpen({ sigma: 0.65, m1: 0.45, m2: 1.1, x1: 2, y2: 10, y3: 20 })
    .webp({ quality: 91, effort: 5, smartSubsample: true })
    .toFile(target);

  const generated = await stat(target);
  console.log(`Product hero: 3840 × 2160 upscaled WebP generated (${Math.round(generated.size / 1024)} KB)`);
} else {
  console.log("Product hero: existing upscaled 4K variant is current");
}
