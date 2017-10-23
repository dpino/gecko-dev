onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let rs = [];
        let workers = [];
        let nworkers = 3;
        // Create three workers and initialize them.
        for (let i = 0; i < nworkers; i++) {
          let w = new Worker('wake-all.js');
          w.onmessage = function(e) {
            rs.push(e.data);
            if (rs.length == nworkers) {
                port.postMessage([rs]);
            }
          }
          workers.push(w);
        }
        // Send message to all workers.
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        for (let i = 0; i < nworkers; i++) {
          workers[i].postMessage([ia.buffer]);
        }
        // Wake all workers.
        setTimeout(() => Atomics.wake(ia, 0), 500);
    });
    port.start();
}
