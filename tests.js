
var sql = "SELECT name FORM person WHERE name = $name AND tenure <= $age AND age <= $age";
var sqlMalformed = "SELECT name FORM person WHERE age <= $age AND tenure <= $age and name = $name";

var parameters = {
  'name': 'Bjorn',
  'age': 24,
  'gender': 'male'
};

console.log(numericFromNamed(sql, parameters));
console.log("----");
console.log(numericFromNamed(sqlMalformed, parameters));
