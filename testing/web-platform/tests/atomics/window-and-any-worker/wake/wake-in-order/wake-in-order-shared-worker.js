onconnect = function(e) {
    let port = e.ports[0];

    port.addEventListener('message', function(e) {
        let rs = [];
        let workers = [];
        let nworkers = 3;
        for (let i = 0; i < nworkers; i++) {
            let w = new Worker('wake-in-order.js');
            w.onmessage = function(e) {
                rs.push({idx: e.data[0], msg: e.data[1]});
            }
            workers.push(w);
        }

        // Send message to all workers.
        let ia = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*4));
        for (let i = 0; i < nworkers; i++) {
            workers[i].postMessage([i+1, ia.buffer]);
        }

        // Store on each ia slot ranging from 1-3, with a pause.
        setTimeout(function() {
            Atomics.store(ia, 1, 1);
            setTimeout(function() {
                Atomics.store(ia, 2, 1);
                setTimeout(function() {
                    Atomics.store(ia, 3, 1);
                }, 200);
            }, 200);
        }, 200);

        // Wake each worker (waiting on zero), with a pause.
        setTimeout(function() {
            setTimeout(function() {
                Atomics.wake(ia, 0, 1);
                setTimeout(function() {
                    Atomics.wake(ia, 0, 1);
                    setTimeout(function() {
                        Atomics.wake(ia, 0, 1);
                    }, 200);
                }, 200);
            }, 200);
        }, 1000);

        // Send results back.
        setTimeout(function() { port.postMessage([rs]); }, 2000);
    });
    port.start();
}
