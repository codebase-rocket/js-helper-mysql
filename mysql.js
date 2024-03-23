// Info: Boilerplate library. Connects to MySql Database. Contains Wraper Functions for MySQL functions
'use strict';

// Shared Dependencies (Managed by Loader)
var Lib = {};

// MySQL Library for NodeJS (Private scope)
const NodeMySQL = require('mysql');

// Exclusive Dependencies
var CONFIG = require('./config'); // Loader can override it with Custom-Config


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations

  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs

  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Must be loaded in memory already)
    Lib.Utils = shared_libs.Utils;
    Lib.Debug = shared_libs.Debug;
    Lib.Instance = shared_libs.Instance;

    // Override default configuration
    if( !Lib.Utils.isNullOrUndefined(config) ){
      Object.assign(CONFIG, config); // Merge custom configuration with defaults
    }

  };

//////////////////////////// Module-Loader END /////////////////////////////////



///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return MySql;

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START//////////////////////////////
const MySql = { // Public functions accessible by other modules

  /********************************************************************
  Build a SQL query with input paramaters
  (Automatically Escape inputs, so no need to do manually escape before)

  ~Different value types are escaped differently, here is how (From mysqljs/mysql Documentaion):
  ~Numbers are left untouched
  ~Booleans are converted to true / false
  ~Strings are safely escaped. Automatically enclosed within single quotes
  ~undefined / null are converted to NULL

  @param {String} query - Query string
  @param {Object[]} inserts - Query Inputs

  @return {String} - SQL Escaped string
  *********************************************************************/
  buildQuery: function(query, inserts){

    // Example 1
    //  query = "SELECT * FROM ?? WHERE ?? = ?";
    //  inserts = ['test', 'id', userId];
    //  sql = Sql.buildQuery(query, inserts);

    // Example 2
    //  query = 'INSERT INTO test SET ?';
    //  inserts = {id: 1, title: 'Hello MySQL'};
    //  sql = Sql.buildQuery(query, inserts);

    // Example 3
    //  query = 'UPDATE test SET ? WHERE ? AND ?';
    //  inserts = { field1: 'foo', field2: 'bar' };
    //  condition1 = { id1: 'abc' };
    //  condition2 = { id2: 'xyz' };
    //  sql.push( Sql.buildQuery(query, [inserts, condition1, condition2]) );


    // Return safe Escaped string
    return NodeMySQL.format(query, inserts);

  },


  /********************************************************************
  Build a SQL query with no escaping. Use this Function carefully.
  (Used for sending nested sql statements when setting value)

  @param {String} str - SQL Keywords/sub-query string

  @return {Object} - String like object but it won't get escaped when used in format()
  *********************************************************************/
  buildRawText: function(str){

    // Return un-escapable string like object
    return NodeMySQL.raw(str);

  },


  /********************************************************************
  Join multiple feilds with 'AND' or 'OR'
  (Automatically Escape inputs, so no need to do manual escape before)

  @param {Set} data - Key-Value Pairs of Identifier-fields and their values
  @param {String} [multi_operator] - (Optional) Default 'AND' ('AND' | 'OR')

  @return {String} - Joined Multiple Conditions. SQL Escaped string
  *********************************************************************/
  buildMultiCondition: function(data, multi_operator = 'AND'){

    // Join each (key:value) by 'AND'
    let list = [];
    for( let key in data ){
      list.push( MySql.buildQuery(
        ' ?? = ? ',
        [ key, data[key] ]
      ));
    }


    return list.join( ` ${multi_operator} ` );

  },


  /********************************************************************
  MySQL get Single/Multiple record(s)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished
  @param {String} sql - SQL query statement

  @callback - Request Callback(err, result, has_multiple_rows)
  * @callback {Error} err - In case of error
  * @callback {String} result - Single value When only one record entry is returned
  * @callback {Map} result - Row as named array if single record is returned
  * @callback {Map[]} result - Multiple Row as array of (named array) if multiple records are retured
  * @callback {object} result - null if no result (note: not returning FALSE, because if output is string "0", it would be mis-treated as FALSE)
  * @callback {Boolean} has_multiple_rows - true in case of multiple rows as result. false is only one record.
  *********************************************************************/
  getRecord: function(instance, cb, sql){

    // Initalize SQL Connection if not Initalized
    _MySql.initIfNot(
      instance,
      function(err, mysql_connection){ // Callback function

        if(err){ // Error Connecting to SQL Host
          return cb(err); // Invoke Callback with error
        }

        else{
          query(mysql_connection); // Execute SQL Query
        }

      },
      true // Read Only Operation
    );


    // SQL Query
    function query(mysql_connection){

      // Execute SQL
      Lib.Debug.timingAuditLog('Start', 'MySQL-Database - Get Record', instance['time_ms']);
      mysql_connection.query(sql, function(err, results, fields){

        // To be returned in callback, whether result has single record or multiple record
        var has_multiple_rows = false;

        Lib.Debug.timingAuditLog('End', 'MySQL-Database - Get Record', instance['time_ms']);
        // Error fetching record
        if(err){

          // Log error for research
          Lib.Debug.logErrorForResearch(
            err,
            'Cause: MySQL' +
            '\ncmd: Get Record' +
            '\nsql: ' + JSON.stringify(sql)
          );

          // Invoke Callback and forward error from mysql-database
          return cb(err);

        }


        // On Success - Properly format result depending on number of rows

          // To be returned in callback, whether result has single record or multiple record
          has_multiple_rows = false;

          // If empty
          if( !results.length ){ //If empty array
            results = null;
          }

          // If Multiple rows
          else if( results.length > 1 ){
            has_multiple_rows = true; // Just set multiple_rows to true. Leave results as-it-is
          }

          // If Single record
          else {

            // If only one single value
            if( Object.keys(results[0]).length == 1 ){ // Check count of elements in 1st record object
              results = results[0][Object.keys(results[0])[0]]; // Value inside 1st row's 1st feild
            }

            // If single row with multiple feilds
            else{
              results = results[0]; // Set 1st row as direct object
            }

          }

          // Invoke Callback with data returned from query
          cb(null, results, has_multiple_rows);

      });

    }

  },


  /********************************************************************
  MySQL Update/Insert/Delete Single or Multiple statements
  (Multiple Queries are executed in Transcational Manner -> All transcations are rolled back if any one is failed)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished
  @param {String[]} sql - One statement as String | Multiple SQL Update/Insert statement(s) as array

  @return - Thru Callback

  @callback(err, rows_affected) - Request Callback.
  * @callback {Error} err - SQL Server Error
  * @callback {Integer} rows_affected - On Success. Numbers of records Affected.
  *********************************************************************/
  setRecord: function(instance, cb, sql){

    // Skip without doing anything if SQL is null or empty array
    if( Lib.Utils.isNullOrUndefined(sql) || sql.length < 1 ){
      return cb(null); // Do not proceed and return callback with no error
    }


    // Initalize SQL Connection if not Initalized
    _MySql.initIfNot(
      instance,
      function(err, mysql_connection){ // Callback function

        if(err){ // Error Connecting to SQL Host
          return cb(err); // Invoke Callback with error
        }

        else{
          query(mysql_connection); // Execute SQL Query
        }

      }
    );


    // SQL Query
    function query(mysql_connection){

      // Final SQL statement with empty string
      var final_sql = '';

      // If sql is array, convert it to one string of semicolon seperated statements
      if( Array.isArray(sql) ){
        // Implode array and join each statement with ';'
        final_sql += sql.join(';');

        // Check if multiple sql statements. Single Statement doesnot need to be executed Transcationally
        if( sql.length > 1 ){
          // Add start Transcation to multiple statements string
          final_sql = 'START TRANSACTION;' + final_sql + ';COMMIT;';
        }
      }

      // If sql is string, copy it to final_sql. Single Statement doesnot need to be executed Transcationally
      else {
        final_sql = sql;
      }


      // Execute SQL
      Lib.Debug.timingAuditLog('Start', 'MySQL-Database - Set Record', instance['time_ms']);
      mysql_connection.query(final_sql, function(err, results, fields){

        Lib.Debug.timingAuditLog('End', 'MySQL-Database - Set Record', instance['time_ms']);
        // Error writing to database
        if(err){

          // Log error for research
          Lib.Debug.logErrorForResearch(
            err,
            'Cause: MySQL' +
            '\ncmd: Set Record' +
            '\nsql: ' + JSON.stringify(sql)
          );

          // Invoke Callback and forward error from mysql-database
          return cb(err);

        }


        // Get number of affectedRows
        var affected_rows = 0;
        if( !Array.isArray(results) ){ // Single result
          affected_rows = results.affectedRows;
        }
        else{ // Multiple results
          results.forEach(function(obj){
            affected_rows += obj.affectedRows;
          })
        }


        // Invoke Callback. Data is not returned from Insert/Update/Delete queries
        cb(null, affected_rows);

      });

    }

  },

};///////////////////////////Public Functions END//////////////////////////////



