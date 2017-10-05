importScripts('/resources/testharness.js');

onconnect = function (e) {
    var port = e.ports[0];

    port.addEventListener('message', function(e) {
        let ia = e.data[0];
        assert_equals(ia[0], 0);
        let ret = Atomics.wait(ia, 0, 0, NaN);
        port.postMessage([ret]);
    });
}
