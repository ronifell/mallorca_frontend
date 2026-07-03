/**
 * Generates Google Play Store feature graphic (1024×500, no alpha).
 *
 * Output: assets/feature-graphic.png
 * Run:    npm run build:feature-graphic
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSET_DIR = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSET_DIR, 'logo-source.png');
const OUTPUT = path.join(ASSET_DIR, 'feature-graphic.png');

const WIDTH = 1024;
const HEIGHT = 500;

const CREAM = '#F2EBE0';
const INK = '#3D2618';
const BRAND = '#B82E2E';
const INK_MUTED = '#7A5640';

function buildBackgroundSvg() {
  return Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="22%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#FDE4E0" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${CREAM}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${CREAM}"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <circle cx="920" cy="80" r="120" fill="#F7D2D0" fill-opacity="0.35"/>
  <circle cx="980" cy="420" r="90" fill="#E9DECE" fill-opacity="0.55"/>
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${BRAND}"/>
  <text x="430" y="210"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="58" font-weight="700" fill="${INK}">Citas Mallorca</text>
  <text x="430" y="268"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="30" font-style="italic" fill="${BRAND}">Conecta en Mallorca</text>
  <text x="430" y="318"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22" fill="${INK_MUTED}">Match · Chat · Conoce gente afín</text>
</svg>
`);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing ${SOURCE}. Add logo-source.png first.`);
  }

  const logoHeight = 340;
  const logo = await sharp(SOURCE)
    .resize(logoHeight, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const logoLeft = 56;
  const logoTop = Math.round((HEIGHT - logoHeight) / 2);

  await sharp(buildBackgroundSvg())
    .composite([{ input: logo, top: logoTop, left: logoLeft }])
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);

  const meta = await sharp(OUTPUT).metadata();
  console.log(`Wrote ${OUTPUT} (${meta.width}x${meta.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
