const path = require("node:path");
const fs = require("node:fs");

const sharp = require("sharp");

const svgPath = path.join(__dirname, "..", "..", "frontend", "public", "icons", "notey-app-icon.svg");
const outDir = path.join(__dirname, "..", "assets");
const outPath = path.join(outDir, "tray-icon.png");

if (!fs.existsSync(svgPath)) {
  console.error("SVG not found:", svgPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

sharp(svgPath)
  .resize(32, 32)
  .png()
  .toFile(outPath)
  .then(() => console.log("Tray icon written to", outPath))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
