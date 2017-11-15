onmessage = function(e) {
    let ia = e.data[0];
    let ret = Atomics.wait(ia, 0, 0, NaN);
    postMessage([ret]);
}
