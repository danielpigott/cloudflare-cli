import { CloudflareCli } from './../index.js';
import { ConfigReader } from './../lib/configReader.js';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';

import { equal } from 'assert';

const config = new ConfigReader().readConfig();
const cli = new CloudflareCli(config);
const zoneName = 'afklafljlaf.com';
const recordName = uuid();
const recordContent = `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
const requiredEnvVars = [
  'CF_API_KEY',
];

_.each(requiredEnvVars, function (envVar) {
  if (process.env[envVar] === undefined) {
    console.log(`Missing env var ${envVar}`);
    process.exit(1);
  }
});

describe('CloudflareCli', function () {
  this.timeout(20000);
  it('should use environment variables where available', async function () {
    equal(cli.key, process.env.CF_API_KEY);
    equal(cli.email, process.env.CF_API_EMAIL);
  });
  it('should add a zone', async function () {
    try {
      await cli.addZone({ name: zoneName });
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data && error.response.data.errors) {
        console.log(error.response.data.errors);
      }
      throw error;
    }
  });
  it('should add an A record', async function () {
    await cli.addRecord({
      'domain': zoneName,
      'type': 'A',
      'name': recordName,
      'content': recordContent,
    });
  });
  it('should find an A record', async function () {
    const result = await cli.findRecord({ domain: zoneName, 'name': recordName });
    equal(result.messages[0].name, `${recordName}.${zoneName}`);
  });
  it('should find an A record using a query', async function () {
    const result = await cli.findRecord({ domain: zoneName, query: { content: recordContent } });
    equal(result.messages[0].name, `${recordName}.${zoneName}`);
  });
  it('should find an A record querying by name', async function () {
    const result = await cli.findRecord({ domain: zoneName, query: { name: recordName } });
    equal(result.messages[0].name, `${recordName}.${zoneName}`);
  });
  it('should not find an A record when using a non-matching query', async function () {
    const result = await cli.findRecord({ domain: zoneName, query: { content: 'xyz' } });
    equal(result.messages.length, 0);
  });
  it('should remove an A record', async function () {
    await cli.removeRecord({ 'domain': zoneName, 'name': recordName });
  });
  it('should remove a zone', async function () {
    await cli.removeZone({ name: zoneName });
  });
});
