#!/usr/bin/env node
//
// Shifts the weight axis of the vendored Roboto Flex, so the theme can ask
// for the common weights while the font keeps drawing its light look.
//
//   npm run fontweight                  every Roboto Flex file in the theme
//   npm run fontweight -- <file>...     named files instead
//
// The theme's body text is drawn at weight 300, its medium text at 400 and
// its large titles at 200. Those are Roboto Flex's looks, and they make poor
// defaults for anybody who swaps the font: most fonts carry nothing but 400
// and 700, and one that does carry a light face turns thin. So the theme asks
// for 400, 500 and 300 instead, and the font is told to answer those with
// what it drew for 200, 300 and 400 before:
//
//   requested   100  300  400  500  700  1000
//   drawn       100  200  300  400  700  1000
//
// The shift lives in the font, not in `font-variation-settings`. A `wght`
// there is inherited and beats `font-weight` on every element below it, so
// anything that only sets a weight - Swagger UI's own styles, an author's CSS
// - would stop working.
//
// Only `fvar`, `avar` and `STAT` change; outlines and advances are untouched.
// An `avar` map must keep the axis default where it is, and the outlines are
// drawn at 400, so the requested default becomes 500 rather than moving the
// outlines to 300. Named instances and STAT values keep naming what they
// draw, so "Regular" now sits at 500.
//
// Run it after every update of the font. A file already shifted is left
// alone, and one whose weight axis looks like neither is refused. The `head`
// checksum adjustment is not recomputed: it covers the decoded font, which a
// WOFF2 decoder rebuilds anyway, and no browser checks it.
//
// No font library, like the font version tool beside this one. A WOFF2 is a
// directory followed by one Brotli stream of the concatenated tables; the
// three tables touched here are never transformed, so they are rewritten in
// the stream and the directory is encoded again around their new lengths.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { resolveThemeDir } from '../../runner/paths.js';

/** Where the theme keeps Roboto Flex, searched when no file is named. */
const FONT_DIR = path.posix.join('assets', 'fonts', 'robotoflex');

/** Requested weight, drawn weight. */
const MAP = [
  [100, 100],
  [300, 200],
  [400, 300],
  [500, 400],
  [700, 700],
  [1000, 1000],
];

/** The axis as the font ships it, and as this tool leaves it. */
const DRAWN = { min: 100, default: 400, max: 1000 };
const REQUESTED = { min: 100, default: 500, max: 1000 };

// The WOFF2 specification's fixed table-tag table; see the font version tool
// for why it is split on commas.
const KNOWN_TAGS = 'cmap,head,hhea,hmtx,maxp,name,OS/2,post,cvt ,fpgm,glyf,loca,prep,CFF ,VORG,EBDT,EBLC,gasp,hdmx,kern,LTSH,PCLT,VDMX,vhea,vmtx,BASE,GDEF,GPOS,GSUB,EBSC,JSTF,MATH,CBDT,CBLC,COLR,CPAL,SVG ,sbix,acnt,avar,bdat,bloc,bsln,cvar,fdsc,feat,fmtx,fvar,gvar,hsty,just,lcar,mort,morx,opbd,prop,trak,Zapf,Silf,Glat,Gloc,Feat,Sill'.split(',');

/** A refusal about one file, as opposed to a defect in this tool. */
class Unusable extends Error {}

/** A value on an axis, scaled to -1..1 around its default. */
function normalize(value, axis) {
  if (value < axis.default) {
    return (value - axis.default) / (axis.default - axis.min);
  }
  if (value > axis.default) {
    return (value - axis.default) / (axis.max - axis.default);
  }
  return 0;
}

/** The requested weight that draws as `drawn`, interpolated between the map's points. */
function requestedFor(drawn) {
  for (let i = 1; i < MAP.length; i++) {
    const [r0, d0] = MAP[i - 1];
    const [r1, d1] = MAP[i];
    if (drawn >= d0 && drawn <= d1) {
      return r0 + ((r1 - r0) * (drawn - d0)) / (d1 - d0);
    }
  }
  throw new Unusable(`weight ${drawn} lies outside the axis`);
}

/** The `avar` segment map for the weight axis, as F2Dot14 pairs. */
const SEGMENTS = MAP.map(([requested, drawn]) => [toF2Dot14(normalize(requested, REQUESTED)), toF2Dot14(normalize(drawn, DRAWN))]);
const IDENTITY = [
  [-16384, -16384],
  [0, 0],
  [16384, 16384],
];

function toF2Dot14(value) {
  return Math.round(value * 16384);
}

const readFixed = (buf, pos) => buf.readInt32BE(pos) / 65536;
const writeFixed = (buf, pos, value) => buf.writeInt32BE(Math.round(value * 65536), pos);

function readBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (pos >= buf.length) {
      throw new Unusable('truncated table directory');
    }
    const byte = buf[pos++];
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) {
      return [value, pos];
    }
  }
  throw new Unusable('malformed UIntBase128');
}

function writeBase128(value) {
  const bytes = [value & 0x7f];
  for (value = Math.floor(value / 128); value; value = Math.floor(value / 128)) {
    bytes.unshift((value & 0x7f) | 0x80);
  }
  return Buffer.from(bytes);
}

