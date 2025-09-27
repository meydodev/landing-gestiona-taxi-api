import { Request, Response, NextFunction } from 'express';
import { readCounterTx, incrementCounter } from '../models/downloadCounter';

// GET /api/downloads  -> { counterDownload, updatedAt }
export const getDownloadCounters = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await readCounterTx();
    res.json(data); // { counterDownload, updatedAt }
  } catch (error) {
    next(error);
  }
};

// POST /api/downloads  -> incrementa en 1 (transaccional)
export const addDownload = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await incrementCounter();
    res.status(201).json(data); // { counterDownload, updatedAt }
  } catch (error) {
    next(error);
  }
};
