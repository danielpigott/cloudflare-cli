import util from 'util';
import fs from 'fs';
import { ApiClient } from './lib/apiClient.js';
import _ from 'lodash';
import { MessageFormatter, TableFormatter } from './lib/formatters.js';
import path from 'path';

export class CloudflareCli {
  constructor(options) {
    this.requiredOptions = ['token'];
    this.email = options.email || null;
    this.key = options.token || null;
    this.perPage = 50;
    this.format = util.format;
    this.cloudflareClient = new ApiClient(options.token, options.email);
    this.commands = {
      add: {
        aliases: ['add', 'addrecord'],
        shortcut: 'a',
        callback: this.addRecord.bind(this),
        description: 'Add a new record',
        params: ['name', 'content'],
        optionalParams: [],
        mergeAdditionalParams: true,
        formatter: new MessageFormatter()
      },
      alwaysUseHttps: {
        aliases: ['always-use-https'],
        shortcut: 'https',
        callback: this.toggleAlwaysUseHttps.bind(this),
        params: ['mode'],
        optionalParams: [],
        description: "Redirect all requests with scheme 'http' to 'https'",
        formatter: new MessageFormatter()
      },
      devmode: {
        aliases: ['devmode'],
        shortcut: 'dev',
        callback: this.toggleDevMode.bind(this),
        params: ['mode'],
        optionalParams: [],
        description: "Turn dev mode on or off",
        formatter: new MessageFormatter()
      },
      disable: {
        aliases: ['disable', 'disablecf', 'disablecache', 'disableproxy'],
        shortcut: 'dis',
        callback: this.disableProxy.bind(this),
        description: 'Disable Cloudflare caching for given record',
        params: ['name'],
        optionalParams: ['content'],
        formatter: new MessageFormatter()
      },
      edit: {
        aliases: ['edit', 'editrecord'],
        shortcut: 'e',
        callback: this.editRecord.bind(this),
        description: 'Edit a DNS record',
        params: ['name', 'content'],
        optionalParams: [],
        formatter: new MessageFormatter()
      },
      enable: {
        aliases: ['enable', 'enablecf', 'enablecache', 'enableproxy'],
        shortcut: 'en',
        callback: this.enableProxy.bind(this),
        description: 'Enable Cloudflare caching for given record',
        params: ['name'],
        optionalParams: ['content'],
        formatter: new MessageFormatter()
      },
      find: {
        aliases: ['find', 'findrecord'],
        shortcut: 'f',
        callback: this.findRecord.bind(this),
        description: 'Find a record',
        params: ['name'],
        optionalParams: ['content'],
        formatter: new TableFormatter({
          head: ['Type', 'Name', 'Value', 'TTL', 'Active', 'ID'],
          colWidths: [8, 40, 50, 10, 8, 34],
          values: ['type', 'name', 'content', 'ttl', 'proxied', 'id']
        })
      },
      help: {
        aliases: ['help'],
        shortcut: 'h',
        params: [],
        callback: this.showHelp.bind(this),
        description: 'Show help',
        formatter: new MessageFormatter()
      },
      purge: {
        aliases: ['purge', 'purgefile', 'purgecache'],
        shortcut: 'p',
        callback: this.purgeCache.bind(this),
        params: [],
        description: 'Purge files from cache'
      },
      rm: {
        aliases: ['rm', 'remove', 'removerecord'],
        shortcut: 'r',
        callback: this.removeRecord.bind(this),
        description: 'Remove a record',
        params: ['name'],
        optionalParams: ['content'],
        formatter: new MessageFormatter()
      },
      ls: {
        aliases: ['ls', 'listrecords', 'list'],
        shortcut: 'l',
        callback: this.listRecords.bind(this),
        params: [],
        optionalParams: [],
        description: 'List records for given domain',
        formatter: new TableFormatter({
          head: ['Type', 'Name', 'Value', 'TTL', 'Active', 'ID'],
          colWidths: [8, 40, 50, 10, 8, 34],
          values: ['type', 'name', 'content', 'ttl', 'proxied', 'id']
        })
      },
      zoneAdd: {
        aliases: ['zone-add', 'add-zone', 'addzone'],
        shortcut: 'za',
        callback: this.addZone.bind(this),
        description: 'Add a new zone to your Cloudflare account',
        params: ['name'],
        optionalParams: [],
        formatter: new MessageFormatter()
      },
      zones: {
        aliases: ['zone-ls', 'zones', 'listdomains', 'listzones'],
        shortcut: 'z',
        callback: this.listZones.bind(this),
        params: [],
        description: 'List zones in your cloudflare account',
        formatter: new TableFormatter({
          head: ['Name', 'Plan', 'Active', 'ID', 'Account'],
          colWidths: [50, 20, 10, 40, 40],
          values: ['name', 'planName', 'status', 'id', 'accountName']
        })
      }
    };
  }

