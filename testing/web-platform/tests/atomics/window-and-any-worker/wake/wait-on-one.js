onmessage = function(e) {
    let sab = e.data[0];
    let timeout = e.data[1] || 1000;
    let ia = new Int32Array(sab);
    postMessage(Atomics.wait(ia, 1, 0, timeout)); // We may timeout eventually
}
