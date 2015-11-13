node-postgres-named
===================

Named parameters for node-postgres.

[![Circle CI](https://circleci.com/gh/bwestergard/node-postgres-named/tree/master.svg?style=svg)](https://circleci.com/gh/bwestergard/node-postgres-named/tree/master)
[![npm version](https://badge.fury.io/js/node-postgres-named.svg)](https://badge.fury.io/js/node-postgres-named)
[![dependencies](https://david-dm.org/bwestergard/node-postgres-named.svg)](https://david-dm.org/bwestergard/node-postgres-named)

Why node-postgres-named?
------------------------

Want to use postgres with node? [node-postgres](https://github.com/brianc/node-postgres) has you covered. Want [named parameters](https://github.com/brianc/node-postgres/issues/268)?

Well, postgres itself doesn't support them, and [brianc](https://github.com/brianc) has sagely opted to keep his library small and close to the postgres specification.

But SQL replete with meaningless numeric tokens (e.g. `$1`) isn't very readable. This module lets you monkeypatch [node-postgres](https://github.com/brianc/node-postgres) or [node-postgres-pure](https://github.com/brianc/node-postgres-pure) to support named parameters.

Go from this...

```javascript

client.query('SELECT name FROM person WHERE name = $1 AND tenure <= $2 AND age <= $3',
             ['Ursus', 2.5, 24],
             function (results) { console.log(results); });
             
```

to this...

```javascript

client.query('SELECT name FROM person WHERE name = $name AND tenure <= $tenure AND age <= $age',
             {'name': 'Ursus', 'tenure': 2.5, 'age': 24},
             function (results) { console.log(results); });
     
```

Tokens are identified with `\$[a-zA-Z]([a-zA-Z0-9_\-]*)\b`. In other words: they must begin with a letter, and can contain only alphanumerics, underscores, and dashes.

Execution of [prepared statements](https://github.com/brianc/node-postgres/wiki/Prepared-Statements) is also supported:

```javascript
client.query({
  name   : 'select.person.byNameTenureAge',
  text   : "SELECT name FORM person WHERE name = $name AND tenure <= $tenure AND age <= $age",
  values : { 'name': 'Ursus Oestergardii',
             'tenure': 3,
             'age': 24 }
}, function (results) { console.log(results); });
```

Usage
-----

Create a client as usual, then call the patch function on it. It will be patched in-place.

```javascript
var pg = require('pg'); 
var named = require('node-postgres-named');
var client = new pg.Client(conString);
named.patch(client);
```

Now both of the above call styles (with a list of values, or a dictionary of named parameters) will work.

Contributors
---------

Inspiration provided by a conversation with [Mike "ApeChimp" Atkins](https://github.com/apechimp). Support for prepared statements added by [nuarhu](https://github.com/nuarhu). Critical connection-pooling bugfix tediously diagnosed and patched by [Tony "tone81" Nguyen](https://github.com/tone81). [Mike "mfine15" Fine](https://github.com/mfine15) righted my unaesthetic mixing of double and single-quotes, and [Victor Quinn](https://github.com/victorquinn) fixed a spelling error.
