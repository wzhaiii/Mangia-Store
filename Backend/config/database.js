const sql = require('mssql');
require('dotenv').config();

// Tách "TUF\MSSQLSERVER03" thành host và tên instance
const [dbHost, dbInstance] = process.env.DB_SERVER.split('\\');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: dbHost,                 // "TUF"
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: dbInstance,     // "MSSQLSERVER03"
    useUTC: false,
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Đã kết nối SQL Server thành công');
    return pool;
  })
  .catch(err => {
    console.error('Lỗi kết nối DB: ', err);
    process.exit(1);   // sửa để không "nuốt" lỗi như trước
  });

module.exports = { sql, poolPromise };