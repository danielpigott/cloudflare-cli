import minimist from 'minimist';

export function parseArgs(argv, allowedOptions = {}) {
  return minimist(argv, {
    ...allowedOptions,
    string: ['_', ...(allowedOptions.string || [])]
  });
}
