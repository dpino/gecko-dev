onmessage = function(e) {
    let ia = e.data[0];
    let then = Date.now();
    let ret = Atomics.wait(ia, 0, 0, 500); // Timeout 500ms
    postMessage([ret, Date.now() - then]);
}
