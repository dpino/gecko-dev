onmessage = function(e) {
    let sab = e.data[0];
    let ia = new Int32Array(sab);
    postMessage(Atomics.wait(ia, 0, 0, 1000)); // We may timeout eventually
}
