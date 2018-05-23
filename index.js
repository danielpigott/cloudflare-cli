/**
 *
 * @param options
 * @constructor
 */
function CloudflareCli(options) {
  let self = this;
  self.email = null;
  self.key = null;
  self.perPage = 50;
  let _ = require('lodash');
  let CloudFlareClient = require('./lib/apiClient');
  let fs = require('fs');
  let format = require('util').format;
  let formatters = require('./lib/formatters');

  /**
   * Available commands
   * @type {Object}
   */
  const commands = {
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
      optionalParams: ['content'],
      formatter: new formatters.MessageFormatter()
    },
    edit: {
      aliases: ['edit', 'editrecord'],
      callback: editRecord,
      description: 'Edit a DNS record',
      params: ['name', 'content'],
      optionalParams: [],
      formatter: new formatters.MessageFormatter()
    },
    enable: {
      aliases: ['enable', 'enablecf'],
      callback: enableProxy,
      description: 'Enable cloudflare caching for given record',
      params: ['name'],
      optionalParams: ['content'],
      formatter: new formatters.MessageFormatter()
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
      description: 'Show help',
      formatter: new formatters.MessageFormatter()
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
  self.addRecord = addRecord;
  self.disableProxy = disableProxy;
  self.editRecord = editRecord;
  self.enableProxy = enableProxy;
  self.findRecord = findRecord;
  self.listRecords = listRecords;
  self.listZones = listZones;
  self.purgeCache = purgeCache;
  self.removeRecord = removeRecord;
  self.showHelp = showHelp;
  self.toggleDevMode = toggleDevMode;

  init(options);

  /**
   * Set up client
   * @param options
   */
  function init(options) {
    self.email = options.email;
    self.key = options.token;
    self.cloudflareClient = new CloudFlareClient(options.email, options.token);
  }

  /**
   * Run the given command and output the result
   * @param command
   * @param options
   */
  function runCommand(command, options) {
    let cmd = getCommand(command);
    if (!cmd) {
      cmd = getCommand('help');
    }
    let fn = cmd.callback;
    let opts = mapParams(cmd, options);
    fn(opts).then(function (result) {
      if (cmd.formatter) {
        cmd.formatter.format(result.messages, options);
      } else {
        console.log(result);
      }
      process.exit();
    }).catch(function (error) {
      let formatter = new formatters.MessageFormatter();
      formatter.format(['Error: ' + error.message]);
      process.exit(1);
    });
  }

  /**
   * Create a new record of the given type
   * @param options
   * @return {*}
   */
  function addRecord(options) {
    options.type = options.type || 'CNAME';
    return getZone(options.domain)
      .then(function (zone) {
        return self.cloudflareClient.addRecord(
          zone.id,
          _.extend({ttl: 1}, mapRecordOptions(options)));
      })
      .then(function (response) {
          return new Result(
            [
              format(
                'Added %s record %s -> %s',
                response.data.result.type,
                response.data.result.name,
                response.data.result.content
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
    return find(options.domain, getQueryParams(options, ['name', 'type', 'query'])).then(function (response) {
      const records = response.data.result;
      //Properties that are editable
      options = mapRecordOptions(options);
      if (records.length === 0) {
        throw new Error('No matching records found');
      } else if (records.length === 1) {
        let record = records[0];
        options.type = options.type || record.type;
        return self.cloudflareClient.editRecord(record.zone_id, record.id, options);
      } else {
        throw new Error(format('%d matching records found, unable to update', records.count));
      }
    }).then(function (response) {
      let record  = response.data.result;
      return new Result([
        format('Updated %s record %s (id: %s)', record.type, record.name, record.id)
      ]);
    });
  }

  /**
   * Remove a record/record(s) matching the given name
   * @param options
   */
  function removeRecord(options) {
    let query = getQueryParams(options, ['name', 'content', 'type', 'query']);
    return find(options.domain, query).then(function (response) {
      let records = response.data.result;
      if (records.length === 0) {
        throw new Error('No matching records found');
      }
      let results = [];
      _.each(records, function (record) {
        results.push(self.cloudflareClient.removeRecord(record.zone_id, record.id));
      });
      return Promise.all(results);
    }).then(function (responses) {
      let messages = _.map(responses, function (response) {
        return 'Deleted record with id ' + response.data.result.id;
      });

      return new Result(messages);
    });
  }

  /**
   * Find command
   * @param options
   * @returns {Promise}
   */
  function findRecord(options) {
    let query = getQueryParams(options, ['name', 'content', 'type', 'query']);
    return find(options.domain, query).then(function (result) {
      return new Result(result.data.result);
    });
  }

  /**
   * Find a given record
   * @param domain
   * @param query
   * @return {Promise}
   */
  function find(domain, query) {
    if (query.name && !query.name.includes(domain)) {
      query.name = query.name + '.' + domain;
    }
    if (query.query) {
      query = _.extend(query, query.query);
      delete query.query;
    }
    return getZone(domain).then(function (zone) {
      return self.cloudflareClient.findRecord(zone.id, query);
    });
  }

  /**
   * List records for given domain
   * @param options
   * @returns {Promise}
   */
  function listRecords(options) {
    return getZone(options.domain).then(function (zone) {
      return self.cloudflareClient.findRecord(zone.id, {page: 1, per_page: self.perPage})
        .then(function (response) {
          let promises = [Promise.resolve(response)];
          for (let i = 2; i <= response.data['result_info']['total_pages']; i++) {
            promises.push(self.cloudflareClient.findRecord(zone.id, {page: i, per_page: self.perPage}));
          }
          return Promise.all(promises);
        });
    }).then(function (responses) {
      let rows = [];
      _.each(responses, function (response) {
        _.each(response.data.result, function (item) {
          item.ttl = (item.ttl === 1) ? 'Auto' : item.ttl;
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
    return self.cloudflareClient.findZones({page: 1, per_page: self.perPage})
      .then(function (response) {
        let promises = [Promise.resolve(response)];
        for (let i = 2; i <= response.data['result_info']['total_pages']; i++) {
          promises.push(self.cloudflareClient.findZones({page: i, per_page: self.perPage}));
        }
        return Promise.all(promises);
      })
      .then(function (responses) {
        let rows = [];
        _.each(responses, function (response) {
          _.each(response.data.result, function (item) {
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
      //Use alternate api client
      return self.cloudflareClient.setDevelopmentMode(zone.id, options.mode);
    }).then(function () {
      return new Result(['Dev mode changed to ' + options.mode]);
    })
  }

  /**
   * Purge files from cache
   * @param options
   * @returns {Promise}
   */
  function purgeCache(options) {
    return getZone(options.domain).then(function (zone) {
      let query = (options._[1]) ? {files: options._.slice(1)} : {purge_everything: true};
      return self.cloudflareClient.purgeCache(zone.id, query);
    }).then(function () {
      return new Result('Purged cache successfully');
    });
  }

  /**
   *
   * @param zoneName {String}
   * @returns {Promise}
   */
  function getZone(zoneName) {
    return self.cloudflareClient.findZones({name: zoneName}).then(function (response) {
      return response.data.result[0];
    });
  }

  /**
   * Display Help
   * @return {Promise}
   */
  function showHelp() {
    return Promise.resolve(new Result([fs.readFileSync(__dirname + '/doc/help.txt', 'utf8')]));
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
    let query = [];
    if (cmd.mergeAdditionalParams && params._ !== undefined) {
      let paramCount = cmd.params.length + cmd.optionalParams.length;
      params._[paramCount] = _.slice(params._, paramCount).join(' ');
    }
    //Process query option
    if (params.query) {
      query = params.query.split(',');
      params.query = _.fromPairs(
        _.map(query,
          function (filter) {
            return filter.split(':');
          }
        )
      );

    }
    return _.extend(params, _.fromPairs(_.zip(cmd.params.concat(cmd.optionalParams), _.drop(params._, 1))));
  }

  /**
   * Map options to parameters when adding or editing records
   * @param options
   * @return {*}
   */
  function mapRecordOptions(options) {
    if (options.type === 'SRV') {
      let contentParts = options.content.split(' ');
      let serverParts = options.name.split('.');
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
    if (options.activate !== undefined) {
      options.proxied = options.activate;
    }
    options = _.omit(options, ['domain', 'email', 'token', '_', 'activate', 'a']);

    return options;
  }

  /**
   *
   * @param options
   * @param allowed
   */
  function getQueryParams(options, allowed) {
    return _(options).pick(allowed).omitBy(_.isUndefined).value();
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