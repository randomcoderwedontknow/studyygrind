import sharp from "sharp";
import { mkdir, rename, unlink } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconPath = join(root, "assets", "icon.png");
const resRoot = join(root, "android", "app", "src", "main", "res");

const DENSITIES = ["mipmap-ldpi", "mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];

/** Adaptive icon layer sizes (108dp base). */
const ADAPTIVE = {
  "mipmap-ldpi": 81,
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

/** Legacy launcher icon sizes. */
const LEGACY = {
  "mipmap-ldpi": 36,
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const BG = "#0f2a1a";

async function writePng(dir, name, size, input = iconPath) {
  const folder = join(resRoot, dir);
  await mkdir(folder, { recursive: true });
  const dest = join(folder, name);
  const tmp = `${dest}.tmp`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sharp(input).resize(size, size, { fit: "cover" }).png().toFile(tmp);
      try {
        await unlink(dest);
      } catch {
        /* missing */
      }
      await rename(tmp, dest);
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
}

async function writeSolid(dir, name, size, color) {
  const folder = join(resRoot, dir);
  await mkdir(folder, { recursive: true });
  const dest = join(folder, name);
  const tmp = `${dest}.tmp`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sharp({
        create: { width: size, height: size, channels: 3, background: color },
      })
        .png()
        .toFile(tmp);
      try {
        await unlink(dest);
      } catch {
        /* missing */
      }
      await rename(tmp, dest);
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
}

for (const dir of DENSITIES) {
  const adaptive = ADAPTIVE[dir];
  const legacy = LEGACY[dir];
  await writePng(dir, "ic_launcher_foreground.png", adaptive);
  await writeSolid(dir, "ic_launcher_background.png", adaptive, BG);
  await writePng(dir, "ic_launcher.png", legacy);
  await writePng(dir, "ic_launcher_round.png", legacy);
}

console.log("Generated Android mipmap launcher PNGs in", resRoot);
