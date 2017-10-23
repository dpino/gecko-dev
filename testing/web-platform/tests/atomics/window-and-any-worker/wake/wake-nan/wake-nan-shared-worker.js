onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let worker = new Worker('wake-nan.js');
        worker.onmessage = function(e) {
            port.postMessage(e.data);
        }
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        worker.postMessage([ia.buffer]);
        setTimeout(() => Atomics.wake(ia, 0, NaN), 500); // Don't actually wake it
    });
    port.start();
}
