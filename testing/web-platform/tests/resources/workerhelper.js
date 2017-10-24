WorkerHelper = {};

WorkerHelper.createFromString = function(script, onmessage) {
    var blob = new Blob([script], {type: 'application/javascript'});
    var w = new Worker(URL.createObjectURL(blob));
    w.onmessage = onmessage;
    return w;
}
WorkerHelper.broadcast = function(workers, sab, idx) {
    for (w of workers) {
        w.postMessage([sab, idx]);
    }
}
// TODO: Not actually a worker related function but a function to help with async tests.
WorkerHelper.check_done = function(t, max) {
    var count = 0;
    return function() {
        count++;
        if (count == max) {
            t.done();
        }
    };
}
