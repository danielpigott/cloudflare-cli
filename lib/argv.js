import { parseArgs as nodeParseArgs } from 'node:util';

function ensureValidOptionSyntax(argv) {
  for (const arg of argv) {
    if (typeof arg !== 'string') {
      continue;
    }

    if (arg.startsWith('-') && !arg.startsWith('--') && arg.length > 2) {
      throw new Error(`Invalid argument syntax: ${arg}. Use --${arg.slice(1)} instead of a single-dash long option.`);
    }
  }
}

function buildOptionDefinitions(allowedOptions = {}) {
  const aliases = allowedOptions.alias || {};
  const booleanOptions = new Set(allowedOptions.boolean || []);
  const options = {};

  for (const [longName, shortName] of Object.entries(aliases)) {
    options[longName] = {
      type: booleanOptions.has(longName) || booleanOptions.has(shortName) ? 'boolean' : 'string',
      short: shortName
    };
  }

  return options;
}

export function parseArgs(argv, allowedOptions = {}) {
  ensureValidOptionSyntax(argv);

  const { values, positionals } = nodeParseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: buildOptionDefinitions(allowedOptions)
  });

  const parsed = {
    _: positionals.map((value) => String(value))
  };

  for (const [key, value] of Object.entries(values)) {
    parsed[key] = value;
  }

  for (const [longName, shortName] of Object.entries(allowedOptions.alias || {})) {
    if (parsed[longName] !== undefined && parsed[shortName] === undefined) {
      parsed[shortName] = parsed[longName];
    }
  }

  const stringOptions = new Set([...(allowedOptions.string || [])]);
  for (const optionName of stringOptions) {
    if (parsed[optionName] !== undefined) {
      parsed[optionName] = String(parsed[optionName]);
    }
  }

  return parsed;
}
