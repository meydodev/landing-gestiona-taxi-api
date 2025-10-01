import { Request, Response, NextFunction } from "express";
import pool from "../db/db"; // tu createPool con .promise()
import { RowDataPacket, ResultSetHeader } from "mysql2";

// ✅ GET /api/reviews -> paginado
export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit ?? "9"), 10));
    const offset = (page - 1) * limit;

    // 1️⃣ obtener items
    const [items] = await pool.query<RowDataPacket[]>(
      "SELECT `id`, `rating`, `review` FROM `reviews` ORDER BY `created_at` DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    // 2️⃣ obtener total
    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM `reviews`"
    );
    const total = Number(countRows[0].total);

    res.json({
      items,   // ya solo { id, rating, review }
      page,
      limit,
      total,
      hasMore: offset + items.length < total,
    });
  } catch (err) {
    next(err);
  }
}

// ✅ POST /api/reviews -> con transacción
export async function addReview(req: Request, res: Response, next: NextFunction) {
  const { rating, review } = req.body ?? {};

  if (typeof rating !== "number" || rating < 1 || rating > 5)
    return res.status(400).json({ message: "rating debe ser entre 1 y 5" });
  if (typeof review !== "string" || review.trim().length < 3)
    return res.status(400).json({ message: "review debe tener al menos 3 caracteres" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1️⃣ Insertar review
    const [insRes] = await connection.query<ResultSetHeader>(
      "INSERT INTO `reviews` (`rating`, `review`) VALUES (?, ?)",
      [rating, review]
    );

    const newId = insRes.insertId;

    // 2️⃣ Obtener la review recién creada
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT `id`, `rating`, `review`, `created_at` FROM `reviews` WHERE `id` = ?",
      [newId]
    );

    await connection.commit();
    res.status(201).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

// ✅ GET /api/reviews/stats
export async function getReviewsStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const sql = `
      SELECT 
        AVG(rating)      AS average,
        COUNT(*)         AS total,
        SUM(rating = 5)  AS stars5,
        SUM(rating = 4)  AS stars4,
        SUM(rating = 3)  AS stars3,
        SUM(rating = 2)  AS stars2,
        SUM(rating = 1)  AS stars1
      FROM reviews
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql);
    const row = rows[0] || {};

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
  } catch (e) {
    next(e);
  }
}
