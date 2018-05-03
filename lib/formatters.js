var Table = require('cli-table');
var _ = require('lodash');

/**
 * Formatter to output tabular data
 * @param options
 * @constructor
 */
function TableFormatter(options) {
  var table = new Table(options);
  this.format = format;
  function format(result, formatOptions) {
    var data = [];
    _.each(result, function (item) {
      data.push(_.values(_.pick(item, options.values)));
    });
    if (formatOptions.format === 'csv') {
     _.each(data, function(row) {
       console.log(row.join(','));
     });
    } else if ( formatOptions.format === 'json') {
      console.log(JSON.stringify(result));
    } else {
      table.push.apply(table, data);
      console.log(table.toString());
    }
  }
}

/**
 * Log plain messages
 * @constructor
 */
function MessageFormatter() {
  this.format = format;
  function format(result) {
    _.each(result, function(message) {
      console.log(message);
    });
  }
}

function RecordFormatter() {

}

module.exports.TableFormatter = TableFormatter;
module.exports.RecordFormatter = RecordFormatter;
module.exports.MessageFormatter = MessageFormatter;