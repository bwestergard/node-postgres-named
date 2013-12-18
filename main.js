var _ = require('lodash');

var tokenPattern = /\$[a-zA-Z]([a-zA-Z0-9_]*)\b/g;

function numericFromNamed(sql, parameters) {
  var fillableTokens = Object.keys(parameters);
  var matchedTokens = _.uniq(_.map(sql.match(tokenPattern), function (token) {
    return token.substring(1); // Remove leading dollar sign
  }));

  var fillTokens = _.intersection(fillableTokens, matchedTokens).sort();
  var fillValues = _.map(fillTokens, function (token) {
    return parameters[token];
  });

  var unmatchedTokens = _.difference(matchedTokens, fillableTokens);

  if (unmatchedTokens.length) {
    var missing = unmatchedTokens.join(", ");
    throw new Error("Missing Parameters: " + missing);
  }

  var interpolatedSql = _.reduce(fillTokens,
  function (partiallyInterpolated, token, index) {
    var replaceAllPattern = new RegExp('\\$' + fillTokens[index] + '\\b', "g");
    return partiallyInterpolated
      .replace(replaceAllPattern,
               '$' + (index+1)); // PostGreSQL parameters are inexplicably 1-indexed.
  }, sql);

  var out = {};
  out.sql = interpolatedSql;
  out.values = fillValues;

  return out;
}

function patch (client) {
  var originalQuery = client.query;
  originalQuery = originalQuery.bind(client);

  var patchedQuery = function(config, values, callback) {
    if (arguments.length === 1) {
      return originalQuery(config);
    }
    else if (arguments.length === 2 && _.isFunction(values)) {
      return originalQuery(config, values);
    }
    else if (_.isArray(values)) {
      return originalQuery(config, values, callback);
    } else {
      var reparameterized = numericFromNamed(config, values);
      return originalQuery(reparameterized.sql, reparameterized.values, callback);
    }
  };

  client.query = patchedQuery;
}

module.exports.patch = patch;