const pad4 = (n) => (n + 3) & ~3;

/**
 * A WOFF2 taken apart: its header, its directory entries with the bytes of
 * each table, and anything after the stream.
 */
function readWoff2(buf) {
  if (buf.length < 48 || buf.toString('ascii', 0, 4) !== 'wOF2') {
    throw new Unusable('not a WOFF2');
  }
  if (buf.toString('ascii', 4, 8) === 'ttcf') {
    throw new Unusable('a font collection, which nothing in the theme is vendored as');
  }
  if (buf.readUInt32BE(28) || buf.readUInt32BE(40)) {
    throw new Unusable('carries metadata or private data, which this tool would have to move');
  }
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);

  let pos = 48;
  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos++];
    const index = flags & 0x3f;
    const transform = (flags >> 6) & 0x03;
    let tag = KNOWN_TAGS[index];
    if (index === 63) {
      tag = buf.toString('ascii', pos, pos + 4);
      pos += 4;
    }
    let origLength;
    [origLength, pos] = readBase128(buf, pos);
    let transformLength = null;
    if (tag === 'glyf' || tag === 'loca' ? transform !== 3 : transform !== 0) {
      [transformLength, pos] = readBase128(buf, pos);
    }
    entries.push({ flags, tag, origLength, transformLength });
  }

  const stream = zlib.brotliDecompressSync(buf.subarray(pos, pos + compressedSize));
  let offset = 0;
  for (const entry of entries) {
    const length = entry.transformLength ?? entry.origLength;
    entry.data = stream.subarray(offset, offset + length);
    offset += length;
  }
  return { header: buf.subarray(0, 48), entries };
}

/**
 * The WOFF2 put back together. Only untransformed tables may have changed,
 * so for each of them the stored length is the table's own.
 */
function writeWoff2({ header, entries }) {
  const directory = [];
  let sfntSize = 12 + 16 * entries.length;
  for (const entry of entries) {
    if (entry.transformLength === null) {
      entry.origLength = entry.data.length;
    }
    directory.push(Buffer.from([entry.flags]));
    if ((entry.flags & 0x3f) === 63) {
      directory.push(Buffer.from(entry.tag, 'ascii'));
    }
    directory.push(writeBase128(entry.origLength));
    if (entry.transformLength !== null) {
      directory.push(writeBase128(entry.transformLength));
    }
    sfntSize += pad4(entry.origLength);
  }

  const stream = Buffer.concat(entries.map((e) => e.data));
  const compressed = zlib.brotliCompressSync(stream, {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: stream.length,
    },
  });

  const dir = Buffer.concat(directory);
  const out = Buffer.alloc(pad4(48 + dir.length + compressed.length));
  header.copy(out, 0);
  dir.copy(out, 48);
  compressed.copy(out, 48 + dir.length);
  out.writeUInt32BE(out.length, 8);
  out.writeUInt32BE(sfntSize, 16);
  out.writeUInt32BE(compressed.length, 20);
  return out;
}

/** The axes of `fvar`, in order, with where each record sits. */
function fvarAxes(fvar) {
  const axesOffset = fvar.readUInt16BE(4);
  const axisCount = fvar.readUInt16BE(8);
  const axisSize = fvar.readUInt16BE(10);
  const axes = [];
  for (let i = 0; i < axisCount; i++) {
    const at = axesOffset + i * axisSize;
    axes.push({ tag: fvar.toString('ascii', at, at + 4), at, min: readFixed(fvar, at + 4), default: readFixed(fvar, at + 8), max: readFixed(fvar, at + 12) });
  }
  return axes;
}

/** The segment maps of a version 1 `avar`, one array of pairs per axis. */
function avarSegments(avar) {
  if (avar.readUInt16BE(0) !== 1) {
    throw new Unusable(`avar version ${avar.readUInt16BE(0)}, where this tool knows version 1 only`);
  }
  const axisCount = avar.readUInt16BE(6);
  const segments = [];
  let pos = 8;
  for (let i = 0; i < axisCount; i++) {
    const count = avar.readUInt16BE(pos);
    pos += 2;
    const pairs = [];
    for (let j = 0; j < count; j++, pos += 4) {
      pairs.push([avar.readInt16BE(pos), avar.readInt16BE(pos + 2)]);
    }
    segments.push(pairs);
  }
  return segments;
}

function buildAvar(segments) {
  const parts = [Buffer.alloc(8)];
  parts[0].writeUInt16BE(1, 0);
  parts[0].writeUInt16BE(segments.length, 6);
  for (const pairs of segments) {
    const part = Buffer.alloc(2 + pairs.length * 4);
    part.writeUInt16BE(pairs.length, 0);
    pairs.forEach(([from, to], j) => {
      part.writeInt16BE(from, 2 + j * 4);
      part.writeInt16BE(to, 4 + j * 4);
    });
    parts.push(part);
  }
  return Buffer.concat(parts);
}

