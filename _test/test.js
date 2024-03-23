// Info: Test Cases
'use strict';

// Shared Dependencies
var Lib = {};

// Set Configrations
const sql_config = {
  HOST: 'TODO',
  USER: 'TODO',
  PASS: 'TODO',
  DATABASE: 'TODO'
};

// Dependencies
Lib.Utils = require('js-helper-utils');
Lib.Debug = require('js-helper-debug')(Lib);
Lib.Instance = require('js-helper-instance')(Lib);
const SqlDB = require('js-helper-mysql')(Lib, sql_config);


////////////////////////////SIMILUTATIONS//////////////////////////////////////

// function to simulate callback for Set-Data
function test_output_setdata(err, response){

  if(err){ // If error
    Lib.Debug.log('err:', JSON.stringify(err) );
  }
  else{
    Lib.Debug.log('response:', response );
  }

  // cleanup instance - close open connections
  Lib.Instance.cleanup(instance);

};


// function to simulate callback for Get-Data
function test_output_getdata(err, result, has_multiple_rows){

  if(err){ // If error
    Lib.Debug.log('err:', JSON.stringify(err) );
  }
  else{
    Lib.Debug.log('result:', result );
    Lib.Debug.log('has_multiple_rows:', has_multiple_rows );
  }

  // cleanup instance - close open connections
  Lib.Instance.cleanup(instance);

};

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////STAGE SETUP///////////////////////////////////////

// Initialize 'instance'
var instance = Lib.Instance.initialize();


// Test table info
var table = 'test_table';

// Dummy data for inserting in mysql
var record_1 = {
  'p_id': 'row1',
  'col_1': 'some text',
  'col_2': 'abc',
  'col_3': 1,
  'col_4': true,
};
var record_2 = {
  'p_id': 'row2',
  'col_1': 'Haha , BBQ on the beach , engage smug mode ! 😍 😎 ❤ 🎉 #vacation',
  'col_2': 'bcd',
  'col_3': 2,
};


// Dummmy key whose data is to be fetched
var key_x = {
  'p_id': 'row2'
}

// variable for sql statements
var sql;

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////////TESTS/////////////////////////////////////////

// multiple sql statements in one go
sql = [
  SqlDB.buildQuery('INSERT INTO test_table SET ?', record_1), // Build SQL query
  SqlDB.buildQuery('INSERT INTO test_table SET ?', record_2), // Build SQL query
]

/*
// Set dummy records in sql
SqlDB.setRecord(
  instance,
  test_output_setdata,
  sql
);
*/


/*
// get single record statement
sql = SqlDB.buildQuery('SELECT * FROM test_table where ?', key_x); // Build SQL query

// get record from from sql
SqlDB.getRecord(
  instance,
  test_output_getdata,
  sql
);
*/


// Query Builder test
var data = {
  'key1': 'value1',
  'key2': 123
};
var sql_where_condition = SqlDB.buildMultiCondition(data, 'OR');
Lib.Debug.log('sql_where_condition', sql_where_condition);



// get multiple record statement
sql = 'SELECT * FROM test_table';

// get records from from sql
SqlDB.getRecord(
  instance,
  test_output_getdata,
  sql
);

///////////////////////////////////////////////////////////////////////////////
