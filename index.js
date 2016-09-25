function CloudflareCli(options) {
    var self = this;
    var CFClient = require('cloudflare');
    var fs = require('fs');
    var format = require('util').format;
    var allowedOptions = require('./lib/options');
    var commands = {
        add: {
            aliases: ['addrecord'],
            callback: addRecord,
            description: 'Add a new record'
        },
        help: {
            aliases: [],
            shortcut: 'h',
            callback: showHelp,
            description: 'Show help'
        }
    };
    var client;

    self.runCommand = runCommand;
    self.showHelp = showHelp;

    init(options);

    function init(options) {
        client = new CFClient({
            email: options.email,
            key: options.token
        });
    }

    function runCommand(command, options) {
        if (commands[command] != undefined) {
            var fn = commands[command].callback;
            fn(options);
        } else {
            console.log(allowedOptions);
        }
    }

    function addRecord(options) {
        getZone(options.domain).then(function (zone) {
            var record = CFClient.DNSRecord.create({
                zoneId: zone.id,
                type: options.type,
                name: options._[1],
                content: options._[2],
                ttl: options.ttl || 1,
                prio: options.priority || 0
            });
            client.addDNS(record).then(function (newRecord) {
                console.log(format(
                    'Added %s record %s -> %s',
                    newRecord.type,
                    newRecord.name,
                    newRecord.content)
                );
            }).catch(function(err) {
                console.log(err);
            });
        }).catch(function (err) {
            console.log(err);
        });
    }

    function editRecord(options) {

    }

    function removeRecord(options) {

    }

    function listRecords(options) {

    }

    function toggleDevMode(options) {

    }

    function purgeCache(options) {

    }

    function purgeFile(options) {

    }

    /**
     *
     * @param zoneName {String}
     * @returns {Promise}
     */

    function getZone(zoneName) {
        return client.browseZones({name: zoneName}).then(function (result) {
            return result.result[0];
        });
    }


    function showHelp() {
        console.log(fs.readFileSync(__dirname + '/doc/help.txt', 'utf8'));
    }
}


module.exports = CloudflareCli;