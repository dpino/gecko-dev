onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let rs = [];
        let workers = [];
        let nworkers = 4;

        // Create three workers and make them wait on zero.
        for (let i = 0; i < nworkers-1; i++) {
            let w = new Worker('../wait-on-zero.js');
            w.onmessage = function(e) {
                rs.push(e.data);
                if (rs.length == nworkers) {
                    port.postMessage([rs]);
                }
            }
            workers.push(w);
        }
        // Make fourth worker and make it wait on one.
        let w = new Worker('../wait-on-one.js');
            w.onmessage = function(e) {
            rs.push(e.data);
            if (rs.length == nworkers) {
                port.postMessage([rs]);
            }
        }
        workers.push(w);
        // Send message to all workers.
        let ia = new Int32Array(new SharedArrayBuffer(2*Int32Array.BYTES_PER_ELEMENT));
        for (let i = 0; i < nworkers; i++) {
            workers[i].postMessage([ia.buffer]);
        }
        // Wake workers waiting on zero.
        setTimeout(() => Atomics.wake(ia, 0), 500);
    });
    port.start();
}
