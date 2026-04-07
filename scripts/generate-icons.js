const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#0055CC"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Wallet body -->
  <rect x="96" y="160" width="320" height="220" rx="24" fill="none" stroke="white" stroke-width="20"/>
  <!-- Wallet flap -->
  <path d="M96 210 L416 210" stroke="white" stroke-width="20" stroke-linecap="round"/>
  <!-- Coin circle -->
  <circle cx="360" cy="280" r="30" fill="white" opacity="0.9"/>
  <!-- Small bar chart on left side -->
  <rect x="150" y="290" width="24" height="60" rx="6" fill="white" opacity="0.7"/>
  <rect x="190" y="260" width="24" height="90" rx="6" fill="white" opacity="0.8"/>
  <rect x="230" y="240" width="24" height="110" rx="6" fill="white" opacity="0.9"/>
</svg>`;

const publicDir = path.join(__dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");

async function generate() {
  // Ensure icons directory exists
  fs.mkdirSync(iconsDir, { recursive: true });

  const svgBuffer = Buffer.from(SVG);

  const sizes = [
    { name: "icon-512x512.png", size: 512, dir: iconsDir },
    { name: "icon-192x192.png", size: 192, dir: iconsDir },
    { name: "apple-touch-icon.png", size: 180, dir: publicDir },
    { name: "favicon-32x32.png", size: 32, dir: publicDir },
    { name: "favicon-16x16.png", size: 16, dir: publicDir },
  ];

  for (const { name, size, dir } of sizes) {
    const outPath = path.join(dir, name);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`Created ${outPath} (${size}x${size})`);
  }

  // Also save the SVG as logo.svg
  fs.writeFileSync(path.join(publicDir, "logo.svg"), SVG);
  console.log("Created logo.svg");

  console.log("\nAll icons generated successfully!");
}

generate().catch(console.error);
