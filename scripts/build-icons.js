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
 *   - assets/icon.png               (1024x1024, iOS app icon — logo at 80%,
 *                                     cream background so iOS rounded corners
 *                                     don't bite into the coin).
 *   - assets/adaptive-icon.png      (1024x1024, Android adaptive icon
 *                                     foreground — logo at 58% on transparent
 *                                     background, sized for Android's safe
 *                                     zone so launcher masks never clip it).
 *   - assets/notification-icon.png (96x96, white silhouette on transparent —
 *                                     required for Android push notification
 *                                     small icon; full-color icons render as
 *                                     an empty circle in the tray).
 *   - assets/notification-large-icon.png (256x256, full-color logo for the
 *                                     large icon shown in expanded notifications).
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

/**
 * Android notification small icons must be a white silhouette on transparency.
 * The OS uses only the alpha channel and tints the icon — full-color PNGs
 * appear as a hollow circle in the notification shade.
 *
 * Do NOT include the coin's outer gold ring: it becomes a white ring with a
 * transparent hole, which reads as an empty circle in the status bar / banner.
 * We keep the heart plus interior lettering only.
 */
function isHeartPixel(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return r > 95 && r > g * 1.3 && r > b * 1.3 && lum < 205;
}

function isInteriorDetailPixel(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const isDarkInk = lum < 118;
  const isCreamFill = lum > 168 && r > 175 && g > 155 && b > 120;
  const isGoldRing = lum >= 132 && lum <= 218 && r >= 145 && g >= 95 && b <= 130;
  return isDarkInk && !isCreamFill && !isGoldRing;
}

function dilateSilhouette(pixels, width, height, radius = 1) {
  const out = Buffer.from(pixels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] === 0) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = (ny * width + nx) * 4;
          out[j] = 255;
          out[j + 1] = 255;
          out[j + 2] = 255;
          out[j + 3] = 255;
        }
      }
    }
  }
  return out;
}

async function composeNotificationIcon() {
  const logoSize = Math.round(CANVAS_SIZE * 0.72);
  const { data, info } = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let pixels = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    if (alpha > 16 && (isHeartPixel(r, g, b) || isInteriorDetailPixel(r, g, b))) {
      pixels[i] = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
      pixels[i + 3] = 255;
    }
  }

  pixels = dilateSilhouette(pixels, info.width, info.height, 1);

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (pixels[(y * info.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const cropWidth = Math.max(1, maxX - minX + 1);
  const cropHeight = Math.max(1, maxY - minY + 1);
  const cropped = await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  const iconSize = 96;
  const innerSize = Math.round(iconSize * 0.78);
  const pad = Math.round((iconSize - innerSize) / 2);

  return sharp(cropped)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function composeNotificationLargeIcon() {
  const logoSize = Math.round(CANVAS_SIZE * 0.78);
  return sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round((CANVAS_SIZE - logoSize) / 2),
      bottom: Math.round((CANVAS_SIZE - logoSize) / 2),
      left: Math.round((CANVAS_SIZE - logoSize) / 2),
      right: Math.round((CANVAS_SIZE - logoSize) / 2),
      background: BACKGROUND,
    })
    .resize(256, 256)
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

  const notificationIcon = await composeNotificationIcon();
  await sharp(notificationIcon).toFile(path.join(ASSET_DIR, 'notification-icon.png'));
  console.log('Wrote assets/notification-icon.png (Android push, white silhouette)');

  const notificationLargeIcon = await composeNotificationLargeIcon();
  await sharp(notificationLargeIcon).toFile(path.join(ASSET_DIR, 'notification-large-icon.png'));
  console.log('Wrote assets/notification-large-icon.png (Android push, full-color large icon)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
