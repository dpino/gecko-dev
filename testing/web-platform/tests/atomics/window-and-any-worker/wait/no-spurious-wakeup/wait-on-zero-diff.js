onmessage = function(e) {
    let ia = new Int32Array(e.data[0]);
    let then = Date.now();
    Atomics.wait(ia, 0, 0);
    let diff = Date.now() - then;
    postMessage([diff]);
}
