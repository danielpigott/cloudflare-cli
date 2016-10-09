function CloudflareCli(options) {
    var self = this;
    var _ = require('lodash');
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
        },
        purge: {
            aliases: ['purgefile'],
            callback: purgeCache,
            description: 'Purge files from cache'
        },
        devmode: {
            aliases: [],
            callback: toggleDevMode,
            description: "Turn dev mode on or off"
        },
        rm : {
            aliases: ['removerecord'],
            callback: removeRecord,
            description: 'Remove a record'
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
            fn(options).then(function(result) {
              console.log(result);
            }).catch(function(error) {
                console.log(error);
            });
        } else {
            console.log(allowedOptions);
        }
    }

    function addRecord(options) {
        return getZone(options.domain).then(
            function (zone) {
            return CFClient.DNSRecord.create({
                zoneId: zone.id,
                type: options.type,
                name: options._[1],
                content: options._[2],
                ttl: options.ttl || 1,
                prio: options.priority || 0
            })})
            .then(function(record) {
            return client.addDNS(record).then(function (newRecord) {
                console.log(format(
                    'Added %s record %s -> %s',
                    newRecord.type,
                    newRecord.name,
                    newRecord.content)
                );
            });
        })
    }

    function editRecord(options) {

    }

    /**
     * Remove a record/record(s) matching the given name
     * @param options
     */
    function removeRecord(options) {
        return getZone(options.domain).then(function(zone) {
            return client.browseDNS(zone, {name: options._[1]});
        }).then(function(records) {
            if (records.count == 0) {
                throw new Error('No matching records found');
            }
            var results = [];
            _.each(records.result, function (record) {
                results.push(client.deleteDNS(record));
            });
            return Promise.all(results);
        });
    }

    function listRecords(options) {

    }

    function toggleDevMode(options) {
        getZone(options.domain).then(function (zone) {
            zone.devMode = (options._[1] == 'on');
            return client.editZone(zone);

        }).then(function(result) {
            console.log(result);
        }).catch(function(error) {
            console.log(error);
        });
    }

    /**
     * Purge files from cache
     * @param options
     * @returns {Promise}
     */
    function purgeCache(options) {
        return getZone(options.domain).then(function (zone) {
            var query = (options._[1]) ? {files : [options._[1]]} :  {purge_everything : true};
            return client.deleteCache(zone, query);
        });
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