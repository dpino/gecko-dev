let HTML_TEMPLATE = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title></title>
        <!-- Test262 required libraries -->
        <script src="http://{{host}}:{{ports[http][0]}}/resources/test262/harness/assert.js"><\/script>
        <script src="http://{{host}}:{{ports[http][0]}}/resources/test262/harness/sta.js"><\/script>
        <script type="text/javascript">
            function createWorkerFromString(source_text) {
                let blob = new Blob([source_text], {type: 'text/javascript'});
                let url = URL.createObjectURL(blob);
                return new Worker(url);
            }

            function enterEventLoop() {}

            function exitEventLoop(w) {
                if (w.constructor === Array) {
                    w.forEach((w) => w.terminate());
                } else if (typeof w === 'object') {
                    w.terminate();
                }
                dispatchEvent(new CustomEvent('done'));
            }

            function sleep(ns) {
                function wait(sec) {
                    let start = Date.now();
                    while (true) {
                        if (Date.now() - start > sec) {
                            return;
                        }
                    }
                }
                wait(ns);
                return {
                    then: function(fn) {
                        if (fn) { fn(); }
                    }
                }
            }
        <\/script>
    </head>
    <body>

    </body>

    <script type="text/javascript">
        window.addEventListener('load', function() {
            ###TEST262###
        });
    <\/script>
    </html>
`;

function prepareTest(test262, opts) {
    let output = [];
    if (opts.strict) {
        output.push('"use strict;"');
    }
    output.push(test262());
    return output.join("\n");
}

// Run in iframe strict.
function run_in_iframe_strict(test262, attrs, t) {
    run_in_iframe(test262, attrs, t, {strict: true});
}

// Run in iframe.
function run_in_iframe(test262, attrs, t, opts) {
    opts = opts || {};
    let html = HTML_TEMPLATE.replace('###TEST262###', prepareTest(test262, opts));
    console.log(html);

    let blob = new Blob([html], {type: 'text/html'});
    let iframe = document.createElement('iframe');
    iframe.style = 'display: none';
    iframe.src = URL.createObjectURL(blob);
    document.body.appendChild(iframe);

    let contentWindow = iframe.contentWindow;
    contentWindow.addEventListener('done', t.step_func(function(e) {
        t.done();
    }));
    let FAILED = 'iframe-failed' + opts.strict ? "-strict" : "";
    contentWindow.addEventListener('error', function(e) {
        e.preventDefault();
        top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
    });
    window.addEventListener(FAILED, t.step_func(function(e) {
        t.set_status(t.FAIL);
        throw new Error(e.detail);
    }));
}

// Run in window strict.
function run_in_window_strict(test262, attrs, t) {
    run_in_window(test262, attrs, t, {strict: true});
}

// Run in window.
function run_in_window(test262, attrs, t, opts) {
    opts = opts || {};
    let html = HTML_TEMPLATE.replace('###TEST262###', prepareTest(test262, opts));

    let blob = new Blob([html], {type: 'text/html'});
    let url = URL.createObjectURL(blob);

    let popup = window.open(url, 'popup');
    popup.addEventListener('done', t.step_func(function(e) {
        popup.close();
        t.done();
    }));

    let FAILED = 'popup-failed' + opts.strict ? "-strict" : "";
    popup.addEventListener('error', function(e) {
        e.preventDefault();
        top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
    });
    window.addEventListener(FAILED, t.step_func(function(e) {
        t.set_status(t.FAIL);
        throw new Error(e.detail);
    }));
}

let WORKER_TEMPLATE = `
    ###INCLUDES###

    function createWorkerFromString(source_text) {
        let blob = new Blob([source_text], {type: 'text/javascript'});
        let url = URL.createObjectURL(blob);
        return new Worker(url);
    }

    function enterEventLoop() {}

    function exitEventLoop(w) {
        if (w.constructor === Array) {
            w.forEach((w) => w.terminate());
        } else if (typeof w === 'object') {
            w.terminate();
        }
        postMessage(['done']);
    }

    function sleep(ns) {
        function wait(sec) {
            let start = Date.now();
            while (true) {
                if (Date.now() - start > sec) {
                    return;
                }
            }
        }
        wait(ns);
        return {
            then: function(fn) {
                if (fn) { fn(); }
            }
        }
    }

    onmessage = function(e) {
        ###TEST262###
    }
