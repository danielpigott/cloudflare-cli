/**
 * Read config at given path
 * @param path
 * @constructor
 */
function ConfigReader(path) {
  var self = this;
  var fs = require('fs');
  var util = require('util');
  var yaml = require('js-yaml');
  var _ = require('lodash');
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  path = path.replace('~', homePath);
  self.readConfig = readConfig;

  function readConfig(account) {
    var config = {};
    if (fs.existsSync(path)) {
      try {
        var ymlConfig = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
        if (ymlConfig != undefined) {
          if (ymlConfig.defaults.account || account) {
            account = (account) ? account : ymlConfig.defaults.account;
            if (ymlConfig.accounts[account] !== undefined) {
              config = ymlConfig.accounts[account];
            } else {
              console.log(util.format('Unable to find account %s', account));
              console.log('Available accounts: ');
              _.each(ymlConfig.accounts, function (acc, name) {
                console.log(util.format(' - %s', name));
              });
              return false;
            }
          } else {
            config = ymlConfig.defaults;
          }
        } else {
          throw new Error(util.format('Unable to parse file: %s', path));
        }
      } catch (error) {
        throw new Error(util.format('Invalid config file: %s message: ', path, error.message));
      }
    }
    return config;
  }
}

module.exports = ConfigReader;