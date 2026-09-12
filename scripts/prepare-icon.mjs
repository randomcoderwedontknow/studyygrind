import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "assets", "icon.png");
const out = join(root, "assets", "icon.png");

/** Calm Pro / StudyGrind dark forest green — fills former black corner areas. */
const BG = { r: 15, g: 42, b: 26 };

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  // Replace near-black pixels (JPG/AI corner padding) with full green.
  if (a < 16 || (r < 28 && g < 28 && b < 28)) {
    data[i] = BG.r;
    data[i + 1] = BG.g;
    data[i + 2] = BG.b;
    data[i + 3] = 255;
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize(1024, 1024, { fit: "cover" })
  .png()
  .toFile(out);

// Easy-mode alias for capacitor-assets
await sharp(out).toFile(join(root, "assets", "logo.png"));

console.log("Prepared icon.png + logo.png at 1024px, black removed -> #0f2a1a");
