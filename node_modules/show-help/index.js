var firstVal = require("first-val");
var puts = require('util').puts;
var join = require('path').join;
var lookup = require('./lookup');

var fs = require('fs');
var readFile = fs.readFileSync;
var exists  = fs.existsSync;

module.exports = showHelp;

function findFilename (dir) {
  var i = -1;
  var len = lookup.length;
  var filename;

  while (++i < len) {
    filename = join(__dirname, dir || '', '../../', lookup[i]);
    if (!exists(filename)) continue;
    return filename;
  }
}

function format (content) {
  content = content.split('\n').map(tab).join('\n');
  return '\n' + content;
}

function tab (line) {
  return '  ' + line;
}

function man (dir) {
  var filename;
  if (!(filename = findFilename(dir))) return '';
  return format(readFile(filename).toString());
}

function showHelp (dir) {
  puts(man(dir));
  process.exit();
}
