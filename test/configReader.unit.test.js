import { afterEach, describe, expect, it } from '@jest/globals';
import { ConfigReader } from '../lib/configReader.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('ConfigReader (unit)', () => {
  const tempFiles = [];

  afterEach(() => {
    tempFiles.forEach((filePath) => fs.existsSync(filePath) && fs.unlinkSync(filePath));
    tempFiles.length = 0;
    delete process.env.CF_API_KEY;
    delete process.env.CF_API_EMAIL;
    delete process.env.CF_API_DOMAIN;
  });

  it('returns environment values when no config file exists', () => {
    process.env.CF_API_KEY = 'env-token';
    process.env.CF_API_EMAIL = 'env@example.com';
    process.env.CF_API_DOMAIN = 'env.example.com';

    const configReader = new ConfigReader('/tmp/does-not-exist.yml');

    expect(configReader.readConfig()).toEqual({
      token: 'env-token',
      email: 'env@example.com',
      domain: 'env.example.com'
    });
  });

  it('loads defaults from a config file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfcli-'));
    const configPath = path.join(tempDir, '.cfcli.yml');
    tempFiles.push(configPath);

    fs.writeFileSync(configPath, `defaults:\n  token: file-token\n  email: file@example.com\n  domain: file.example.com\n`);

    const configReader = new ConfigReader(configPath);

    expect(configReader.readConfig()).toEqual({
      token: 'file-token',
      email: 'file@example.com',
      domain: 'file.example.com'
    });
  });

  it('loads a named account from a config file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfcli-'));
    const configPath = path.join(tempDir, '.cfcli.yml');
    tempFiles.push(configPath);

    fs.writeFileSync(configPath, `defaults:\n  account: main\naccounts:\n  main:\n    token: account-token\n    domain: account.example.com\n`);

    const configReader = new ConfigReader(configPath);

    expect(configReader.readConfig('main')).toEqual({
      token: 'account-token',
      domain: 'account.example.com'
    });
  });
});
