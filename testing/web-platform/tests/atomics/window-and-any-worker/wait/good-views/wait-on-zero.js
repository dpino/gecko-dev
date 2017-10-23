onmessage = function(e) {
    let view = e.data[0];
    postMessage(Atomics.wait(view, 0, 0, 0));
}
