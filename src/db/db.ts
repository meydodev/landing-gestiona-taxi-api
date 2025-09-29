import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7800628',
    port: 3306,
    password: 'EnXv6pfTpj',
    database: 'sql7800628',
});

export default connection;