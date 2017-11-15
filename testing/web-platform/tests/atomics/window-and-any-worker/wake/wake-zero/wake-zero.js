onmessage = function(e) {
    let ia = e.data[0];
    let ret = Atomics.wait(ia, 0, 0, 1000); // We may timeout eventually.
    postMessage([ret]);
}
