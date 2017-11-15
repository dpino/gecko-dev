onmessage = function(e) {
    let view = e.data[0];
    let idx = e.data[1];
    postMessage(Atomics.wait(view, idx, 0));
}
