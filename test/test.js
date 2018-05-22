const CloudflareCli = require('../index');
const ConfigReader =  require('../lib/configReader');
const uuid = require('uuid/v4');

const assert = require('assert');

const email = 'test@null.nul';
const key = 'PRETENDKEY';
const config = new ConfigReader().readConfig();
const cli = new CloudflareCli(config);
const recordName = uuid();

describe('CloudflareCli', function () {
  this.timeout(5000);
  it('should use environment variables where available', function () {
    assert.equal(cli.key, process.env.CF_API_KEY);
    assert.equal(cli.email, process.env.CF_API_EMAIL);
  });
  it('should add an A record', function(done) {
    cli.addRecord({'domain': config.domain, 'type': 'A', 'name': recordName, 'content': '8.8.8.8'}).then(function(result) {
      done();
    }).catch(function (error) {
      console.log(error.response.data.errors);
      done(error);
    });
  });
  it('should remove an A record', function (done) {
    cli.removeRecord({'domain': config.domain, 'name': recordName}).then(function() {
      done();
    });
  });
});
