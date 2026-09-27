import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { access } from "fs/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "assets", "launcher-clock-source.png");
const out = join(root, "assets", "icon.png");

/** Same green as the launcher art background. */
const BG = "#163d2a";

let input = source;
try {
  await access(source);
} catch {
  input = out;
}

const CANVAS = 1024;
const SAFE_ZONE = 0.68;
const artSize = Math.round(CANVAS * SAFE_ZONE);
const art = await sharp(input)
  .resize(artSize, artSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const left = Math.floor((CANVAS - artSize) / 2);
const buf = await sharp({
  create: { width: CANVAS, height: CANVAS, channels: 4, background: BG },
})
  .composite([{ input: art, left, top: left }])
  .png()
  .toBuffer();
await sharp(buf).toFile(out);
await sharp(buf).toFile(join(root, "assets", "logo.png"));

console.log("Prepared icon.png + logo.png (full art, no crop) from", input);
