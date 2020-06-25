# MiniUnit

xUnit style test cases, suites, and runner for Node's assert module. Inspired by
Ruby's MiniTest::Unit.

MiniUnit is only intended to help you structure your tests, it is expected
you'll be using it with the [Node.js assert module][assert] for assertions.

[assert]: http://nodejs.org/docs/latest/api/assert.html

## Usage

    // require MiniUnit and Node's assert module
    var MiniUnit = require("mini-unit");
    var assert = require("assert");
    
    // require the module under test
    var MyModule = require("./../lib/my-module");
    
    // create and name a test case
    var tc = new MiniUnit.TestCase("MyModule");
    
    // run before each test
    tc.setup = function () {
        this.adder = new MyModule.adder();
    };
    
    // run after each test
    tc.teardown = function () {
        this.adder.reset();
    };
    
    // test methods must be named 'test' followed by at least one character.
    tc.testAddition = function () {
        var a = 2,
            b = 2,
            result,
        
        result = this.adder.add(a, b)
        
        assert.equal(result, 4);
    };
    
    // if the file being run is the current file, then run the tests, otherwise
    // export the test case
    if (require.main === module) {
        MiniUnit.run(tc);
    } else {
        module.exports = tc;
    }

### Running a suite of test cases

    var MiniUnit = require("mini-unit");
    var testCases = [
        "./foo",
        "./bar"
    ].map(function (path) {
        return require(path);
    });
    
    MiniUnit.runSuit(testCases);
