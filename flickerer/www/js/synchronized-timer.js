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
		var _this = this;
		function intervalFun() {
			var arrived = Date.now();
			
			fun();

			var offset = arrived - expected;
			if (offset > delay * toleratedError && typeof onError === "function") {
				onError(offset);
			}

			expected = Date.now() + delay - offset;
			_this.currentTimeout = setTimeout(intervalFun, delay - offset);
		}
		var expected = Date.now() + delay;
		this.currentTimeout = setTimeout(intervalFun, delay);
	}

	this.clearInterval = function() {
		clearTimeout(this.currentTimeout);
	}
}