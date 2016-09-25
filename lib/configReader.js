function ConfigReader(path) {

    var self = this;
    var fs = require('fs');

    self.readConfig = readConfig;

    function readConfig() {
        var config = {};
        if (fs.existsSync(path)) {
            var ymlConfig = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
            if (ymlConfig != undefined) {
                if (ymlConfig.defaults.account || argv.account) {
                    var account = (argv.account) ? argv.account : ymlConfig.defaults.account;
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
            }
        }

        return config;
    }
}

module.exports = ConfigReader;