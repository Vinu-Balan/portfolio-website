// Generates src/assets/paper-noise.png: a small tileable paper-fibre texture. Pre-rendering it
// avoids rasterising an SVG feTurbulence filter across the whole screen at runtime.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SIZE = 128;
const MAX_ALPHA = 26;
const INK = [90, 64, 30];

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

let seed = 1873;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = [0];
  for (let x = 0; x < SIZE; x++) {
    const fibre = Math.abs(Math.sin((x + random() * 3) * 0.9 + y * 0.05));
    const alpha = Math.round(MAX_ALPHA * (0.55 * random() + 0.45 * fibre * random()));
    row.push(...INK, alpha);
  }
  rows.push(Buffer.from(row));
}
const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header.set([8, 6, 0, 0, 0], 8);
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('../src/assets/paper-noise.png', import.meta.url), png);
console.log(`Wrote src/assets/paper-noise.png (${png.length} bytes)`);
