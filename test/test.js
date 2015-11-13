/* globals it: false, describe: false */
var _ = require('lodash');
var assert = require("assert");
var chai = require("chai");
var named = require("../main.js");

// Dummy Client class for testing purposes. No methods except query, which returns its arguments

function Client() {
}

Client.prototype.query = function(sql, values, callback) {
  var out = {};
  out.sql = sql;
  out.values = values;
  out.callback = callback;

  // prepared statement call with 2 arguments
  if (_.isUndefined(callback) && _.isFunction(values) && _.isPlainObject(sql)) {
    out.callback = values;
    out.values = sql.values;
    out.sql = sql.text;
  }
  return out;
};

var client = new Client();
named.patch(client);

describe('node-postgres-named', function () {
  describe('Parameter translation', function () {
    it('Basic Interpolation', function () {
      var results = client.query("$a $b $c", {'a': 10, 'b': 20, 'c': 30});
      assert.deepEqual(results.values, [ 10, 20, 30 ]);
      assert.equal(results.sql, "$1 $2 $3");
    });

    it('Lexicographic order of parameter keys differs from order of appearance in SQL string', function () {
      var results = client.query("$z $y $x", {'z': 10, 'y': 20, 'x': 30});
      assert.deepEqual(results.values, [ 30, 20, 10 ]);
      assert.equal(results.sql, "$3 $2 $1");
    });

    it('Missing Parameters', function () {
      var flawedCall = function () {
        client.query("$z $y $x", {'z': 10, 'y': 20});
      };
      chai.expect(flawedCall).to.throw('Missing Parameters: x');
    });

    it('Extra Parameters', function () {
      var okayCall = function () {
        client.query("$x $y $z", {'w': 0, 'x': 10, 'y': 20, 'z': 30});
      };
      chai.expect(okayCall).not.to.throw();
    });

    it('Handles word boundaries', function() {
      var results = client.query("$a $aa", { a: 5, aa: 23 });
      assert.deepEqual(results.values, [5, 23]);
      assert.equal(results.sql, ["$1 $2"]);
    });
  });

  describe('Monkeypatched Dispatch', function () {
    it('Call with original signature results in unchanged call to original function', function () {
      var sql = "SELECT name FORM person WHERE name = $1 AND tenure <= $2 AND age <= $3";
      var values = ['Ursus Oestergardii', 3, 24];
      var callback = function () { };
      var results = client.query(sql, values, callback);
      assert.equal(results.sql, sql);
      assert.deepEqual(results.values, values);
      assert.equal(callback, callback);
    });
    it('Call with no values results in unchanged call to original function', function () {
      var sql = "SELECT name FORM person WHERE name = $1 AND tenure <= $2 AND age <= $3";
      var results = client.query(sql);
      assert.equal(results.sql, sql);
      assert.strictEqual(results.values, undefined);
      assert.strictEqual(results.callback, undefined);
    });
    it('Named parameter call dispatched correctly', function () {
      var sql = "SELECT name FORM person WHERE name = $name AND tenure <= $tenure AND age <= $age";
      var values = { 'name': 'Ursus Oestergardii',
                     'tenure': 3,
                     'age': 24 };
      var callback = function () { };
      var results = client.query(sql, values, callback);
      assert.equal(results.sql, 'SELECT name FORM person WHERE name = $2 AND tenure <= $3 AND age <= $1');
      assert.deepEqual(results.values, [24, "Ursus Oestergardii", 3]);
      assert.equal(callback, callback);
    });
    it('Prepared statement call', function() {
      var prepStmt = {
        name   : 'select.person.byNameTenureAge',
        text   : "SELECT name FORM person WHERE name = $name AND tenure <= $tenure AND age <= $age",
        values : { 'name': 'Ursus Oestergardii',
          'tenure': 3,
          'age': 24 }
      };
      var callback = function () { };
      var results = client.query(prepStmt, callback);
      assert.equal(results.sql, 'SELECT name FORM person WHERE name = $2 AND tenure <= $3 AND age <= $1');
      assert.deepEqual(results.values, [24, "Ursus Oestergardii", 3]);
      assert.equal(callback, callback);
    });
  });
});
