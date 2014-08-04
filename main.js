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

  if (originalQuery.patched) return client;
  
  originalQuery = originalQuery.bind(client);

  var patchedQuery = function(config, values, callback) {
    var reparameterized;
    if (_.isPlainObject(config) && _.isPlainObject(config.values)) {
      reparameterized = numericFromNamed(config.text, config.values);
      config.text = reparameterized.sql;
      config.values = reparameterized.values;
    }

    if (arguments.length === 1) {
      return originalQuery(config);
    }
    else if (arguments.length === 2 && _.isFunction(values)) {
      return originalQuery(config, values);
    }
    else if (_.isUndefined(values) || _.isNull(values) || _.isArray(values)) {
      return originalQuery(config, values, callback);
    } else {
      reparameterized = numericFromNamed(config, values);
      return originalQuery(reparameterized.sql, reparameterized.values, callback);
    }
  };

  client.query = patchedQuery;
  client.query.patched = true;

  return client;
}

module.exports.patch = patch;
