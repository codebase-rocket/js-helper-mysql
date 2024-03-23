--------------------
Create test database
--------------------
Create a MySQL database or use some existing database for testing

* Note down hostname, username, password and database name



------------
Create Table
------------
Test table in mysql

* Table Name: test_table

Table Schema
------------
```

/* Test Table */
CREATE TABLE IF NOT EXISTS `test_table` (
`p_id` VARCHAR(20) NOT NULL, /* [PRIMARY KEY] */
`col_1` VARCHAR(200) NULL,
`col_2` CHAR(3) CHARACTER SET ascii NOT NULL, /* only accept ascii value. Memory saving */
`col_3` INT NULL,
`col_4` BOOLEAN DEFAULT 1, /* default value true */
PRIMARY KEY(`p_id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;

```


-------------
Create
-------------
Create new test_user with access to test_table

* Privileges: DELETE, INSERT, SELECT, UPDATE, EXECUTE
* U/N: test_user
* Pass: 26a92vYgzpxa6ZXaCRqn

Create Command
--------------
```SQL
CREATE USER 'test_user'@'%' IDENTIFIED BY '26a92vYgzpxa6ZXaCRqn';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON my_database.test_table TO 'test_user'@'%'; /* Allow Read, Write, Execute Procedures, Commit, Rollback on all tables */
FLUSH PRIVILEGES;
```