  runCommand(command, options) {
    let cmd = this.getCommand(command);
    if (!cmd || command === 'help') {
      cmd = this.getCommand('help');
    } else {
      try {
        this.validateConfig(options);
      } catch (error) {
        console.log(error.message);
        process.exit(1);
      }
    }
    let fn = cmd.callback;
    let opts = this.mapParams(cmd, options);
    fn(opts).then((result) => {
      if (cmd.formatter) {
        cmd.formatter.format(result.messages, options);
      } else {
        console.log(result);
      }
    }).catch((error) => {
      let formatter = new MessageFormatter();
      if (error.response && error.response.data.errors) {
        formatter.format([`Error response received: ${error.response.data.errors[0].message}`]);
      } else if (error.message) {
        formatter.format([`Error when communicating with api: ${error.message}`]);
      } else {
        formatter.format([`Error: ${error}`]);
      }
      process.exit(1);
    });
  }

  async addRecord(options) {
    options.type = options.type || 'CNAME';
    const zone = await this.getZone(options.domain);
    const response = await this.cloudflareClient.addRecord(
      zone.id,
      _.extend({ ttl: 1 }, this.mapRecordOptions(options)));
    return new Result([
      this.format(
        'Added %s record %s -> %s',
        response.data.result.type,
        response.data.result.name,
        response.data.result.content
      )
    ]);
  }

  async toggleAlwaysUseHttps(options) {
    const zone = await this.getZone(options.domain);
    await this.cloudflareClient.setAlwaysUseHttps(zone.id, options.mode);
    return new Result(['Always Use HTTPS mode changed to ' + options.mode]);
  }

  enableProxy(options) {
    options.activate = true;
    return this.editRecord(options);
  }

  disableProxy(options) {
    options.activate = false;
    return this.editRecord(options);
  }

  async editRecord(options) {
    return this.find(options.domain, this.getQueryParams(options, ['name', 'type', 'query'])).then((response) => {
      const records = response.data.result;
      options = this.mapRecordOptions(options);
      if (records.length === 0) {
        throw new Error('No matching records found');
      } else if (records.length === 1) {
        let record = records[0];
        options.type = options.type || record.type;
        options.content = options.content || record.content;
        return this.cloudflareClient.editRecord(record.zone_id, record.id, options);
      } else {
        throw new Error(this.format('%d matching records found, unable to update', records.count));
      }
    }).then((response) => {
      let record = response.data.result;
      return new Result([
        this.format('Updated %s record %s (id: %s)', record.type, record.name, record.id)
      ]);
    });
  }

  async removeRecord(options) {
    let query = this.getQueryParams(options, ['name', 'content', 'type', 'query']);
    if (query.name === undefined) {
      return Promise.reject('name not provided');
    }
    const response = await this.find(options.domain, query);
    if (response.data.result.length === 0) {
      throw new Error('No matching records found');
    }
    const zone = await this.getZone(options.domain);
    let results = [];
    _.each(response.data.result, (record) => {
      results.push(this.cloudflareClient.removeRecord(zone.id, record.id));
    });
    const responses = await Promise.all(results);
    return new Result(_.map(responses, (response) => {
      return 'Deleted record with id ' + response.data.result.id;
    }));
  }

  async findRecord(options) {
    let query = this.getQueryParams(options, ['name', 'content', 'type', 'query']);
    const result = await this.find(options.domain, query);
    return new Result(result.data.result);
  }

  async find(domain, query) {
    if (query.query) {
      query = _.extend(query, query.query);
      delete query.query;
    }
    if (query.name && !query.name.includes(domain)) {
      query.name = `${query.name}.${domain}`;
    }
    const zone = await this.getZone(domain);
    return this.cloudflareClient.findRecord(zone.id, query);
  }

  async listRecords(options) {
    return this.getZone(options.domain).then((zone) => {
      return this.cloudflareClient.findRecord(zone.id, { page: 1, per_page: this.perPage })
        .then((response) => {
          let promises = [Promise.resolve(response)];
          for (let i = 2; i <= response.data['result_info']['total_pages']; i++) {
            promises.push(this.cloudflareClient.findRecord(zone.id, { page: i, per_page: this.perPage }));
          }
          return Promise.all(promises);
        });
    }).then((responses) => {
      let rows = [];
      _.each(responses, (response) => {
        _.each(response.data.result, (item) => {
          item.ttl = (item.ttl === 1) ? 'Auto' : item.ttl;
          rows.push(item);
        });
      });
      return new Result(rows);
    });
  }

