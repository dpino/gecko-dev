onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
    let worker = new Worker('did-timeout.js');
    worker.onmessage = function(e) {
      port.postMessage([e.data[0], e.data[1]]);
    }
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    worker.postMessage([ia]);
    });
    port.start();
}
