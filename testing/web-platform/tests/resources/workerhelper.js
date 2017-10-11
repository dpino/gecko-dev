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
