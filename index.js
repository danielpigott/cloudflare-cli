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
  var formatters = require('./lib/formatters');
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
      params: ['name', 'content'],
      optionalParams: [],
      mergeAdditionalParams: true,
      formatter: new formatters.MessageFormatter()
    },
    devmode: {
      aliases: ['devmode'],
      callback: toggleDevMode,
      params: ['mode'],
      optionalParams: [],
      description: "Turn dev mode on or off",
      formatter: new formatters.MessageFormatter()
    },
    disable: {
      aliases: ['disable', 'disablecf'],
      callback: disableProxy,
      description: 'Enable cloudflare caching for given record',
      params: ['name'],
      optionalParams: ['content']
    },
    edit: {
      aliases: ['edit', 'editrecord'],
      callback: editRecord,
      description: 'Edit a DNS record',
      params: ['name', 'content'],
      optionalParams: []
    },
    enable: {
      aliases: ['enable', 'enablecf'],
      callback: enableProxy,
      description: 'Enable cloudflare caching for given record',
      params: ['name'],
      optionalParams: ['content']
    },
    find: {
      aliases: ['find'],
      callback: findRecord,
      description: 'Find a record',
      params: ['name'],
      optionalParams: ['content'],
      formatter: new formatters.TableFormatter({
        head: ['Type', 'Name', 'Value', 'TTL', 'Active'],
        colWidths: [8, 40, 50, 10, 10],
        values: ['type', 'name', 'content', 'ttl', 'proxied']
      })
    },
    help: {
      aliases: ['help'],
      shortcut: 'h',
      params: [],
      callback: showHelp,
      description: 'Show help'
    },
    purge: {
      aliases: ['purge', 'purgefile', 'purgecache'],
      callback: purgeCache,
      params: [],
      description: 'Purge files from cache'
    },
    rm: {
      aliases: ['rm', 'removerecord'],
      callback: removeRecord,
      description: 'Remove a record',
      params: ['name'],
      optionalParams: ['content'],
      formatter: new formatters.MessageFormatter()
    },
    ls: {
      aliases: ['ls', 'listrecords', 'list'],
      callback: listRecords,
      params: [],
      optionalParams: [],
      description: 'List records for given domain',
      formatter: new formatters.TableFormatter({
        head: ['Type', 'Name', 'Value', 'TTL', 'Active'],
        colWidths: [8, 40, 50, 10, 10],
        values: ['type', 'name', 'content', 'ttl', 'proxied']
      })
    },
    zones: {
      aliases: ['zones', 'listdomains'],
      callback: listZones,
      params: [],
      description: 'List zones in your cloudflare account',
      formatter: new formatters.TableFormatter({
        head: ['Name', 'Plan', 'Active', 'ID'],
        colWidths: [50, 20, 10, 40],
        values: ['name', 'planName', 'status', 'id']
      })
    }
  };

  self.runCommand = runCommand;
  self.showHelp = showHelp;

  init(options);

  /**
   * Set up client
   * @param options
   */
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
      var opts = mapParams(cmd, options);
      fn(opts).then(function (result) {
        if (cmd.formatter) {
          cmd.formatter.format(result.messages, options);
        } else {
          console.log(result);
        }
        process.exit();
      }).catch(function (error) {
        var formatter = new formatters.MessageFormatter();
        formatter.format(['Error: ' + error.message]);
        process.exit(1);
      });
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
        return CFClient.DNSRecord.create(
          _.extend({zoneId: zone.id}, mapRecordOptions(options)));
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

  /**
   * Enable proxying/caching for given record
   * @param options
   * @return {Promise}
   */
  function enableProxy(options) {
    options.activate = true;
    return editRecord(options);
  }

  /**
   * Disable proxying/caching for given record
   * @param options
   * @return {Promise}
   */
  function disableProxy(options) {
    options.activate = false;
    return editRecord(options);
  }

  /**
   * Edit a record
   * @param options
   * @returns {Promise}
   */
  function editRecord(options) {
    return find(options.domain, {'name': options.name}).then(function (records) {
      //Properties that are editable
      var allowedProperties = ['content', 'ttl', 'proxied'];
      options = mapRecordOptions(options);
      if (records.count == 0) {
        throw new Error('No matching records found');
      }
      if (records.count == 1) {
        var record = records.result[0];
        _.each(allowedProperties, function (property) {
          if (options[property] !== undefined) {
            record[property] = options[property];
          }
        });
        return client.editDNS(record);
      }
    })
  }

  /**
   * Remove a record/record(s) matching the given name
   * @param options
   */
  function removeRecord(options) {
    var query = _(options).pick(['name', 'content']).omitBy(_.isUndefined).value();
    return find(options.domain, query).then(function (records) {
      if (records.count == 0) {
        throw new Error('No matching records found');
      }
      var results = [];
      _.each(records.result, function (record) {
        results.push(client.deleteDNS(record));
      });
      return Promise.all(results);
    }).then(function (results) {
      var messages = _.map(results, function (row) {
        return 'Deleted record with id ' + row.id;
      });

      return new Result(messages);
    });
  }

  /**
   *
   * @param options
   * @returns {Promise}
   */
  function findRecord(options) {
    return find(options.domain, {'name': options.name}).then(function (result) {
      return new Result(result.result);
    });
  }

  /**
   * Find a given record
   * @param domain
   * @param query
   * @return {Promise}
   */
  function find(domain, query) {
    if (!query.name.includes(domain)) {
      query.name = query.name + '.' + domain;
    }
    return getZone(domain).then(function (zone) {
      return client.browseDNS(zone, query);
    });
  }

  /**
   * List records for given domain
   * @param options
   * @returns {Promise}
   */
  function listRecords(options) {
    return getZone(options.domain).then(function (zone) {
      return client.browseDNS(zone, {page: 1, per_page: 50})
        .then(function (result) {
          var promises = [Promise.resolve(result)];
          for (var i = 2; i <= result.totalPages; i++) {
            promises.push(client.browseDNS(zone, {page: i, per_page: 50}));
          }
          return Promise.all(promises);
        });
    }).then(function (results) {
      var rows = [];
      _.each(results, function (result) {
        _.each(result.result, function (item) {
          item.ttl = (item.ttl == 1) ? 'Auto' : item.ttl;
          rows.push(item);
        });
      });
      return new Result(rows);
    });
  }

  /**
   * List zones in the current account
   * @return {Promise}
   */
  function listZones() {
    return client.browseZones({page: 1, per_page: 50})
      .then(function (result) {
        var promises = [Promise.resolve(result)];
        for (var i = 2; i <= result.totalPages; i++) {
          promises.push(client.browseZones({page: i, per_page: 50}));
        }
        return Promise.all(promises);
      })
      .then(function (results) {
        var rows = [];
        _.each(results, function (result) {
          _.each(result.result, function (item) {
            rows.push(_.extend(item, {planName: item.plan.name}));
          })
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
      zone.devMode = (options.mode == 'on');
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
    }).then(function (result) {
      return new Result({result: result});
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
   * Display Help
   * @return {Promise}
   */
  function showHelp() {
    return Promise.resolve(fs.readFileSync(__dirname + '/doc/help.txt', 'utf8'));
  }

  /**
   * Get command from available commands by name
   * @param commandName
   * @return {Object}
   */
  function getCommand(commandName) {
    return _.find(commands, function (command) {
      return _.includes(command.aliases, commandName);
    });
  }

  /**
   *
   * @param cmd
   * @param params
   * @return {Object}
   */
  function mapParams(cmd, params) {
    if (cmd.mergeAdditionalParams) {
      var paramCount = cmd.params.length + cmd.optionalParams.length;
      params._[paramCount] = _.slice(params._, paramCount).join(' ');
    }
    return _.extend(params, _.fromPairs(_.zip(cmd.params.concat(cmd.optionalParams), _.drop(params._, 1))));
  }

  /**
   * Map options to parameters when adding or editing records
   * @param options
   * @return {*}
   */
  function mapRecordOptions(options) {
    if (options.type == 'SRV') {
      var contentParts = options.content.split(' ');
      var serverParts = options.name.split('.');
      options.data = {
        service: serverParts[0],
        proto: serverParts[1],
        name: _.slice(serverParts, 2).join('.'),
        priority: contentParts[1],
        weight: contentParts[1],
        port: contentParts[2],
        target: contentParts[3]
      }
    }
    options.ttl = options.ttl || 1;
    options.priority = options.priority || 0;
    if (options.activate !== undefined) {
      options.proxied = options.activate;
    }

    return options;
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