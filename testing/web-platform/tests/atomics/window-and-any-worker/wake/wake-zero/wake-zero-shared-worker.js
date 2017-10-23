onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let worker = new Worker('wake-zero.js');
        worker.onmessage = function(e) {
            port.postMessage([e.data[0]]);
        }
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        worker.postMessage([ia]);
        setTimeout(() => Atomics.wake(ia, 0, 0)); // Wake zero
    });
    port.start();
}
