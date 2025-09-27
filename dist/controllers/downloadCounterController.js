"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDownload = exports.getDownloadCounters = void 0;
const downloadCounter_1 = require("../models/downloadCounter");
// GET /api/downloads  -> { counterDownload, updatedAt }
const getDownloadCounters = async (_req, res, next) => {
    try {
        const data = await (0, downloadCounter_1.readCounterTx)();
        res.json(data); // { counterDownload, updatedAt }
    }
    catch (error) {
        next(error);
    }
};
exports.getDownloadCounters = getDownloadCounters;
// POST /api/downloads  -> incrementa en 1 (transaccional)
const addDownload = async (_req, res, next) => {
    try {
        const data = await (0, downloadCounter_1.incrementCounter)();
        res.status(201).json(data); // { counterDownload, updatedAt }
    }
    catch (error) {
        next(error);
    }
};
exports.addDownload = addDownload;
