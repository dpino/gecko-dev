onmessage = function() {
    let worker = new Worker('wake-zero.js');
    worker.onmessage = function(e) {
        let ret = e.data[0];
        postMessage([ret]);
    }
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    worker.postMessage([ia]);
    setTimeout(() => Atomics.wake(ia, 0, 0)); // Wake zero
}
