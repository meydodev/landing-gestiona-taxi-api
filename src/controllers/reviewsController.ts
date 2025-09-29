import { Request, Response, NextFunction } from 'express';
import connection from '../db/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ✅ GET /api/reviews -> paginado
// GET /api/reviews -> paginado
export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '9'), 10));
    const offset = (page - 1) * limit;

    connection.query(
      'SELECT `id`, `rating`, `review` FROM `reviews` ORDER BY `created_at` DESC LIMIT ? OFFSET ?',
      [limit, offset],
      (err, items: RowDataPacket[]) => {
        if (err) return next(err);

        connection.query(
          'SELECT COUNT(*) AS total FROM `reviews`',
          (cerr, crows: RowDataPacket[]) => {
            if (cerr) return next(cerr);
            const total = Number(crows[0].total);
            res.json({
              items,   // ⬅️ ya solo { id, rating, review }
              page,
              limit,
              total,
              hasMore: offset + items.length < total,
            });
          }
        );
      }
    );
  } catch (err) {
    next(err);
  }
}


// ✅ POST /api/reviews -> con transacción
export async function addReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { rating, review } = req.body ?? {};

    if (typeof rating !== 'number' || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'rating debe ser entre 1 y 5' });
    if (typeof review !== 'string' || review.trim().length < 3)
      return res.status(400).json({ message: 'review debe tener al menos 3 caracteres' });

    connection.beginTransaction((err) => {
      if (err) return next(err);

      connection.query(
        'INSERT INTO `reviews` (`rating`, `review`) VALUES (?, ?)',
        [rating, review],
        (insErr, insRes: ResultSetHeader) => {
          if (insErr) return connection.rollback(() => next(insErr));

          const newId = insRes.insertId;

          connection.query(
            'SELECT `id`, `rating`, `review`, `created_at` FROM `reviews` WHERE `id` = ?',
            [newId],
            (selErr, rows: RowDataPacket[]) => {
              if (selErr) return connection.rollback(() => next(selErr));

              connection.commit((comErr) => {
                if (comErr) return connection.rollback(() => next(comErr));
                res.status(201).json(rows[0]);
              });
            }
          );
        }
      );
    });
  } catch (e) {
    next(e);
  }
}

// ✅ GET /api/reviews/stats
export async function getReviewsStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const sql = `
      SELECT 
        AVG(rating)  AS average,
        COUNT(*)     AS total,
        SUM(rating = 5) AS stars5,
        SUM(rating = 4) AS stars4,
        SUM(rating = 3) AS stars3,
        SUM(rating = 2) AS stars2,
        SUM(rating = 1) AS stars1
      FROM reviews
    `;

    connection.query(sql, (err, rows: RowDataPacket[]) => {
      if (err) return next(err);

      const row = rows[0] || {};
      // Normaliza a número (evita null/undefined)
      const average = row.average != null ? Number(row.average) : 0;
      const total   = row.total   != null ? Number(row.total)   : 0;

      res.json({
        average,
        total,
        breakdown: {
          5: Number(row.stars5 || 0),
          4: Number(row.stars4 || 0),
          3: Number(row.stars3 || 0),
          2: Number(row.stars2 || 0),
          1: Number(row.stars1 || 0),
        },
      });
    });
  } catch (e) {
    next(e);
  }
}
