node-postgres-named
===================

Want to use postgres with node? [node-postgres](https://github.com/brianc/node-postgres) has you covered.

Want [named parameters](https://github.com/brianc/node-postgres/issues/268)? Well, postgres itself doesn't support them, and [brianc](https://github.com/brianc) has sagely opted to keep his library small and close to the postgres specification.

But code full of random numeric tokens (e.g. `$1`) isn't very readable. This module lets you monkeypatch [node-postgres](https://github.com/brianc/node-postgres) or [node-postgres-pure](https://github.com/brianc/node-postgres-pure) to support named parameters.

Go from this...

```javascript

client.query("SELECT name FORM person WHERE name = $1 AND tenure <= $2 AND age <= $3",
             ['Ursus', 2.5, 24],
             function (results) { console.log(results); });
             
```

to this...

```javascript

client.query("SELECT name FORM person WHERE name = $name AND tenure <= $tenure AND age <= $age",
             {'name': 'Ursus', "tenure": 2.5, "age": 24},
             function (results) { console.log(results); });
     
```

Usage
-----

Create a client as usual, then call the patch function on it. It will be patched in-place.

```javascript
var pg = require('pg'); 
var named = require("node-postgres-named");
var client = new pg.Client(conString);
named.patch(client);
```

Now both of the above call styles (with a list of values, or a dictionary of named parameters) will work.
