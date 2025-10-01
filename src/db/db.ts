import mysql from "mysql2";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "sql7.freesqldatabase.com",
  user: process.env.DB_USER || "sql7800628",
  port: 3306,
  password: process.env.DB_PASS || "EnXv6pfTpj",
  database: process.env.DB_NAME || "sql7800628",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool.promise();  // 👈 importante, si no, rompe todo
