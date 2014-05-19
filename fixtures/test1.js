function minErr(module) {
  return function (message) {
    return new Error("[Derp][" + module + "]" + message);
  };
}

(function() {
  var testMinErr = minErr('test');
  throw testMinErr('one', 'Herp! A {0} happened', 'bad');
})();
