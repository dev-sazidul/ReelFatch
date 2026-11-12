import { deflateSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const config = JSON.parse(await readFile(path.join(projectRoot, 'pwa.config.json'), 'utf8'));
const publicDirectory = path.join(projectRoot, 'public');
const iconDirectory = path.join(publicDirectory, 'icons');
const splashDirectory = path.join(publicDirectory, 'splash');

const theme = hexToRgb(config.themeColor);
const background = hexToRgb(config.backgroundColor);
const white = [255, 255, 255, 255];

const splashDevices = [
  { name: 'iphone-se', width: 750, height: 1334, ratio: 2 },
  { name: 'iphone-14', width: 1170, height: 2532, ratio: 3 },
  { name: 'iphone-14-pro', width: 1179, height: 2556, ratio: 3 },
  { name: 'iphone-14-plus', width: 1284, height: 2778, ratio: 3 },
  { name: 'iphone-14-pro-max', width: 1290, height: 2796, ratio: 3 },
  { name: 'ipad-10', width: 1620, height: 2160, ratio: 2 },
  { name: 'ipad-pro-11', width: 1668, height: 2388, ratio: 2 },
  { name: 'ipad-pro-12', width: 2048, height: 2732, ratio: 2 },
];

await mkdir(iconDirectory, { recursive: true });
await mkdir(splashDirectory, { recursive: true });

const icon192 = drawIcon(192, false);
const icon512 = drawIcon(512, false);
const maskable192 = drawIcon(192, true);
const maskable512 = drawIcon(512, true);
const apple = drawIcon(180, false);

await Promise.all([
  writeFile(path.join(iconDirectory, 'icon-192.png'), encodePng(192, 192, icon192)),
  writeFile(path.join(iconDirectory, 'icon-512.png'), encodePng(512, 512, icon512)),
  writeFile(path.join(iconDirectory, 'maskable-192.png'), encodePng(192, 192, maskable192)),
  writeFile(path.join(iconDirectory, 'maskable-512.png'), encodePng(512, 512, maskable512)),
  writeFile(path.join(iconDirectory, 'apple-touch-icon.png'), encodePng(180, 180, apple)),
]);

const mark = drawIcon(256, false);
const splashManifest = [];
for (const device of splashDevices) {
  for (const orientation of ['portrait', 'landscape']) {
    const width = orientation === 'portrait' ? device.width : device.height;
    const height = orientation === 'portrait' ? device.height : device.width;
    const image = splashImage(width, height, mark);
    const href = `/splash/${device.name}-${orientation}.png`;
    await writeFile(path.join(splashDirectory, `${device.name}-${orientation}.png`), encodePng(width, height, image));
    const cssWidth = width / device.ratio;
    const cssHeight = height / device.ratio;
    splashManifest.push({
      href,
      media: `screen and (device-width: ${cssWidth}px) and (device-height: ${cssHeight}px) and (-webkit-device-pixel-ratio: ${device.ratio}) and (orientation: ${orientation})`,
    });
  }
}

await writeFile(path.join(projectRoot, 'src/config/apple-splash.json'), `${JSON.stringify(splashManifest, null, 2)}\n`, 'utf8');

function drawIcon(size, maskable) {
  const data = new Uint8ClampedArray(size * size * 4);
  if (maskable) {
    fillRect(data, size, theme);
  } else {
    fillRoundedRect(data, size, size * 0.22, theme);
  }
  const glyphScale = maskable ? 0.42 : 0.5;
  drawArrow(data, size, glyphScale);
  return data;
}

function splashImage(width, height, mark) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = background[0];
    data[i + 1] = background[1];
    data[i + 2] = background[2];
    data[i + 3] = 255;
  }
  const markSize = 256;
  blit(data, width, mark, markSize, Math.round((width - markSize) / 2), Math.round((height - markSize) / 2));
  return data;
}

function fillRect(data, size, color) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = 255;
  }
}

function fillRoundedRect(data, size, radius, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const coverage = roundedCoverage(x + 0.5, y + 0.5, size, size, radius);
      if (coverage > 0) blend(data, size, x, y, color, coverage);
    }
  }
}

function drawArrow(data, size, scale) {
  const box = size * scale;
  const left = (size - box) / 2;
  const top = (size - box) / 2;
  const thickness = Math.max(3, box * 0.075);
  const point = (x, y) => [left + box * x, top + box * y];
  const shaftTop = point(0.5, 0.16);
  const shaftBottom = point(0.5, 0.62);
  const leftHead = point(0.28, 0.42);
  const rightHead = point(0.72, 0.42);
  const baseLeft = point(0.24, 0.8);
  const baseRight = point(0.76, 0.8);
  stroke(data, size, shaftTop, shaftBottom, thickness);
  stroke(data, size, leftHead, shaftBottom, thickness);
  stroke(data, size, rightHead, shaftBottom, thickness);
  stroke(data, size, baseLeft, baseRight, thickness);
}

function stroke(data, size, from, to, radius) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(length));
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
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = Math.min(1, Math.max(0, radius + 0.5 - distance));
      if (coverage > 0) blend(data, size, x, y, white, coverage);
    }
  }
}

function blit(dest, destWidth, src, srcSize, offsetX, offsetY) {
  for (let y = 0; y < srcSize; y += 1) {
    for (let x = 0; x < srcSize; x += 1) {
      const srcIndex = (y * srcSize + x) * 4;
      const alpha = src[srcIndex + 3] / 255;
      if (alpha === 0) continue;
      blend(dest, destWidth, offsetX + x, offsetY + y, [src[srcIndex], src[srcIndex + 1], src[srcIndex + 2], 255], alpha);
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

function roundedCoverage(px, py, width, height, radius) {
  const dx = Math.abs(px - width / 2) - (width / 2 - radius);
  const dy = Math.abs(py - height / 2) - (height / 2 - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  const distance = outside + inside - radius;
  return Math.min(1, Math.max(0, 0.75 - distance));
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

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16), 255];
}
