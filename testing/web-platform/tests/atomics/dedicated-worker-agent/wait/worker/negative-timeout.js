onmessage = function(e) {
    var ia = e.data[0];
    var ret = Atomics.wait(ia, 0, 0, -5);
    postMessage([ret]);
}
