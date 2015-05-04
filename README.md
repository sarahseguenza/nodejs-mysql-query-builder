# Nodejs MySQL Query Builder
A small lib that builds query using mysql and nodejs 

credits to https://github.com/felixge/node-mysql for mysql nodejs module

##Table of Contents

- [Introduction](#introduction)
- [Database Configuration and Connecting to your Database](#database-configuration-and-connecting-to-your-database)
- [Connection Options](#connection-options)
- [Queries](#queries)
- [Select Statement](#select-statement)
- [Update Statement](#update-statement)
- [Delete Statement](#delete-statement)
- [Insert Statement](#insert-statement)
- [Native Query](#native-query)
- [Set Field Clause](#set-field-clause)
- [Build a Condition Clause](#build-a-condition-clause)
- [Build a Join Clause](#build-a-join-clause)
- [View the Generated Query](#view-the-generated-query)

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

## Database Configuration and Connecting to your Database

This module used the poolcluster functionality that provides multiple host connection.

Below is how you connect to your default database schema.

```js
var dbconn_default = {
	host : 'host',
	user : 'user',
	pass : 'password',
	dbase : 'database_schema'
};

var default_schema = new query_builder( dbconn_default );
```

Connect in other database

```js
var dbconn1 = {
	host : 'host',
	user : 'user',
	pass : 'password',
	dbase : 'other_database_schema',
	pool_name : 'DBCONN1'
};

var new = new query_builder( dbconn1 );

new.select( 
	{
		table : 'table_name_in_another_database',
		fields : [ 'field1', 'field2', ... ],
		conditions : {
			field1 : 'value1',
			field2 : 'value2'
		},
		pool_name : 'DBCONN1'
	}, 
	function( err, rows ){
		if( err )
			console.log( err );
		else
			console.log( rows );
	}
);
```

## Connection Options

Configuration to establish connection are as follows:

* `host` : Hostname of the database.
* `user` : The username used to connect to the database.
* `pass` : The password used to connect to the database.
* `dbase` : The name of the database you want to connect to.
* `pool_name` : Connection name identifier ( use when using multiple connections ).

## Queries

To submit a query, use the following functions.

```js
qb.select( query_details_here, callback );
qb.update( query_details_here, callback );
qb.delete( query_details_here, callback );
qb.insert( query_details_here, callback );
qb.native_query( query_here, callback );
```

This will automatically generate, escape and execute a query.

## Select Statement

Options for Select Statement

* `table` : The table name that you want to select. Required.
* `fields` : An array of table fields that you want to show.
* `conditions` : This is for `WHERE` clause. Please see `Build a Condition Parameters`.
* `joins` : This is for `JOIN` portion of your query. Please see `Build a Join Parameters`.
* `order` : Set an `ORDER BY` clause.
* `group` : Permits you to create a `GROUP BY` clause.
* `limit` : Limit the number of rows you would like returned by the query.
* `start_row` : Set a result offset. Commonly used on pagination functionality.
* `count` : Determine the number of rows in a particular table. A boolean type. Set to `false` by default.
* `count_fields` : Field set with `COUNT` option. Sample is COUNT( users.id ) as X. This will overwrite the `fields` option.
* `show_query` : View the generated query. Please see `View the Generated Query`.

```js
	qb.select(
		{
			table : 'table',
			fields : [ 'field1', 'field2' ],
			conditions : {
				field1 : 'value1',
				field2 : 'value2'
			},
			order : 'field_name ASC',
			group : 'field_name, ...',
			limit : 10,
			start_row : 1,
			show_query : true
		},
		function( err, row ){
			// callback
			// err : an error code, msg
				// { [Error: ER_NO_SUCH_TABLE: Table 'database_schema.table' doesn't exist]
				//  code: 'ER_NO_SUCH_TABLE',
				//  errno: 1146,
				//  sqlState: '42S02',
				//  index: 0 }
			// row : contain results of the query
				// [{
				//	field1 : value1,
				//	field2 : value2
				//	}]
		}
	);
```

## Update Statement

Options for Update Statement

* `table` : The table name where you want to update a particular record. Required.
* `details` : This is where we set the fields and its new values. Please see build `Set Fields Parameters`.
* `conditions` : This is for `WHERE` clause. Please see `Build a Condition Parameters`.
* `show_query` : View the generated query. Please see `View the Generated Query`.

```js
	qb.update(
		{
			table : 'table',
			details : {
				field3 : 'new_value',
				...	   : '...'
			},
			conditions : {
				field1 : 'value1',
				field2 : 'value2'
			},
			show_query : true
		},
		function( err, result, number_of_changed_rows ){
			// callback
			// err : an error code, msg
				// { [Error: ER_NO_SUCH_TABLE: Table 'database_schema.table' doesn't exist]
				//  code: 'ER_NO_SUCH_TABLE',
				//  errno: 1146,
				//  sqlState: '42S02',
				//  index: 0 }
			// result : contain results of the query
			// number of changed rows : The number of changed rows when executing the update statement
		}
	);
```

## Delete Statement

Options for Delete Statement

* `table` : The table name where you want to delete a particular record. Required.
* `conditions` : This is for `WHERE` clause. Please see `Build a Condition Parameters`.
* `show_query` : View the generated query. Please see `View the Generated Query`.

```js
	qb.delete(
		{
			table : 'table',
			conditions : {
				field1 : 'value1',
				field2 : 'value2'
			},
			show_query : true
		},
		function( err, result, number_of_affected_rows ){
			// callback
			// err : an error code, msg
				// { [Error: ER_NO_SUCH_TABLE: Table 'database_schema.table' doesn't exist]
				//  code: 'ER_NO_SUCH_TABLE',
				//  errno: 1146,
				//  sqlState: '42S02',
				//  index: 0 }
			// result : contain results of the query
			// number of affected rows : The number of deleted rows when executing the delete statement
		}
	);
```

## Insert Statement

Options for Insert Statement

* `table` : The table name where you want to insert a particular record. Required.
* `details` : This is where we set the fields and its values. Please see build `Set Fields Parameters`.
* `show_query` : View the generated query. Please see `View the Generated Query`.

```js
	qb.insert(
		{
			table : 'table',
			details : {
				field1 : 'value1',
				field2 : 'value2'
			}
		},
		function( err, result, inserted_id ){
			// callback
			// err : an error code, msg
				// { [Error: ER_NO_SUCH_TABLE: Table 'database_schema.table' doesn't exist]
				//  code: 'ER_NO_SUCH_TABLE',
				//  errno: 1146,
				//  sqlState: '42S02',
				//  index: 0 }
			// result : contain results of the query
			// inserted id : The generated primary id of the newly created row
		}
	);
```

## Native Query

Options for executing a query

* `query` : Your query statement to execute.
* `pool_name` : Use this if you have multiple connections. Optional.

```js
	qb.native_query( { query : 'SELECT * FROM users' }, function( err, result ){
		console.log( result );
	});
```

## Set Field Clause

This is for select and insert queries.

To build on what fields to insert and/or update, please create an object of field names and values

```js
{ field1 : 'value', field2 : 'value' }
```

This will generate

```sql
UPDATE `table` SET `field1` = 'value', `field2` = 'value';
INSERT INTO `table` SET `field1` = 'value', `field2` = 'value';
```

## Build a Condition Clause

This is where we build the `WHERE` clause.

For simple condition, this will generate an AND operator by default
```js
	{
		field1 : 'value',
		field2 : 'value'
	}
```
```sql
	`field1` = 'value' AND `field2` = 'value'
```

Joined by OR
```js
	{
		or : {
			field1 : 'value',
			field2 : 'value'
		}
	}
```
```sql
	`field1` = 'value' OR `field2` = 'value'
```

IN clauses
```js
	{
		field1 : {
			field1 : 'value',
			field2 : 'value'
		}
	}
```
```sql
	`field1` IN( 'value', 'value' )
```

NOT clauses
```js
	1. {
		not : {
			field1 : 'value',
			field2 : 'value'
		}
	}
	
	2. {
		'field1 !=' : 'value'
	}
```
```sql
	1. `field1` != 'value' AND `field2` != 'value'
	
	2. `field1` != 'value'
```

LIKE clause, by default, this will joined by AND
```js
	{
		'field1 LIKE' : '%value%',
		'field2 NOT LIKE' : 'value%'
	}
```
```sql
	`field1` LIKE '%value%' AND `field2` NOT LIKE 'value%'
```

OR LIKE clause

LIKE clause, by default, this will joined by AND
```js
	or : {
		'field1 LIKE' : '%value%',
		'field2 NOT LIKE' : 'value%'
	}
```
```sql
	`field1` LIKE '%value%' OR `field2` NOT LIKE 'value%'
```

Nested clause
```js
	and : {
		and : {
			key1 : 'value',
			key2 : 'value'
		},
		or : {
			key3 : 'value',
			key4 : 'value'
		},
		not : {
			key5 : 'value',
			key6 : 'value'
		}
	}
```
```sql
	( ( `key1` = 'value' and `key2` = 'value' ) and ( `key3` = 'value' or `key4` = 'value' ) and ( `key5` != 'value' AND `key6` != 'value' ) )
```

Other operators
```js
	{
		'field1 !=' : 1,
		'field2 <=' : 1,
		'field3 >=' : 1
	}
```
```sql
	field1 != 1 AND field2 <= 1 AND field3 >= 1
```

Summary of Condition clause
```js
	{
		field1 : 'value',
		field2 : 'value',
		'field1 !=' : 'value',
		'field1 LIKE' : '%value%',
		'field2 NOT LIKE' : 'value%',
		'field1 !=' : 1,
		'field2 <=' : 1,
		'field3 >=' : 1
		or : {
			field1 : 'value',
			field2 : 'value',
			'field1 LIKE' : '%value%',
			'field2 NOT LIKE' : 'value%'
		},
		and : {
			field1 : 'value',
			field2 : 'value'
		},
		field3 : {
			key1 : 'value',
			key2 : 'value'
		},
		not : {
			field1 : 'value',
			field2 : 'value'
		},
		and : {
			and : {
				key1 : 'value',
				key2 : 'value'
			},
			or : {
				key3 : 'value',
				key4 : 'value'
			},
			not : {
				key5 : 'value',
				key6 : 'value'
			}
		}
	}
```
```sql
	SELECT 		* 
	FROM 		`table` 
	WHERE  		`field1` = 'value' 
				AND 
				`field2` = 'value' 
				AND 
				field1 != 1 
				AND 
				field1 LIKE '%value%' 
				AND 
				field2 NOT LIKE 'value%' 
				AND 
				field2 <= 1 
				AND 
				field3 >= 1 
				AND 
				( `field1` = 'value' or `field2` = 'value' or field1 LIKE '%value%' or field2 NOT LIKE 'value%' ) 
				AND 
				( ( `key1` = 'value' and `key2` = 'value' ) and ( `key3` = 'value' or `key4` = 'value' ) and ( `key5` != 'value' AND `key6` != 'value' ) ) 
				AND 
				`field3` IN ( 'value', 'value' )
				AND 
				( `field1` != 'value' AND `field2` != 'value' )
	;
```

## Build a Join Clause

Permits you to write the JOIN portion of your query.

Options are as follows:

* `joins` : An object of table details to join.
* `type` : Optional and this is `JOIN` by default. Join types are `left`, `right` and `inner`.
* `ON clause` : This is where the ON condition resides. Similar to `Condition` parameter format.

```js
	qb.select(
		{
			table : 'users',
			joins : {
				'user_types' : {
					type : 'left',
					'users.user_type_id !=' : 'user_types.user_type_id'
				},
				'another table to join' : {
					'field' : 'field'
				}
			}
		},
		function( err, rows ){
			console.log( rows );
		}
	);
```
```sql
	SELECT * FROM `users` LEFT OUTER JOIN `user_types` ON  users.user_type_id != user_types.user_type_id
```

## View the Generated Query

This will log the generated query using `console.log()`.

Setting is as simple as assigning a boolean value to `show_query`. This is set `false` by default.