onmessage = function(e) {
    let ia = new Int32Array(e.data[0]);
    postMessage(Atomics.wait(ia, 0, 0, -5));
}
