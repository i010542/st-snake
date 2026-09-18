import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');

const BG = [11, 18, 32, 255];
const BODY = [54, 211, 153, 255];
const HEAD = [167, 243, 208, 255];
const FOOD = [255, 180, 84, 255];
const FOOD_IN = [255, 230, 184, 255];

const PATTERN = [
  '................................',
  '................................',
  '..........HHHHHH................',
  '........HH######HH..............',
  '......HH##########o.............',
  '.....H######HHHHHH..............',
  '....H#####H.....................',
  '....H####H......................',
  '....H#####HHHH..................',
  '.....HH########HH...............',
  '.......HHHH######H..............',
  '............H#####H.............',
  '.............H#####H............',
  '....HHHHHHHHH######H............',
  '...H##############H.............',
  '....HHHH######HHHH..............',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  const crcSource = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcSource));
  return Buffer.concat([header, crcSource, crc]);
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    pixels[y].copy(raw, rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function colorAt(ch) {
  if (ch === 'H') {
    return HEAD;
  }
  if (ch === '#') {
    return BODY;
  }
  if (ch === 'o') {
    return FOOD;
  }
  return BG;
}

function paintBase() {
  const rows = PATTERN.map((line) => {
    const row = Buffer.alloc(32 * 4);
    for (let x = 0; x < 32; x += 1) {
      const [r, g, b, a] = colorAt(line[x] ?? '.');
      row[x * 4] = r;
      row[x * 4 + 1] = g;
      row[x * 4 + 2] = b;
      row[x * 4 + 3] = a;
    }
    return row;
  });

  const foodX = 21;
  const foodY = 4;
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    const x = foodX + dx;
    const y = foodY + dy;
    if (y >= 0 && y < 32 && x >= 0 && x < 32 && PATTERN[y][x] === '.') {
      rows[y][x * 4] = FOOD_IN[0];
      rows[y][x * 4 + 1] = FOOD_IN[1];
      rows[y][x * 4 + 2] = FOOD_IN[2];
      rows[y][x * 4 + 3] = FOOD_IN[3];
    }
  }

  return rows;
}

function scaleNearest(source, size) {
  const scale = size / 32;
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const srcY = Math.min(31, Math.floor(y / scale));
    const row = Buffer.alloc(size * 4);
    for (let x = 0; x < size; x += 1) {
      const srcX = Math.min(31, Math.floor(x / scale));
      source[srcY].copy(row, x * 4, srcX * 4, srcX * 4 + 4);
    }
    rows.push(row);
  }
  return rows;
}

function encodeIco(pngBySize) {
  const sizes = Object.keys(pngBySize).map(Number).sort((a, b) => a - b);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const entries = [];
  const blobs = [];
  let offset = 6 + 16 * sizes.length;

  for (const size of sizes) {
    const png = pngBySize[size];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    blobs.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...blobs]);
}

const base = paintBase();
const png1024 = encodePng(1024, 1024, scaleNearest(base, 1024));
const png256 = encodePng(256, 256, scaleNearest(base, 256));
const png48 = encodePng(48, 48, scaleNearest(base, 48));
const png32 = encodePng(32, 32, base);
const png16 = encodePng(16, 16, scaleNearest(base, 16));

mkdirSync(assets, { recursive: true });
writeFileSync(join(assets, 'icon.png'), png1024);
writeFileSync(
  join(assets, 'icon.ico'),
  encodeIco({ 16: png16, 32: png32, 48: png48, 256: png256 }),
);

console.log('Wrote original first-version icons to assets/icon.png and assets/icon.ico');
