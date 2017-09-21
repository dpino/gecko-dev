onmessage = function(e) {
    var ia = e.data[0];
    var idx = e.data[1];
    var ret = Atomics.wait(ia, idx, 0);
    postMessage([ret]);
}
