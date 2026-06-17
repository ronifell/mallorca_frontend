/**
 * Regenerates the app launcher icons from `assets/logo-source.png`.
 *
 * Why this script exists:
 *   The raw "Citas Mallorca" coin logo touches the edges of its square
 *   canvas. When Android applies its adaptive-icon mask (which crops the
 *   outer ~17% on each side) and iOS rounds the corners, the gold border
 *   and the "MALLORCA" / "CITAS, CONTACTOS Y AMOR" lettering get clipped.
 *
 * What it produces:
 *   - assets/icon.png            (1024x1024, iOS app icon — logo at 80%,
 *                                  cream background so iOS rounded corners
 *                                  don't bite into the coin).
 *   - assets/adaptive-icon.png   (1024x1024, Android adaptive icon
 *                                  foreground — logo at 58% on transparent
 *                                  background, sized for Android's safe
 *                                  zone so launcher masks never clip it).
 *
 * Re-run with: `npm run build:icons` after replacing logo-source.png.
 */
const path = require('path');
const sharp = require('sharp');

const ASSET_DIR = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSET_DIR, 'logo-source.png');

const CANVAS_SIZE = 1024;
// Cream background that matches the splash + onboarding palette.
const BACKGROUND = { r: 0xf2, g: 0xeb, b: 0xe0, alpha: 1 };

/**
 * Compose the source logo onto a square canvas at a given scale.
 *
 * @param {number} scale - Logo size as a fraction of the canvas (0–1).
 * @param {Buffer|null} background - Solid RGBA background, or null for
 *   transparent (used for the Android adaptive foreground).
 */
async function composeIcon(scale, background) {
  const logoSize = Math.round(CANVAS_SIZE * scale);
  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const canvas = background
    ? sharp({
        create: {
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          channels: 4,
          background,
        },
      })
    : sharp({
        create: {
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

  const offset = Math.round((CANVAS_SIZE - logoSize) / 2);
  return canvas
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toBuffer();
}

async function main() {
  const iosIcon = await composeIcon(0.8, BACKGROUND);
  await sharp(iosIcon).toFile(path.join(ASSET_DIR, 'icon.png'));
  console.log('Wrote assets/icon.png (iOS, logo @ 80% on cream)');

  const androidIcon = await composeIcon(0.58, null);
  await sharp(androidIcon).toFile(path.join(ASSET_DIR, 'adaptive-icon.png'));
  console.log('Wrote assets/adaptive-icon.png (Android, logo @ 58% on transparent)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
