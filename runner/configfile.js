// Reads Hugo configuration files in any of the formats Hugo itself reads.
//
// The format is told by the extension, as Hugo tells it. YAML is parsed with
// the same library the theme ships, so both read a file alike.

import fs from 'fs';
import path from 'path';
import * as TOML from 'js-toml';
import YAML from 'js-yaml';

/** The extensions Hugo reads configuration from, in the order it looks for them. */
export const CONFIG_EXTENSIONS = ['.toml', '.yaml', '.yml', '.json'];

/** Parse one configuration file; an empty file is an empty document. */
export function loadConfigFile(where) {
  const ext = path.extname(where).toLowerCase();
  const text = fs.readFileSync(where, 'utf8');
  switch (ext) {
    case '.toml':
      return TOML.load(text) || {};
    case '.yaml':
    case '.yml':
      return YAML.load(text) || {};
    case '.json':
      return text.trim() ? JSON.parse(text) : {};
    default:
      throw new Error(`${where}: ${ext || 'no extension'} is not a configuration format.`);
  }
}

/**
 * Find the configuration file `name` in `dir`, whatever its format, or null.
 * Should several formats exist, the first in Hugo's lookup order is taken.
 */
export function findConfigFile(dir, name) {
  for (const ext of CONFIG_EXTENSIONS) {
    const where = path.join(dir, name + ext);
    if (fs.existsSync(where)) {
      return where;
    }
  }
  return null;
}
