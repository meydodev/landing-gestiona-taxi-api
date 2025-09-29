import { Request, Response, NextFunction } from 'express';
import connection from '../db/db';
import { RowDataPacket } from 'mysql2';

// GET /api/downloads -> { counterDownload, updatedAt }
export const getDownloadCounters = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  connection.beginTransaction((txErr) => {
    if (txErr) {
      //console.error('❌ Error iniciando transacción:', txErr);
      return next(txErr);
    }

    // Lectura normal dentro de la transacción (snapshot consistente).
    const sql = `
      SELECT counter AS counterDownload, updatedAt
      FROM counter_dowload
      WHERE id = 1
    `;

    connection.query(sql, (err, results: RowDataPacket[]) => {
      if (err) {
        //console.error('❌ Error en SELECT:', err);
        return connection.rollback(() => next(err));
      }

      if (!results || results.length === 0) {
        // No hay fila; confirma para cerrar la transacción igualmente
        return connection.commit((commitErr) => {
          if (commitErr) {
            //console.error('❌ Error al hacer commit:', commitErr);
            return connection.rollback(() => next(commitErr));
          }
          return res.status(404).json({ message: 'No counter found' });
        });
      }

      connection.commit((commitErr) => {
        if (commitErr) {
          //console.error('❌ Error al hacer commit:', commitErr);
          return connection.rollback(() => next(commitErr));
        }

        // Devuelve { counterDownload, updatedAt }
        return res.json(results[0]);
      });
    });
  });
};

// POST /api/downloads -> incrementa en 1 (transaccional)
export const addDownload = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  connection.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error iniciando transacción:", err);
      return next(err);
    }

    const sql = `
      INSERT INTO counter_dowload (id, counter, updatedAt)
      VALUES (1, 1, NOW())
      ON DUPLICATE KEY UPDATE counter = counter + 1, updatedAt = NOW()
    `;

    connection.query(sql, (insertErr) => {
      if (insertErr) {
        console.error("❌ Error en INSERT/UPDATE:", insertErr);
        return connection.rollback(() => next(insertErr));
      }

      connection.query(
        'SELECT counter AS counterDownload, updatedAt FROM counter_dowload WHERE id = 1',
        (selectErr, results: RowDataPacket[]) => {
          if (selectErr) {
            console.error("❌ Error en SELECT:", selectErr);
            return connection.rollback(() => next(selectErr));
          }

          connection.commit((commitErr) => {
            if (commitErr) {
              console.error("❌ Error al hacer commit:", commitErr);
              return connection.rollback(() => next(commitErr));
            }

            res.status(201).json(results[0]); // { counterDownload, updatedAt }
          });
        }
      );
    });
  });
};

