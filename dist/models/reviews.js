"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReviewTx = createReviewTx;
exports.getReviewStats = getReviewStats;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.DATA_DIR ?? path_1.default.resolve(__dirname, '../data');
const DATA_FILE = process.env.DATA_FILE ?? path_1.default.join(DATA_DIR, 'reviews.json');
let queue = Promise.resolve();
function serialize(op) {
    const run = queue.then(op, op);
    queue = run.then(() => { }, () => { });
    return run;
}
async function ensureFile() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs_1.promises.access(DATA_FILE);
    }
    catch {
        await fs_1.promises.writeFile(DATA_FILE, '[]\n', 'utf8');
    }
}
// Normaliza el archivo (convierte id string -> number, completa fechas)
async function readFileSafe() {
    await ensureFile();
    const raw = await fs_1.promises.readFile(DATA_FILE, 'utf8');
    if (!raw.trim())
        return [];
    const arr = JSON.parse(raw);
    return arr.map((r) => {
        const idNum = typeof r.id === 'number' ? r.id : parseInt(String(r.id), 10);
        const created = r.createdAt ?? new Date().toISOString();
        return {
            id: Number.isFinite(idNum) ? idNum : 0,
            rating: Number(r.rating),
            review: String(r.review ?? ''),
            createdAt: created,
            updatedAt: r.updatedAt ?? created,
        };
    }).filter(r => Number.isFinite(r.id));
}
async function writeAtomic(data) {
    await ensureFile();
    const tmp = `${DATA_FILE}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    await fs_1.promises.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
    await fs_1.promises.rename(tmp, DATA_FILE);
}
function nextId(list) {
    let max = 0;
    for (const r of list)
        if (typeof r.id === 'number' && r.id > max)
            max = r.id;
    return max + 1; // empieza en 1 si está vacío
}
// --- API pública ---
async function listReviews() {
    await queue; // espera escrituras en curso
    return readFileSafe();
}
async function createReviewTx(input) {
    return serialize(async () => {
        const list = await readFileSafe();
        const now = new Date().toISOString();
        const item = {
            id: nextId(list), // 👈 autoincrement
            rating: input.rating,
            review: input.review.trim(),
            createdAt: now,
            updatedAt: now,
        };
        list.push(item); // se añade “una detrás de otra”
        await writeAtomic(list);
        return item;
    });
}
async function getReviewStats() {
    const list = await listReviews();
    const total = list.length;
    if (total === 0) {
        return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of list) {
        sum += r.rating;
        breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
    }
    // convierte a porcentaje
    for (let i = 1; i <= 5; i++) {
        breakdown[i] = Math.round((breakdown[i] / total) * 100);
    }
    return {
        average: sum / total,
        total,
        breakdown
    };
}
