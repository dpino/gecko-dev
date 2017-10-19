importScripts('/resources/testharness.js');
importScripts('/resources/test262harness.js');

onmessage = function(e) {
	let script = e.data[0];
	eval(script);
	postMessage(["ok"]);
}
