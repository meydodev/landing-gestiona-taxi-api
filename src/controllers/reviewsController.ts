import { Request, Response, NextFunction } from 'express';
import { listReviews, createReviewTx } from '../models/reviews';
import { getReviewStats } from '../models/reviews';



export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '9'), 10));

    const all = await listReviews();
    const total = all.length;
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    // respuesta paginada
    res.json({
      items,
      page,
      limit,
      total,
      hasMore: start + items.length < total,
    });
  } catch (err) {
    next(err);
  }
}

export async function addReview(req: Request, res: Response, next: NextFunction) {
  try {
    //console.log('[SERVER BODY]', req.body); // debe mostrar { rating: 5, review: '...' }
    const { rating, review } = req.body ?? {};

    if (typeof rating !== 'number' || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'rating 1..5' });
    if (typeof review !== 'string' || review.trim().length < 3)
      return res.status(400).json({ message: 'review ≥ 3 chars' });

    const saved = await createReviewTx({ rating, review });
    res.status(201).json(saved);
  } catch (e) { next(e); }
}

export async function getReviewsStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getReviewStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}