const CloudflareCli = require('../index');
const ConfigReader = require('../lib/configReader');
const uuid = require('uuid/v4');
const _ = require('lodash');

const assert = require('assert');

const config = new ConfigReader().readConfig();
const cli = new CloudflareCli(config);
const zoneName = 'cloudflaretest.com';
const recordName = uuid();
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
  it('should use environment variables where available', function () {
    assert.equal(cli.key, process.env.CF_API_KEY);
    assert.equal(cli.email, process.env.CF_API_EMAIL);
  });
  it('shoud add a zone', function(done) {
    cli.addZone({name: zoneName}).then(
      function () {
        done();
      }
    ).catch(function(error) {
      console.log(error);
      done(error);
    });
  });
  it('should add an A record', function (done) {
    cli.addRecord({
      'domain': zoneName,
      'type': 'A',
      'name': recordName,
      'content': '8.8.8.8'
    }).then(function () {
      done();
    }).catch(function (error) {
      done(error);
    });
  });
  it('should find an A record', function (done) {
    cli.findRecord({domain: zoneName, 'name': recordName}).then(function (result) {
      assert.equal(result.messages[0].name, `${recordName}.${zoneName}`);
      done();
    });
  });
  it('should remove an A record', function (done) {
    cli.removeRecord({'domain': zoneName, 'name': recordName}).then(function () {
      done();
    });
  });
  it('should remove a zone', function (done) {
    cli.removeZone({name: zoneName}).then(function() {
      done();
    });
  })
});
