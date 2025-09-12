import Table from 'cli-table';
import _ from 'lodash';

/**
 * Formatter to output tabular data
 * @param options
 * @constructor
 */
export class TableFormatter {
  constructor(options) {
    const table = new Table(options);
    this.format = format;
    function format(result, formatOptions) {
      let data = [];
      _.each(result, function (item) {
        data.push(_.values(_.pick(item, options.values)));
      });
      if (formatOptions.format === 'csv') {
        _.each(data, function (row) {
          console.log(row.join(','));
        });
      } else if (formatOptions.format === 'json') {
        console.log(JSON.stringify(result));
      } else {
        table.push.apply(table, data);
        console.log(table.toString());
      }
    }
  }
}

/**
 * Log plain messages
 * @constructor
 */
export class MessageFormatter {
  constructor() {
    this.format = format;
    function format(result) {
      _.each(result, function (message) {
        console.log(message);
      });
    }
  }
}

