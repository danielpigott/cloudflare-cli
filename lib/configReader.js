/**
 * Read config at given path
 * @param path
 * @constructor
 */
function ConfigReader(path) {
  const self = this;
  const fs = require('fs');
  const util = require('util');
  const yaml = require('js-yaml');
  const _ = require('lodash');
  const allowedEnvironmentVars = {
    token: 'CF_API_KEY',
    email: 'CF_API_EMAIL',
    domain: 'CF_API_DOMAIN'
  };
  const requiredOptions = ['token', 'email'];
  const homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];


  path = path ? path.replace('~', homePath) : false;
  self.readConfig = readConfig;

  function validateConfig(config) {
    let missing = [];
    _.each(requiredOptions, function (option) {
      if (config[option] === undefined) {
        missing.push(option);
      }
    });
    if (missing.length > 0) {
      throw new Error('The following required parameters were not provided: ' + missing.join(','));
    }
  }

  function readConfig(account) {
    let config = {};
    //Load allowed environment variables
    const envConfig = _.fromPairs(
      _.filter(_.map(allowedEnvironmentVars, function (envVar, key) {
          if (process.env[envVar]) {
            return [key, process.env[envVar]];
          } else {
            return false;
          }
        }
      ), function (value) {
        return value !== false;
      })
    );
    if (path && fs.existsSync(path)) {
      try {
        const ymlConfig = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
        if (ymlConfig !== undefined) {
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
    let mergedConfig = _.extend(config, envConfig);
    validateConfig(mergedConfig);
    return mergedConfig;
  }
}

module.exports = ConfigReader;