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

/** Matches the dark forest green in the clock launcher art. */
const BG = "#163d2a";
/** Adaptive icon safe zone (~66% visible after launcher mask). */
const SAFE_ZONE = 0.68;
const LEGACY_SCALE = 0.88;

async function writeBuffer(dir, name, buf) {
  const folder = join(resRoot, dir);
  await mkdir(folder, { recursive: true });
  const dest = join(folder, name);
  const tmp = `${dest}.tmp`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sharp(buf).png().toFile(tmp);
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
  const buf = await sharp({
    create: { width: size, height: size, channels: 3, background: color },
  })
    .png()
    .toBuffer();
  await writeBuffer(dir, name, buf);
}

/** Scale art into adaptive safe zone so launcher mask does not clip top pills. */
async function writeLauncherArt(dir, name, size, scale = SAFE_ZONE) {
  const artSize = Math.round(size * scale);
  const art = await sharp(iconPath)
    .resize(artSize, artSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const left = Math.floor((size - artSize) / 2);
  const top = Math.floor((size - artSize) / 2);
  const buf = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: art, left, top }])
    .png()
    .toBuffer();
  await writeBuffer(dir, name, buf);
}

for (const dir of DENSITIES) {
  const adaptive = ADAPTIVE[dir];
  const legacy = LEGACY[dir];
  await writeSolid(dir, "ic_launcher_background.png", adaptive, BG);
  await writeLauncherArt(dir, "ic_launcher_foreground.png", adaptive, SAFE_ZONE);
  await writeLauncherArt(dir, "ic_launcher.png", legacy, LEGACY_SCALE);
  await writeLauncherArt(dir, "ic_launcher_round.png", legacy, LEGACY_SCALE);
}

console.log("Generated Android mipmap launcher PNGs (safe zone) in", resRoot);