const samePairs = (a, b) => a.length === b.length && a.every(([f, t], i) => f === b[i][0] && t === b[i][1]);

/** Every named instance's weight, moved to the requested weight that draws it. */
function shiftInstances(fvar, axes, wghtIndex) {
  const instanceCount = fvar.readUInt16BE(12);
  const instanceSize = fvar.readUInt16BE(14);
  const first = fvar.readUInt16BE(4) + axes.length * fvar.readUInt16BE(10);
  for (let i = 0; i < instanceCount; i++) {
    const at = first + i * instanceSize + 4 + wghtIndex * 4;
    writeFixed(fvar, at, requestedFor(readFixed(fvar, at)));
  }
}

/** Every STAT value on the weight axis, moved the same way. */
function shiftStat(stat) {
  const designAxisSize = stat.readUInt16BE(4);
  const designAxisCount = stat.readUInt16BE(6);
  const designAxesOffset = stat.readUInt32BE(8);
  const axisValueCount = stat.readUInt16BE(12);
  const valuesOffset = stat.readUInt32BE(14);

  let wghtIndex = -1;
  for (let i = 0; i < designAxisCount; i++) {
    const at = designAxesOffset + i * designAxisSize;
    if (stat.toString('ascii', at, at + 4) === 'wght') {
      wghtIndex = i;
    }
  }
  if (wghtIndex < 0) {
    return;
  }

  const shift = (at) => writeFixed(stat, at, requestedFor(readFixed(stat, at)));
  for (let i = 0; i < axisValueCount; i++) {
    const at = valuesOffset + stat.readUInt16BE(valuesOffset + i * 2);
    const format = stat.readUInt16BE(at);
    if (format === 4) {
      const count = stat.readUInt16BE(at + 2);
      for (let j = 0; j < count; j++) {
        const record = at + 8 + j * 6;
        if (stat.readUInt16BE(record) === wghtIndex) {
          shift(record + 2);
        }
      }
      continue;
    }
    if (stat.readUInt16BE(at + 2) !== wghtIndex) {
      continue;
    }
    // Format 1 holds a value, 3 a value and the weight it links to, and 2 a
    // nominal value inside a range.
    const fields = { 1: [8], 2: [8, 12, 16], 3: [8, 12] }[format];
    if (!fields) {
      throw new Unusable(`STAT axis value format ${format}`);
    }
    fields.forEach((field) => shift(at + field));
  }
}

/** Shifts one file in place; says what it did, or why it did nothing. */
function remap(file) {
  const font = readWoff2(fs.readFileSync(file));
  const table = (tag) => font.entries.find((e) => e.tag === tag);
  const fvar = table('fvar');
  const avar = table('avar');
  const stat = table('STAT');
  if (!fvar || !avar) {
    throw new Unusable('no fvar or avar, so not a variable font this tool knows');
  }

  // Copies, because the parsed tables are views onto the decompressed stream.
  fvar.data = Buffer.from(fvar.data);
  const axes = fvarAxes(fvar.data);
  const wghtIndex = axes.findIndex((a) => a.tag === 'wght');
  if (wghtIndex < 0) {
    throw new Unusable('no weight axis');
  }
  const wght = axes[wghtIndex];
  const segments = avarSegments(avar.data);
  const sameAxis = (shape) => wght.min === shape.min && wght.default === shape.default && wght.max === shape.max;

  if (sameAxis(REQUESTED) && samePairs(segments[wghtIndex], SEGMENTS)) {
    return 'already shifted';
  }
  if (!sameAxis(DRAWN) || !(segments[wghtIndex].length === 0 || samePairs(segments[wghtIndex], IDENTITY))) {
    throw new Unusable(`weight axis ${wght.min}..${wght.default}..${wght.max} with a map of ${segments[wghtIndex].length} points, which this tool does not know how to shift`);
  }

  writeFixed(fvar.data, wght.at + 4, REQUESTED.min);
  writeFixed(fvar.data, wght.at + 8, REQUESTED.default);
  writeFixed(fvar.data, wght.at + 12, REQUESTED.max);
  shiftInstances(fvar.data, axes, wghtIndex);

  segments[wghtIndex] = SEGMENTS;
  avar.data = buildAvar(segments);

  if (stat) {
    stat.data = Buffer.from(stat.data);
    shiftStat(stat.data);
  }

  fs.writeFileSync(file, writeWoff2(font));
  return 'shifted';
}

const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const themeDir = resolveThemeDir();
const files = named.length
  ? named
  : fs
      .readdirSync(path.join(themeDir, FONT_DIR))
      .filter((f) => f.endsWith('.woff2'))
      .sort()
      .map((f) => path.join(themeDir, FONT_DIR, f));

/** Slashes whichever way the platform handed them over. */
const posix = (p) => p.split(path.sep).join('/');

for (const file of files) {
  const shown = posix(named.length ? file : path.relative(themeDir, file));
  try {
    console.log(`${shown}  ${remap(file)}`);
  } catch (err) {
    if (!(err instanceof Unusable)) {
      throw err;
    }
    console.log(`${shown}  refused: ${err.message}`);
    process.exitCode = 1;
  }
}
