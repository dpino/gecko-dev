onmessage = function() {
    let worker = new Worker('wake-negative.js');
    worker.onmessage = function(e) {
        postMessage(e.data);
    }
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    worker.postMessage([ia.buffer]);
    setTimeout(() => Atomics.wake(ia, 0, -1), 500); // Don't actually wake it
}
