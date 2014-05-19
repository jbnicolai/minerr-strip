function minErr(module) {
  'use strict';
  var stringify = function (arg) {
    if (typeof arg === 'function') {
      return arg.toString().replace(/ \{[\s\S]*$/, '');
    } else if (typeof arg === 'undefined') {
      return 'undefined';
    } else if (typeof arg !== 'string') {
      return JSON.stringify(arg);
    }
    return arg;
  };
  return function () {
    var code = arguments[0], prefix = '[' + (module ? module + ':' : '') + code + '] ', message, i = 1;
    message = prefix + 'http://docs.example.com' + code;
    for (; i < arguments.length; i++) {
      message = message + (i === 1 ? '?' : '&') + 'p' + (i - 1) + '=' + stringify(arguments[i]);
    }
    return new Error(message);
  };
}
(function () {
  var testMinErr = minErr('test');
  throw testMinErr('one', 'bad');
}());
