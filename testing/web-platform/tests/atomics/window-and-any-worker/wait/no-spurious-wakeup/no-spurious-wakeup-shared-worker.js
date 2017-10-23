onconnect = function(e) {
    let port = e.ports[0];
    port.addEventListener('message', function(e) {
        let worker = new Worker('wait-on-zero-diff.js');
        worker.onmessage = function(e) {
            port.postMessage([e.data[0]]);
        };
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        worker.postMessage([ia.buffer]);
        setTimeout(function() {
            // Change the value, should not wake the agent.
            Atomics.store(ia, 0, 1);
            // Wake up worker.
            setTimeout(() => Atomics.wake(ia, 0), 500);
        }, 500);
    });
    port.start();
}
