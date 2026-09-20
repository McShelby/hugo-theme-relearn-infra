#!/usr/bin/env node
//
// Reads the version a vendored font declares about itself.
//
//   npm run fontversion                  every font in the theme's assets
//   npm run fontversion -- <file>...     named files instead
//
// The dependency declaration wants a `version` for every component, and a font
// arrives without one: there is no manifest beside it, the file name carries
// nothing, and the distributor's own numbering describes their packaging
// rather than the font - Google Fonts serves Roboto Flex from a `v30` path
// while the font inside says 3.200. The number is in the file, in `head` and
// in the `name` table, and both survive subsetting and conversion. So this
// reads it out rather than leaving the component declared without one.
//
// Both fields are printed, because neither is reliably the answer: Roboto Flex
// agrees with itself, while Font Awesome's `head` reads 899.012 and only its
// name string mentions the 7.3.1 everyone calls it.
//
// No font library. A WOFF2 stores its tables as a single Brotli stream, which
// Node decompresses on its own, and `head` and `name` are never transformed -
// only `glyf` and `loca` are - so locating them by accumulated length is
// enough. A bare TTF or OTF is simpler still.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { resolveThemeDir } from '../../runner/paths.js';

/** Where a theme keeps fonts, searched when no file is named. */
const FONT_ROOT = path.posix.join('assets', 'fonts');

const EXTENSIONS = ['.woff2', '.ttf', '.otf'];

// The WOFF2 specification's fixed table-tag table; a directory entry stores an
// index into it. Comma-separated, because three of the tags are padded to four
// characters with a trailing space and splitting on whitespace would silently
// shift every index past them.
const KNOWN_TAGS = 'cmap,head,hhea,hmtx,maxp,name,OS/2,post,cvt ,fpgm,glyf,loca,prep,CFF ,VORG,EBDT,EBLC,gasp,hdmx,kern,LTSH,PCLT,VDMX,vhea,vmtx,BASE,GDEF,GPOS,GSUB,EBSC,JSTF,MATH,CBDT,CBLC,COLR,CPAL,SVG ,sbix,acnt,avar,bdat,bloc,bsln,cvar,fdsc,feat,fmtx,fvar,gvar,hsty,just,lcar,mort,morx,opbd,prop,trak,Zapf,Silf,Glat,Gloc,Feat,Sill'.split(',');

/** A refusal about one file, as opposed to a defect in this tool. */
class Unreadable extends Error {}

/**
 * A variable-length integer, most significant group first, seven bits a byte.
 *
 * Returns the value and the position after it, because every caller needs
 * both and the directory is parsed by walking forward through them.
 */
function readBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (pos >= buf.length) {
      throw new Unreadable('truncated table directory');
    }
    const byte = buf[pos++];
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) {
      return [value, pos];
    }
  }
  throw new Unreadable('malformed UIntBase128');
}

/** The tables of a bare TTF or OTF, by tag. */
function sfntTables(buf) {
  const numTables = buf.readUInt16BE(4);
  const at = {};
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    const tag = buf.toString('ascii', record, record + 4);
    const offset = buf.readUInt32BE(record + 8);
    const length = buf.readUInt32BE(record + 12);
    at[tag] = buf.subarray(offset, offset + length);
  }
  return at;
}

/**
 * The tables of a WOFF2, by tag.
 *
 * The directory is uncompressed and gives each table's length in the stream;
 * the tables themselves follow, concatenated in directory order with no
 * padding, as one Brotli stream. A transform length is present only when a
 * transform was applied, and `glyf`/`loca` invert the convention - for those
 * two, version 3 is the one that means "not transformed".
 */
function woff2Tables(buf) {
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);

  let pos = 48;
  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos++];
    const index = flags & 0x3f;
    const transform = (flags >> 6) & 0x03;

    let tag;
    if (index === 63) {
      tag = buf.toString('ascii', pos, pos + 4);
      pos += 4;
    } else {
      tag = KNOWN_TAGS[index];
    }

    let length;
    [length, pos] = readBase128(buf, pos);
    const transformed = tag === 'glyf' || tag === 'loca' ? transform !== 3 : transform !== 0;
    if (transformed) {
      [length, pos] = readBase128(buf, pos);
    }
    entries.push({ tag, length });
  }

  let stream;
  try {
    stream = zlib.brotliDecompressSync(buf.subarray(pos, pos + compressedSize));
  } catch {
    throw new Unreadable('the compressed table stream did not decompress');
  }

  const at = {};
  let offset = 0;
  for (const entry of entries) {
    at[entry.tag] = stream.subarray(offset, offset + entry.length);
    offset += entry.length;
  }
  return at;
}

