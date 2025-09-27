"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCounterTx = readCounterTx;
exports.incrementCounter = incrementCounter;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// ⬇️ clave: usar __dirname -> ../data del archivo compilado
const DATA_DIR = process.env.DATA_DIR ?? path_1.default.resolve(__dirname, '../data');
const DATA_FILE = process.env.DATA_FILE ?? path_1.default.join(DATA_DIR, 'downloadsCounter.json');
const TMP_FILE = DATA_FILE + '.tmp';
async function ensureFile() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs_1.promises.access(DATA_FILE);
    }
    catch {
        const init = {
            counterDownload: 0,
            updatedAt: new Date().toISOString(),
        };
        await fs_1.promises.writeFile(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
    }
}
let writing = Promise.resolve();
async function readCounterTx() {
    await ensureFile();
    await writing;
    const raw = await fs_1.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
}
async function writeCounter(data) {
    writing = writing.then(async () => {
        try {
            await fs_1.promises.writeFile(TMP_FILE, JSON.stringify(data, null, 2), 'utf8');
            await fs_1.promises.rename(TMP_FILE, DATA_FILE);
        }
        catch (err) {
            try {
                await fs_1.promises.unlink(TMP_FILE);
            }
            catch { }
            throw err;
        }
    });
    return writing;
}
async function incrementCounter() {
    const current = await readCounterTx();
    const next = {
        counterDownload: current.counterDownload + 1,
        updatedAt: new Date().toISOString(),
    };
    await writeCounter(next);
    return next;
}
