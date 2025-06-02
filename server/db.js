const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '123456',
  database: 'labeler',
});