function tablesOf(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 48) {
    throw new Unreadable('too short to be a font');
  }
  const signature = buf.toString('ascii', 0, 4);
  if (signature === 'wOF2') {
    return woff2Tables(buf);
  }
  if (signature === 'wOFF') {
    throw new Unreadable('WOFF 1 is not read here; nothing in the theme is vendored as one');
  }
  if (signature === 'OTTO' || signature === 'true' || buf.readUInt32BE(0) === 0x00010000) {
    return sfntTables(buf);
  }
  throw new Unreadable(`unrecognised signature ${JSON.stringify(signature)}`);
}

/**
 * `head.fontRevision`, the version as a number.
 *
 * A 16.16 fixed-point value, which is why it is printed to three decimals: a
 * font numbered 3.200 is not 3.2 to anyone who reads its release notes.
 */
function fontRevision(head) {
  if (!head || head.length < 8) {
    return null;
  }
  return (head.readUInt32BE(4) / 65536).toFixed(3);
}

/** The `name` table's version string, which carries what built it too. */
function nameVersion(name) {
  if (!name || name.length < 6) {
    return null;
  }
  const count = name.readUInt16BE(2);
  const storage = name.readUInt16BE(4);

  for (let i = 0; i < count; i++) {
    const record = 6 + i * 12;
    if (record + 12 > name.length) {
      return null;
    }
    if (name.readUInt16BE(record + 6) !== 5) {
      continue;
    }
    const platform = name.readUInt16BE(record);
    const length = name.readUInt16BE(record + 8);
    const offset = storage + name.readUInt16BE(record + 10);
    const bytes = name.subarray(offset, offset + length);

    // Macintosh records are single-byte; the Unicode and Windows platforms
    // are both UTF-16BE. Copied before swapping, because these buffers are
    // views onto the decompressed stream and swapping is in place.
    if (platform === 1) {
      return bytes.toString('latin1');
    }
    return bytes.length % 2 ? null : Buffer.from(bytes).swap16().toString('utf16le');
  }
  return null;
}

/** Every font below a directory, as paths relative to the theme. */
function fontsUnder(themeDir, dir) {
  const full = path.join(themeDir, dir);
  if (!fs.existsSync(full)) {
    return [];
  }
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const child = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...fontsUnder(themeDir, child));
    } else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      out.push(child);
    }
  }
  return out.sort();
}

const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const themeDir = resolveThemeDir();
const files = named.length ? named : fontsUnder(themeDir, FONT_ROOT);

if (!files.length) {
  console.error(`no fonts found under ${FONT_ROOT}`);
  process.exitCode = 1;
}

/** Slashes whichever way the platform handed them over. */
const posix = (p) => p.split(path.sep).join('/');

// Grouped by directory, because that is the unit a component declares. The
// question this answers is "what single version does this component get", and
// it only has an answer while every file under the directory agrees.
const byDirectory = new Map();
let failed = false;

for (const file of files) {
  const where = named.length ? file : path.join(themeDir, file);
  const shown = posix(file);
  let reading;

  try {
    const at = tablesOf(where);
    reading = { shown, head: fontRevision(at.head), name: nameVersion(at.name) };
  } catch (err) {
    if (!(err instanceof Unreadable)) {
      throw err;
    }
    reading = { shown, error: err.message };
    failed = true;
  }

  const dir = path.posix.dirname(shown);
  byDirectory.set(dir, [...(byDirectory.get(dir) || []), reading]);
}

// Both fields, never one presented as the answer. `head.fontRevision` is a
// fixed-point number a foundry may use however it likes - Font Awesome's reads
// 899.012 while the version it means, and the one the declaration carries, is
// the 7.3.1 inside its name string. Deciding between them is a person's job;
// this only puts them side by side.
for (const [dir, readings] of byDirectory) {
  const distinct = new Set(readings.map((r) => `${r.error ?? ''}\u0000${r.head ?? ''}\u0000${r.name ?? ''}`));
  const [first] = readings;

  if (distinct.size === 1 && !first.error) {
    console.log(`${dir}  (${readings.length} file(s), agreeing)`);
    console.log(`  head  ${first.head ?? '<none>'}`);
    console.log(`  name  ${first.name ?? '<none>'}`);
  } else {
    console.log(`${dir}  no single version`);
    for (const r of readings) {
      console.log(`  ${r.shown}`);
      console.log(`    ${r.error ?? `head ${r.head ?? '<none>'} | name ${r.name ?? '<none>'}`}`);
    }
    failed = true;
  }
  console.log('');
}

if (failed) {
  process.exitCode = 1;
}
