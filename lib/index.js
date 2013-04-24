var traceback = require("traceback");
var DD = require("node-dogstatsd").StatsD;

module.exports = function (mongodb, options) {
	options = options || {};
	var datadog = options.dogstatsd || new DD();
	var stat = options.stat || "node.mongodb";

	var wrapFunction = function (object, fnName) {
		var fn = object[fnName];

		object[fnName] = function () {
			var args = Array.prototype.slice.call(arguments);
			var tags = [];

			tags.push("collection:" + this.collectionName);
			tags.push("operation:" + fnName);

			var stack = traceback();

			// look for first file that is not in `node_modules` and not this module
			var stackLength = stack.length;
			for (var i = 0; i < stackLength; i++) {
				var path = stack[i].path;

				if (
					path.indexOf("node_modules") == -1 &&
					path.substr(0, 1) == "/" &&
					path.indexOf(__dirname) == -1
				) {
					var calledBy = stack[i];
					tags.push("caller:" + calledBy.path + ":" + calledBy.line);
					break;
				}
			}

			// look for query fields
			if (fnName != "insert" && typeof(args[0]) == "object") {
				// sort and comma delimit
				var fields = Object.keys(args[0]).sort().join(",");

				// only add the tag if we found fields
				if (fields != "") {
					tags.push("fields:" + fields);
				}
			}

			// callback is always last so grab it
			var cb = args[args.length - 1];

			if (typeof(cb) == "function") {
				// hold on to start time
				var start = new Date();

				args[args.length - 1] = function (err) {
					// calc time to run operation
					var time = (new Date() - start);

					if (err) {
						tags.push("error:" + err.message);
					}

					// if update or remove grab the count argument
					if (arguments[1] && (
						fnName == "update" ||
						fnName == "remove"
					)) {
						tags.push("count:" + arguments[1]);
					}

					// if insert grab the length of the docs argument
					if (arguments[1] && fnName == "insert") {
						tags.push("count:" + arguments[1].length);
					}

					// send histogram data
					datadog.histogram(stat, time, 1, tags);
					datadog.set(stat + ".count", fnName, tags);

					// return and call callback
					return cb.apply(this, arguments);
				};
			} else {
				// no callback just send the data
				datadog.set(stat + ".count", fnName, tags);
			}

			// return and call the function we are wrapping
			return fn.apply(this, args);
		};
	};

	// wrapp mongodb functions
	["find", "update", "insert", "remove"].forEach(function (fnName) {
		wrapFunction(mongodb.Collection.prototype, fnName);
	});
};
