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

/** contain = show full timer + top alarm pills (no crop). */
const buf = await sharp(input)
  .resize(1024, 1024, { fit: "contain", background: BG, position: "centre" })
  .png()
  .toBuffer();
await sharp(buf).toFile(out);
await sharp(buf).toFile(join(root, "assets", "logo.png"));

console.log("Prepared icon.png + logo.png (full art, no crop) from", input);
