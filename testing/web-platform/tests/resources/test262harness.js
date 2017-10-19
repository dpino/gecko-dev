assert = {}

assert.sameValue = function(a, b) {
    assert_equals(a, b);
}
var verifyNotEnumerable = function(o, property) {
	let propDesc = Object.getOwnPropertyDescriptor(o, property);
	assert_equals(propDesc.enumerable, false, "must not be enumerable");
}
var verifyNotWritable = function(o, property) {
	let propDesc = Object.getOwnPropertyDescriptor(o, property);
	assert_equals(propDesc.writable, false, "must not be writable");
}
var verifyConfigurable = function(o, property) {
	let propDesc = Object.getOwnPropertyDescriptor(o, property);
	assert_equals(propDesc.configurable, true, "must not be configurable");
}
