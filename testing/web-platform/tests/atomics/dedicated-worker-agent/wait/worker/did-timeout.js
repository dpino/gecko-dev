onmessage = function(e) {
  var ia = e.data[0];
  var then = Date.now();
  var ret = Atomics.wait(ia, 0, 0, 500); // Timeout 500ms
  postMessage([ret, Date.now() - then]);
}
