import { describe, expect, it, jest } from '@jest/globals';
import { MessageFormatter, TableFormatter } from '../lib/formatters.js';

describe('formatters (unit)', () => {
  it('prints each message with MessageFormatter', () => {
    const formatter = new MessageFormatter();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    formatter.format(['first', 'second']);

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls.map((call) => call[0])).toEqual(['first', 'second']);

    logSpy.mockRestore();
  });

  it('prints csv rows with TableFormatter', () => {
    const formatter = new TableFormatter({ head: ['Name'], values: ['name'] });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    formatter.format([{ name: 'first' }, { name: 'second' }], { format: 'csv' });

    expect(logSpy.mock.calls.map((call) => call[0])).toEqual(['first', 'second']);

    logSpy.mockRestore();
  });

  it('prints JSON with TableFormatter', () => {
    const formatter = new TableFormatter({ head: ['Name'], values: ['name'] });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const rows = [{ name: 'first' }];

    formatter.format(rows, { format: 'json' });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(rows));

    logSpy.mockRestore();
  });

  it('prints a table with TableFormatter', () => {
    const formatter = new TableFormatter({ head: ['Name'], values: ['name'] });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    formatter.format([{ name: 'first' }], { format: 'table' });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('first'));

    logSpy.mockRestore();
  });
});
