assert.sameValue(Atomics.wake.length, 3);

verifyNotEnumerable(Atomics.wake, "length");
verifyNotWritable(Atomics.wake, "length");
verifyConfigurable(Atomics.wake, "length");
