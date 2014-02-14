module.exports = firstval;

function firstval(){
  var fns;
  fns = Array.prototype.slice.call(arguments);

  return function(){
    var callback, params;

    callback = arguments[ arguments.length - 1 ];
    params   = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

    (function next(i){

      if( i >= fns.length ) {
        return callback();
      }

      fns[i].apply(undefined, params.concat([function(error, result){

        if(result) return callback(undefined, result);

        next(i+1);

      }]));

    }(0));

  };

}
