"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDownload = exports.getDownloadCounters = void 0;
const db_1 = __importDefault(require("../db/db"));
// GET /api/downloads -> { counterDownload, updatedAt }
const getDownloadCounters = async (_req, res, next) => {
    db_1.default.beginTransaction((txErr) => {
        if (txErr) {
            //console.error('❌ Error iniciando transacción:', txErr);
            return next(txErr);
        }
        // Lectura normal dentro de la transacción (snapshot consistente).
        const sql = `
      SELECT counter AS counterDownload, updatedAt
      FROM counter_download
      WHERE id = 1
    `;
        db_1.default.query(sql, (err, results) => {
            if (err) {
                //console.error('❌ Error en SELECT:', err);
                return db_1.default.rollback(() => next(err));
            }
            if (!results || results.length === 0) {
                // No hay fila; confirma para cerrar la transacción igualmente
                return db_1.default.commit((commitErr) => {
                    if (commitErr) {
                        //console.error('❌ Error al hacer commit:', commitErr);
                        return db_1.default.rollback(() => next(commitErr));
                    }
                    return res.status(404).json({ message: 'No counter found' });
                });
            }
            db_1.default.commit((commitErr) => {
                if (commitErr) {
                    //console.error('❌ Error al hacer commit:', commitErr);
                    return db_1.default.rollback(() => next(commitErr));
                }
                // Devuelve { counterDownload, updatedAt }
                return res.json(results[0]);
            });
        });
    });
};
exports.getDownloadCounters = getDownloadCounters;
// POST /api/downloads -> incrementa en 1 (transaccional)
const addDownload = async (_req, res, next) => {
    db_1.default.beginTransaction((err) => {
        if (err) {
            //console.error("❌ Error iniciando transacción:", err);
            return next(err);
        }
        // ⬅️ solo incrementa
        db_1.default.query('UPDATE counter_download SET counter = counter + 1, updatedAt = NOW() WHERE id = 1', (updateErr) => {
            if (updateErr) {
                //console.error("❌ Error en UPDATE:", updateErr);
                return db_1.default.rollback(() => next(updateErr));
            }
            // ⬅️ luego selecciona el valor actualizado
            db_1.default.query('SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1', (selectErr, results) => {
                if (selectErr) {
                    //console.error("❌ Error en SELECT:", selectErr);
                    return db_1.default.rollback(() => next(selectErr));
                }
                db_1.default.commit((commitErr) => {
                    if (commitErr) {
                        //console.error("❌ Error al hacer commit:", commitErr);
                        return db_1.default.rollback(() => next(commitErr));
                    }
                    //console.log("✅ Contador actualizado:", results[0]);
                    res.status(200).json(results[0]);
                });
            });
        });
    });
};
exports.addDownload = addDownload;
