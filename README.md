# Nodejs MySQL Query Builder
a small lib that builds query using mysql and nodejs 


##Introduction

This is a small mysql query builder using the nojejs mysql driver by felixge. 

Sample Usage:

```js
var query_builder = require('query_builder');

var dbconn_default = {
	host : 'host',
	user : 'user',
	pass : 'password',
	dbase : 'database_schema'
};

var qb = new query_builder( dbconn_default );

var select_details = {
	table : 'table_name',
	fields : [ 'field1', 'field2', ... ],
	conditions : {
		field1 : 'value1',
		field2 : 'value2'
	}
};

qb.select( select_details, function( err, rows ){
	if( err )
		console.log( err );
	else
		console.log( rows );
});
```

By this, we can generate a query something like this:

```sql
SELECT `field1`, `field2` FROM `table_name` WHERE `field1` = 'value1' AND `field2` = 'value2'
```