//////////////////////////Private Functions START//////////////////////////////
const _MySql = { // Private functions accessible within this modules only

  /********************************************************************
  Initialize Connection with MySQL Database

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished
  @param {Boolean} read_only - For Seperate Read-Only Connection

  @callback - Request Callback(err)
  * @callback {Error} err - In case of error
  * @callback {Reference} mysql_connection - Reference to MySQL Connection
  *********************************************************************/
  initIfNot: function(instance, cb, read_only){

    // Check additional requirements for read-only connection
    read_only = (
      read_only &&
      !Lib.Utils.isNullOrUndefined(CONFIG.READER_HOST) && // Reader host is not null
      CONFIG.HOST !== CONFIG.READER_HOST // Both Hosts should be different
    );

    // Determine if separate Read-Only Connection
    var mysql_key = read_only ? 'mysql_reader' : 'mysql'; // For default coonection that supports both Writing and Reading

    // Initialize only if 'sql' object is not already Initialized
    if( !Lib.Utils.isNullOrUndefined(instance[mysql_key]) ){
      return cb( // Do not proceed since already initalized
        null,
        instance[mysql_key] // Reference to MySQL Connection
      );
    }


    // Set SQL Connection config
    Lib.Debug.timingAuditLog('Init-Start', 'MySQL - Database Connection', instance['time_ms']);
    instance[mysql_key] = NodeMySQL.createConnection({
      'host'     : read_only ? CONFIG.READER_HOST : CONFIG.HOST,
      'user'     : CONFIG.USER,
      'password' : CONFIG.PASS,
      'database' : CONFIG.DATABASE,
      'multipleStatements' : true
    });


    // Establish connection with SQL Host
    instance[mysql_key].connect( function(err){

      Lib.Debug.timingAuditLog('Init-End', 'MySQL - Database Connection', instance['time_ms']);
      if(err){ // Error connection to MySQL Database
        return cb(err); // Invoke callback with error
      }


      // All Good

      // Close SQL connection at the time of cleanup
      Lib.Instance.addCleanupRoutine( instance, read_only ? _MySql.closeReader : _MySql.close );

      // Invoke Callback
      cb(
        null, // No Error
        instance[mysql_key] // Reference to MySQL Connection
      );

    });

  },


  /********************************************************************
  Close connection with MySQL Database
  (Must be invoked if connection has been Initialized)

  @param {reference} instance - Request Instance object reference

  @return {void} - Nothing. Internally closes connection with MySql Host
  *********************************************************************/
  close: function(instance){

    // Close connection with SQL Host by sending a quit packet to the mysql server
    instance['mysql'].end( function(err){
      // If error in graceful 'end', Immediate force termination of connection by destroying it
      if(err){
        instance['mysql'].destroy();
      }

      instance['mysql'] = null; // Reset to null to free memory
    });

  },


  /********************************************************************
  Close connection with MySQL Database - ReadOnly Instance
  (Must be invoked if connection has been Initialized)

  @param {reference} instance - Request Instance object reference

  @return {void} - Nothing. Internally closes connection with MySql Host
  *********************************************************************/
  closeReader: function(instance){

    // Close connection with SQL Host by sending a quit packet to the mysql server
    instance['mysql_reader'].end( function(err){
      // If error in graceful 'end', Immediate force termination of connection by destroying it
      if(err){
        instance['mysql_reader'].destroy();
      }

      instance['mysql_reader'] = null; // Reset to null to free memory
    });

  },

};//////////////////////////Private Functions END//////////////////////////////
