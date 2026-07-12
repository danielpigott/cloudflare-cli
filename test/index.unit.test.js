import { describe, expect, it } from '@jest/globals';
import { CloudflareCli } from '../index.js';

describe('CloudflareCli index helpers (unit)', () => {
  it('maps params into the command argument positions', () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    const cmd = cli.getCommand('edit');
    const params = {
      _: ['edit', 'test.example.com', '1.2.3.4'],
      domain: 'example.com',
      query: 'name:test.example.com'
    };

    const mapped = cli.mapParams(cmd, params);

    expect(mapped.query).toEqual({ name: 'test.example.com' });
    expect(mapped.name).toBe('test.example.com');
    expect(mapped.content).toBe('1.2.3.4');
  });

  it('normalizes record options for SRV and activation flags', () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    const options = cli.mapRecordOptions({
      type: 'SRV',
      content: '1 2 3 target.example.com',
      name: '_sip._tcp.example.com',
      activate: true,
      domain: 'example.com',
      email: 'x',
      token: 'y',
      _: []
    });

    expect(options).toEqual(expect.objectContaining({
      data: {
        service: '_sip',
        proto: '_tcp',
        name: 'example.com',
        priority: 1,
        weight: 2,
        port: 3,
        target: 'target.example.com'
      },
      proxied: true,
      type: 'SRV',
      content: '1 2 3 target.example.com',
      name: '_sip._tcp.example.com'
    }));
  });

  it('builds query params from allowed values and omits undefined ones', () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    const query = cli.getQueryParams({ name: 'www', content: '1.2.3.4', type: 'A', query: { content: '1.2.3.4' }, ttl: undefined }, ['name', 'content', 'type', 'query']);

    expect(query).toEqual({ name: 'www', content: '1.2.3.4', type: 'A', query: { content: '1.2.3.4' } });
  });

  it('throws when edit cannot find a matching record', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    await cli.addZone({ name: 'example.com' });

    await expect(cli.editRecord({ domain: 'example.com', name: 'missing', content: '1.2.3.4' })).rejects.toThrow('No matching records found');
  });

  it('throws when edit finds multiple matching records', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    await cli.addZone({ name: 'example.com' });
    await cli.addRecord({ domain: 'example.com', type: 'A', name: 'www', content: '1.2.3.4' });
    await cli.addRecord({ domain: 'example.com', type: 'A', name: 'www', content: '1.2.3.5' });

    await expect(cli.editRecord({ domain: 'example.com', name: 'www', content: '1.2.3.6' })).rejects.toThrow('matching records found');
  });

  it('throws when removeRecord is missing a name', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });

    await expect(cli.removeRecord({ domain: 'example.com' })).rejects.toBe('name not provided');
  });

  it('throws a helpful error when no matching zone is found', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });

    await expect(cli.getZone('missing.example.com')).rejects.toThrow('No matching zones found');
  });

  it('returns help text and validates config requirements', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    const helpResult = await cli.showHelp();

    expect(helpResult.messages[0]).toContain('NAME');
    expect(() => cli.validateConfig({})).toThrow('required parameters');
  });

  it('supports toggling dev mode, purging cache and listing zones and records', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });
    await cli.addZone({ name: 'example.com' });
    await cli.addRecord({ domain: 'example.com', type: 'A', name: 'www', content: '1.2.3.4' });

    const devModeResult = await cli.toggleDevMode({ domain: 'example.com', mode: 'on' });
    expect(devModeResult.messages[0]).toContain('Dev mode changed');

    const purgeResult = await cli.purgeCache({ domain: 'example.com' });
    expect(purgeResult.messages).toBe('Purged cache successfully');

    const zonesResult = await cli.listZones();
    expect(zonesResult.messages).toHaveLength(1);

    const recordsResult = await cli.listRecords({ domain: 'example.com' });
    expect(recordsResult.messages).toHaveLength(1);
  });
});
