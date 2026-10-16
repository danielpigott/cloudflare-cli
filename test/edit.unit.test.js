import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const transport = new URL('./fixtures/edit-transport.mjs', import.meta.url).href;

describe('CLI edits with a domain-scoped mock transport', () => {
  it.each([
    ['edit', 'www', '192.0.2.2'],
    ['enable', 'www'],
    ['disable', 'www'],
    ['enable', 'shared', '192.0.2.2'],
    ['disable', 'shared', '192.0.2.2']
  ])('keeps the configured domain for %s', (...command) => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cfcli-edit-'));
    try {
      fs.writeFileSync(path.join(home, '.cfcli.yml'), 'defaults:\n  token: dummy-token\n  domain: example.com\n');
      const env = { ...process.env, HOME: home, USERPROFILE: home, NODE_OPTIONS: '' };
      delete env.CF_API_KEY;
      delete env.CF_API_EMAIL;
      delete env.CF_API_DOMAIN;
      const result = spawnSync(process.execPath, ['--import', transport, path.join(root, 'bin/cfcli'), ...command], { env, encoding: 'utf8' });

      expect(result.error).toBeUndefined();
      expect({ status: result.status, stderr: result.stderr, stdout: result.stdout }).toEqual({
        status: 0,
        stderr: '',
        stdout: expect.stringContaining('Updated A record')
      });
      expect(result.stdout).toContain(`Updated A record ${command[2] || '192.0.2.1'} (id: ${command[1] === 'shared' ? 'record-shared-2' : 'record-www'})`);
    } finally {
      fs.rmSync(home, { recursive: true });
    }
  });
});
