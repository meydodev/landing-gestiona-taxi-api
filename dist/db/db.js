"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const pool = mysql2_1.default.createPool({
    host: process.env.DB_HOST || "sql7.freesqldatabase.com",
    user: process.env.DB_USER || "sql7800628",
    port: 3306,
    password: process.env.DB_PASS || "EnXv6pfTpj",
    database: process.env.DB_NAME || "sql7800628",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
exports.default = pool.promise(); // 👈 importante, si no, rompe todo
