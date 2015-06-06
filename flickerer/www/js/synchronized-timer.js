function SynchronizedTimer(onError, toleratedError) {
	// toleratedError can be a value >= 0. If at one point an interval
	// has a bigger timing error than toleratedError times interval delay,
	// the onError method is called with the offset as parameter. 
	// Example usage:
	// var t = new SynchronizedTimer(function(e) {
	// 		console.log('Abort transmission due to timing error!');
	// }, 0.5)
	// t.setInterval(function() { Do something }, 500);
	// ...
	// t.clearInterval();

	if (toleratedError == undefined) {
		toleratedError = 0.5;
	}

	this.setInterval = function(fun, delay) {
		if (typeof delay === "string") {
			delay = parseFloat(delay);
		}
		this.stop = false;
		var _this = this;
		function intervalFun() {
			var arrived = Date.now();

			var offset = arrived - expected;
			if (offset > delay * toleratedError && typeof onError === "function") {
				onError(offset);
			}

			expected = Date.now() + delay - offset;
			if (!_this.stop) {
				setTimeout(intervalFun, delay - offset);
				fun();
			};
		}
		var expected = Date.now() + delay;
		setTimeout(intervalFun, delay);
	}

	this.clearInterval = function() {
		this.stop = true;
	}
}