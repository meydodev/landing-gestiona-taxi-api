import mysql from "mysql2";

const pool = mysql.createPool({
  host: "sql7.freesqldatabase.com",
  user: "sql7800628",
  port: 3306,
  password: "EnXv6pfTpj",
  database: "sql7800628",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool.promise(); // 👈 exportamos el pool con promesas
