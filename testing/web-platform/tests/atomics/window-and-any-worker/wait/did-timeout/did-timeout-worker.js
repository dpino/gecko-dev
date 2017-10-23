onmessage = function(e) {
    let worker = new Worker('did-timeout.js');
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    worker.postMessage([ia]);
    worker.onmessage = function(e) {
        postMessage([e.data[0], e.data[1]]);
    }
}
