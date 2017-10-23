onmessage = function() {
    let rs = [];
    let workers = [];
    // Create two workers and initialize them.
    for (let i = 0; i < 2; i++) {
      let w = new Worker('wake-one.js');
      w.onmessage = function(e) {
        rs.push(e.data);
        if (rs.length == 2) {
            postMessage([rs]);
        }
      }
      workers.push(w);
    }
    // Send message to all broadcast.
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    for (let i = 0; i < 2; i++) {
      workers[i].postMessage([ia.buffer]);
    }
    // Wake one worker.
    setTimeout(() => Atomics.wake(ia, 0, 1), 500);
}
