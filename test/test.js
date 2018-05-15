var CloudflareCli = require('../index');
var assert = require('assert');

var email = 'test@null.nul';
var key = 'PRETENDKEY';

var cli = new CloudflareCli({email: email, key: key});

describe('CloudflareCli', function() {
  describe('init()', function() {
    it('should set email and key when constructed with email and key', function() {
      assert.equal(cli.key, key);
      assert.equal(cli.email, email);
    });
  });
});