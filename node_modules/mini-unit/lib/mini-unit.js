var Assert = require("assert");
var util = require("util");

var MiniUnit = exports;

MiniUnit.Skip = function (message) {
	this.message = message;
};
MiniUnit.Skip.prototype = Error;
MiniUnit.Skip.constructor = MiniUnit.Skip;

MiniUnit.TestCase = function (name) {
	this.name = name;
};

MiniUnit.TestCase.prototype.setup = function () {};
MiniUnit.TestCase.prototype.teardown = function () {};

var Runner = function () {
	this.tests = 0;
	this.failures = 0;
	this.errors = 0;
	this.skips = 0;
	this.report = [];
	this.stream = process.stdout;
};

Runner.prototype.progress = function (marker) {
	this.stream.write(marker);
};

Runner.prototype.reportStart = function (testCase) {
	this.stream.write("# Running tests:\n\n");
	this.startTime = Date.now();
};

Runner.prototype.reportTestCaseStart = function (testCase) {};

Runner.prototype.reportSuccess = function (testCase, test) {
	this.tests += 1;
	this.progress(".");
};

var originalPrepareStackTrace = Error.prepareStackTrace;
var stackArray = function (error, structuredStackTrace) {
	return structuredStackTrace.map(function (callSite) {
		return callSite.getFileName() + ":" + callSite.getLineNumber();
	});
};

Runner.prototype.reportFailure = function (testCase, test, error) {
	var message, originalPrepareStackTrace;
	this.tests += 1;
	switch (error.constructor) {
	case MiniUnit.Skip:
		this.skips += 1;
		this.report.push("Skip:\n" + test + "(" + testCase + ") []:\n" +
			error.message);
		this.progress("S");
		break;
	case Assert.AssertionError:
		this.failures += 1;
		if (this.message) {
			message = this.message;
		} else {
			message = "Expected: " + util.inspect(error.expected) + "\n" +
				"  Actual: " + util.inspect(error.actual) + "\n" +
				"    With: " + error.operator;
		}
		originalPrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = stackArray;
		this.report.push("Failure:\n" + test + "(" + testCase + ") [" + 
			error.stack[0] + "]:\n" + message);
		Error.prepareStackTrace = originalPrepareStackTrace;
		this.progress("F");
		break;
	default:
		this.errors += 1;
		this.report.push("Error:\n" + test + "(" + testCase + "):\n" +
			(error.stack || error.message || error.toString()));
		this.progress("E");
	}
};

Runner.prototype.reportTestCaseDone = function (testCase) {};

Runner.prototype.reportDone = function (testCase) {
	var count = 0,
		out = this.stream;
	
	out.write("\n\nFinished tests in " +
		((Date.now() - this.startTime) / 1000) + "s.\n\n");
	
	this.report.forEach(function (e) {
		count += 1;
		out.write(count + ") ");
		out.write(e);
		out.write("\n\n");
	});
	
	out.write(this.tests + " tests, ");
	out.write(this.failures + " failures, ");
	out.write(this.errors + " errors, ");
	out.write(this.skips + " skips");
	out.write("\n");
};

var runTest = function (testCase, test, runner) {
	var obj = Object.create(testCase);
	obj.setup();
	try {
		testCase[test].bind(obj)();
		runner.reportSuccess(testCase.name, test);
	} catch (err) {
		runner.reportFailure(testCase.name, test, err);
	}
	obj.teardown();
};

MiniUnit.runSuit = function (testCases) {
	var runner = new Runner();
	runner.reportStart();
	testCases.forEach(function (testCase) {
		var prop;
		runner.reportTestCaseStart(testCase.name);
		for (prop in testCase) {
			if (testCase.hasOwnProperty(prop) && prop.match(/^test./)) {
				runTest(testCase, prop, runner);
			}
		}
		runner.reportTestCaseDone(testCase.name);
	});
	runner.reportDone();
};

MiniUnit.run = function (/* testCase, ... */) {
	MiniUnit.runSuit([].slice.call(arguments));
};
