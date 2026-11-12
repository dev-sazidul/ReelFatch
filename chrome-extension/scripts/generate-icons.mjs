import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

const root = path.join(fileURLToPath(new URL('..', import.meta.url)));
const iconDirectory = path.join(root, 'icons');
const theme = [30, 99, 184, 255];
const white = [255, 255, 255, 255];

await mkdir(iconDirectory, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const image = drawIcon(size);
  await writeFile(path.join(iconDirectory, `icon-${size}.png`), encodePng(size, size, image));
}

function drawIcon(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  fillRoundedRect(data, size, size * 0.22, theme);
  drawArrow(data, size, 0.52);
  return data;
}

function fillRoundedRect(data, size, radius, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = Math.abs(x + 0.5 - size / 2) - (size / 2 - radius);
      const dy = Math.abs(y + 0.5 - size / 2) - (size / 2 - radius);
      const distance = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - radius;
      const coverage = Math.min(1, Math.max(0, 0.75 - distance));
      if (coverage > 0) blend(data, size, x, y, color, coverage);
    }
  }
}

function drawArrow(data, size, scale) {
  const box = size * scale;
  const left = (size - box) / 2;
  const top = (size - box) / 2;
  const thickness = Math.max(1.4, box * 0.09);
  const point = (x, y) => [left + box * x, top + box * y];
  stroke(data, size, point(0.5, 0.12), point(0.5, 0.62), thickness);
  stroke(data, size, point(0.24, 0.4), point(0.5, 0.66), thickness);
  stroke(data, size, point(0.76, 0.4), point(0.5, 0.66), thickness);
  stroke(data, size, point(0.22, 0.82), point(0.78, 0.82), thickness);
}

function stroke(data, size, from, to, radius) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(length * 2));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    stampCircle(data, size, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, radius);
  }
}

function stampCircle(data, size, cx, cy, radius) {
  const minX = Math.max(0, Math.floor(cx - radius - 1));
  const maxX = Math.min(size - 1, Math.ceil(cx + radius + 1));
  const minY = Math.max(0, Math.floor(cy - radius - 1));
  const maxY = Math.min(size - 1, Math.ceil(cy + radius + 1));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const coverage = Math.min(1, Math.max(0, radius + 0.5 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy)));
      if (coverage > 0) blend(data, size, x, y, white, coverage);
    }
  }
}

function blend(data, width, x, y, color, coverage) {
  const index = (y * width + x) * 4;
  const amount = coverage * (color[3] / 255);
  data[index] = Math.round(data[index] * (1 - amount) + color[0] * amount);
  data[index + 1] = Math.round(data[index + 1] * (1 - amount) + color[1] * amount);
  data[index + 2] = Math.round(data[index + 2] * (1 - amount) + color[2] * amount);
  data[index + 3] = 255;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, rowStart + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}
