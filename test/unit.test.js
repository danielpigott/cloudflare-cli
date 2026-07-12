import { describe, expect, it } from '@jest/globals';
import { CloudflareCli } from '../index.js';

describe('FakeApiClient (unit)', () => {
  it('supports the CLI flow for adding, finding, editing and removing records', async () => {
    const cli = new CloudflareCli({ token: 'fake', apiClientType: 'fake' });

    await cli.addZone({ name: 'example.com' });

    const addResult = await cli.addRecord({
      domain: 'example.com',
      type: 'A',
      name: 'www',
      content: '1.2.3.4'
    });

    expect(addResult.messages[0]).toContain('Added');

    const findResult = await cli.findRecord({ domain: 'example.com', name: 'www' });
    expect(findResult.messages).toHaveLength(1);
    expect(findResult.messages[0].name).toBe('www.example.com');

    const editResult = await cli.editRecord({
      domain: 'example.com',
      name: 'www',
      content: '5.6.7.8'
    });

    expect(editResult.messages[0]).toContain('5.6.7.8');

    const removeResult = await cli.removeRecord({ domain: 'example.com', name: 'www' });
    expect(removeResult.messages[0]).toContain('Deleted');
  });
});
