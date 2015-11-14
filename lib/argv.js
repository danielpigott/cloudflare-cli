var yaml = require('js-yaml');
var fs   = require('fs');
var util = require('util');
var _ = require('lodash');
var opts = {
    alias : {
        'domain' : 'd',
        'type' : 't',
        'help' : 'h',
        'email' : 'e',
        'token' : 'k',
        'config' : 'c',
        'activate' : 'a',
        'format' : 'f',
        'ttl' : 'l',
        'account': 'u',
        'priority': 'p'
    },
    boolean : ['a'],
    default : {
        'type' : 'CNAME'
    }
};
var required = ['domain','email','token'];
var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/';
exports.run = function() {
    var argv = require('minimist')(process.argv.slice(2), opts);
    if(argv._.length == 0 && argv.help === false) {
        argv = false;
    } else if (argv.help === undefined || argv.help === false) {
        var configPath = (argv.config) ? argv.config : homePath + '.cfcli.yml';
        if (fs.existsSync(configPath)) {
           try {
              var ymlConfig = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
            } catch (e) {
              console.log(e);
            }
        } else {
            console.log(util.format('%s not found', configPath));
        }
        //load defaults from yml
        if (ymlConfig != undefined) {
            var defaults;
            if(ymlConfig.defaults.account || argv.account) {
                var account = (argv.account)? argv.account : ymlConfig.defaults.account;
                if (ymlConfig.accounts[account] !== undefined) {
                    defaults = ymlConfig.accounts[account];
                } else {
                    console.log(util.format('Unable to find account %s', account));
                    console.log('Available accounts: ');
                    _.each(ymlConfig.accounts, function(acc, name) {
                        console.log(util.format(' - %s', name));
                    });
                    return false;
                }
            } else {
                defaults = ymlConfig.defaults;
            }
            argv = _.extend(defaults, argv);
        }
        var valid = _.every(required, function(r) {
            if (argv[r] == undefined) {
                console.log(util.format('Missing required option: %s', r));
                return false;
            } else {
               return true;
            }
        });
        if (valid == false) {
            argv = false;
        }
    }

    return argv;
};
