/**
 *
 * @param options
 * @constructor
 */
function CloudflareCli(options) {
  var self = this;
  var _ = require('lodash');
  var CFClient = require('cloudflare');
  var fs = require('fs');
  var format = require('util').format;
  var allowedOptions = require('./lib/options');
  var client;
  /**
   * Available commands
   * @type {Object}
   */
  var commands = {
    add: {
      aliases: ['add', 'addrecord'],
      callback: addRecord,
      description: 'Add a new record',
      options: ['name', 'content']
    },
    find: {
      aliases: ['find'],
      callback: findRecord,
      description: 'Find a record',
      options: ['pattern']
    },
    help: {
      aliases: ['help'],
      shortcut: 'h',
      callback: showHelp,
      description: 'Show help'
    },
    purge: {
      aliases: ['purge', 'purgefile'],
      callback: purgeCache,
      description: 'Purge files from cache'
    },
    devmode: {
      aliases: ['devmode'],
      callback: toggleDevMode,
      description: "Turn dev mode on or off"
    },
    rm: {
      aliases: ['rm', 'removerecord'],
      callback: removeRecord,
      description: 'Remove a record'
    },
    ls: {
      aliases: ['ls', 'listrecords', 'list'],
      callback: listRecords,
      description: 'List records for given domain'
    }
  };

  self.runCommand = runCommand;
  self.showHelp = showHelp;

  init(options);

  function init(options) {
    client = new CFClient({
      email: options.email,
      key: options.token
    });
  }

  /**
   * Run the given command and output the result
   * @param command
   * @param options
   */
  function runCommand(command, options) {
    var cmd = getCommand(command);
    if (cmd) {
      var fn = cmd.callback;
      var opts = _.extend(options, _.fromPairs(_.zip(cmd.options, _.drop(options._,1))));
      fn(opts).then(function (result) {
        _.each(result.messages, function (message) {
          console.log(message);
        });
      }).catch(function (error) {
        console.log(error);
      });
    } else {
      // console.log(allowedOptions);
    }
  }

  /**
   * Create a new record of the given type
   * @param options
   * @return {*}
   */
  function addRecord(options) {
    return getZone(options.domain).then(
      function (zone) {
        return CFClient.DNSRecord.create({
          zoneId: zone.id,
          type: options.type,
          name: options.name,
          content: options.content,
          ttl: options.ttl || 1,
          prio: options.priority || 0
        })
      })
      .then(function (record) {
        return client.addDNS(record);
      }).then(function (newRecord) {
          return new Result(
            [
              format(
                'Added %s record %s -> %s',
                newRecord.type,
                newRecord.name,
                newRecord.content
              )
            ]
          );
        }
      )
  }

  function editRecord(options) {
    return getZone(options.domain).then(function (zone) {

    });
  }

  /**
   * Remove a record/record(s) matching the given name
   * @param options
   */
  function removeRecord(options) {
    return getZone(options.domain).then(function (zone) {
      return client.browseDNS(zone, {name: options._[1]});
    }).then(function (records) {
      if (records.count == 0) {
        throw new Error('No matching records found');
      }
      var results = [];
      _.each(records.result, function (record) {
        results.push(client.deleteDNS(record));
      });
      return Promise.all(results);
    }).then(function (results) {
      return new Result(results);
    });
  }

  /**
   *
   * @param options
   */
  function findRecord(options) {
  }

  function listRecords(options) {
    return getZone(options.domain).then(function (zone) {
      return client.browseDNS(zone);
    }).then(function (result) {
      var rows = [];
      _.each(result.result, function (item) {
        rows.push(format('%s %s %s', item.name, item.content, item.type));
      });
      return new Result(rows);
    });
  }

  /**
   * Enable/disable dev mode
   * @param options
   */
  function toggleDevMode(options) {
    return getZone(options.domain).then(function (zone) {
      zone.devMode = (options._[1] == 'on');
      return client.editZone(zone);

    }).then(function (result) {
      return new Result([result]);
    })
  }

  /**
   * Purge files from cache
   * @param options
   * @returns {Promise}
   */
  function purgeCache(options) {
    return getZone(options.domain).then(function (zone) {
      var query = (options._[1]) ? {files: [options._[1]]} : {purge_everything: true};
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

  /**
   *
   */
  function showHelp() {
    console.log(fs.readFileSync(__dirname + '/doc/help.txt', 'utf8'));
  }

  /**
   *
   * @param commandName
   */
  function getCommand(commandName) {
    return _.find(commands, function (command) {
      return _.includes(command.aliases, commandName);
    });
  }
}

/**
 *
 * @param messages
 * @constructor
 */
function Result(messages) {
  this.messages = messages;
}

module.exports = CloudflareCli;