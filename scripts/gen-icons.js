// Genera los iconos PNG de la PWA (icon-192.png, icon-512.png, maskable-512.png)
// sin dependencias externas: dibuja "PV" con una fuente de pixeles y codifica el PNG a mano.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const ACCENT = [0x7a, 0x1f, 0x2b]; // --accent
const WHITE = [255, 255, 255];

// fuente 5x7 (1 = pixel encendido)
const FONT = {
  P: [
    '11110',
    '10001',
    '10001',
    '11110',
    '10000',
    '10000',
    '10000',
  ],
  V: [
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '01010',
    '00100',
  ],
};

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgbaBuffer.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function drawIcon({ size, maskable }) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };

  // fondo: cuadrado con esquinas redondeadas (o cuadrado completo si es maskable)
  const radius = maskable ? 0 : size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      if (radius > 0) {
        const cx = x < radius ? radius : (x > size - radius ? size - radius : x);
        const cy = y < radius ? radius : (y > size - radius ? size - radius : y);
        const nearCorner = (x < radius || x > size - radius) && (y < radius || y > size - radius);
        if (nearCorner) {
          const dx = x - cx, dy = y - cy;
          inside = (dx * dx + dy * dy) <= radius * radius;
        }
      }
      if (inside) set(x, y, ACCENT);
    }
  }

  // texto "PV" centrado, usando la fuente 5x7
  const letters = ['P', 'V'];
  const safe = maskable ? size * 0.6 : size; // area segura para iconos maskable
  const glyphCols = 5, glyphRows = 7, gap = 1;
  const totalCols = letters.length * glyphCols + (letters.length - 1) * gap;
  const scale = Math.floor((safe * 0.7) / Math.max(totalCols, glyphRows));
  const textW = totalCols * scale;
  const textH = glyphRows * scale;
  const startX = Math.floor((size - textW) / 2);
  const startY = Math.floor((size - textH) / 2);

  let colOffset = 0;
  for (const letter of letters) {
    const rows = FONT[letter];
    for (let r = 0; r < glyphRows; r++) {
      for (let c = 0; c < glyphCols; c++) {
        if (rows[r][c] !== '1') continue;
        const px0 = startX + (colOffset + c) * scale;
        const py0 = startY + r * scale;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++)
            set(px0 + dx, py0 + dy, WHITE);
      }
    }
    colOffset += glyphCols + gap;
  }

  return encodePNG(size, size, Buffer.from(px));
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawIcon({ size: 192, maskable: false }));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawIcon({ size: 512, maskable: false }));
fs.writeFileSync(path.join(outDir, 'maskable-512.png'), drawIcon({ size: 512, maskable: true }));

console.log('Iconos generados en', outDir);
