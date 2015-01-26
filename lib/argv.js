yaml = require('js-yaml');
fs   = require('fs');
_ = require('lodash');
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
        'account': 'u'
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
    if(argv.help || argv._.length == 0) {
        argv = false;
    } else {
        var configPath = (argv.config) ? argv.config : homePath + '.cfcli.yml';
        if (fs.existsSync(configPath)) {
           try {
              var ymlConfig = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
            } catch (e) {
              console.log(e);
            }
        } else {
            console.log(configPath + ' not found');
        }
        if (ymlConfig != undefined) {
            if(ymlConfig.defaults.account) {
                var account = (argv.u)? argv.u : ymlConfig.defaults.account;
                argv = _.merge(ymlConfig.accounts[account], argv);
            } else {
                argv = _.merge(ymlConfig.defaults, argv);
            }
        }
        var valid = _.every(required, function(r) {
            if (argv[r] == undefined) {
                console.log('Missing required option: ' + r);
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
