function check_done(rs) {
    if (rs.length == 7) postMessage([rs]);
}

onmessage = function() {
    let rs = [];
    let w1 = new Worker('wait-on-zero.js');
    let w2 = new Worker('wait-on-fixed.js');
    let w3 = new Worker('wait-on-index.js');

    w1.onmessage = function(e) {
      rs.push("A " + e.data);
      check_done(rs);
    };
    w2.onmessage = function(e) {
      rs.push("B " + e.data);
      check_done(rs);
    };
    w3.onmessage = function(e) {
      rs.push("C " + e.data);
      check_done(rs);
    };

    let sab = new SharedArrayBuffer(1024);
    let view = new Int32Array(sab, 32, 20);

    w1.postMessage([view]);
    w2.postMessage([view]);

    let good_indices = [
        (view) => 0/-1,
        (view) => '-0',
        (view) => view.length - 1,
        (view) => ({ valueOf: () => 0 }),
        (view) => ({ toString: () => '0', valueOf: false }) // non-callable valueOf triggers invocation of toString
    ];

    setTimeout(function() {
        for (let idxGen of good_indices) {
            let idx = idxGen(view);
            view[idx] = 0;
            // Firefox cannot apply clone algorithm on an Object.
            // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
            if (typeof idx == "object") {
                idx = idx.valueOf ? idx.valueOf() : idx.toString();
            }
            Atomics.store(view, idx, 37);
            w3.postMessage([view, idx]);
        }
    }, 500);
}
