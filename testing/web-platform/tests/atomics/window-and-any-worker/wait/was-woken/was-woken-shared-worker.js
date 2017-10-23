onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let worker = new Worker('wait-on-zero.js');
        worker.onmessage = function(e) {
            port.postMessage(e.data);
        };
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        worker.postMessage([ia.buffer]);
        setTimeout(() => Atomics.wake(ia, 0), 500);
    });
    port.start();
}
