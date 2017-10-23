onmessage = function(e) {
    let worker = new Worker('nan-timeout.js');
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    worker.onmessage = function(e) {
        postMessage([e.data[0]]);
    }
    worker.postMessage([ia]);
    setTimeout(() => Atomics.wake(ia, 0), 500);
}
