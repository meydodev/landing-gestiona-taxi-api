"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCounterTx = readCounterTx;
exports.incrementCounter = incrementCounter;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
/**
 * Usa DISCO PERSISTENTE:
 * - En Render añade un Disk y móntalo en /data (recomendado).
 * - Opcional: setea DATA_DIR=/data en las variables de entorno.
 * - Si no hay DATA_DIR, por defecto usará /data igualmente.
 */
const DATA_DIR = process.env.DATA_DIR && path_1.default.isAbsolute(process.env.DATA_DIR)
    ? process.env.DATA_DIR
    : '/data';
const DATA_FILE = path_1.default.join(DATA_DIR, 'downloadsCounter.json');
const TMP_FILE = DATA_FILE + '.tmp';
/** Crea el archivo si no existe; si está corrupto, lo re-inicializa. */
async function ensureFile() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        const raw = await fs_1.promises.readFile(DATA_FILE, 'utf8');
        JSON.parse(raw);
    }
    catch {
        const init = {
            counterDownload: 0,
            updatedAt: new Date().toISOString(),
        };
        await fs_1.promises.writeFile(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
    }
}
// Cola para serializar escrituras dentro del proceso
let writing = Promise.resolve();
async function readCounterTx() {
    await ensureFile();
    await writing; // espera a que termine cualquier write en curso
    const raw = await fs_1.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
}
async function writeCounter(data) {
    writing = writing.then(async () => {
        try {
            // write-then-rename atómico en el mismo dir
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
