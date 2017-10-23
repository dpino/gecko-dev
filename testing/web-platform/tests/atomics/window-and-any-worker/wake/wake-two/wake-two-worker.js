onmessage = function() {
    let rs = [];
    let workers = [];
    let nworkers = 3;
    // Create two workers and initialize them.
    for (let i = 0; i < nworkers; i++) {
      let w = new Worker('wake-two.js');
      w.onmessage = function(e) {
        rs.push(e.data);
        if (rs.length == nworkers) {
            postMessage([rs]);
        }
      }
      workers.push(w);
    }
    // Send message to all broadcast.
    let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    for (let i = 0; i < nworkers; i++) {
      workers[i].postMessage([ia.buffer]);
    }
    // Wake one worker.
    setTimeout(() => Atomics.wake(ia, 0, 2), 500);
}
