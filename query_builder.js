'use strict';

var mysql = require('mysql'),
    pool_cluster = mysql.createPoolCluster(),
    pool_name = 'default';

function QB(options){
	if( typeof options !== "undefined" ){
		pool_cluster.add(
			( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name,
			{
				host 	 : options.host,
				user 	 : options.user,
				password : options.pass,
				database : options.dbase,
				debug	 : ( typeof options.debug !== "undefined" ) ? options.debug : false
			}
		);
	}
}

QB.prototype.add = function( options ){
	if( typeof options !== "undefined" ){
		pool_cluster.add(
			( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name,
			{
				host 	 : options.host,
				user 	 : options.user,
				password : options.pass,
				database : options.dbase,
				debug	 : ( typeof options.debug !== "undefined" ) ? options.debug : false
			}
		);
	}
}

QB.prototype.native_query = function( options, callback ){
	pool_cluster.getConnection( ( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name, function( err, connection ){
		if (err) 
			callback(err,null);
		
		connection.query( options.query, function( err, result ){
			if (err)
				callback(err,null);
			
			connection.destroy();
			
			callback(null,result);
		});
	});
}

QB.prototype.select = function( opts, callback ){
	var sql = 'SELECT {0} FROM {1}{2}{3}{4}{5}{6}',
		table = mysql.escapeId( opts.table ),
		fields = ( typeof opts.fields !== "undefined" ) ? mysql.escapeId( opts.fields ) : '*',
		where = ( typeof opts.conditions !== "undefined" ) ? ' WHERE' + this.format_conditions( opts.conditions ) : '',
		joins = ( typeof opts.joins !== "undefined" ) ? this.format_joins( opts.table, opts.joins ) : '',
		start_row = ( typeof opts.start_row !== "undefined" ) ? opts.start_row : 0,
		limit = ( typeof opts.limit !== "undefined" ) ? ' LIMIT ' + start_row + ', ' + opts.limit : '',
		group_by = ( typeof opts.group !== "undefined" ) ? ' GROUP BY ' + opts.group : '',
		order_by = ( typeof opts.order !== "undefined" ) ? ' ORDER BY ' + opts.order : '',
		fields = ( typeof opts.count !== "undefined" ) ? (( typeof opts.count_fields !== 'undefined' ) ? opts.count_fields : 'COUNT( * ) AS count') : fields
	;
	
	var sql_string = this.format( sql, fields, table, joins, where, group_by, order_by, limit );
	
	pool_cluster.getConnection( ( typeof opts.pool_name !== "undefined" ) ? opts.pool_name : pool_name, function( err, connection ){
		if (err) 
			callback(err,null);
		
		connection.query( sql_string, function( err, result ){
			if( 
				typeof opts.show_query !== "undefined" 
				&&
				opts.show_query
			)
				console.log( sql_string );
				
			if (err)
				callback( err, null );
			else
				callback( null, result );
				
			connection.destroy();
		});
	});
}

QB.prototype.insert = function( options, callback ){
	var sql_string = 'INSERT INTO ' + mysql.escapeId( options.table ) + ' SET ?';
	
	pool_cluster.getConnection( ( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name, function( err, connection ){
		if(err) callback( err, null );
		
		connection.query( sql_string, options.details, function( err, result ){			
			if( 
				typeof options.show_query !== "undefined" 
				&&
				options.show_query
			)
				console.log( mysql.format(sql_string, [options.details]) );
				
			if (err)
				callback( err, null );
			else
				callback( null, result, result.insertId );
				
			connection.destroy();
		});
	});
}

QB.prototype.update = function( options, callback ){
	var sql_string = 'UPDATE ?? SET ?';
	
	if( 
		typeof options.conditions !== "undefined"
		&& this.size( options.conditions ) > 0 
	)
		sql_string += ' WHERE ' + this.format_conditions( options.conditions );
	
	pool_cluster.getConnection( ( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name, function( err, connection ){
		if(err) callback( err, null);
		
		var opts = [options.table, options.details];
			
		sql_string = mysql.format(sql_string, opts);
		
		connection.query( sql_string, function( err, result ){			
			if( 
				typeof options.show_query !== "undefined" 
				&&
				options.show_query
			)
				console.log( sql_string );
					
			if (err){
				callback( err, null );
			}else
				callback( null, result, result.changedRows );
			
			connection.destroy();
		});
	});
}

QB.prototype.delete = function( options, callback ){
	var sql_string = 'DELETE FROM ??';
	
	if( this.size( options.conditions ) > 0 ){
		sql_string += ' WHERE ' + this.format_conditions( options.conditions );
	}

	pool_cluster.getConnection( ( typeof options.pool_name !== "undefined" ) ? options.pool_name : pool_name, function( err, connection ){
		if(err) callback( err, null );
		
		var opts = [options.table];
			
		sql_string = mysql.format(sql_string, opts);
		
		connection.query( sql_string, function( err, result ){
			if( 
				typeof options.show_query !== "undefined" 
				&&
				options.show_query
			)
				console.log( sql_string );
					
			if (err){
				callback( err, null );
			}else
				callback( null, result, result.affectedRows );
			
			connection.destroy();
		});
	});
}

QB.prototype.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

QB.prototype.format = function() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];
    
    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }
    
    return theString;
}

QB.prototype.format_joins = function( table, opts ){
	var arr = [],
		join_types = {
			'inner' : 'INNER JOIN',
			'left' : 'LEFT OUTER JOIN',
			'right' : 'RIGHT JOIN',
			'default' : 'JOIN'
		}
	;
	
	for (var key in opts) { if (opts.hasOwnProperty(key)) {
		var keys = Object.keys( opts[key] );
		var values = keys.map(function(v) { return opts[key][v]; });
		
		if( typeof opts[key]['type'] !== "undefined" ){
			var _join_type = opts[key]['type'];
			delete opts[key]['type'];
		}
		
		if( typeof _join_type === "undefined" ){
			var pos = key.indexOf( " " );
			
			if( pos > -1 ){
				var key_arr = key.split(" ");
				arr.push( ' JOIN ' + mysql.escapeId( key_arr[0] ) + ' ' + key_arr[1] + ' ON ' + this.format_conditions( opts[key], true ) );
			} else
				arr.push( ' JOIN ' + mysql.escapeId(key) + ' ON ' + this.format_conditions( opts[key], true ) );
		} else {
			var pos = key.indexOf( " " );
			
			if( pos > -1 ){
				var key_arr = key.split(" ");
				arr.push( ' ' + join_types[_join_type] + ' ' + mysql.escapeId( key_arr[0] ) + ' ' + key_arr[1] + ' ON ' + this.format_conditions( opts[key], true ) );
			} else
				arr.push( ' ' + join_types[_join_type] + ' ' + mysql.escapeId(key) + ' ON ' + this.format_conditions( opts[key], true ) );
		}
	}}
	
	return arr.join(' ');
}

QB.prototype.format_conditions = function( opts, is_join ){
	var arr = [];
	is_join = ( typeof is_join !== "undefined" ) ? is_join : false;
	
	if( typeof opts === "object" ){
		var or_and = [ 'and', 'or', 'not' ];
		
		for (var key in opts) {
			if (opts.hasOwnProperty(key)) {
				if( or_and.indexOf( key ) > -1 ){
					arr.push( this.reformat_fields( key, opts[ key ], is_join ) );
				}else{
					var _arr = {};
					_arr[key] = opts[ key ];
					
					arr.push( this.reformat_fields( '', _arr, is_join ) );
				}
			}
		}
	} else
		arr.push( this.reformat_fields( 'AND', opts, is_join ) );
	
	var res = arr.join( ' AND ' ).replace( 'AND AND', 'AND' ).replace( 'AND OR', 'OR' ).replace( /\s+/g, ' ' ).replace("= 'IS NULL'", 'IS NULL').replace( "= 'IS NOT NULL'", 'IS NOT NULL');
	
	return res;
}

QB.prototype.reformat_fields = function( or_and, fields, is_join ){
	var arr = [];
	
	for (var key in fields) {
		if (fields.hasOwnProperty(key)) {
			if( [ 'and', 'or', 'not' ].indexOf( key ) > -1 && this.size( fields[key] ) > 0 && typeof fields[key] === "object" ){
				if( [ 'and', 'or', 'not' ].indexOf( key ) > -1 ){
					arr.push( this.reformat_fields( key, fields[ key ], is_join ) );
				}else{
					var _arr = {};
					_arr[key] = fields[ key ];
					
					arr.push( this.reformat_fields( '', _arr, is_join ) );
				}
			}
			
			if( [ 'and', 'or', 'not' ].indexOf( key ) == -1 ){
				if( typeof fields[key] === "object" && this.size( fields[key] ) > 0 ){
					var e = [];
					
					if( 
						typeof fields[key] !== "undefined"
						&& typeof fields[key][0] !== "undefined"
						&& typeof fields[key][0][0] !== "undefined" 
						&& typeof fields[key][0] === "object" 
					){
						for (var key1 in fields[key]) {
							if (fields[key].hasOwnProperty(key1)) {
								for (var key2 in fields[key][key1]) {
									if (fields[key][key1].hasOwnProperty(key2)) {
										e.push( fields[key][key1][key2] );
									}
								}
							}
						}
					} else {
						for (var key1 in fields[key]){
							if (fields[key].hasOwnProperty(key1)){
								e.push( fields[key][key1] );
							}
						}
					}
				}
				
				if( typeof fields[key] === "object" && this.size( fields[key] ) > 0 ){
					if( or_and.toLowerCase() == 'or' && key.toLowerCase().indexOf( 'like' ) == -1 ){
						arr.push( mysql.escapeId( key ) + ' IN ( \'' + e.join( '\', \'' ) + '\' ) ' + ' ' );
					} else if( or_and.toLowerCase() == 'not' ){
						if( key.toLowerCase().indexOf( 'like' ) == -1 )
							arr.push( mysql.escapeId( key ) + ' NOT IN (\'' + e.join( '\', \'' ) + '\' ) ' + ' ' );
						else{
							for (var e_key in e) {
								if (e.hasOwnProperty(e_key)){
									arr.push( mysql.escapeId(key.replace( ' LIKE' ).replace(' like')) + ' NOT LIKE ' + mysql.escape(e[e_key]) + ' ' );
								}
							}						
						}
					} else {
						if( this.size( e ) > 1 ){
							arr.push( mysql.escapeId( key ) + ' IN ( \'' + e.join( '\', \'' ) +  '\' ) ' + ' ' );
						} else {
							matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
							if( 
								matches != null
								&& this.size( matches ) > 0 
							)
								arr.push( matches[1] + '' + matches[2] + ' ' + mysql.escape(e[0]) + ' ' );
							else
								arr.push( mysql.escapeId( key ) + ' = ' + mysql.escape(e[0]) + ' ' );
						}
					}
				} else {
					if( or_and.toLowerCase() == 'not' ){
						if( key.toLowerCase().indexOf( 'like' ) > -1 ){
							arr.push( mysql.escapeId( key.replace( ' LIKE' ).replace(' like') ) + ' NOT LIKE ' + mysql.escape(fields[key]) + ' ' );
						} else {
							matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
							if( this.size( matches ) > 0 )
								arr.push( matches[1] + '' + matches[2] + ' ' + mysql.escape(fields[key]) + ' ' );
							else
								arr.push( mysql.escapeId( key ) + ' != ' + mysql.escape(fields[key]) + ' ' );
						}
					} else {
						if( key.toLowerCase().indexOf( 'like' ) > -1 )
							arr.push( key + ' ' + mysql.escape(fields[key]) + ' ' );
						else{
							matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
							if( 
								matches != null
								&& this.size( matches ) > 0 
							)
								arr.push( matches[1] + '' + matches[2] + ' ' + mysql.escape(fields[key]) + ' ' );
							else{
								arr.push( mysql.escapeId( key ) + ' = ' + mysql.escape(fields[key]) + ' ' );
							}
						}
					}
				}
			}
		}
	}
	
	var arr_size = this.size( arr );
	if( arr_size > 0 ){
		var a = '';
		if( arr_size == 1 )
			a = ( or_and.toLowerCase() == 'not' ) ? 'AND' : or_and + ' ' + arr[0];
		else
			a = ' ( ' + arr.join( ' ' + ( or_and.toLowerCase() == 'not' ? 'AND' : or_and ) + ' ' ).replace( 'AND AND', 'AND' ).replace( 'AND OR', 'OR' ) + ' ) ';			
		
		return is_join ? a.replace(/`/g, '').replace(/'/g, '') : a;
	} else
		return;
}

QB.prototype.test = function( opts ){
	console.log( mysql.escape( opts ) );
}

exports = module.exports = QB;
