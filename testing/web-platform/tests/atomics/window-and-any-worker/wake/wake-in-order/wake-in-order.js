onmessage = function(e) {
  let idx = e.data[0];
  let buffer = e.data[1];
  let ia = new Int32Array(buffer);
  while (true) {
    if (Atomics.load(ia, idx)) {
      break;
    }
  }
  let ret = Atomics.wait(ia, 0, 0);
  postMessage([idx, ret]);
}