`;

function importScripts(includes) {
    function quote(str) {
        return "'" + str + "'";
    }
    includes = includes || [];
    let output = [];
    let root = 'http://{{host}}:{{ports[http][0]}}/resources/test262/harness/';
    let mandatory = ['assert.js', 'sta.js'];
    mandatory.forEach(function(filename) {
        output.push(quote(root + filename));
    });
    includes.forEach(function(filename) {
        output.push(quote(root + filename));
    });
    return "importScripts(" + output.join(",") + ");"
}

function run_in_worker_strict(test262, attrs, t, opts) {
    opts = opts || {};
    opts.strict = true;
    run_in_worker(test262, attrs, t, opts);
}

// Run in worker.
function run_in_worker(test262, attrs, t, opts) {
    opts = opts || {};

    let source_text = WORKER_TEMPLATE.replace('###TEST262###', prepareTest(test262, opts));
    source_text = source_text.replace('###INCLUDES###', importScripts());

    let blob = new Blob([source_text], {type: 'application/javascript'});
    let worker = new Worker(URL.createObjectURL(blob));

    worker.addEventListener('message', t.step_func(function(e) {
        let message = e.data[0];
        if (message == 'done') {
            t.done();
        }
    }));

    let FAILED = 'worker-failed' + opts.strict ? "-strict" : "";
    worker.addEventListener('error', function(e) {
        e.preventDefault();
        top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
    });
    window.addEventListener(FAILED, t.step_func(function(e) {
        console.log('fail1');
        t.set_status(t.FAIL);
        throw new Error(e.detail);
    }));
    worker.postMessage([]);
}

// Run in shared worker.
let SHARED_WORKER_TEMPLATE = `
    ###INCLUDES###

    function createWorkerFromString(source_text) {
        let blob = new Blob([source_text], {type: 'text/javascript'});
        let url = URL.createObjectURL(blob);
        return new Worker(url);
    }

    function enterEventLoop() {}

    function sleep(ns) {
        function wait(sec) {
            let start = Date.now();
            while (true) {
                if (Date.now() - start > sec) {
                    return;
                }
            }
        }
        wait(ns);
        return {
            then: function(fn) {
                if (fn) { fn(); }
            }
        }
    }

    onconnect = function(e) {
        function exitEventLoop(w) {
            if (w.constructor === Array) {
                w.forEach((w) => w.terminate());
            } else if (typeof w === 'object') {
                w.terminate();
            }
            port.postMessage(['done']);
        }

        let port = e.ports[0];

        port.addEventListener('message', function(e) {
            ###TEST262###
        });

        port.start();
    }
`;

function run_in_shared_worker_strict(test262, attrs, t) {
    let opts = {}
    opts.strict = true;
    run_in_shared_worker(test262, attrs, t, opts);
}

// Run in shared worker.
function run_in_shared_worker(test262, attrs, t, opts) {
    opts = opts || {};

    let source_text = SHARED_WORKER_TEMPLATE.replace('###TEST262###', prepareTest(test262, opts));
    source_text = source_text.replace('###INCLUDES###', importScripts());

    let blob = new Blob([source_text], {type: 'application/javascript'});
    let worker = new SharedWorker(URL.createObjectURL(blob));

    worker.port.addEventListener('message', t.step_func(function(e) {
        let message = e.data[0];
        if (message == 'done') {
            t.done();
        }
    }));

    let FAILED = 'shared-worker-failed' + opts.strict ? "-strict" : "";
    worker.addEventListener('error', function(e) {
        e.preventDefault();
        top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
    });
    window.addEventListener(FAILED, t.step_func(function(e) {
        t.set_status(t.FAIL);
        throw new Error(e.detail);
    }));
    worker.port.start();
    worker.port.postMessage([]);
}
