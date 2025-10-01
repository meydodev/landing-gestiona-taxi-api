"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const pool = mysql2_1.default.createPool({
    host: "sql7.freesqldatabase.com",
    user: "sql7800628",
    port: 3306,
    password: "EnXv6pfTpj",
    database: "sql7800628",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
exports.default = pool.promise(); // 👈 exportamos el pool con promesas