  addZone(options) {
    return this.cloudflareClient.addZone(options.name).then((response) => {
      return new Result([
        this.format(
          'Added zone %s',
          response.data.result.name
        )
      ]);
    });
  }

  async removeZone(options) {
    return this.getZone(options.name).then((zone) => {
      return this.cloudflareClient.removeZone(zone.id);
    }).then((response) => {
      return new Result(['Deleted zone with id ' + response.data.result.id]);
    });
  }

  async listZones() {
    return this.cloudflareClient.findZones({ page: 1, per_page: this.perPage })
      .then((response) => {
        let promises = [Promise.resolve(response)];
        for (let i = 2; i <= response.data['result_info']['total_pages']; i++) {
          promises.push(this.cloudflareClient.findZones({ page: i, per_page: this.perPage }));
        }
        return Promise.all(promises);
      })
      .then((responses) => {
        let rows = [];
        _.each(responses, (response) => {
          _.each(response.data.result, (item) => {
            rows.push(_.extend(
              item,
              {
                planName: item.plan.name,
                accountName: item.account.name
              }
            ));
          });
        });
        return new Result(rows);
      });
  }

  async toggleDevMode(options) {
    return this.getZone(options.domain).then((zone) => {
      return this.cloudflareClient.setDevelopmentMode(zone.id, options.mode);
    }).then(() => {
      return new Result(['Dev mode changed to ' + options.mode]);
    });
  }

  async purgeCache(options) {
    return this.getZone(options.domain).then((zone) => {
      let query = (options._ && options._[1]) ? { files: options._.slice(1) } : { purge_everything: true };
      return this.cloudflareClient.purgeCache(zone.id, query);
    }).then(() => {
      return new Result('Purged cache successfully');
    });
  }

  async getZone(zoneName) {
    return this.cloudflareClient.findZones({ name: zoneName }).then((response) => {
      if (response.data.result.length === 0) {
        throw new Error(`No matching zones found for "${zoneName}"`);
      }
      return response.data.result[0];
    });
  }

  showHelp() {
    return Promise.resolve(new Result([fs.readFileSync(path.resolve() + '/doc/help.txt', 'utf8')]));
  }

  getCommand(commandName) {
    return _.find(this.commands, (command) => {
      return _.includes(command.aliases, commandName);
    });
  }

  mapParams(cmd, params) {
    let query = [];
    if (cmd.mergeAdditionalParams && params._ !== undefined) {
      let paramCount = cmd.params.length + cmd.optionalParams.length;
      params._[paramCount] = _.slice(params._, paramCount).join(' ');
    }
    if (params.query) {
      query = params.query.split(',');
      params.query = _.fromPairs(
        _.map(query,
          (filter) => filter.split(':')
        )
      );
    }
    return _.extend(params, _.fromPairs(_.zip(cmd.params.concat(cmd.optionalParams), _.drop(params._, 1))));
  }

  mapRecordOptions(options) {
    if (options.type === 'SRV') {
      let contentParts = options.content.split(' ');
      let serverParts = options.name.split('.');
      options.data = {
        service: serverParts[0],
        proto: serverParts[1],
        name: _.slice(serverParts, 2).join('.'),
        priority: parseInt(contentParts[0]),
        weight: parseInt(contentParts[1]),
        port: parseInt(contentParts[2]),
        target: contentParts[3]
      };
    }
    if (options.activate !== undefined) {
      options.proxied = options.activate;
    }
    if (options.name !== undefined) {
      options.name = _.toString(options.name);
    }
    options = _.omit(options, ['domain', 'email', 'token', '_', 'activate', 'a']);
    return options;
  }

  getQueryParams(options, allowed) {
    return _(options).pick(allowed)
      .omitBy(_.isUndefined)
      .mapValues((val) => {
        if (val instanceof Object) {
          return val;
        } else {
          return _.toString(val);
        }
      }).value();
  }

  validateConfig(config) {
    let missing = [];
    _.each(this.requiredOptions, (option) => {
      if (config[option] === undefined) {
        missing.push(option);
      }
    });
    if (missing.length > 0) {
      throw new Error('The following required parameters were not provided: ' + missing.join(','));
    }
  }
}

/**
 *
 * @param messages
 * @constructor
 */
export class Result {
  constructor(messages) {
    this.messages = messages;
  }
}
