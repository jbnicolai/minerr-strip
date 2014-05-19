var derpMinErr = minErr('derp');
if (Math.random() < 0.1) {
  throw derpMinErr('herp', 'I accidentally {0}', 'the whole coke bottle');
}

(function () {
  console.log('Oops!');
  throw testMinErr('two', '{0} {1} {2}', 'foo', 'bar', 'baz');
})();