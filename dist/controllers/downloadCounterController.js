"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDownload = exports.getDownloadCounters = void 0;
const db_1 = __importDefault(require("../db/db"));
// GET
const getDownloadCounters = async (_req, res, next) => {
    try {
        const [rows] = await db_1.default.query("SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1");
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "No counter found" });
        }
        res.json(rows[0]);
    }
    catch (err) {
        next(err);
    }
};
exports.getDownloadCounters = getDownloadCounters;
// POST
const addDownload = async (_req, res, next) => {
    const connection = await db_1.default.getConnection();
    try {
        await connection.beginTransaction();
        const [updateResult] = await connection.query("UPDATE counter_download SET counter = counter + 1, updatedAt = NOW() WHERE id = 1");
        if (updateResult.affectedRows === 0) {
            await connection.query("INSERT INTO counter_download (id, counter, createdAt, updatedAt) VALUES (1, 1, NOW(), NOW())");
        }
        const [rows] = await connection.query("SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1");
        await connection.commit();
        res.status(200).json(rows[0]);
    }
    catch (err) {
        await connection.rollback();
        next(err);
    }
    finally {
        connection.release();
    }
};
exports.addDownload = addDownload;
