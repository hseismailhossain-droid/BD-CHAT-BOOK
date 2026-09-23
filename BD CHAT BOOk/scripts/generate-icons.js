import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter type: None
    
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;
      const dist = Math.sqrt(nx * nx + ny * ny);

      // Gradient background (Deep Slate to Cyan & Emerald)
      let r = Math.floor(15 + 20 * (x / width));
      let g = Math.floor(23 + 60 * (y / height));
      let b = Math.floor(42 + 80 * (x / width));
      let a = 255;

      // Draw rounded squircle border unless maskable
      if (!isMaskable) {
        const cornerDist = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
        if (cornerDist > 1.05) {
          a = 0;
        } else if (cornerDist > 0.98) {
          // Cyan glowing border
          r = 6;
          g = 182;
          b = 212;
        }
      }

      // Draw stylized lightning / flash in the center
      // Centered coordinate
      const cx = x - width / 2;
      const cy = y - height / 2;
      const s = width / 120; // scale factor

      // Simple flash poly test
      let inFlash = false;
      // top part of flash
      if (cy >= -35 * s && cy <= 5 * s) {
        const leftEdge = -12 * s - (cy / 35 / s) * 15 * s;
        const rightEdge = 15 * s - (cy / 35 / s) * 10 * s;
        if (cx >= leftEdge && cx <= rightEdge) inFlash = true;
      }
      // bottom part of flash
      if (cy >= -5 * s && cy <= 35 * s) {
        const leftEdge = -18 * s + (cy / 35 / s) * 12 * s;
        const rightEdge = 8 * s + (cy / 35 / s) * 5 * s;
        if (cx >= leftEdge && cx <= rightEdge) inFlash = true;
      }

      if (inFlash && a > 0) {
        // Bright cyan/white gradient
        r = 34;
        g = 211;
        b = 238;
      }

      scanlines[pxOffset] = r;
      scanlines[pxOffset + 1] = g;
      scanlines[pxOffset + 2] = b;
      scanlines[pxOffset + 3] = a;
    }
  }

  // Deflate scanlines
  const deflated = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Adaptive
  ihdrData[12] = 0; // Interlace: None
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), generatePng(192, 192, false));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), generatePng(512, 512, false));
console.log('Generated pwa-512x512.png');

// 3. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
console.log('Generated apple-touch-icon.png');

// 4. pwa-maskable-512x512.png (full bleed)
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
console.log('Generated pwa-maskable-512x512.png');

// 5. favicon.ico (64x64 PNG format is accepted as favicon)
fs.writeFileSync(path.join(outDir, 'favicon.ico'), generatePng(64, 64, false));
console.log('Generated favicon.ico');
