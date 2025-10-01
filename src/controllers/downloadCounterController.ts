import { Request, Response, NextFunction } from "express";
import pool from "../db/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET
export const getDownloadCounters = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1"
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No counter found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST
export const addDownload = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query<ResultSetHeader>(
      "UPDATE counter_download SET counter = counter + 1, updatedAt = NOW() WHERE id = 1"
    );

    if (updateResult.affectedRows === 0) {
      await connection.query<ResultSetHeader>(
        "INSERT INTO counter_download (id, counter, createdAt, updatedAt) VALUES (1, 1, NOW(), NOW())"
      );
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT counter AS counterDownload, updatedAt FROM counter_download WHERE id = 1"
    );

    await connection.commit();
    res.status(200).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};
