## first-val

Execute given async functions in given order until a value is produced

## Install

```bash
$ npm install first-val
```

## Usage

```js
firstval = require('first-val')

search = firstval(searchRedis, searchMongo, searchPostgres)

search('hello world', function(result){

    result
    // => ['results from', 'the first value produced function']

})

function searchRedis(keyword, callback){}
function searchMongo(keyword, callback){}
function searchPostgres(keyword, callback){}
```

![](http://distilleryimage1.s3.amazonaws.com/0b20f65e896c11e2ad6322000a9f14f2_6.jpg)
