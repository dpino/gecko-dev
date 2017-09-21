onmessage = function(e) {
    var ia = e.data[0];
    var then = Date.now();
    Atomics.wait(ia, 0, 0);
    var diff = Date.now() - then;
    postMessage([diff]);
}
