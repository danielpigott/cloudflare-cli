import { describe, expect, it } from '@jest/globals';
import { parseArgs } from '../lib/argv.js';
import allowedOptions from '../lib/options.js';

describe('parseArgs', () => {
  it('preserves leading-zero positional values as strings', () => {
    const argv = parseArgs(['add', '-d', 'test.com', '-t', 'CNAME', '000', 'abc.com'], allowedOptions);

    expect(argv._[1]).toBe('000');
    expect(argv._[2]).toBe('abc.com');
  });
});
