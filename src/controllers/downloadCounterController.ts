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
      FROM counter_download
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
      //console.error("❌ Error iniciando transacción:", err);
      return next(err);
    }

    // ⬅️ solo incrementa
    connection.query(
      'UPDATE counter_download SET counter = counter + 1, updatedAt = NOW() WHERE id = 1',
      (updateErr) => {
        if (updateErr) {
          //console.error("❌ Error en UPDATE:", updateErr);
          return connection.rollback(() => next(updateErr));
        }

        // ⬅️ luego selecciona el valor actualizado
        connection.query(
          'SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1',
          (selectErr, results: RowDataPacket[]) => {
            if (selectErr) {
              //console.error("❌ Error en SELECT:", selectErr);
              return connection.rollback(() => next(selectErr));
            }

            connection.commit((commitErr) => {
              if (commitErr) {
                //console.error("❌ Error al hacer commit:", commitErr);
                return connection.rollback(() => next(commitErr));
              }

              //console.log("✅ Contador actualizado:", results[0]);
              res.status(200).json(results[0]);
            });
          }
        );
      }
    );
  });
};

