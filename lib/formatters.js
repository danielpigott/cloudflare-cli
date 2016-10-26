var Table = require('cli-table');
var _ = require('lodash');

/**
 *
 * @param options
 * @constructor
 */
function TableFormatter(options) {
  var table = new Table(options);
  this.format = format;
  function format(result) {
    var data = [];
    _.each(result, function (item) {
      data.push(_.values(_.pick(item, options.values)));
    });
    table.push.apply(table, data);
    console.log(table.toString());
  }
}

/**
 *
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