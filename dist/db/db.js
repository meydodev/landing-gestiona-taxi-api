"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const connection = mysql2_1.default.createConnection({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7800628',
    port: 3306,
    password: 'EnXv6pfTpj',
    database: 'sql7800628',
});
exports.default = connection;
