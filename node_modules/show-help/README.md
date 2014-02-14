## show-help

Outputs help for parent package and exits

## Install

```bash
$ npm install show-help
```

## Usage

```js
if(argv.help) require('show-help')
```

Will show the content of first found file from the [lookup paths](#lookup).

<a name="lookup"></a>
## Lookup Paths

* docs/man
* bin/help.txt
* bin/usage.txt
* help.txt
* usage.txt
* README
* README.md
* README.markdown

![](https://dl.dropboxusercontent.com/s/ctqwvswr8l2fn7m/npmel_26.jpg)
